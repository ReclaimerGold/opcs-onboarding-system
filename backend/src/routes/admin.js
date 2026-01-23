import express from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { auditLog } from '../services/auditService.js'

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
        newStatus: isAdmin
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
      }
    })
  } catch (error) {
    console.error('Update admin status error:', error)
    res.status(500).json({ error: 'Failed to update admin status' })
  }
})

export default router

