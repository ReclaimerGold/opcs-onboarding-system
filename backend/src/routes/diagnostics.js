import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Diagnostics endpoint requires authentication (but not admin - for troubleshooting)
router.use(requireAuth)

/**
 * GET /api/diagnostics/export
 * Export comprehensive diagnostic information optimized for Cursor
 * Query params:
 *   - includeTestResults: if true, will attempt to run tests and include results
 *   - testResults: JSON string of test results to include (optional)
 */
router.get('/export', async (req, res) => {
  try {
    const db = getDatabase()
    const timestamp = new Date().toISOString()
    const includeTestResults = req.query.includeTestResults === 'true'
    let testResults = null

    // Get test results if requested
    if (includeTestResults || req.query.testResults) {
      if (req.query.testResults) {
        try {
          testResults = JSON.parse(req.query.testResults)
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    // System Health
    const tableCounts = {
      applicants: db.prepare('SELECT COUNT(*) as count FROM applicants').get().count,
      form_submissions: db.prepare('SELECT COUNT(*) as count FROM form_submissions').get().count,
      audit_log: db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count,
      login_attempts: db.prepare('SELECT COUNT(*) as count FROM login_attempts').get().count,
      form_drafts: db.prepare('SELECT COUNT(*) as count FROM form_drafts').get().count,
      privacy_consents: db.prepare('SELECT COUNT(*) as count FROM privacy_consents').get().count,
      settings: db.prepare('SELECT COUNT(*) as count FROM settings').get().count
    }

    // Recent Login Attempts (last 50)
    const loginAttempts = db.prepare(`
      SELECT 
        la.*,
        a.first_name as applicant_first_name,
        a.last_name as applicant_last_name,
        a.email as applicant_email
      FROM login_attempts la
      LEFT JOIN applicants a ON la.applicant_id = a.id
      ORDER BY la.created_at DESC
      LIMIT 50
    `).all()

    // Onboarding Status
    const onboardingStatus = db.prepare(`
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

    // Recent Audit Logs (last 100)
    const auditLogs = db.prepare(`
      SELECT 
        al.*,
        a.first_name,
        a.last_name,
        a.email
      FROM audit_log al
      LEFT JOIN applicants a ON al.user_id = a.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `).all()

    // Recent Errors
    const recentErrors = db.prepare(`
      SELECT * FROM audit_log 
      WHERE action LIKE '%ERROR%' OR action LIKE '%FAIL%' OR action LIKE '%ERROR%'
      ORDER BY created_at DESC 
      LIMIT 20
    `).all()

    // Database file info
    const dbPath = path.join(__dirname, '../../database/onboarding.db')
    let dbSize = 0
    let dbExists = false
    try {
      if (fs.existsSync(dbPath)) {
        dbExists = true
        const stats = fs.statSync(dbPath)
        dbSize = stats.size
      }
    } catch (error) {
      // Ignore file size errors
    }

    // Format as markdown for Cursor
    const markdown = `## OPCS Diagnostics Export
Generated: ${timestamp}

### System Health
- Backend: Running
- Database: ${dbExists ? 'Connected' : 'Not Found'}
- Database Size: ${(dbSize / (1024 * 1024)).toFixed(2)} MB
- Node Version: ${process.version}

### Database Table Counts
- applicants: ${tableCounts.applicants}
- form_submissions: ${tableCounts.form_submissions}
- audit_log: ${tableCounts.audit_log}
- login_attempts: ${tableCounts.login_attempts}
- form_drafts: ${tableCounts.form_drafts}
- privacy_consents: ${tableCounts.privacy_consents}
- settings: ${tableCounts.settings}

### Recent Login Attempts (last 50)
| Time | Name | Email | Status | IP Address | Error |
|------|------|-------|--------|------------|-------|
${loginAttempts.map(la => {
      const name = la.applicant_first_name && la.applicant_last_name
        ? `${la.applicant_first_name} ${la.applicant_last_name}`
        : `${la.first_name} ${la.last_name}`
      const email = la.applicant_email || la.email
      const status = la.success ? '✅ Success' : '❌ Failed'
      return `| ${la.created_at} | ${name} | ${email} | ${status} | ${la.ip_address || 'N/A'} | ${la.error_message || ''} |`
    }).join('\n')}

### Onboarding Status
| ID | Name | Email | Admin | Steps Completed | Progress | Status | Created |
|----|------|-------|-------|-----------------|----------|--------|---------|
${onboardingStatus.map(app => {
      const progress = Math.round(((app.completed_steps || 0) / 7) * 100)
      const status = app.completed_steps >= 7 ? '✅ Completed' : app.completed_steps > 0 ? '🔄 In Progress' : '⏸️ Not Started'
      return `| ${app.id} | ${app.first_name} ${app.last_name} | ${app.email} | ${app.is_admin ? 'Yes' : 'No'} | ${app.completed_steps || 0}/7 | ${progress}% | ${status} | ${app.created_at} |`
    }).join('\n')}

### Recent Audit Logs (last 100)
| Time | Action | Resource Type | User | IP Address | Details |
|------|--------|---------------|------|------------|---------|
${auditLogs.map(log => {
      const user = log.first_name && log.last_name
        ? `${log.first_name} ${log.last_name} (${log.email || 'N/A'})`
        : log.user_id ? `User ID: ${log.user_id}` : 'System'
      const details = log.details ? JSON.parse(log.details) : {}
      return `| ${log.created_at} | ${log.action} | ${log.resource_type} | ${user} | ${log.ip_address || 'N/A'} | ${JSON.stringify(details).substring(0, 100)} |`
    }).join('\n')}

### Recent Errors
${recentErrors.length > 0
        ? recentErrors.map(err => {
          const details = err.details ? JSON.parse(err.details) : {}
          return `- **${err.created_at}**: ${err.action} - ${err.resource_type} - ${JSON.stringify(details)}`
        }).join('\n')
        : 'No recent errors found.'
      }

### Environment
- NODE_ENV: ${process.env.NODE_ENV || 'not set'}
- PORT: ${process.env.PORT || '3000 (default)'}
- Database Path: ${dbPath}

${testResults ? `### Unit Test Results
Generated: ${testResults.timestamp || 'N/A'}

#### Backend Tests
${testResults.backend ? `
- Status: ${testResults.backend.success ? '✅ Passed' : '❌ Failed'}
${testResults.backend.output ? `
- Total Tests: ${testResults.backend.output.numTotalTests || 'N/A'}
- Passed: ${testResults.backend.output.numPassedTests || 'N/A'}
- Failed: ${testResults.backend.output.numFailedTests || 'N/A'}
- Test Suites: ${testResults.backend.output.numTotalTestSuites || 'N/A'}
- Passed Suites: ${testResults.backend.output.numPassedTestSuites || 'N/A'}
- Failed Suites: ${testResults.backend.output.numFailedTestSuites || 'N/A'}
` : ''}
${testResults.backend.error ? `- Error: ${testResults.backend.error}` : ''}
${testResults.backend.rawOutput ? `\n\`\`\`\n${testResults.backend.rawOutput.substring(0, 2000)}\n\`\`\`` : ''}
` : '- No backend test results available'}

#### Frontend Tests
${testResults.frontend ? `
- Status: ${testResults.frontend.success ? '✅ Passed' : '❌ Failed'}
${testResults.frontend.output ? `
- Total Test Suites: ${testResults.frontend.output.numTotalTestSuites || 'N/A'}
- Total Tests: ${testResults.frontend.output.numTotalTests || 'N/A'}
- Passed: ${testResults.frontend.output.numPassedTests || 'N/A'}
- Failed: ${testResults.frontend.output.numFailedTests || 'N/A'}
- Passed Suites: ${testResults.frontend.output.numPassedTestSuites || 'N/A'}
- Failed Suites: ${testResults.frontend.output.numFailedTestSuites || 'N/A'}
` : ''}
${testResults.frontend.error ? `- Error: ${testResults.frontend.error}` : ''}
${testResults.frontend.rawOutput ? `\n\`\`\`\n${testResults.frontend.rawOutput.substring(0, 2000)}\n\`\`\`` : ''}
` : '- No frontend test results available'}
` : ''}

---
*End of diagnostic export*
`

    // Return as both JSON and markdown
    res.json({
      timestamp,
      format: 'markdown',
      markdown,
      data: {
        systemHealth: {
          backend: 'running',
          database: dbExists ? 'connected' : 'not_found',
          dbSizeMB: (dbSize / (1024 * 1024)).toFixed(2),
          nodeVersion: process.version
        },
        tableCounts,
        loginAttempts: loginAttempts.map(la => ({
          ...la,
          success: la.success === 1
        })),
        onboardingStatus: onboardingStatus.map(app => ({
          ...app,
          isAdmin: app.is_admin === 1,
          progress: Math.round(((app.completed_steps || 0) / 7) * 100),
          status: app.completed_steps >= 7 ? 'completed' : app.completed_steps > 0 ? 'in_progress' : 'not_started'
        })),
        auditLogs: auditLogs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : {}
        })),
        recentErrors: recentErrors.map(err => ({
          ...err,
          details: err.details ? JSON.parse(err.details) : {}
        })),
        testResults: testResults || null
      }
    })
  } catch (error) {
    console.error('Diagnostic export error:', error)
    res.status(500).json({
      error: 'Failed to generate diagnostic export',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export default router

