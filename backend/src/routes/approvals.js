import express from 'express'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { requireAuth, requireManager } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { addManagerSignatureToPdf, getSigningManagerSignatureForApplicant, loadPendingApprovalPdf } from '../services/pdfService.js'
import { auditLog } from '../services/auditService.js'
import { downloadFromGoogleDrive } from '../services/googleDriveService.js'
import { decryptBuffer } from '../services/encryptionService.js'
import { createNotification } from '../services/notificationService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

/**
 * GET /api/approvals/queue
 * List pending approvals for the current manager/admin.
 * Admins see all; managers see only their assigned applicants.
 * Supports filtering by status, form_type, and pagination.
 */
router.get('/queue', requireManager, async (req, res) => {
  try {
    const db = getDatabase()
    const currentUser = db.prepare('SELECT id, role, is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'admin')

    const { status, formType, page = 1, limit = 50 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

    let whereClause = 'WHERE 1=1'
    const params = []

    // Managers only see approvals for their assigned applicants
    if (!isAdmin) {
      whereClause += ' AND (da.manager_id = ? OR a.assigned_manager_id = ?)'
      params.push(req.applicantId, req.applicantId)
    }

    if (status) {
      whereClause += ' AND da.status = ?'
      params.push(status)
    }

    if (formType) {
      whereClause += ' AND da.form_type = ?'
      params.push(formType)
    }

    // Get total count
    const countRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM document_approvals da
      JOIN applicants a ON da.applicant_id = a.id
      ${whereClause}
    `).get(...params)

    // Get paginated results
    const approvals = db.prepare(`
      SELECT 
        da.id,
        da.submission_id,
        da.applicant_id,
        da.manager_id,
        da.step_number,
        da.form_type,
        da.status,
        da.rejection_reason,
        da.signed_at,
        da.created_at,
        da.updated_at,
        a.first_name as applicant_first_name,
        a.last_name as applicant_last_name,
        a.email as applicant_email,
        fs.pdf_filename,
        fs.submitted_at,
        fs.web_view_link,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name
      FROM document_approvals da
      JOIN applicants a ON da.applicant_id = a.id
      JOIN form_submissions fs ON da.submission_id = fs.id
      LEFT JOIN applicants m ON da.manager_id = m.id
      ${whereClause}
      ORDER BY 
        CASE da.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
        da.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset)

    res.json({
      approvals,
      total: countRow?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    console.error('Approval queue error:', error)
    res.status(500).json({ error: 'Failed to retrieve approval queue' })
  }
})

/**
 * GET /api/approvals/stats
 * Get approval queue statistics
 */
router.get('/stats', requireManager, async (req, res) => {
  try {
    const db = getDatabase()
    const currentUser = db.prepare('SELECT id, role, is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'admin')

    let whereClause = ''
    const params = []

    if (!isAdmin) {
      whereClause = 'WHERE (da.manager_id = ? OR a.assigned_manager_id = ?)'
      params.push(req.applicantId, req.applicantId)
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN da.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN da.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN da.status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM document_approvals da
      ${whereClause ? `JOIN applicants a ON da.applicant_id = a.id ${whereClause}` : ''}
    `).get(...params)

    res.json(stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
  } catch (error) {
    console.error('Approval stats error:', error)
    res.status(500).json({ error: 'Failed to retrieve approval stats' })
  }
})

/**
 * GET /api/approvals/applicant-status
 * Get approval statuses for the current applicant's submissions.
 * Available to any authenticated user.
 */
router.get('/applicant-status', requireAuth, async (req, res) => {
  try {
    const db = getDatabase()
    const approvals = db.prepare(`
      SELECT 
        da.id,
        da.submission_id,
        da.step_number,
        da.form_type,
        da.status,
        da.rejection_reason,
        da.signed_at,
        da.created_at,
        da.updated_at
      FROM document_approvals da
      WHERE da.applicant_id = ?
      ORDER BY da.step_number, da.created_at DESC
    `).all(req.applicantId)

    res.json(approvals)
  } catch (error) {
    console.error('Applicant approval status error:', error)
    res.status(500).json({ error: 'Failed to retrieve approval status' })
  }
})

/**
 * GET /api/approvals/:id
 * Get approval detail with submission data
 */
router.get('/:id', requireManager, async (req, res) => {
  try {
    const db = getDatabase()
    const approval = db.prepare(`
      SELECT 
        da.*,
        a.first_name as applicant_first_name,
        a.last_name as applicant_last_name,
        a.email as applicant_email,
        fs.pdf_filename,
        fs.form_data,
        fs.submitted_at,
        fs.web_view_link,
        fs.google_drive_id
      FROM document_approvals da
      JOIN applicants a ON da.applicant_id = a.id
      JOIN form_submissions fs ON da.submission_id = fs.id
      WHERE da.id = ?
    `).get(parseInt(req.params.id))

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' })
    }

    // Verify access: admins see all, managers see only their assigned applicants
    const currentUser = db.prepare('SELECT id, role, is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'admin')

    if (!isAdmin) {
      const applicant = db.prepare('SELECT assigned_manager_id FROM applicants WHERE id = ?').get(approval.applicant_id)
      if (approval.manager_id !== req.applicantId && applicant?.assigned_manager_id !== req.applicantId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    res.json(approval)
  } catch (error) {
    console.error('Get approval error:', error)
    res.status(500).json({ error: 'Failed to retrieve approval' })
  }
})

/**
 * GET /api/approvals/:id/pdf
 * View/download the submission PDF for review
 */
router.get('/:id/pdf', requireManager, async (req, res) => {
  try {
    const db = getDatabase()
    const approval = db.prepare(`
      SELECT da.id, da.applicant_id, da.manager_id, fs.google_drive_id, fs.pdf_filename, fs.pdf_encrypted_path, fs.pending_pdf_path
      FROM document_approvals da
      JOIN form_submissions fs ON da.submission_id = fs.id
      WHERE da.id = ?
    `).get(parseInt(req.params.id))

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' })
    }

    // Verify access
    const currentUser = db.prepare('SELECT id, role, is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'admin')

    if (!isAdmin) {
      const applicant = db.prepare('SELECT assigned_manager_id FROM applicants WHERE id = ?').get(approval.applicant_id)
      if (approval.manager_id !== req.applicantId && applicant?.assigned_manager_id !== req.applicantId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    let pdfBuffer
    if (approval.pending_pdf_path) {
      try {
        pdfBuffer = await loadPendingApprovalPdf(approval.pending_pdf_path)
      } catch (err) {
        console.error('Pending approval PDF read error:', err)
        return res.status(500).json({ error: 'Failed to retrieve document from pending storage' })
      }
    } else if (approval.google_drive_id) {
      try {
        // Google Drive stores raw PDF (not encrypted); use download as-is
        pdfBuffer = await downloadFromGoogleDrive(approval.google_drive_id)
      } catch (downloadError) {
        console.error('Download error (Google Drive):', downloadError)
        return res.status(500).json({ error: 'Failed to retrieve document from Google Drive' })
      }
    } else if (approval.pdf_encrypted_path) {
      const localPath = path.join(__dirname, '../../storage/encrypted-pdfs', approval.pdf_encrypted_path)
      try {
        const encryptedBuffer = await fs.readFile(localPath)
        pdfBuffer = decryptBuffer(encryptedBuffer)
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
      action: 'VIEW_APPROVAL_PDF',
      resourceType: 'DOCUMENT_APPROVAL',
      resourceId: approval.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { filename: approval.pdf_filename }
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${approval.pdf_filename}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('View approval PDF error:', error)
    res.status(500).json({ error: 'Failed to retrieve document' })
  }
})

/**
 * POST /api/approvals/:id/approve
 * Approve a document and sign with manager's signature
 * Body: { signatureData?: string } - optional override; defaults to manager's stored signature
 */
router.post('/:id/approve', requireManager, async (req, res) => {
  try {
    const db = getDatabase()
    const approvalId = parseInt(req.params.id)

    const approval = db.prepare(`
      SELECT da.*, fs.form_type
      FROM document_approvals da
      JOIN form_submissions fs ON da.submission_id = fs.id
      WHERE da.id = ?
    `).get(approvalId)

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' })
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve: current status is '${approval.status}'` })
    }

    // Verify access
    const currentUser = db.prepare('SELECT id, role, is_admin, signature_data FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'admin')

    if (!isAdmin) {
      const applicant = db.prepare('SELECT assigned_manager_id FROM applicants WHERE id = ?').get(approval.applicant_id)
      if (approval.manager_id !== req.applicantId && applicant?.assigned_manager_id !== req.applicantId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Whose signature goes on the document: assigned manager if set (and has signature), else first admin as default
    const signingManager = getSigningManagerSignatureForApplicant(approval.applicant_id)
    const signatureData = req.body.signatureData || (signingManager?.signatureData ?? null)
    if (!signatureData) {
      return res.status(400).json({
        error: 'No manager signature available for this document. Set up the default admin signature (Admin onboarding), or assign a manager with a captured signature to this applicant.'
      })
    }

    // Embed manager signature on PDF (pass approval date for 8850 employer signature date)
    const approvalDate = new Date()
    try {
      await addManagerSignatureToPdf(approval.submission_id, signatureData, approvalDate)
    } catch (sigError) {
      console.error('Manager signature embedding error:', sigError)
      return res.status(500).json({ error: `Failed to sign document: ${sigError.message}` })
    }

    // Update approval record
    db.prepare(`
      UPDATE document_approvals 
      SET status = 'approved', manager_id = ?, signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.applicantId, approvalId)

    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'APPROVE_DOCUMENT',
      resourceType: 'DOCUMENT_APPROVAL',
      resourceId: approvalId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        submissionId: approval.submission_id,
        applicantId: approval.applicant_id,
        formType: approval.form_type
      }
    })

    // --- Notification trigger: form approved ---
    try {
      const approvedApplicant = db.prepare('SELECT first_name, last_name FROM applicants WHERE id = ?').get(approval.applicant_id)
      createNotification({
        recipientId: approval.applicant_id,
        type: 'form_approved',
        title: 'Form Approved',
        message: `Your ${approval.form_type} (Step ${approval.step_number}) has been approved and signed by a manager.`,
        link: '/dashboard',
        sourceUserId: req.applicantId
      })
    } catch (notifError) {
      console.error('Notification trigger error (approval):', notifError.message)
    }

    res.json({ success: true, message: 'Document approved and signed' })
  } catch (error) {
    console.error('Approve document error:', error)
    res.status(500).json({ error: 'Failed to approve document' })
  }
})

/**
 * POST /api/approvals/:id/reject
 * Reject a document with a reason
 * Body: { reason: string }
 */
router.post('/:id/reject', requireManager, async (req, res) => {
  try {
    const db = getDatabase()
    const approvalId = parseInt(req.params.id)
    const { reason } = req.body

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }

    const approval = db.prepare(`
      SELECT da.*, fs.form_type
      FROM document_approvals da
      JOIN form_submissions fs ON da.submission_id = fs.id
      WHERE da.id = ?
    `).get(approvalId)

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' })
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject: current status is '${approval.status}'` })
    }

    // Verify access
    const currentUser = db.prepare('SELECT id, role, is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'admin')

    if (!isAdmin) {
      const applicant = db.prepare('SELECT assigned_manager_id FROM applicants WHERE id = ?').get(approval.applicant_id)
      if (approval.manager_id !== req.applicantId && applicant?.assigned_manager_id !== req.applicantId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Update approval record
    db.prepare(`
      UPDATE document_approvals 
      SET status = 'rejected', manager_id = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.applicantId, reason.trim(), approvalId)

    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'REJECT_DOCUMENT',
      resourceType: 'DOCUMENT_APPROVAL',
      resourceId: approvalId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        submissionId: approval.submission_id,
        applicantId: approval.applicant_id,
        formType: approval.form_type,
        reason: reason.trim()
      }
    })

    // --- Notification trigger: form rejected ---
    try {
      createNotification({
        recipientId: approval.applicant_id,
        type: 'form_rejected',
        title: 'Form Rejected',
        message: `Your ${approval.form_type || 'form'} (Step ${approval.step_number}) was rejected. Reason: ${reason.trim()}`,
        link: `/forms?step=${approval.step_number}`,
        sourceUserId: req.applicantId
      })
    } catch (notifError) {
      console.error('Notification trigger error (rejection):', notifError.message)
    }

    res.json({ success: true, message: 'Document rejected' })
  } catch (error) {
    console.error('Reject document error:', error)
    res.status(500).json({ error: 'Failed to reject document' })
  }
})

export default router
