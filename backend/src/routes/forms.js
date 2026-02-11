import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { requireAuth } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { generateAndSavePDF, getSignaturePlacement, getSignaturePlacementStatus, getManagerSignatureRequiredForms, flattenPdfBuffer } from '../services/pdfService.js'
import { auditLog } from '../services/auditService.js'
import { uploadToGoogleDrive, downloadFromGoogleDrive, isGoogleDriveConfigured, deleteFromGoogleDrive } from '../services/googleDriveService.js'
import { encryptBuffer, decryptBuffer } from '../services/encryptionService.js'
import { redactFormDataForStorage } from '../utils/redactFormData.js'
import { createNotification, notifyAdminsAndManagers } from '../services/notificationService.js'

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

/**
 * GET /api/forms/template-status
 * Returns whether signature placement is configured for each PDF form type.
 * Used by the form wizard to block steps until admin has set placement.
 */
router.get('/template-status', async (req, res) => {
  try {
    // Use shared helper so result is identical to admin setup-status (consistent for all users)
    res.json(getSignaturePlacementStatus())
  } catch (error) {
    console.error('Template status error:', error)
    res.status(500).json({ error: 'Failed to retrieve template status' })
  }
})

const FORM_TYPES = {
  1: 'W4',
  2: 'I9',
  3: 'BACKGROUND',
  4: 'DIRECT_DEPOSIT',
  5: 'ACKNOWLEDGEMENTS',
  6: '8850',
  7: '9061'
}

/**
 * Validate that all legally required form fields are present for preview (no upload check).
 * Returns { valid: true } or { valid: false, error: string }.
 */
function validatePreviewFormData(formData, step) {
  if (!formData) return { valid: false, error: 'Form data is required' }
  switch (step) {
    case 1: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      const stateValid = formData.state && formData.state.length === 2
      const zipValid = formData.zipCode && /^\d{5}(-\d{4})?$/.test(formData.zipCode)
      if (!formData.firstName || !formData.lastName || !formData.email || !ssnValid || !formData.dateOfBirth ||
        !formData.address || !formData.city || !stateValid || !zipValid || !formData.filingStatus) {
        return { valid: false, error: 'Complete all required W-4 fields before viewing preview' }
      }
      return { valid: true }
    }
    case 2: {
      if (!formData.firstName || !formData.lastName || !formData.authorizationType) {
        return { valid: false, error: 'Complete name and employment authorization before viewing preview' }
      }
      if (formData.listADocument) {
        if (!formData.listADocumentNumber) {
          return { valid: false, error: 'Complete List A document number before viewing preview' }
        }
        return { valid: true }
      }
      if (formData.listBDocument && formData.listCDocument) {
        if (!formData.listBDocumentNumber || !formData.listBIssuingAuthority || !formData.listCDocumentNumber) {
          return { valid: false, error: 'Complete all List B and List C document fields before viewing preview' }
        }
        return { valid: true }
      }
      return { valid: false, error: 'Select and complete identity document (List A or List B + List C) before viewing preview' }
    }
    case 6: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      if (!formData.firstName || !formData.lastName || !ssnValid || !formData.email || !formData.county) {
        return { valid: false, error: 'Complete all required Form 8850 fields before viewing preview' }
      }
      return { valid: true }
    }
    case 7: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      if (!formData.firstName || !formData.lastName || !ssnValid) {
        return { valid: false, error: 'Complete all required ETA Form 9061 fields before viewing preview' }
      }
      return { valid: true }
    }
    default:
      return { valid: true }
  }
}

/**
 * Validate that all legally required form fields (and I-9 document uploads) are present for submission.
 * Returns { valid: true } or { valid: false, error: string }.
 */
