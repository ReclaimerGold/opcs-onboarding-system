import express from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { auditLog } from '../services/auditService.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import { 
  getTemplateStatus, 
  updateTemplate, 
  updateAllTemplates, 
  getSupportedFormTypes,
  getTemplate,
  getArchivedTemplate,
  getArchivedVersions,
  getTemplateDirectory
} from '../services/pdfTemplateService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)

const router = express.Router()

// All admin routes require admin authentication
router.use(requireAdmin)

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics summary
 */
router.get('/dashboard', async (req, res) => {
  try {
    const db = getDatabase()
    
    // Total applicants
    const totalApplicants = db.prepare('SELECT COUNT(*) as count FROM applicants').get().count
    
    // Total admins
    const totalAdmins = db.prepare('SELECT COUNT(*) as count FROM applicants WHERE is_admin = 1').get().count
    
    // Completed onboarding count
    const completedOnboarding = db.prepare(`
      SELECT COUNT(DISTINCT applicant_id) as count 
      FROM form_submissions 
      GROUP BY applicant_id 
      HAVING COUNT(*) >= 6
    `).all().length
    
    // In progress onboarding
    const inProgress = db.prepare(`
      SELECT COUNT(DISTINCT applicant_id) as count
      FROM form_submissions
      GROUP BY applicant_id
      HAVING COUNT(*) > 0 AND COUNT(*) < 6
    `).all().length
    
    // Recent login attempts (last 24 hours)
    const recentLogins = db.prepare(`
      SELECT COUNT(*) as count 
      FROM login_attempts 
      WHERE created_at > datetime('now', '-1 day')
    `).get().count
    
    // Failed login attempts (last 24 hours)
    const failedLogins = db.prepare(`
      SELECT COUNT(*) as count 
      FROM login_attempts 
      WHERE success = 0 AND created_at > datetime('now', '-1 day')
    `).get().count
    
    // Total form submissions
    const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM form_submissions').get().count
    
    // Recent audit logs (last 24 hours)
    const recentAuditLogs = db.prepare(`
      SELECT COUNT(*) as count 
      FROM audit_log 
      WHERE created_at > datetime('now', '-1 day')
    `).get().count
    
    res.json({
      applicants: {
        total: totalApplicants,
        admins: totalAdmins,
        regular: totalApplicants - totalAdmins
      },
      onboarding: {
        completed: completedOnboarding,
        inProgress,
        notStarted: totalApplicants - completedOnboarding - inProgress
      },
      activity: {
        recentLogins,
        failedLogins,
        totalSubmissions,
        recentAuditLogs
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to retrieve dashboard data' })
  }
})

/**
 * GET /api/admin/login-attempts
 * Get all login attempts with filtering
 */
router.get('/login-attempts', async (req, res) => {
  try {
    const db = getDatabase()
    const { limit = 100, success, startDate, endDate } = req.query
    
    let query = `
      SELECT 
        la.*,
        a.first_name as applicant_first_name,
        a.last_name as applicant_last_name,
        a.email as applicant_email
      FROM login_attempts la
      LEFT JOIN applicants a ON la.applicant_id = a.id
      WHERE 1=1
    `
    const params = []
    
    if (success !== undefined) {
      query += ' AND la.success = ?'
      params.push(success === 'true' ? 1 : 0)
    }
    
    if (startDate) {
      query += ' AND la.created_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND la.created_at <= ?'
      params.push(endDate)
    }
    
    query += ' ORDER BY la.created_at DESC LIMIT ?'
    params.push(parseInt(limit))
    
    const attempts = db.prepare(query).all(...params)
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'login-attempts', filters: req.query }
    })
    
    res.json({ attempts })
  } catch (error) {
    console.error('Login attempts error:', error)
    res.status(500).json({ error: 'Failed to retrieve login attempts' })
  }
})

/**
 * GET /api/admin/onboarding-status
 * Get onboarding completion status for all applicants
 */
