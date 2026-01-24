import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { requireAuth } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { generateAndSavePDF } from '../services/pdfService.js'
import { auditLog } from '../services/auditService.js'
import { uploadToGoogleDrive, downloadFromGoogleDrive, isGoogleDriveConfigured } from '../services/googleDriveService.js'
import { encryptBuffer, decryptBuffer } from '../services/encryptionService.js'

// Local storage directory for encrypted documents when Google Drive is not configured
const LOCAL_I9_STORAGE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../storage/encrypted-i9-docs')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// All routes require authentication
router.use(requireAuth)

const FORM_TYPES = {
  1: 'W4',
  2: 'I9',
  3: 'BACKGROUND',
  4: 'DIRECT_DEPOSIT',
  5: 'ACKNOWLEDGEMENTS',
  6: '8850'
}

/**
 * POST /api/forms/submit/:step
 * Submit a form step
 */
router.post('/submit/:step', upload.any(), async (req, res) => {
  try {
    const step = parseInt(req.params.step)
    if (step < 1 || step > 6) {
      return res.status(400).json({ error: 'Invalid step number' })
    }
    
    const formType = FORM_TYPES[step]
    let formData
    
    // Parse form data (could be JSON string or object)
    if (typeof req.body.formData === 'string') {
      formData = JSON.parse(req.body.formData)
    } else {
      formData = req.body.formData || req.body
    }
    
    // Get applicant data
    const db = getDatabase()
    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.applicantId)
    
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' })
    }
    
    // Check if SSN consent was provided for forms that need it
    if ((formType === 'W4' || formType === '8850') && !req.body.ssnConsented) {
      return res.status(400).json({ error: 'SSN collection consent required' })
    }
    
    // Log privacy consent if provided
    if (req.body.ssnConsented) {
      db.prepare(`
        INSERT INTO privacy_consents (applicant_id, consent_type, consent_text, ip_address)
        VALUES (?, ?, ?, ?)
      `).run(
        req.applicantId,
        'SSN_COLLECTION',
        'Consented to SSN collection for ' + formType,
        req.ip
      )
    }
    
    // Update applicant record with data from Step 1 (W-4) - date of birth and phone
    if (step === 1 && formData) {
      db.prepare(`
        UPDATE applicants 
        SET date_of_birth = ?, phone = ?
        WHERE id = ?
      `).run(
        formData.dateOfBirth || null,
        formData.phone || null,
        req.applicantId
      )
    }
    
    // Update applicant record with address data from Step 3 (Background Check)
    if (step === 3 && formData) {
      db.prepare(`
        UPDATE applicants 
        SET address = ?, city = ?, state = ?, zip_code = ?
        WHERE id = ?
      `).run(
        formData.address || null,
        formData.city || null,
        formData.state || null,
        formData.zipCode || null,
        req.applicantId
      )
    }
    
    // Generate PDF and upload directly to Google Drive (SSN is included here but never stored in DB)
    const pdfResult = await generateAndSavePDF(
      req.applicantId,
      step,
      formType,
      formData,
      applicant
    )
    
    // Check if onboarding is complete (6 steps) and if user is admin
    const submissions = db.prepare(`
      SELECT COUNT(*) as count 
      FROM form_submissions 
      WHERE applicant_id = ?
    `).get(req.applicantId)
    
    const completedSteps = submissions.count || 0
    const isOnboardingComplete = completedSteps >= 6
    
    // Check if admin and password setup required
    let requiresPasswordSetup = false
    if (isOnboardingComplete) {
      const adminCheck = db.prepare('SELECT is_admin, password_hash FROM applicants WHERE id = ?').get(req.applicantId)
      if (adminCheck && adminCheck.is_admin === 1) {
        requiresPasswordSetup = !adminCheck.password_hash || adminCheck.password_hash === ''
      }
    }
    
    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'SUBMIT_FORM',
      resourceType: 'FORM',
      resourceId: pdfResult.submissionId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        step,
        formType,
        filename: pdfResult.filename,
        isOnboardingComplete,
        requiresPasswordSetup
      }
    })
    
    res.json({
      success: true,
      submissionId: pdfResult.submissionId,
      filename: pdfResult.filename,
      retentionUntil: pdfResult.retentionUntil,
      isOnboardingComplete,
      requiresPasswordSetup
    })
  } catch (error) {
    console.error('Form submission error:', error)
    res.status(500).json({ error: 'Failed to submit form' })
  }
})

/**
 * GET /api/forms/submissions
 * Get all form submissions for current applicant
 */