function validateSubmitFormData(formData, step, applicantId, db) {
  if (!formData) return { valid: false, error: 'Form data is required' }
  switch (step) {
    case 1: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      const stateValid = formData.state && formData.state.length === 2
      const zipValid = formData.zipCode && /^\d{5}(-\d{4})?$/.test(formData.zipCode)
      if (!formData.firstName || !formData.lastName || !formData.email || !ssnValid || !formData.dateOfBirth ||
        !formData.address || !formData.city || !stateValid || !zipValid || !formData.filingStatus) {
        return { valid: false, error: 'Complete all required W-4 fields before submitting' }
      }
      return { valid: true }
    }
    case 2: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      if (!formData.firstName || !formData.lastName || !formData.authorizationType) {
        return { valid: false, error: 'Complete name and employment authorization before submitting' }
      }
      if (!ssnValid) {
        return { valid: false, error: 'Social Security Number is required for the I-9. Complete Step 1 (W-4) first so your SSN can be used on the I-9.' }
      }
      if (formData.listADocument) {
        if (!formData.listADocumentNumber) {
          return { valid: false, error: 'Complete List A document number before submitting' }
        }
        const listA = db.prepare(`
          SELECT id FROM i9_documents WHERE applicant_id = ? AND document_category = 'listA'
        `).get(applicantId)
        if (!listA) {
          return { valid: false, error: 'Upload your List A identity document before submitting' }
        }
        return { valid: true }
      }
      if (formData.listBDocument && formData.listCDocument) {
        if (!formData.listBDocumentNumber || !formData.listBIssuingAuthority || !formData.listCDocumentNumber) {
          return { valid: false, error: 'Complete all List B and List C document number and issuing authority fields before submitting' }
        }
        const listB = db.prepare(`
          SELECT id FROM i9_documents WHERE applicant_id = ? AND document_category = 'listB'
        `).get(applicantId)
        const listC = db.prepare(`
          SELECT id FROM i9_documents WHERE applicant_id = ? AND document_category = 'listC'
        `).get(applicantId)
        if (!listB) {
          return { valid: false, error: 'Upload your List B identity document before submitting' }
        }
        if (!listC) {
          return { valid: false, error: 'Upload your List C work authorization document before submitting' }
        }
        return { valid: true }
      }
      return { valid: false, error: 'Select identity documents (List A or List B + List C) and upload them before submitting' }
    }
    case 6: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      if (!formData.firstName || !formData.lastName || !ssnValid || !formData.email || !formData.county) {
        return { valid: false, error: 'Complete all required Form 8850 fields before submitting' }
      }
      return { valid: true }
    }
    case 7: {
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      if (!formData.firstName || !formData.lastName || !ssnValid) {
        return { valid: false, error: 'Complete all required ETA Form 9061 fields before submitting' }
      }
      return { valid: true }
    }
    default:
      return { valid: true }
  }
}

/**
 * POST /api/forms/submit/:step
 * Submit a form step
 */