router.get('/onboarding-status', async (req, res) => {
  try {
    const db = getDatabase()
    
    const applicants = db.prepare(`
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.email,
        a.is_admin,
        a.created_at,
        COUNT(fs.id) as completed_steps,
        MAX(fs.submitted_at) as last_submission
      FROM applicants a
      LEFT JOIN form_submissions fs ON a.id = fs.applicant_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all()
    
    const status = applicants.map(app => ({
      id: app.id,
      firstName: app.first_name,
      lastName: app.last_name,
      email: app.email,
      isAdmin: app.is_admin === 1,
      completedSteps: app.completed_steps || 0,
      totalSteps: 6,
      progress: Math.round(((app.completed_steps || 0) / 6) * 100),
      status: app.completed_steps >= 6 ? 'completed' : app.completed_steps > 0 ? 'in_progress' : 'not_started',
      createdAt: app.created_at,
      lastSubmission: app.last_submission
    }))
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'onboarding-status' }
    })
    
    res.json({ applicants: status })
  } catch (error) {
    console.error('Onboarding status error:', error)
    res.status(500).json({ error: 'Failed to retrieve onboarding status' })
  }
})

/**
 * GET /api/admin/audit-logs
 * Get filtered audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const db = getDatabase()
    const { limit = 100, action, resourceType, userId, startDate, endDate } = req.query
    
    let query = `
      SELECT 
        al.*,
        a.first_name,
        a.last_name,
        a.email
      FROM audit_log al
      LEFT JOIN applicants a ON al.user_id = a.id
      WHERE 1=1
    `
    const params = []
    
    if (action) {
      query += ' AND al.action = ?'
      params.push(action)
    }
    
    if (resourceType) {
      query += ' AND al.resource_type = ?'
      params.push(resourceType)
    }
    
    if (userId) {
      query += ' AND al.user_id = ?'
      params.push(parseInt(userId))
    }
    
    if (startDate) {
      query += ' AND al.created_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND al.created_at <= ?'
      params.push(endDate)
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT ?'
    params.push(parseInt(limit))
    
    const logs = db.prepare(query).all(...params)
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'audit-logs', filters: req.query }
    })
    
    res.json({ logs })
  } catch (error) {
    console.error('Audit logs error:', error)
    res.status(500).json({ error: 'Failed to retrieve audit logs' })
  }
})

/**
 * GET /api/admin/system-health
 * Get system health information
 */
router.get('/system-health', async (req, res) => {
  try {
    const db = getDatabase()
    
    // Database table counts
    const tableCounts = {
      applicants: db.prepare('SELECT COUNT(*) as count FROM applicants').get().count,
      form_submissions: db.prepare('SELECT COUNT(*) as count FROM form_submissions').get().count,
      audit_log: db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count,
      login_attempts: db.prepare('SELECT COUNT(*) as count FROM login_attempts').get().count,
      form_drafts: db.prepare('SELECT COUNT(*) as count FROM form_drafts').get().count,
      privacy_consents: db.prepare('SELECT COUNT(*) as count FROM privacy_consents').get().count,
      settings: db.prepare('SELECT COUNT(*) as count FROM settings').get().count
    }
    
    // Recent errors from audit log
    const recentErrors = db.prepare(`
      SELECT * FROM audit_log 
      WHERE action LIKE '%ERROR%' OR action LIKE '%FAIL%'
      ORDER BY created_at DESC 
      LIMIT 10
    `).all()
    
    // Database file size
    const dbPath = db.prepare('PRAGMA database_list').all()[0]?.file
    const fs = await import('fs')
    const path = await import('path')
    let dbSize = 0
    try {
      if (dbPath) {
        const stats = fs.statSync(dbPath)
        dbSize = stats.size
      }
    } catch (error) {
      // Ignore file size errors
    }
    
    // Server uptime (approximate - time since first audit log)
    const firstLog = db.prepare('SELECT MIN(created_at) as first_log FROM audit_log').get()
    const serverStartTime = firstLog?.first_log || new Date().toISOString()
    
    res.json({
      database: {
        status: 'connected',
        tables: tableCounts,
        sizeBytes: dbSize,
        sizeMB: (dbSize / (1024 * 1024)).toFixed(2)
      },
      server: {
        status: 'running',
        startTime: serverStartTime,
        nodeVersion: process.version
      },
      recentErrors: recentErrors.map(err => ({
        id: err.id,
        action: err.action,
        resourceType: err.resource_type,
        details: err.details,
        createdAt: err.created_at
      }))
    })
  } catch (error) {
    console.error('System health error:', error)
    res.status(500).json({ error: 'Failed to retrieve system health' })
  }
})

/**
 * PUT /api/admin/users/:id/admin
 * Update user admin status
 */
router.put('/users/:id/admin', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { isAdmin } = req.body
    
    if (userId === req.applicantId) {
      return res.status(400).json({ error: 'Cannot modify your own admin status' })
    }
    
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin must be a boolean value' })
    }
    
    const db = getDatabase()
    
    // Check if user exists
    const user = db.prepare('SELECT id, first_name, last_name, email, is_admin FROM applicants WHERE id = ?').get(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update admin status
    db.prepare('UPDATE applicants SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, userId)
    
    // Check if password is set (only if promoting to admin)
    let requiresPasswordSetup = false
    if (isAdmin) {
      const updatedUser = db.prepare('SELECT password_hash FROM applicants WHERE id = ?').get(userId)
      requiresPasswordSetup = !updatedUser.password_hash || updatedUser.password_hash === ''
    }
    
    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: isAdmin ? 'PROMOTE_ADMIN' : 'DEMOTE_ADMIN',
      resourceType: 'USER',
      resourceId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { 
        targetUserId: userId,
        targetUserName: `${user.first_name} ${user.last_name}`,
        targetUserEmail: user.email,
        previousStatus: user.is_admin === 1,
        newStatus: isAdmin,
        requiresPasswordSetup
      }
    })
    
    res.json({
      success: true,
      message: isAdmin 
        ? `User ${user.first_name} ${user.last_name} has been promoted to administrator`
        : `User ${user.first_name} ${user.last_name} has been removed from administrator role`,
      user: {
        id: userId,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        isAdmin
      },
      requiresPasswordSetup
    })
  } catch (error) {
    console.error('Update admin status error:', error)
    res.status(500).json({ error: 'Failed to update admin status' })
  }
})

/**
 * GET /api/admin/submissions
 * Get all form submissions for all applicants
 */
router.get('/submissions', async (req, res) => {
  try {
    const db = getDatabase()
    const submissions = db.prepare(`
      SELECT 
        fs.id,
        fs.step_number,
        fs.form_type,
        fs.pdf_filename,
        fs.submitted_at,
        fs.retention_until,
        a.id as applicant_id,
        a.first_name,
        a.last_name,
        a.email
      FROM form_submissions fs
      JOIN applicants a ON fs.applicant_id = a.id
      ORDER BY fs.submitted_at DESC
    `).all()
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'submissions' }
    })
    
    res.json({ submissions })
  } catch (error) {
    console.error('Get all submissions error:', error)
    res.status(500).json({ error: 'Failed to retrieve submissions' })
  }
})

/**
 * GET /api/admin/i9-documents
 * Get all I-9 documents for all applicants
 */
router.get('/i9-documents', async (req, res) => {
  try {
    const db = getDatabase()
    const documents = db.prepare(`
      SELECT 
        d.id,
        d.document_type,
        d.document_category,
        d.document_name,
        d.file_name,
        d.file_size,
        d.uploaded_at,
        a.id as applicant_id,
        a.first_name,
        a.last_name,
        a.email
      FROM i9_documents d
      JOIN applicants a ON d.applicant_id = a.id
      ORDER BY d.uploaded_at DESC
    `).all()
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'i9-documents' }
    })
    
    res.json({ documents })
  } catch (error) {
    console.error('Get all I-9 documents error:', error)
    res.status(500).json({ error: 'Failed to retrieve I-9 documents' })
  }
})

/**
 * POST /api/admin/normalize-applicants
 * Normalize existing applicant data (first_name, last_name, email) to ensure consistency
 * This fixes accounts that were created before normalization was added
 */
router.post('/normalize-applicants', async (req, res) => {
  try {
    const db = getDatabase()
    
    // Get all applicants
    const applicants = db.prepare('SELECT id, first_name, last_name, email FROM applicants').all()
    
    let updated = 0
    const transaction = db.transaction(() => {
      for (const applicant of applicants) {
        const normalizedFirstName = applicant.first_name ? applicant.first_name.trim() : ''
        const normalizedLastName = applicant.last_name ? applicant.last_name.trim() : ''
        const normalizedEmail = applicant.email ? applicant.email.trim().toLowerCase() : ''
        
        // Only update if normalization would change the value
        if (applicant.first_name !== normalizedFirstName ||
            applicant.last_name !== normalizedLastName ||
            applicant.email !== normalizedEmail) {
          db.prepare(`
            UPDATE applicants 
            SET first_name = ?, last_name = ?, email = ?
            WHERE id = ?
          `).run(normalizedFirstName, normalizedLastName, normalizedEmail, applicant.id)
          updated++
        }
      }
    })
    
    transaction()
    
    await auditLog({
      userId: req.applicantId,
      action: 'NORMALIZE_APPLICANTS',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { totalApplicants: applicants.length, updated }
    })
    
    res.json({
      success: true,
      message: `Normalized ${updated} of ${applicants.length} applicants`,
      totalApplicants: applicants.length,
      updated
    })
  } catch (error) {
    console.error('Normalize applicants error:', error)
    res.status(500).json({ error: 'Failed to normalize applicants', details: error.message })
  }
})

/**
 * POST /api/admin/fix-admin-assignments
 * Fix incorrect admin assignments - only keep the first user as admin
 * This fixes the issue where all users were incorrectly made admins
 */
router.post('/fix-admin-assignments', async (req, res) => {
  try {
    const db = getDatabase()
    
    // Get all applicants ordered by creation date
    const applicants = db.prepare(`
      SELECT id, first_name, last_name, email, is_admin, created_at 
      FROM applicants 
      ORDER BY created_at ASC, id ASC
    `).all()
    
    if (applicants.length === 0) {
      return res.json({
        success: true,
        message: 'No applicants found',
        fixed: 0,
        total: 0
      })
    }
    
    // First user should be admin, all others should not be
    const firstUserId = applicants[0].id
    let fixed = 0
    
    const transaction = db.transaction(() => {
      for (const applicant of applicants) {
        const shouldBeAdmin = applicant.id === firstUserId ? 1 : 0
        const isCurrentlyAdmin = applicant.is_admin === 1
        
        if (shouldBeAdmin !== isCurrentlyAdmin) {
          db.prepare('UPDATE applicants SET is_admin = ? WHERE id = ?')
            .run(shouldBeAdmin, applicant.id)
          fixed++
        }
      }
    })
    
    transaction()
    
    await auditLog({
      userId: req.applicantId,
      action: 'FIX_ADMIN_ASSIGNMENTS',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { totalApplicants: applicants.length, fixed, firstUserId }
    })
    
    res.json({
      success: true,
      message: `Fixed admin assignments: ${fixed} of ${applicants.length} applicants`,
      totalApplicants: applicants.length,
      fixed,
      firstUser: {
        id: firstUserId,
        name: `${applicants[0].first_name} ${applicants[0].last_name}`,
        email: applicants[0].email
      }
    })
  } catch (error) {
    console.error('Fix admin assignments error:', error)
    res.status(500).json({ error: 'Failed to fix admin assignments', details: error.message })
  }
})

/**
 * GET /api/admin/diagnose-login
 * Diagnostic endpoint to help identify login issues
 * Query params: firstName, lastName, email
 */
router.get('/diagnose-login', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.query
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'firstName, lastName, and email query parameters are required' 
      })
    }
    
    const db = getDatabase()
    
    // Normalize input
    const normalizedFirstName = firstName.trim().toLowerCase()
    const normalizedLastName = lastName.trim().toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()
    
    // Try to find with normalized query
    const applicant = db.prepare(`
      SELECT id, first_name, last_name, email,
             LOWER(TRIM(first_name)) as norm_first,
             LOWER(TRIM(last_name)) as norm_last,
             LOWER(TRIM(email)) as norm_email
      FROM applicants 
      WHERE LOWER(TRIM(first_name)) = ?
        AND LOWER(TRIM(last_name)) = ?
        AND LOWER(TRIM(email)) = ?
      LIMIT 1
    `).get(normalizedFirstName, normalizedLastName, normalizedEmail)
    
    // Get all applicants for comparison
    const allApplicants = db.prepare(`
      SELECT id, first_name, last_name, email,
             LOWER(TRIM(first_name)) as norm_first,
             LOWER(TRIM(last_name)) as norm_last,
             LOWER(TRIM(email)) as norm_email
      FROM applicants
      ORDER BY id DESC
      LIMIT 20
    `).all()
    
    res.json({
      input: { firstName, lastName, email },
      normalized: { normalizedFirstName, normalizedLastName, normalizedEmail },
      found: applicant !== undefined,
      applicant: applicant || null,
      sampleApplicants: allApplicants,
      message: applicant 
        ? 'Applicant found - login should work'
        : 'Applicant not found - check if data matches exactly (case-insensitive, trimmed)'
    })
  } catch (error) {
    console.error('Diagnose login error:', error)
    res.status(500).json({ error: 'Failed to diagnose login issue', details: error.message })
  }
})

/**
 * GET /api/admin/pdf-templates/status
 * Get status of all PDF templates (IRS/USCIS forms)
 */
router.get('/pdf-templates/status', async (req, res) => {
  try {
    const status = await getTemplateStatus()
    const supportedTypes = getSupportedFormTypes()
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'PDF_TEMPLATES',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'pdf-templates/status' }
    })
    
    res.json({
      supportedFormTypes: supportedTypes,
      templates: status
    })
  } catch (error) {
    console.error('Get PDF template status error:', error)
    res.status(500).json({ error: 'Failed to retrieve PDF template status' })
  }
})

/**
 * POST /api/admin/pdf-templates/update
 * Manually trigger update of PDF templates
 * Query params: formType (optional) - specific form type to update (W4, I9, 8850)
 * If formType is not specified, all templates are updated
 */
router.post('/pdf-templates/update', async (req, res) => {
  try {
    const { formType } = req.query
    const force = req.query.force === 'true'
    
    let results
    
    if (formType) {
      // Update specific template
      const supportedTypes = getSupportedFormTypes()
      if (!supportedTypes.includes(formType)) {
        return res.status(400).json({
          error: `Invalid form type: ${formType}. Supported types: ${supportedTypes.join(', ')}`
        })
      }
      
      const result = await updateTemplate(formType, force)
      results = { [formType]: result }
    } else {
      // Update all templates
      results = await updateAllTemplates(force)
    }
    
    // Count updates
    const updated = Object.entries(results).filter(([, r]) => r.updated).map(([type]) => type)
    const errors = Object.entries(results).filter(([, r]) => r.error).map(([type, r]) => ({ type, error: r.error }))
    
    await auditLog({
      userId: req.applicantId,
      action: 'UPDATE_PDF_TEMPLATES',
      resourceType: 'PDF_TEMPLATES',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        formType: formType || 'all',
        force,
        updated,
        errors: errors.length > 0 ? errors : null
      }
    })
    
    res.json({
      success: errors.length === 0,
      message: updated.length > 0
        ? `Updated templates: ${updated.join(', ')}`
        : 'No templates needed updating',
      results,
      updated,
      errors: errors.length > 0 ? errors : null
    })
  } catch (error) {
    console.error('Update PDF templates error:', error)
    res.status(500).json({ error: 'Failed to update PDF templates', details: error.message })
  }
})

/**
 * GET /api/admin/pdf-templates/:formType/preview
 * Serve the current PDF template for preview/download
 */
router.get('/pdf-templates/:formType/preview', async (req, res) => {
  try {
    const { formType } = req.params
    const supportedTypes = getSupportedFormTypes()
    
    if (!supportedTypes.includes(formType)) {
      return res.status(400).json({
        error: `Invalid form type: ${formType}. Supported types: ${supportedTypes.join(', ')}`
      })
    }
    
    const templateBuffer = await getTemplate(formType)
    
    if (!templateBuffer) {
      return res.status(404).json({ error: `Template for ${formType} not found` })
    }
    
    await auditLog({
      userId: req.applicantId,
      action: 'PREVIEW_PDF_TEMPLATE',
      resourceType: 'PDF_TEMPLATES',
      resourceId: formType,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { formType, type: 'current' }
    })
    
    // Set headers for PDF viewing in browser
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${formType}-template.pdf"`)
    res.setHeader('Content-Length', templateBuffer.length)
    res.send(templateBuffer)
  } catch (error) {
    console.error('Preview PDF template error:', error)
    res.status(500).json({ error: 'Failed to retrieve PDF template' })
  }
})

