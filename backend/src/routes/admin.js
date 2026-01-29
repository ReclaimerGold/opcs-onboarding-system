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
import { runAllComplianceChecks } from '../services/complianceService.js'
import { fixAllFilePermissions, isGoogleDriveConfigured, deleteFromGoogleDrive, uploadToGoogleDrive } from '../services/googleDriveService.js'
import { generateW4PDF, generateI9PDF, generate8850PDF, generateGenericPDF, generateFilename, calculateRetentionDate } from '../services/pdfService.js'

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
 * Get all login attempts with filtering, search, and pagination
 * Query params: search, success, startDate, endDate, page, limit, sortKey, sortDir
 */
router.get('/login-attempts', async (req, res) => {
  try {
    const db = getDatabase()
    const {
      search,
      success,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortKey = 'created_at',
      sortDir = 'desc'
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    let whereClause = 'WHERE 1=1'
    const params = []

    // Search filter (searches name, email, IP)
    if (search) {
      whereClause += ` AND (
        la.first_name LIKE ? OR 
        la.last_name LIKE ? OR 
        la.email LIKE ? OR 
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.email LIKE ? OR
        la.ip_address LIKE ?
      )`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (success !== undefined && success !== '') {
      whereClause += ' AND la.success = ?'
      params.push(success === 'true' ? 1 : 0)
    }

    if (startDate) {
      whereClause += ' AND la.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND la.created_at <= ?'
      params.push(endDate)
    }

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['created_at', 'first_name', 'email', 'success', 'ip_address']
    const sortColumn = validSortColumns.includes(sortKey) ? `la.${sortKey}` : 'la.created_at'
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC'

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM login_attempts la
      LEFT JOIN applicants a ON la.applicant_id = a.id
      ${whereClause}
    `
    const total = db.prepare(countQuery).get(...params).total

    // Get paginated results
    const dataQuery = `
      SELECT 
        la.*,
        a.first_name as applicant_first_name,
        a.last_name as applicant_last_name,
        a.email as applicant_email
      FROM login_attempts la
      LEFT JOIN applicants a ON la.applicant_id = a.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    const attempts = db.prepare(dataQuery).all(...params, parseInt(limit), offset)

    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'login-attempts', filters: req.query }
    })

    res.json({
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Login attempts error:', error)
    res.status(500).json({ error: 'Failed to retrieve login attempts' })
  }
})

/**
 * GET /api/admin/onboarding-status
 * Get onboarding completion status for all applicants with filtering, search, and pagination
 * Query params: search, status, isAdmin, startDate, endDate, page, limit, sortKey, sortDir
 */
router.get('/onboarding-status', async (req, res) => {
  try {
    const db = getDatabase()
    const {
      search,
      status,
      isAdmin,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortKey = 'created_at',
      sortDir = 'desc'
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    // First, get all applicants with their submission counts (we need to filter after aggregation for status)
    let baseQuery = `
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
    `

    let whereClause = 'WHERE 1=1'
    const params = []

    // Search filter
    if (search) {
      whereClause += ` AND (
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.email LIKE ?
      )`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    // Admin filter
    if (isAdmin !== undefined && isAdmin !== '') {
      whereClause += ' AND a.is_admin = ?'
      params.push(isAdmin === 'true' ? 1 : 0)
    }

    // Date filters
    if (startDate) {
      whereClause += ' AND a.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND a.created_at <= ?'
      params.push(endDate)
    }

    // Build full query with grouping
    const fullQuery = `${baseQuery} ${whereClause} GROUP BY a.id`

    // Get all matching records for filtering by status
    const allApplicants = db.prepare(fullQuery).all(...params)

    // Transform and filter by status
    let transformedApplicants = allApplicants.map(app => ({
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

    // Filter by status if specified
    if (status && status !== '') {
      transformedApplicants = transformedApplicants.filter(app => app.status === status)
    }

    // Sort
    const validSortKeys = ['firstName', 'lastName', 'email', 'createdAt', 'progress', 'completedSteps', 'status']
    const actualSortKey = validSortKeys.includes(sortKey) ? sortKey : 'createdAt'
    transformedApplicants.sort((a, b) => {
      let aVal = a[actualSortKey]
      let bVal = b[actualSortKey]

      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal?.toLowerCase() || ''
      }

      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    // Paginate
    const total = transformedApplicants.length
    const paginatedApplicants = transformedApplicants.slice(offset, offset + parseInt(limit))

    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'onboarding-status', filters: req.query }
    })

    res.json({
      applicants: paginatedApplicants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    res.status(500).json({ error: 'Failed to retrieve onboarding status' })
  }
})

/**
 * GET /api/admin/audit-logs
 * Get filtered audit logs with search and pagination
 * Query params: search, action, resourceType, userId, startDate, endDate, page, limit, sortKey, sortDir
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const db = getDatabase()
    const {
      search,
      action,
      resourceType,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortKey = 'created_at',
      sortDir = 'desc'
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    let whereClause = 'WHERE 1=1'
    const params = []

    // Search filter
    if (search) {
      whereClause += ` AND (
        al.action LIKE ? OR 
        al.resource_type LIKE ? OR 
        al.details LIKE ? OR
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.email LIKE ? OR
        al.ip_address LIKE ?
      )`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (action && action !== '') {
      whereClause += ' AND al.action = ?'
      params.push(action)
    }

    if (resourceType && resourceType !== '') {
      whereClause += ' AND al.resource_type = ?'
      params.push(resourceType)
    }

    if (userId && userId !== '') {
      whereClause += ' AND al.user_id = ?'
      params.push(parseInt(userId))
    }

    if (startDate) {
      whereClause += ' AND al.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND al.created_at <= ?'
      params.push(endDate)
    }

    // Validate sort column
    const validSortColumns = ['created_at', 'action', 'resource_type', 'ip_address']
    const sortColumn = validSortColumns.includes(sortKey) ? `al.${sortKey}` : 'al.created_at'
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC'

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_log al
      LEFT JOIN applicants a ON al.user_id = a.id
      ${whereClause}
    `
    const total = db.prepare(countQuery).get(...params).total

    // Get paginated results
    const dataQuery = `
      SELECT 
        al.*,
        a.first_name,
        a.last_name,
        a.email
      FROM audit_log al
      LEFT JOIN applicants a ON al.user_id = a.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    const logs = db.prepare(dataQuery).all(...params, parseInt(limit), offset)

    // Get distinct actions and resource types for filter dropdowns
    const actions = db.prepare('SELECT DISTINCT action FROM audit_log ORDER BY action').all().map(r => r.action)
    const resourceTypes = db.prepare('SELECT DISTINCT resource_type FROM audit_log ORDER BY resource_type').all().map(r => r.resource_type)

    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'audit-logs', filters: req.query }
    })

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      filterOptions: {
        actions,
        resourceTypes
      }
    })
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
 * Get all form submissions for all applicants with filtering, search, and pagination
 * Query params: search, formType, applicantId, startDate, endDate, page, limit, sortKey, sortDir
 */
router.get('/submissions', async (req, res) => {
  try {
    const db = getDatabase()
    const {
      search,
      formType,
      stepNumber,
      applicantId,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortKey = 'submitted_at',
      sortDir = 'desc'
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    let whereClause = 'WHERE 1=1'
    const params = []

    // Search filter
    if (search) {
      whereClause += ` AND (
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.email LIKE ? OR
        fs.form_type LIKE ? OR
        fs.pdf_filename LIKE ?
      )`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (formType && formType !== '') {
      whereClause += ' AND fs.form_type = ?'
      params.push(formType)
    }

    if (stepNumber && stepNumber !== '') {
      whereClause += ' AND fs.step_number = ?'
      params.push(parseInt(stepNumber))
    }

    if (applicantId && applicantId !== '') {
      whereClause += ' AND fs.applicant_id = ?'
      params.push(parseInt(applicantId))
    }

    if (startDate) {
      whereClause += ' AND fs.submitted_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND fs.submitted_at <= ?'
      params.push(endDate)
    }

    // Validate sort column
    const validSortColumns = ['submitted_at', 'step_number', 'form_type', 'first_name', 'email', 'retention_until']
    const sortColumn = validSortColumns.includes(sortKey)
      ? (sortKey === 'first_name' || sortKey === 'email' ? `a.${sortKey}` : `fs.${sortKey}`)
      : 'fs.submitted_at'
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC'

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM form_submissions fs
      JOIN applicants a ON fs.applicant_id = a.id
      ${whereClause}
    `
    const total = db.prepare(countQuery).get(...params).total

    // Get paginated results
    const dataQuery = `
      SELECT 
        fs.id,
        fs.step_number,
        fs.form_type,
        fs.pdf_filename,
        fs.submitted_at,
        fs.retention_until,
        fs.google_drive_id,
        fs.web_view_link,
        a.id as applicant_id,
        a.first_name,
        a.last_name,
        a.email
      FROM form_submissions fs
      JOIN applicants a ON fs.applicant_id = a.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    const submissions = db.prepare(dataQuery).all(...params, parseInt(limit), offset)

    // Get distinct form types for filter dropdown
    const formTypes = db.prepare('SELECT DISTINCT form_type FROM form_submissions ORDER BY form_type').all().map(r => r.form_type)

    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'submissions', filters: req.query }
    })

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      filterOptions: {
        formTypes,
        stepNumbers: [1, 2, 3, 4, 5, 6]
      }
    })
  } catch (error) {
    console.error('Get all submissions error:', error)
    res.status(500).json({ error: 'Failed to retrieve submissions' })
  }
})

/**
 * GET /api/admin/i9-documents
 * Get all I-9 documents for all applicants with filtering, search, and pagination
 * Query params: search, documentType, documentCategory, applicantId, startDate, endDate, page, limit, sortKey, sortDir
 */
router.get('/i9-documents', async (req, res) => {
  try {
    const db = getDatabase()
    const {
      search,
      documentType,
      documentCategory,
      applicantId,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortKey = 'uploaded_at',
      sortDir = 'desc'
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)

    let whereClause = 'WHERE 1=1'
    const params = []

    // Search filter
    if (search) {
      whereClause += ` AND (
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.email LIKE ? OR
        d.document_type LIKE ? OR
        d.document_name LIKE ? OR
        d.file_name LIKE ?
      )`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (documentType && documentType !== '') {
      whereClause += ' AND d.document_type = ?'
      params.push(documentType)
    }

    if (documentCategory && documentCategory !== '') {
      whereClause += ' AND d.document_category = ?'
      params.push(documentCategory)
    }

    if (applicantId && applicantId !== '') {
      whereClause += ' AND d.applicant_id = ?'
      params.push(parseInt(applicantId))
    }

    if (startDate) {
      whereClause += ' AND d.uploaded_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND d.uploaded_at <= ?'
      params.push(endDate)
    }

    // Validate sort column
    const validSortColumns = ['uploaded_at', 'document_type', 'document_category', 'file_name', 'file_size', 'first_name', 'email']
    const sortColumn = validSortColumns.includes(sortKey)
      ? (sortKey === 'first_name' || sortKey === 'email' ? `a.${sortKey}` : `d.${sortKey}`)
      : 'd.uploaded_at'
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC'

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM i9_documents d
      JOIN applicants a ON d.applicant_id = a.id
      ${whereClause}
    `
    const total = db.prepare(countQuery).get(...params).total

    // Get paginated results
    const dataQuery = `
      SELECT 
        d.id,
        d.document_type,
        d.document_category,
        d.document_name,
        d.file_name,
        d.file_size,
        d.uploaded_at,
        d.google_drive_id,
        d.web_view_link,
        a.id as applicant_id,
        a.first_name,
        a.last_name,
        a.email
      FROM i9_documents d
      JOIN applicants a ON d.applicant_id = a.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    const documents = db.prepare(dataQuery).all(...params, parseInt(limit), offset)

    // Get distinct values for filter dropdowns
    const documentTypes = db.prepare('SELECT DISTINCT document_type FROM i9_documents WHERE document_type IS NOT NULL ORDER BY document_type').all().map(r => r.document_type)
    const documentCategories = db.prepare('SELECT DISTINCT document_category FROM i9_documents WHERE document_category IS NOT NULL ORDER BY document_category').all().map(r => r.document_category)

    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { endpoint: 'i9-documents', filters: req.query }
    })

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      filterOptions: {
        documentTypes,
        documentCategories
      }
    })
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

/**
 * GET /api/admin/compliance-check
 * Run comprehensive compliance check for Federal and South Dakota state requirements
 * Verifies SSN protection, document retention, encryption, audit logging, and more
 */
router.get('/compliance-check', async (req, res) => {
  try {
    // Run all compliance checks
    const complianceReport = await runAllComplianceChecks()

    // Audit log the compliance check
    await auditLog({
      userId: req.applicantId,
      action: 'COMPLIANCE_CHECK',
      resourceType: 'SYSTEM',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: {
        complianceScore: complianceReport.summary.complianceScore,
        status: complianceReport.summary.status,
        criticalIssues: complianceReport.summary.criticalIssues,
        timestamp: complianceReport.timestamp
      }
    })

    res.json(complianceReport)
  } catch (error) {
    console.error('Compliance check error:', error)
    res.status(500).json({
      error: 'Failed to run compliance check',
      message: error.message
    })
  }
})

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * Helper function to convert data to CSV
 */
function toCSV(data, columns) {
  if (!data || data.length === 0) return ''

  const escapeValue = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headers = columns.map(col => escapeValue(col.label))
  const rows = data.map(row =>
    columns.map(col => escapeValue(row[col.key])).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

/**
 * GET /api/admin/onboarding-status/export
 * Export onboarding status data as CSV
 */
router.get('/onboarding-status/export', async (req, res) => {
  try {
    const db = getDatabase()
    const { search, status, isAdmin, startDate, endDate } = req.query

    let baseQuery = `
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
    `

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ` AND (a.first_name LIKE ? OR a.last_name LIKE ? OR a.email LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (isAdmin !== undefined && isAdmin !== '') {
      whereClause += ' AND a.is_admin = ?'
      params.push(isAdmin === 'true' ? 1 : 0)
    }

    if (startDate) {
      whereClause += ' AND a.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND a.created_at <= ?'
      params.push(endDate)
    }

    const fullQuery = `${baseQuery} ${whereClause} GROUP BY a.id ORDER BY a.created_at DESC`
    const applicants = db.prepare(fullQuery).all(...params)

    let data = applicants.map(app => ({
      id: app.id,
      firstName: app.first_name,
      lastName: app.last_name,
      email: app.email,
      isAdmin: app.is_admin === 1 ? 'Yes' : 'No',
      completedSteps: app.completed_steps || 0,
      progress: Math.round(((app.completed_steps || 0) / 6) * 100) + '%',
      status: app.completed_steps >= 6 ? 'Completed' : app.completed_steps > 0 ? 'In Progress' : 'Not Started',
      createdAt: app.created_at,
      lastSubmission: app.last_submission || 'N/A'
    }))

    if (status && status !== '') {
      const statusMap = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started' }
      data = data.filter(app => app.status === statusMap[status])
    }

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'isAdmin', label: 'Admin' },
      { key: 'completedSteps', label: 'Steps Completed' },
      { key: 'progress', label: 'Progress' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
      { key: 'lastSubmission', label: 'Last Submission' }
    ]

    const csv = toCSV(data, columns)

    await auditLog({
      userId: req.applicantId,
      action: 'EXPORT',
      resourceType: 'ONBOARDING_STATUS',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { filters: req.query, recordCount: data.length }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="onboarding-status-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Export onboarding status error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

/**
 * GET /api/admin/submissions/export
 * Export form submissions data as CSV
 */
router.get('/submissions/export', async (req, res) => {
  try {
    const db = getDatabase()
    const { search, formType, stepNumber, applicantId, startDate, endDate } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ` AND (a.first_name LIKE ? OR a.last_name LIKE ? OR a.email LIKE ? OR fs.form_type LIKE ? OR fs.pdf_filename LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (formType && formType !== '') {
      whereClause += ' AND fs.form_type = ?'
      params.push(formType)
    }

    if (stepNumber && stepNumber !== '') {
      whereClause += ' AND fs.step_number = ?'
      params.push(parseInt(stepNumber))
    }

    if (applicantId && applicantId !== '') {
      whereClause += ' AND fs.applicant_id = ?'
      params.push(parseInt(applicantId))
    }

    if (startDate) {
      whereClause += ' AND fs.submitted_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND fs.submitted_at <= ?'
      params.push(endDate)
    }

    const query = `
      SELECT 
        fs.id,
        fs.step_number as stepNumber,
        fs.form_type as formType,
        fs.pdf_filename as pdfFilename,
        fs.submitted_at as submittedAt,
        fs.retention_until as retentionUntil,
        a.first_name as firstName,
        a.last_name as lastName,
        a.email
      FROM form_submissions fs
      JOIN applicants a ON fs.applicant_id = a.id
      ${whereClause}
      ORDER BY fs.submitted_at DESC
    `
    const submissions = db.prepare(query).all(...params)

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'stepNumber', label: 'Step' },
      { key: 'formType', label: 'Form Type' },
      { key: 'pdfFilename', label: 'Filename' },
      { key: 'submittedAt', label: 'Submitted At' },
      { key: 'retentionUntil', label: 'Retention Until' }
    ]

    const csv = toCSV(submissions, columns)

    await auditLog({
      userId: req.applicantId,
      action: 'EXPORT',
      resourceType: 'FORM_SUBMISSIONS',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { filters: req.query, recordCount: submissions.length }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Export submissions error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

/**
 * GET /api/admin/i9-documents/export
 * Export I-9 documents data as CSV
 */
router.get('/i9-documents/export', async (req, res) => {
  try {
    const db = getDatabase()
    const { search, documentType, documentCategory, applicantId, startDate, endDate } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ` AND (a.first_name LIKE ? OR a.last_name LIKE ? OR a.email LIKE ? OR d.document_type LIKE ? OR d.document_name LIKE ? OR d.file_name LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (documentType && documentType !== '') {
      whereClause += ' AND d.document_type = ?'
      params.push(documentType)
    }

    if (documentCategory && documentCategory !== '') {
      whereClause += ' AND d.document_category = ?'
      params.push(documentCategory)
    }

    if (applicantId && applicantId !== '') {
      whereClause += ' AND d.applicant_id = ?'
      params.push(parseInt(applicantId))
    }

    if (startDate) {
      whereClause += ' AND d.uploaded_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND d.uploaded_at <= ?'
      params.push(endDate)
    }

    const query = `
      SELECT 
        d.id,
        d.document_type as documentType,
        d.document_category as documentCategory,
        d.document_name as documentName,
        d.file_name as fileName,
        d.file_size as fileSize,
        d.uploaded_at as uploadedAt,
        a.first_name as firstName,
        a.last_name as lastName,
        a.email
      FROM i9_documents d
      JOIN applicants a ON d.applicant_id = a.id
      ${whereClause}
      ORDER BY d.uploaded_at DESC
    `
    const documents = db.prepare(query).all(...params)

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'documentType', label: 'Document Type' },
      { key: 'documentCategory', label: 'Category' },
      { key: 'documentName', label: 'Document Name' },
      { key: 'fileName', label: 'File Name' },
      { key: 'fileSize', label: 'File Size' },
      { key: 'uploadedAt', label: 'Uploaded At' }
    ]

    const csv = toCSV(documents, columns)

    await auditLog({
      userId: req.applicantId,
      action: 'EXPORT',
      resourceType: 'I9_DOCUMENTS',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { filters: req.query, recordCount: documents.length }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="i9-documents-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Export I-9 documents error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs data as CSV
 */
router.get('/audit-logs/export', async (req, res) => {
  try {
    const db = getDatabase()
    const { search, action, resourceType, userId, startDate, endDate } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ` AND (al.action LIKE ? OR al.resource_type LIKE ? OR al.details LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ? OR a.email LIKE ? OR al.ip_address LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (action && action !== '') {
      whereClause += ' AND al.action = ?'
      params.push(action)
    }

    if (resourceType && resourceType !== '') {
      whereClause += ' AND al.resource_type = ?'
      params.push(resourceType)
    }

    if (userId && userId !== '') {
      whereClause += ' AND al.user_id = ?'
      params.push(parseInt(userId))
    }

    if (startDate) {
      whereClause += ' AND al.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND al.created_at <= ?'
      params.push(endDate)
    }

    const query = `
      SELECT 
        al.id,
        al.action,
        al.resource_type as resourceType,
        al.resource_id as resourceId,
        al.ip_address as ipAddress,
        al.user_agent as userAgent,
        al.details,
        al.created_at as createdAt,
        COALESCE(a.first_name || ' ' || a.last_name, 'System') as userName,
        a.email as userEmail
      FROM audit_log al
      LEFT JOIN applicants a ON al.user_id = a.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `
    const logs = db.prepare(query).all(...params)

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'action', label: 'Action' },
      { key: 'resourceType', label: 'Resource Type' },
      { key: 'resourceId', label: 'Resource ID' },
      { key: 'userName', label: 'User' },
      { key: 'userEmail', label: 'User Email' },
      { key: 'ipAddress', label: 'IP Address' },
      { key: 'details', label: 'Details' }
    ]

    const csv = toCSV(logs, columns)

    await auditLog({
      userId: req.applicantId,
      action: 'EXPORT',
      resourceType: 'AUDIT_LOGS',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { filters: req.query, recordCount: logs.length }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Export audit logs error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

/**
 * GET /api/admin/login-attempts/export
 * Export login attempts data as CSV
 */
router.get('/login-attempts/export', async (req, res) => {
  try {
    const db = getDatabase()
    const { search, success, startDate, endDate } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ` AND (la.first_name LIKE ? OR la.last_name LIKE ? OR la.email LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ? OR a.email LIKE ? OR la.ip_address LIKE ?)`
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    if (success !== undefined && success !== '') {
      whereClause += ' AND la.success = ?'
      params.push(success === 'true' ? 1 : 0)
    }

    if (startDate) {
      whereClause += ' AND la.created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND la.created_at <= ?'
      params.push(endDate)
    }

    const query = `
      SELECT 
        la.id,
        la.created_at as createdAt,
        COALESCE(a.first_name, la.first_name) as firstName,
        COALESCE(a.last_name, la.last_name) as lastName,
        COALESCE(a.email, la.email) as email,
        CASE WHEN la.success = 1 THEN 'Success' ELSE 'Failed' END as status,
        la.ip_address as ipAddress,
        la.error_message as errorMessage
      FROM login_attempts la
      LEFT JOIN applicants a ON la.applicant_id = a.id
      ${whereClause}
      ORDER BY la.created_at DESC
    `
    const attempts = db.prepare(query).all(...params)

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'ipAddress', label: 'IP Address' },
      { key: 'errorMessage', label: 'Error Message' }
    ]

    const csv = toCSV(attempts, columns)

    await auditLog({
      userId: req.applicantId,
      action: 'EXPORT',
      resourceType: 'LOGIN_ATTEMPTS',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { filters: req.query, recordCount: attempts.length }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="login-attempts-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  } catch (error) {
    console.error('Export login attempts error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

/**
 * POST /api/admin/regenerate-pdfs
 * Regenerate all corrupted PDFs in Google Drive
 * Deletes old files and uploads new unencrypted versions
 */
router.post('/regenerate-pdfs', async (req, res) => {
  try {
    // Check if Google Drive is configured
    if (!isGoogleDriveConfigured()) {
      return res.status(400).json({ 
        error: 'Google Drive is not configured. Please configure credentials in Settings first.' 
      })
    }

    const db = getDatabase()
    
    // Get all submissions with Google Drive IDs
    // Include all applicant fields needed for PDF generation
    const submissions = db.prepare(`
      SELECT fs.id, fs.applicant_id, fs.step_number, fs.form_type, fs.google_drive_id, fs.form_data,
             a.id as a_id, a.first_name, a.last_name, a.email, a.phone, a.hire_date, a.termination_date,
             a.address, a.city, a.state, a.zip_code, a.date_of_birth
      FROM form_submissions fs
      JOIN applicants a ON fs.applicant_id = a.id
      WHERE fs.google_drive_id IS NOT NULL AND fs.google_drive_id != ''
      ORDER BY fs.applicant_id, fs.step_number
    `).all()

    console.log(`Starting PDF regeneration for ${submissions.length} submissions...`)

    const results = {
      total: submissions.length,
      success: 0,
      failed: 0,
      details: []
    }

    for (const sub of submissions) {
      const applicantName = `${sub.first_name} ${sub.last_name}`
      console.log(`Processing: ${applicantName} - ${sub.form_type} (Step ${sub.step_number})`)

      try {
        // 1. Delete old file from Google Drive (don't fail if delete fails)
        if (sub.google_drive_id) {
          try {
            await deleteFromGoogleDrive(sub.google_drive_id)
            console.log(`  Deleted old file: ${sub.google_drive_id}`)
          } catch (deleteError) {
            console.warn(`  Could not delete old file (may already be deleted): ${deleteError.message}`)
          }
        }

        // 2. Parse stored form data and build applicant data with all needed fields
        const formData = JSON.parse(sub.form_data)
        
        // For I-9 forms, we need SSN which is stored in the W-4 submission (not in applicants table)
        let ssn = formData.ssn || ''
        if (!ssn && sub.form_type === 'I9') {
          // Try to get SSN from the W-4 form submission for this applicant
          const w4Submission = db.prepare(`
            SELECT form_data FROM form_submissions 
            WHERE applicant_id = ? AND form_type = 'W4'
            ORDER BY submitted_at DESC LIMIT 1
          `).get(sub.applicant_id)
          if (w4Submission) {
            try {
              const w4Data = JSON.parse(w4Submission.form_data)
              ssn = w4Data.ssn || ''
            } catch (e) { /* ignore parse errors */ }
          }
        }
        
        const applicantData = {
          first_name: sub.first_name,
          last_name: sub.last_name,
          email: sub.email,
          phone: sub.phone,
          address: sub.address,
          city: sub.city,
          state: sub.state,
          zip_code: sub.zip_code,
          date_of_birth: sub.date_of_birth,
          ssn: ssn
        }

        // 3. Generate new PDF
        let pdfBytes
        switch (sub.form_type) {
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
            pdfBytes = await generateGenericPDF(formData, sub.form_type, applicantData)
        }

        // 4. Generate new filename
        const filename = generateFilename(sub.first_name, sub.last_name, sub.form_type)

        // 5. Upload to Google Drive (unencrypted)
        const pdfBuffer = Buffer.from(pdfBytes)
        const uploadResult = await uploadToGoogleDrive(
          pdfBuffer,
          filename,
          { first_name: sub.first_name, last_name: sub.last_name },
          'application/pdf'
        )

        console.log(`  Uploaded new file: ${uploadResult.fileId}`)

        // 6. Calculate retention date
        const retentionUntil = calculateRetentionDate(
          sub.form_type,
          sub.hire_date,
          sub.termination_date
        )

        // 7. Update database record
        db.prepare(`
          UPDATE form_submissions 
          SET google_drive_id = ?, web_view_link = ?, pdf_filename = ?, retention_until = ?
          WHERE id = ?
        `).run(uploadResult.fileId, uploadResult.webViewLink, filename, retentionUntil, sub.id)

        console.log(`  ✓ Success`)
        results.success++
        results.details.push({
          applicant: applicantName,
          formType: sub.form_type,
          status: 'success',
          newFileId: uploadResult.fileId
        })

      } catch (error) {
        console.error(`  ✗ Error: ${error.message}`)
        results.failed++
        results.details.push({
          applicant: applicantName,
          formType: sub.form_type,
          status: 'error',
          error: error.message
        })
      }
    }

    await auditLog({
      userId: req.applicantId,
      action: 'REGENERATE_PDFS',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { total: results.total, success: results.success, failed: results.failed }
    })

    res.json({
      success: true,
      message: `Regenerated ${results.success} of ${results.total} PDFs`,
      results
    })
  } catch (error) {
    console.error('Regenerate PDFs error:', error)
    res.status(500).json({ 
      error: 'Failed to regenerate PDFs', 
      details: error.message 
    })
  }
})

/**
 * POST /api/admin/fix-gdrive-permissions
 * Fix permissions on all existing Google Drive files
 * Makes all files viewable by anyone with the link
 */
router.post('/fix-gdrive-permissions', async (req, res) => {
  try {
    // Check if Google Drive is configured
    if (!isGoogleDriveConfigured()) {
      return res.status(400).json({ 
        error: 'Google Drive is not configured. Please configure credentials in Settings first.' 
      })
    }

    console.log('Starting to fix Google Drive file permissions...')
    const results = await fixAllFilePermissions()

    await auditLog({
      userId: req.applicantId,
      action: 'FIX_GDRIVE_PERMISSIONS',
      resourceType: 'ADMIN',
      resourceId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: results
    })

    res.json({
      success: true,
      message: `Fixed permissions on ${results.success} of ${results.total} files`,
      results
    })
  } catch (error) {
    console.error('Fix GDrive permissions error:', error)
    res.status(500).json({ 
      error: 'Failed to fix Google Drive permissions', 
      details: error.message 
    })
  }
})

export default router