router.post('/submit/:step', upload.any(), async (req, res) => {
  try {
    const step = parseInt(req.params.step)
    if (step < 1 || step > 7) {
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
    if ((formType === 'W4' || formType === '8850' || formType === '9061') && !req.body.ssnConsented) {
      return res.status(400).json({ error: 'SSN collection consent required' })
    }

    // Block submission if admin has not configured signature placement for this form type
    if (['W4', 'I9', '8850', '9061'].includes(formType) && !getSignaturePlacement(formType)) {
      return res.status(503).json({
        error: 'This form is not yet available. The administrator must configure signature placement in Admin → System → PDF Templates before employees can submit.'
      })
    }

    // Validate all legally required fields (and I-9 uploads) before generating PDF
    if (['W4', 'I9', '8850', '9061'].includes(formType)) {
      const validation = validateSubmitFormData(formData, step, req.applicantId, db)
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
      }
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

    // Update applicant record with data from Step 1 (W-4) - date of birth, phone, and address
    // Address is also collected in W-4 and needed for I-9 (Step 2)
    if (step === 1 && formData) {
      db.prepare(`
        UPDATE applicants 
        SET date_of_birth = ?, phone = ?, address = ?, city = ?, state = ?, zip_code = ?
        WHERE id = ?
      `).run(
        formData.dateOfBirth || null,
        formData.phone || null,
        formData.address || null,
        formData.city || null,
        formData.state || null,
        formData.zipCode || null,
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

    // During onboarding: overwrite existing submission for this step. After onboarding: insert new (duplicate).
    const distinctSteps = db.prepare(`
      SELECT COUNT(DISTINCT step_number) as count FROM form_submissions WHERE applicant_id = ?
    `).get(req.applicantId)
    const distinctStepCount = distinctSteps?.count ?? 0
    const existingForStep = db.prepare(`
      SELECT id, google_drive_id, pdf_encrypted_path FROM form_submissions
      WHERE applicant_id = ? AND step_number = ?
      ORDER BY submitted_at DESC LIMIT 1
    `).get(req.applicantId, step)
    const shouldOverwrite = existingForStep && distinctStepCount < 7
    const existingSubmission = shouldOverwrite ? {
      id: existingForStep.id,
      google_drive_id: existingForStep.google_drive_id || '',
      pdf_encrypted_path: existingForStep.pdf_encrypted_path
    } : null

    // Generate PDF and upload directly to Google Drive (SSN is included here but never stored in DB)
    const pdfResult = await generateAndSavePDF(
      req.applicantId,
      step,
      formType,
      formData,
      applicant,
      existingSubmission
    )

    // Set retention_until on I-9 identity documents to match I-9 form (IRCA)
    if (step === 2 && pdfResult.retentionUntil) {
      db.prepare(`
        UPDATE i9_documents SET retention_until = ? WHERE applicant_id = ?
      `).run(pdfResult.retentionUntil, req.applicantId)
    }

    // Check if this form type requires manager approval
    const managerRequiredForms = getManagerSignatureRequiredForms()
    const requiresApproval = managerRequiredForms.includes(formType)
    let approvalId = null

    if (requiresApproval) {
      // If overwriting, mark any existing pending approval for this step as superseded
      if (shouldOverwrite) {
        db.prepare(`
          DELETE FROM document_approvals
          WHERE applicant_id = ? AND step_number = ? AND status = 'pending'
        `).run(req.applicantId, step)
      }

      // Get assigned manager
      const assignedManager = db.prepare('SELECT assigned_manager_id FROM applicants WHERE id = ?').get(req.applicantId)
      const managerId = assignedManager?.assigned_manager_id || null

      // Create approval record
      approvalId = db.prepare(`
        INSERT INTO document_approvals (submission_id, applicant_id, manager_id, step_number, form_type, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(
        pdfResult.submissionId,
        req.applicantId,
        managerId,
        step,
        formType
      ).lastInsertRowid
    }

    // After submit: distinct step count (overwrite = unchanged; insert new step = +1; insert duplicate = unchanged)
    const afterSubmitDistinct = shouldOverwrite
      ? distinctStepCount
      : (existingForStep ? distinctStepCount : distinctStepCount + 1)
    const completedSteps = Math.min(7, afterSubmitDistinct)

    // Onboarding is complete when all 7 steps submitted AND all required approvals are approved
    let isOnboardingComplete = afterSubmitDistinct >= 7
    if (isOnboardingComplete && managerRequiredForms.length > 0) {
      const pendingOrRejected = db.prepare(`
        SELECT COUNT(*) as count FROM document_approvals
        WHERE applicant_id = ? AND status IN ('pending', 'rejected')
      `).get(req.applicantId)
      if (pendingOrRejected && pendingOrRejected.count > 0) {
        isOnboardingComplete = false
      }
    }

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
        requiresPasswordSetup,
        requiresApproval,
        approvalId
      }
    })

    // --- Notification triggers ---
    try {
      // Step 4: No bank account notification
      if (step === 4 && formData.accountType === 'no-account') {
        notifyAdminsAndManagers({
          type: 'no_bank_account',
          title: 'Applicant Has No Bank Account',
          message: `${applicant.first_name} ${applicant.last_name} (${applicant.email}) indicated they do not have a bank account on the Direct Deposit form.`,
          link: '/admin',
          sourceUserId: req.applicantId,
          applicantId: req.applicantId
        })
      }

      // Document approval needed
      if (requiresApproval && approvalId) {
        notifyAdminsAndManagers({
          type: 'document_approval_needed',
          title: 'Document Needs Approval',
          message: `${applicant.first_name} ${applicant.last_name} submitted ${formType} (Step ${step}) which requires manager approval.`,
          link: '/approvals',
          sourceUserId: req.applicantId,
          applicantId: req.applicantId
        })
      }

      // Onboarding complete notifications
      if (isOnboardingComplete) {
        notifyAdminsAndManagers({
          type: 'onboarding_complete',
          title: 'Onboarding Completed',
          message: `${applicant.first_name} ${applicant.last_name} (${applicant.email}) has completed all onboarding forms.`,
          link: '/admin',
          sourceUserId: req.applicantId,
          applicantId: req.applicantId
        })

        createNotification({
          recipientId: req.applicantId,
          type: 'onboarding_complete_confirmation',
          title: 'Onboarding Complete!',
          message: 'Congratulations! You have completed all onboarding forms. Thank you for completing your paperwork.',
          link: '/dashboard'
        })
      }
    } catch (notifError) {
      console.error('Notification trigger error (form submit):', notifError.message)
    }

    res.json({
      success: true,
      submissionId: pdfResult.submissionId,
      filename: pdfResult.filename,
      retentionUntil: pdfResult.retentionUntil,
      isOnboardingComplete,
      requiresPasswordSetup,
      requiresApproval,
      approvalId
    })
  } catch (error) {
    console.error('Form submission error:', error)
    const payload = { error: 'Failed to submit form' }
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      payload.message = error.message
      payload.stack = error.stack
    }
    res.status(500).json(payload)
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
      ORDER BY step_number, submitted_at DESC
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
    if (step < 1 || step > 7) {
      return res.status(400).json({ error: 'Invalid step number' })
    }

    const formType = FORM_TYPES[step]
    if (!formType) {
      return res.status(400).json({ error: 'Invalid form type' })
    }

    // Only allow preview for forms that generate PDFs (W-4, I-9, 8850, 9061)
    if (!['W4', 'I9', '8850', '9061'].includes(formType)) {
      return res.status(400).json({ error: 'Preview not available for this form type' })
    }

    // Block preview if signature placement not configured (same as submission)
    if (!getSignaturePlacement(formType)) {
      return res.status(503).json({
        error: 'This form is not yet available. The administrator must configure signature placement in Admin → System → PDF Templates.'
      })
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

    // Don't generate preview until all legally required fields are filled
    const previewValidation = validatePreviewFormData(formData, step)
    if (!previewValidation.valid) {
      return res.status(400).json({ error: previewValidation.error })
    }

    // Generate PDF preview (without saving)
    const { generateW4PDF, generateI9PDF, generate8850PDF, generate9061PDF } = await import('../services/pdfService.js')

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
      case '9061':
        pdfBytes = await generate9061PDF(formData, applicantData)
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
 * Admins can view all submissions, regular users can only view their own
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

    // Check if user is admin
    const currentUser = db.prepare('SELECT is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && currentUser.is_admin === 1

    // Verify ownership (admins can view all documents)
    if (submission.applicant_id !== req.applicantId && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' })
    }

    let decryptedBuffer

    // Check if document is in Google Drive or local storage
    if (submission.google_drive_id) {
      // Google Drive stores raw PDF (not encrypted); use download as-is
      const { downloadFromGoogleDrive } = await import('../services/googleDriveService.js')
      try {
        decryptedBuffer = await downloadFromGoogleDrive(submission.google_drive_id)
      } catch (downloadError) {
        console.error('Download error (Google Drive):', downloadError)
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
    if (step < 1 || step > 7) {
      return res.status(400).json({ error: 'Invalid step number' })
    }

    const db = getDatabase()
    const formData = req.body.formData || req.body
    const formDataToStore = redactFormDataForStorage(formData, step)

    // Save or update draft (SSN redacted for compliance)
    db.prepare(`
      INSERT INTO form_drafts (applicant_id, step_number, form_data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(applicant_id, step_number) DO UPDATE SET
        form_data = ?,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      req.applicantId,
      step,
      JSON.stringify(formDataToStore),
      JSON.stringify(formDataToStore)
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
    if (step < 1 || step > 7) {
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
 * Update I-9 form submission form_data with document metadata for a category (keeps form in sync with latest document).
 * @param {object} db - Database instance
 * @param {number} applicantId
 * @param {string} documentCategory - listA, listB, or listC
 * @param {string|null} documentNumber
 * @param {string|null} issuingAuthority
 * @param {string|null} expirationDate
 */
function updateI9FormDataForDocument(db, applicantId, documentCategory, documentNumber, issuingAuthority, expirationDate) {
  const row = db.prepare(`
    SELECT id, form_data FROM form_submissions
    WHERE applicant_id = ? AND step_number = 2
    ORDER BY submitted_at DESC LIMIT 1
  `).get(applicantId)
  if (!row || !row.form_data) return
  let formData
  try {
    formData = JSON.parse(row.form_data)
  } catch {
    return
  }
  if (documentCategory === 'listA') {
    if (documentNumber != null) formData.listADocumentNumber = documentNumber
    if (issuingAuthority != null) formData.listAIssuingAuthority = issuingAuthority
    if (expirationDate != null) formData.listAExpiration = expirationDate
  } else if (documentCategory === 'listB') {
    if (documentNumber != null) formData.listBDocumentNumber = documentNumber
    if (issuingAuthority != null) formData.listBIssuingAuthority = issuingAuthority
    if (expirationDate != null) formData.listBExpiration = expirationDate
  } else if (documentCategory === 'listC') {
    if (documentNumber != null) formData.listCDocumentNumber = documentNumber
  }
  db.prepare('UPDATE form_submissions SET form_data = ? WHERE id = ?').run(JSON.stringify(formData), row.id)
}

/**
 * Update step-2 form draft with document metadata so draft stays in sync with uploaded documents.
 * Does not write SSN (frontend omits listCDocumentNumber for SSN card; backend never receives it).
 * @param {object} db - Database instance
 * @param {number} applicantId
 * @param {string} documentCategory - listA, listB, or listC
 * @param {string|null} documentNumber
 * @param {string|null} issuingAuthority
 * @param {string|null} expirationDate
 */
function updateI9DraftForDocument(db, applicantId, documentCategory, documentNumber, issuingAuthority, expirationDate) {
  const draft = db.prepare(`
    SELECT id, form_data FROM form_drafts
    WHERE applicant_id = ? AND step_number = 2
  `).get(applicantId)
  if (!draft || !draft.form_data) return
  let formData
  try {
    formData = JSON.parse(draft.form_data)
  } catch {
    return
  }
  if (documentCategory === 'listA') {
    if (documentNumber != null) formData.listADocumentNumber = documentNumber
    if (issuingAuthority != null) formData.listAIssuingAuthority = issuingAuthority
    if (expirationDate != null) formData.listAExpiration = expirationDate
  } else if (documentCategory === 'listB') {
    if (documentNumber != null) formData.listBDocumentNumber = documentNumber
    if (issuingAuthority != null) formData.listBIssuingAuthority = issuingAuthority
    if (expirationDate != null) formData.listBExpiration = expirationDate
  } else if (documentCategory === 'listC') {
    if (documentNumber != null) formData.listCDocumentNumber = documentNumber
  }
  const redacted = redactFormDataForStorage(formData, 2)
  db.prepare('UPDATE form_drafts SET form_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(redacted), draft.id)
}

/**
 * POST /api/forms/i9/upload-document
 * Upload an I-9 identity document
 */
router.post('/i9/upload-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { documentType, documentCategory, documentName, documentNumber, issuingAuthority, expirationDate } = req.body

    if (!documentType || !documentCategory) {
      // Clean up uploaded file
      await fs.unlink(req.file.path)
      return res.status(400).json({ error: 'Document type and category are required' })
    }

    // Get applicant data
    const db = getDatabase()
    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.applicantId)

    // During onboarding (distinct form steps < 7): overwrite. After: insert new version.
    const distinctSteps = db.prepare(`
      SELECT COUNT(DISTINCT step_number) as count FROM form_submissions WHERE applicant_id = ?
    `).get(req.applicantId)
    const duringOnboarding = (distinctSteps?.count ?? 0) < 7

    if (!applicant) {
      await fs.unlink(req.file.path)
      return res.status(404).json({ error: 'Applicant not found' })
    }

    // Read uploaded file into buffer
    let fileBuffer = await fs.readFile(req.file.path)

    // Clean up temporary file immediately
    await fs.unlink(req.file.path)

    // Flatten PDFs so stored copies are non-editable (compliance)
    if (req.file.mimetype === 'application/pdf') {
      fileBuffer = await flattenPdfBuffer(fileBuffer)
    }

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
      googleDriveId = uploadResult.fileId
      webViewLink = uploadResult.webViewLink
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

    // Latest existing document for this applicant + type + category (for overwrite or versioning)
    const existing = db.prepare(`
      SELECT id, google_drive_id, file_path FROM i9_documents
      WHERE applicant_id = ? AND document_type = ? AND document_category = ?
      ORDER BY uploaded_at DESC LIMIT 1
    `).get(req.applicantId, documentType, documentCategory)

    const docNumber = documentNumber != null ? String(documentNumber).trim() || null : null
    const issuingAuth = issuingAuthority != null ? String(issuingAuthority).trim() || null : null
    const expDate = expirationDate != null ? String(expirationDate).trim() || null : null

    if (duringOnboarding && existing) {
      // Overwrite: delete old file, update existing row
      if (existing.google_drive_id) {
        try {
          await deleteFromGoogleDrive(existing.google_drive_id)
        } catch (error) {
          console.error('Error deleting old document from Google Drive:', error)
        }
      }
      if (existing.file_path) {
        try {
          await fs.unlink(path.join(LOCAL_I9_STORAGE_DIR, existing.file_path))
        } catch (error) {
          console.error('Error deleting old document from local storage:', error)
        }
      }
      db.prepare(`
        UPDATE i9_documents
        SET document_name = ?, file_name = ?, file_size = ?, mime_type = ?, google_drive_id = ?, file_path = ?, web_view_link = ?, uploaded_at = CURRENT_TIMESTAMP,
            document_number = ?, issuing_authority = ?, expiration_date = ?
        WHERE id = ?
      `).run(
        documentName || req.file.originalname,
        filename,
        req.file.size,
        req.file.mimetype,
        googleDriveId || '',
        localFilePath,
        webViewLink,
        docNumber,
        issuingAuth,
        expDate,
        existing.id
      )
      updateI9FormDataForDocument(db, req.applicantId, documentCategory, docNumber, issuingAuth, expDate)
      updateI9DraftForDocument(db, req.applicantId, documentCategory, docNumber, issuingAuth, expDate)
    } else {
      // Insert new row (first upload or post-onboarding new version)
      db.prepare(`
        INSERT INTO i9_documents
        (applicant_id, document_type, document_category, document_name, file_name, file_size, mime_type, google_drive_id, file_path, web_view_link, document_number, issuing_authority, expiration_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        webViewLink,
        docNumber,
        issuingAuth,
        expDate
      )
      updateI9FormDataForDocument(db, req.applicantId, documentCategory, docNumber, issuingAuth, expDate)
      updateI9DraftForDocument(db, req.applicantId, documentCategory, docNumber, issuingAuth, expDate)
    }

    const resourceId = duringOnboarding && existing ? existing.id : db.prepare('SELECT last_insert_rowid()').get()['last_insert_rowid()']

    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'UPLOAD_DOCUMENT',
      resourceType: 'I9_DOCUMENT',
      resourceId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        documentType,
        documentCategory,
        filename
      }
    })

    // --- Notification trigger: I-9 document uploaded ---
    try {
      notifyAdminsAndManagers({
        type: 'i9_document_uploaded',
        title: 'I-9 Document Uploaded',
        message: `${applicant.first_name} ${applicant.last_name} uploaded an I-9 document (${documentName || documentType}, ${documentCategory}).`,
        link: '/admin',
        sourceUserId: req.applicantId,
        applicantId: req.applicantId
      })
    } catch (notifError) {
      console.error('Notification trigger error (i9 upload):', notifError.message)
    }

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
 * Get current I-9 documents for applicant (latest version per document_category)
 */
router.get('/i9/documents', async (req, res) => {
  try {
    const db = getDatabase()
    const documents = db.prepare(`
      SELECT id, document_type, document_category, document_name, file_name, file_size, uploaded_at, google_drive_id, web_view_link, document_number, issuing_authority, expiration_date
      FROM i9_documents
      WHERE applicant_id = ?
        AND (document_category, uploaded_at) IN (
          SELECT document_category, MAX(uploaded_at) FROM i9_documents WHERE applicant_id = ? GROUP BY document_category
        )
      ORDER BY document_category
    `).all(req.applicantId, req.applicantId)

    res.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

/**
 * GET /api/forms/i9/documents/:id/view
 * View/download an I-9 document
 * Admins can view all documents, regular users can only view their own
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

    // Check if user is admin
    const currentUser = db.prepare('SELECT is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && currentUser.is_admin === 1

    // Verify ownership (admins can view all documents)
    if (document.applicant_id !== req.applicantId && !isAdmin) {
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