router.get('/submissions', async (req, res) => {
  try {
    const db = getDatabase()
    const submissions = db.prepare(`
      SELECT id, step_number, form_type, pdf_filename, submitted_at, retention_until, google_drive_id, web_view_link
      FROM form_submissions
      WHERE applicant_id = ?
      ORDER BY step_number
    `).all(req.applicantId)
    
    res.json(submissions)
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({ error: 'Failed to retrieve submissions' })
  }
})

/**
 * POST /api/forms/preview/:step
 * Generate a preview PDF from form data (without saving)
 */
router.post('/preview/:step', async (req, res) => {
  try {
    const step = parseInt(req.params.step)
    if (step < 1 || step > 6) {
      return res.status(400).json({ error: 'Invalid step number' })
    }
    
    const formType = FORM_TYPES[step]
    if (!formType) {
      return res.status(400).json({ error: 'Invalid form type' })
    }
    
    // Only allow preview for forms that generate PDFs (W-4, I-9, 8850)
    if (!['W4', 'I9', '8850'].includes(formType)) {
      return res.status(400).json({ error: 'Preview not available for this form type' })
    }
    
    // Parse form data
    let formData
    if (typeof req.body.formData === 'string') {
      formData = JSON.parse(req.body.formData)
    } else {
      formData = req.body.formData || req.body
    }
    
    // Get applicant data
    const db = getDatabase()
    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.applicantId)
    
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' })
    }
    
    // Generate PDF preview (without saving)
    const { generateW4PDF, generateI9PDF, generate8850PDF } = await import('../services/pdfService.js')
    
    let pdfBytes
    const applicantData = {
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      email: applicant.email,
      phone: applicant.phone,
      date_of_birth: applicant.date_of_birth,
      address: applicant.address,
      city: applicant.city,
      state: applicant.state,
      zip_code: applicant.zip_code
    }
    
    switch (formType) {
      case 'W4':
        pdfBytes = await generateW4PDF(formData, applicantData)
        break
      case 'I9':
        pdfBytes = await generateI9PDF(formData, applicantData)
        break
      case '8850':
        pdfBytes = await generate8850PDF(formData, applicantData)
        break
      default:
        return res.status(400).json({ error: 'Preview not available for this form type' })
    }
    
    // Return PDF as response with appropriate headers
    // Convert Uint8Array to Buffer for Express to send as binary data
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.send(Buffer.from(pdfBytes))
  } catch (error) {
    console.error('Preview generation error:', error)
    console.error('Error stack:', error.stack)
    // Make sure we return JSON, not try to send PDF
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate preview', message: error.message })
    }
  }
})

/**
 * GET /api/forms/submissions/:id/view
 * View/download a form submission PDF
 */