/**
 * GET /api/admin/pdf-templates/:formType/archive
 * Get list of archived versions for a form type
 */
router.get('/pdf-templates/:formType/archive', async (req, res) => {
  try {
    const { formType } = req.params
    const supportedTypes = getSupportedFormTypes()
    
    if (!supportedTypes.includes(formType)) {
      return res.status(400).json({
        error: `Invalid form type: ${formType}. Supported types: ${supportedTypes.join(', ')}`
      })
    }
    
    const versions = await getArchivedVersions(formType)
    
    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'PDF_TEMPLATES',
      resourceId: formType,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { formType, endpoint: 'archive-list' }
    })
    
    res.json({
      formType,
      versions,
      count: versions.length
    })
  } catch (error) {
    console.error('Get archived versions error:', error)
    res.status(500).json({ error: 'Failed to retrieve archived versions' })
  }
})

/**
 * GET /api/admin/pdf-templates/:formType/archive/:filename
 * Serve an archived PDF template for preview/download
 */
router.get('/pdf-templates/:formType/archive/:filename', async (req, res) => {
  try {
    const { formType, filename } = req.params
    const supportedTypes = getSupportedFormTypes()
    
    if (!supportedTypes.includes(formType)) {
      return res.status(400).json({
        error: `Invalid form type: ${formType}. Supported types: ${supportedTypes.join(', ')}`
      })
    }
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    
    const templateBuffer = await getArchivedTemplate(formType, filename)
    
    if (!templateBuffer) {
      return res.status(404).json({ error: `Archived template ${filename} not found` })
    }
    
    await auditLog({
      userId: req.applicantId,
      action: 'PREVIEW_PDF_TEMPLATE',
      resourceType: 'PDF_TEMPLATES',
      resourceId: formType,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { formType, type: 'archived', filename }
    })
    
    // Set headers for PDF viewing in browser
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.setHeader('Content-Length', templateBuffer.length)
    res.send(templateBuffer)
  } catch (error) {
    console.error('Preview archived template error:', error)
    res.status(500).json({ error: 'Failed to retrieve archived template' })
  }
})