router.get('/submissions/:id/view', async (req, res) => {
  try {
    const db = getDatabase()
    const submission = db.prepare(`
      SELECT google_drive_id, pdf_filename, pdf_encrypted_path, applicant_id, web_view_link
      FROM form_submissions
      WHERE id = ?
    `).get(parseInt(req.params.id))

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    // Verify ownership
    if (submission.applicant_id !== req.applicantId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    let decryptedBuffer
    
    // Check if document is in Google Drive or local storage
    if (submission.google_drive_id) {
      // Download and decrypt file from Google Drive
      const { downloadFromGoogleDrive } = await import('../services/googleDriveService.js')
      const { decryptBuffer } = await import('../services/encryptionService.js')
      
      try {
        const encryptedBuffer = await downloadFromGoogleDrive(submission.google_drive_id)
        decryptedBuffer = decryptBuffer(encryptedBuffer)
      } catch (downloadError) {
        console.error('Download/decryption error:', downloadError)
        return res.status(500).json({ error: 'Failed to retrieve document from Google Drive' })
      }
    } else if (submission.pdf_encrypted_path) {
      // Read from local storage
      const { decryptBuffer } = await import('../services/encryptionService.js')
      const localPath = path.join(__dirname, '../../storage/encrypted-pdfs', submission.pdf_encrypted_path)
      
      try {
        const encryptedBuffer = await fs.readFile(localPath)
        decryptedBuffer = decryptBuffer(encryptedBuffer)
      } catch (readError) {
        console.error('Local file read/decryption error:', readError)
        return res.status(500).json({ error: 'Failed to retrieve document from local storage' })
      }
    } else {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW_SUBMISSION',
      resourceType: 'FORM_SUBMISSION',
      resourceId: parseInt(req.params.id),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${submission.pdf_filename}"`)
    res.send(decryptedBuffer)
  } catch (error) {
    console.error('Error viewing submission:', error)
    res.status(500).json({ error: 'Failed to retrieve submission', details: error.message })
  }
})

/**
 * POST /api/forms/draft/:step
 * Save draft form data
 */
router.post('/draft/:step', async (req, res) => {
  try {
    const step = parseInt(req.params.step)
    if (step < 1 || step > 6) {
      return res.status(400).json({ error: 'Invalid step number' })
    }
    
    const db = getDatabase()
    const formData = req.body.formData || req.body
    
    // Save or update draft
    db.prepare(`
      INSERT INTO form_drafts (applicant_id, step_number, form_data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(applicant_id, step_number) DO UPDATE SET
        form_data = ?,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      req.applicantId,
      step,
      JSON.stringify(formData),
      JSON.stringify(formData)
    )
    
    await auditLog({
      userId: req.applicantId,
      action: 'SAVE_DRAFT',
      resourceType: 'FORM',
      resourceId: step,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { step }
    })
    
    res.json({ success: true, message: 'Draft saved successfully' })
  } catch (error) {
    console.error('Save draft error:', error)
    res.status(500).json({ error: 'Failed to save draft' })
  }
})

/**
 * GET /api/forms/draft/:step
 * Get draft form data for a step
 */
router.get('/draft/:step', async (req, res) => {
  try {
    const step = parseInt(req.params.step)
    if (step < 1 || step > 6) {
      return res.status(400).json({ error: 'Invalid step number' })
    }
    
    const db = getDatabase()
    const draft = db.prepare(`
      SELECT form_data, updated_at
      FROM form_drafts
      WHERE applicant_id = ? AND step_number = ?
    `).get(req.applicantId, step)
    
    if (draft) {
      res.json({
        success: true,
        formData: JSON.parse(draft.form_data),
        updatedAt: draft.updated_at
      })
    } else {
      res.json({ success: true, formData: null })
    }
  } catch (error) {
    console.error('Get draft error:', error)
    res.status(500).json({ error: 'Failed to retrieve draft' })
  }
})

/**
 * GET /api/forms/drafts
 * Get all drafts for current applicant
 */
router.get('/drafts', async (req, res) => {
  try {
    const db = getDatabase()
    const drafts = db.prepare(`
      SELECT step_number, updated_at
      FROM form_drafts
      WHERE applicant_id = ?
      ORDER BY step_number
    `).all(req.applicantId)
    
    res.json(drafts.map(d => ({
      stepNumber: d.step_number,
      updatedAt: d.updated_at
    })))
  } catch (error) {
    console.error('Get drafts error:', error)
    res.status(500).json({ error: 'Failed to retrieve drafts' })
  }
})

/**
 * POST /api/forms/i9/upload-document
 * Upload an I-9 identity document
 */
router.post('/i9/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { documentType, documentCategory, documentName } = req.body
    
    if (!documentType || !documentCategory) {
      // Clean up uploaded file
      await fs.unlink(req.file.path)
      return res.status(400).json({ error: 'Document type and category are required' })
    }

    // Get applicant data
    const db = getDatabase()
    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.applicantId)
    
    if (!applicant) {
      await fs.unlink(req.file.path)
      return res.status(404).json({ error: 'Applicant not found' })
    }

    // Read uploaded file into buffer
    const fileBuffer = await fs.readFile(req.file.path)
    
    // Clean up temporary file immediately
    await fs.unlink(req.file.path)

    // Generate appropriate filename
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')
    const name = `${applicant.first_name}${applicant.last_name}`.replace(/\s/g, '')
    const fileExtension = path.extname(req.file.originalname) || '.pdf'
    const filename = `${name}-I9-${documentType}-${documentCategory}-${dateStr}-${timeStr}${fileExtension}`

    // Encrypt the document in memory
    const encryptedBuffer = encryptBuffer(fileBuffer)

    let googleDriveId = null
    let webViewLink = null
    let localFilePath = null
    
    // Check if Google Drive is configured
    if (isGoogleDriveConfigured()) {
      // Upload encrypted document directly to Google Drive
      const uploadResult = await uploadToGoogleDrive(
        encryptedBuffer,
        filename,
        applicant,
        req.file.mimetype || 'application/pdf'
      )
      ;({ fileId: googleDriveId, webViewLink } = uploadResult)
      console.log(`I-9 document uploaded to Google Drive: ${googleDriveId}`)
    } else {
      // Fallback to local storage
      const applicantFolder = `${applicant.first_name}${applicant.last_name}`.replace(/\s/g, '')
      const folderPath = path.join(LOCAL_I9_STORAGE_DIR, applicantFolder)
      await fs.mkdir(folderPath, { recursive: true })
      
      localFilePath = path.join(applicantFolder, filename)
      await fs.writeFile(path.join(LOCAL_I9_STORAGE_DIR, localFilePath), encryptedBuffer)
      console.log(`I-9 document saved to local storage: ${localFilePath} (Google Drive not configured)`)
    }

    // Store in database (replace if exists for same type/category)
    const existing = db.prepare(`
      SELECT id, google_drive_id, file_path FROM i9_documents 
      WHERE applicant_id = ? AND document_type = ? AND document_category = ?
    `).get(req.applicantId, documentType, documentCategory)

    if (existing) {
      // Delete old file from Google Drive or local storage
      if (existing.google_drive_id) {
        try {
          const { deleteFromGoogleDrive } = await import('../services/googleDriveService.js')
          await deleteFromGoogleDrive(existing.google_drive_id)
        } catch (error) {
          console.error('Error deleting old document from Google Drive:', error)
        }
      } else if (existing.file_path) {
        try {
          await fs.unlink(path.join(LOCAL_I9_STORAGE_DIR, existing.file_path))
        } catch (error) {
          console.error('Error deleting old document from local storage:', error)
        }
      }
      
      // Update record
      db.prepare(`
        UPDATE i9_documents 
        SET document_name = ?, file_name = ?, file_size = ?, mime_type = ?, google_drive_id = ?, file_path = ?, web_view_link = ?, uploaded_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        documentName || req.file.originalname,
        filename,
        req.file.size,
        req.file.mimetype,
        googleDriveId || '',
        localFilePath,
        webViewLink,
        existing.id
      )
    } else {
      // Insert new record
      db.prepare(`
        INSERT INTO i9_documents 
        (applicant_id, document_type, document_category, document_name, file_name, file_size, mime_type, google_drive_id, file_path, web_view_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.applicantId,
        documentType,
        documentCategory,
        documentName || req.file.originalname,
        filename,
        req.file.size,
        req.file.mimetype,
        googleDriveId || '',
        localFilePath,
        webViewLink
      )
    }

    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'UPLOAD_DOCUMENT',
      resourceType: 'I9_DOCUMENT',
      resourceId: existing?.id || db.prepare('SELECT last_insert_rowid()').get()['last_insert_rowid()'],
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        documentType,
        documentCategory,
        filename
      }
    })

    res.json({
      success: true,
      filename,
      documentType,
      documentCategory
    })
  } catch (error) {
    console.error('Document upload error:', error)
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError)
      }
    }
    res.status(500).json({ error: 'Failed to upload document' })
  }
})

/**
 * GET /api/forms/i9/documents
 * Get all I-9 documents for current applicant
 */
router.get('/i9/documents', async (req, res) => {
  try {
    const db = getDatabase()
    const documents = db.prepare(`
      SELECT id, document_type, document_category, document_name, file_name, file_size, uploaded_at, google_drive_id, web_view_link
      FROM i9_documents
      WHERE applicant_id = ?
      ORDER BY uploaded_at DESC
    `).all(req.applicantId)

    res.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

/**
 * GET /api/forms/i9/documents/:id/view
 * View/download an I-9 document
 */
router.get('/i9/documents/:id/view', async (req, res) => {
  try {
    const db = getDatabase()
    const document = db.prepare(`
      SELECT google_drive_id, file_path, file_name, mime_type, applicant_id, web_view_link
      FROM i9_documents
      WHERE id = ?
    `).get(parseInt(req.params.id))

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Verify ownership
    if (document.applicant_id !== req.applicantId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    let decryptedBuffer
    
    // Check if document is in Google Drive or local storage
    if (document.google_drive_id) {
      // Download and decrypt file from Google Drive
      try {
        const encryptedBuffer = await downloadFromGoogleDrive(document.google_drive_id)
        decryptedBuffer = decryptBuffer(encryptedBuffer)
      } catch (downloadError) {
        console.error('Download/decryption error:', downloadError)
        return res.status(500).json({ error: 'Failed to retrieve document from Google Drive' })
      }
    } else if (document.file_path) {
      // Read from local storage
      try {
        const encryptedBuffer = await fs.readFile(path.join(LOCAL_I9_STORAGE_DIR, document.file_path))
        decryptedBuffer = decryptBuffer(encryptedBuffer)
      } catch (readError) {
        console.error('Local file read/decryption error:', readError)
        return res.status(500).json({ error: 'Failed to retrieve document from local storage' })
      }
    } else {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW_DOCUMENT',
      resourceType: 'I9_DOCUMENT',
      resourceId: parseInt(req.params.id),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.setHeader('Content-Type', document.mime_type || 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`)
    res.send(decryptedBuffer)
  } catch (error) {
    console.error('Error viewing document:', error)
    res.status(500).json({ error: 'Failed to retrieve document', details: error.message })
  }
})

export default router