/**
 * POST /api/admin/tests/run
 * Run unit tests and return results
 */
router.post('/tests/run', async (req, res) => {
  try {
    const backendDir = path.join(__dirname, '../../')
    const frontendDir = path.join(__dirname, '../../../frontend')
    
    const results = {
      backend: null,
      frontend: null,
      timestamp: new Date().toISOString()
    }
    
    // Run backend tests
    try {
      const backendTestCmd = 'cd ' + backendDir + ' && npm test -- --json --no-coverage 2>&1'
      const { stdout: backendOutput, stderr: backendError } = await execAsync(backendTestCmd, {
        timeout: 120000, // 120 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })
      
      const fullOutput = (backendOutput || '') + (backendError || '')
      
      try {
        // Try to parse as JSON (Jest JSON output)
        const jsonMatch = backendOutput.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          results.backend = {
            success: parsed.numFailedTests === 0 && parsed.numFailedTestSuites === 0,
            output: parsed,
            rawOutput: fullOutput,
            stderr: backendError || '',
            command: backendTestCmd
          }
        } else {
          const hasPass = fullOutput.includes('PASS') || fullOutput.includes('✓')
          const hasFail = fullOutput.includes('FAIL') || fullOutput.includes('✕') || fullOutput.includes('Error:')
          results.backend = {
            success: hasPass && !hasFail,
            output: null,
            rawOutput: fullOutput,
            stderr: backendError || '',
            command: backendTestCmd
          }
        }
      } catch (parseError) {
        const hasPass = fullOutput.includes('PASS') || fullOutput.includes('✓')
        const hasFail = fullOutput.includes('FAIL') || fullOutput.includes('✕') || fullOutput.includes('Error:')
        results.backend = {
          success: hasPass && !hasFail,
          output: null,
          rawOutput: fullOutput,
          stderr: backendError || '',
          command: backendTestCmd,
          parseError: parseError.message
        }
      }
    } catch (backendTestError) {
      const errorOutput = (backendTestError.stdout || '') + (backendTestError.stderr || '') + (backendTestError.message || '')
      results.backend = {
        success: false,
        error: backendTestError.message,
        code: backendTestError.code,
        signal: backendTestError.signal,
        output: null,
        rawOutput: errorOutput,
        stderr: backendTestError.stderr || '',
        command: 'cd ' + backendDir + ' && npm test -- --json --no-coverage 2>&1'
      }
    }
    
    // Run frontend tests
    try {
      const frontendTestCmd = 'cd ' + frontendDir + ' && npm test -- --run --reporter=json 2>&1'
      const { stdout: frontendOutput, stderr: frontendError } = await execAsync(frontendTestCmd, {
        timeout: 120000, // 120 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })
      
      const fullOutput = (frontendOutput || '') + (frontendError || '')
      
      try {
        // Try to parse as JSON (Vitest JSON output)
        const jsonMatch = frontendOutput.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          results.frontend = {
            success: parsed.numFailedTests === 0 && parsed.numFailedTestSuites === 0,
            output: parsed,
            rawOutput: fullOutput,
            stderr: frontendError || '',
            command: frontendTestCmd
          }
        } else {
          const hasPass = fullOutput.includes('PASS') || fullOutput.includes('✓') || fullOutput.includes('passed')
          const hasFail = fullOutput.includes('FAIL') || fullOutput.includes('✕') || fullOutput.includes('failed') || fullOutput.includes('Error:')
          results.frontend = {
            success: hasPass && !hasFail,
            output: null,
            rawOutput: fullOutput,
            stderr: frontendError || '',
            command: frontendTestCmd
          }
        }
      } catch (parseError) {
        const hasPass = fullOutput.includes('PASS') || fullOutput.includes('✓') || fullOutput.includes('passed')
        const hasFail = fullOutput.includes('FAIL') || fullOutput.includes('✕') || fullOutput.includes('failed') || fullOutput.includes('Error:')
        results.frontend = {
          success: hasPass && !hasFail,
          output: null,
          rawOutput: fullOutput,
          stderr: frontendError || '',
          command: frontendTestCmd,
          parseError: parseError.message
        }
      }
    } catch (frontendTestError) {
      const errorOutput = (frontendTestError.stdout || '') + (frontendTestError.stderr || '') + (frontendTestError.message || '')
      results.frontend = {
        success: false,
        error: frontendTestError.message,
        code: frontendTestError.code,
        signal: frontendTestError.signal,
        output: null,
        rawOutput: errorOutput,
        stderr: frontendTestError.stderr || '',
        command: 'cd ' + frontendDir + ' && npm test -- --run --reporter=json 2>&1'
      }
    }
    
    // Audit log
    await auditLog({
      userId: req.applicantId,
      action: 'RUN_TESTS',
      resourceType: 'SYSTEM',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        backendSuccess: results.backend?.success,
        frontendSuccess: results.frontend?.success,
        timestamp: results.timestamp
      }
    })
    
    res.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Test execution error:', error)
    res.status(500).json({
      error: 'Failed to run tests',
      message: error.message
    })
  }
})

export default router

