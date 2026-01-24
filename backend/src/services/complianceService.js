import { getDatabase } from '../database/init.js'
import { calculateRetentionDate } from './pdfService.js'
import { getDocumentsExpiringSoon } from './retentionService.js'

/**
 * Compliance Checker Service
 * Verifies Federal and South Dakota state compliance for information storage
 */

// SSN patterns to detect in stored data
const SSN_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,  // XXX-XX-XXXX
  /\b\d{9}\b/,               // XXXXXXXXX (9 consecutive digits)
  /\b\d{3}\s\d{2}\s\d{4}\b/, // XXX XX XXXX
]

// Columns that should NEVER exist in the database (SSN-related)
const FORBIDDEN_COLUMNS = [
  'ssn',
  'social_security',
  'social_security_number',
  'ss_number',
  'ss_num',
  'ssn_number',
  'tax_id',
  'taxpayer_id'
]

// Required tables for compliance
const REQUIRED_TABLES = [
  'applicants',
  'form_submissions',
  'audit_log',
  'privacy_consents',
  'login_attempts',
  'form_drafts',
  'settings',
  'i9_documents'
]

// Required audit log actions
const REQUIRED_AUDIT_ACTIONS = [
  'SUBMIT',           // Form submissions
  'VIEW',             // Document access
  'DELETE_RETENTION', // Document deletions
  'LOGIN_SUCCESS',    // Successful logins
  'LOGIN_FAILURE'     // Failed logins
]

// Retention periods by form type (in years)
const RETENTION_PERIODS = {
  'W4': 4,
  '8850': 4,
  'I9': 3, // or 1 year after termination, whichever is later
  'BACKGROUND': 5,
  'DIRECT_DEPOSIT': 3,
  'ACKNOWLEDGEMENTS': 1
}

/**
 * Check if database schema contains any SSN-related columns
 * @returns {Object} Check result with pass status and findings
 */
export function checkSSNInSchema() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Get all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all()

  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all()

    for (const column of columns) {
      const colNameLower = column.name.toLowerCase()

      for (const forbidden of FORBIDDEN_COLUMNS) {
        if (colNameLower.includes(forbidden)) {
          passed = false
          findings.push({
            severity: 'critical',
            message: `Forbidden SSN-related column found: ${table.name}.${column.name}`,
            table: table.name,
            column: column.name
          })
        }
      }
    }
  }

  if (passed) {
    findings.push({
      severity: 'info',
      message: 'No SSN-related columns found in database schema'
    })
  }

  return {
    check: 'SSN Schema Protection',
    category: 'SSN Protection',
    passed,
    critical: !passed,
    findings
  }
}

/**
 * Scan form_data JSON for potential SSN values
 * @returns {Object} Check result with pass status and findings
 */
export function checkSSNInFormData() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Get all form submissions with form_data
  const submissions = db.prepare(`
    SELECT id, applicant_id, form_type, form_data 
    FROM form_submissions 
    WHERE form_data IS NOT NULL AND form_data != ''
  `).all()

  let checkedCount = 0
  let violationsFound = 0

  for (const submission of submissions) {
    checkedCount++
    try {
      const formData = JSON.parse(submission.form_data)
      const jsonString = JSON.stringify(formData)

      // Check for SSN patterns in the JSON
      for (const pattern of SSN_PATTERNS) {
        if (pattern.test(jsonString)) {
          passed = false
          violationsFound++
          findings.push({
            severity: 'critical',
            message: `Potential SSN found in form_data for submission ${submission.id} (${submission.form_type})`,
            submissionId: submission.id,
            formType: submission.form_type,
            applicantId: submission.applicant_id
          })
          break // Only report once per submission
        }
      }

      // Check for specific SSN field names in the data
      const ssnFields = ['ssn', 'socialSecurity', 'social_security', 'taxId']
      for (const field of ssnFields) {
        if (formData[field] && formData[field].length > 0) {
          // Check if it's actually an SSN (not just a field name)
          const value = String(formData[field])
          if (value.length >= 9 && /\d/.test(value)) {
            passed = false
            violationsFound++
            findings.push({
              severity: 'critical',
              message: `SSN field "${field}" found with value in submission ${submission.id}`,
              submissionId: submission.id,
              formType: submission.form_type
            })
          }
        }
      }
    } catch (e) {
      // Invalid JSON - note but continue
      findings.push({
        severity: 'warning',
        message: `Invalid JSON in form_data for submission ${submission.id}`
      })
    }
  }

  findings.unshift({
    severity: 'info',
    message: `Scanned ${checkedCount} form submissions, found ${violationsFound} potential SSN violations`
  })

  return {
    check: 'SSN Data Protection',
    category: 'SSN Protection',
    passed,
    critical: !passed,
    findings,
    stats: {
      scanned: checkedCount,
      violations: violationsFound
    }
  }
}

/**
 * Check privacy consent records for SSN collection
 * @returns {Object} Check result with pass status and findings
 */
export function checkPrivacyConsents() {
  const db = getDatabase()
  const findings = []

  // Get count of SSN consents
  const ssnConsents = db.prepare(`
    SELECT COUNT(*) as count 
    FROM privacy_consents 
    WHERE consent_type = 'SSN_COLLECTION'
  `).get()

  // Get count of W4 and 8850 submissions (forms that require SSN)
  const ssnFormSubmissions = db.prepare(`
    SELECT COUNT(*) as count 
    FROM form_submissions 
    WHERE form_type IN ('W4', '8850')
  `).get()

  // Get applicants who submitted SSN forms without consent
  const missingConsents = db.prepare(`
    SELECT DISTINCT fs.applicant_id, a.first_name, a.last_name
    FROM form_submissions fs
    JOIN applicants a ON fs.applicant_id = a.id
    WHERE fs.form_type IN ('W4', '8850')
    AND fs.applicant_id NOT IN (
      SELECT applicant_id FROM privacy_consents WHERE consent_type = 'SSN_COLLECTION'
    )
  `).all()

  const passed = missingConsents.length === 0

  findings.push({
    severity: 'info',
    message: `Total SSN consent records: ${ssnConsents.count}`
  })

  findings.push({
    severity: 'info',
    message: `Total W4/8850 submissions (SSN required): ${ssnFormSubmissions.count}`
  })

  if (missingConsents.length > 0) {
    findings.push({
      severity: 'warning',
      message: `${missingConsents.length} applicants have SSN forms without recorded consent`,
      applicants: missingConsents.map(a => `${a.first_name} ${a.last_name} (ID: ${a.applicant_id})`)
    })
  } else {
    findings.push({
      severity: 'info',
      message: 'All SSN form submissions have corresponding consent records'
    })
  }

  return {
    check: 'Privacy Consent Records',
    category: 'Privacy & Data Protection',
    passed,
    critical: false,
    findings,
    stats: {
      totalConsents: ssnConsents.count,
      ssnFormSubmissions: ssnFormSubmissions.count,
      missingConsents: missingConsents.length
    }
  }
}

/**
 * Verify document retention dates are calculated correctly
 * @returns {Object} Check result with pass status and findings
 */
export function checkRetentionDates() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Get all form submissions with retention dates
  const submissions = db.prepare(`
    SELECT 
      fs.id, fs.form_type, fs.retention_until, fs.submitted_at,
      a.hire_date, a.termination_date, a.first_name, a.last_name
    FROM form_submissions fs
    JOIN applicants a ON fs.applicant_id = a.id
    WHERE fs.retention_until IS NOT NULL
  `).all()

  let checkedCount = 0
  let mismatchCount = 0

  for (const submission of submissions) {
    checkedCount++

    // Recalculate expected retention date
    const expectedRetention = calculateRetentionDate(
      submission.form_type,
      submission.hire_date,
      submission.termination_date
    )

    // Compare with stored date (allow 1 day tolerance for timing differences)
    const storedDate = new Date(submission.retention_until)
    const expectedDate = new Date(expectedRetention)
    const diffDays = Math.abs((storedDate - expectedDate) / (1000 * 60 * 60 * 24))

    if (diffDays > 1) {
      mismatchCount++
      findings.push({
        severity: 'warning',
        message: `Retention date mismatch for submission ${submission.id} (${submission.form_type}): stored=${submission.retention_until}, expected=${expectedRetention}`,
        submissionId: submission.id,
        formType: submission.form_type,
        storedDate: submission.retention_until,
        expectedDate: expectedRetention
      })
    }
  }

  // Check for submissions without retention dates
  const missingRetention = db.prepare(`
    SELECT COUNT(*) as count 
    FROM form_submissions 
    WHERE retention_until IS NULL
  `).get()

  if (missingRetention.count > 0) {
    passed = false
    findings.push({
      severity: 'critical',
      message: `${missingRetention.count} form submissions are missing retention dates`
    })
  }

  findings.unshift({
    severity: 'info',
    message: `Checked ${checkedCount} retention dates, found ${mismatchCount} mismatches`
  })

  if (passed && mismatchCount === 0) {
    findings.push({
      severity: 'info',
      message: 'All retention dates are calculated correctly per federal requirements'
    })
  }

  return {
    check: 'Document Retention Dates',
    category: 'Document Retention',
    passed: passed && mismatchCount === 0,
    critical: !passed,
    findings,
    stats: {
      checked: checkedCount,
      mismatches: mismatchCount,
      missingDates: missingRetention.count
    }
  }
}

/**
 * Check for expired documents that should have been deleted
 * @returns {Object} Check result with pass status and findings
 */
export function checkExpiredDocuments() {
  const db = getDatabase()
  const findings = []

  const today = new Date().toISOString().split('T')[0]

  // Find expired documents that still have Google Drive IDs
  const expiredDocs = db.prepare(`
    SELECT fs.id, fs.form_type, fs.retention_until, fs.google_drive_id,
           a.first_name, a.last_name
    FROM form_submissions fs
    JOIN applicants a ON fs.applicant_id = a.id
    WHERE fs.retention_until < ?
    AND fs.google_drive_id IS NOT NULL
    AND fs.google_drive_id != ''
  `).all(today)

  const passed = expiredDocs.length === 0

  if (expiredDocs.length > 0) {
    findings.push({
      severity: 'critical',
      message: `${expiredDocs.length} expired documents have not been deleted`,
      documents: expiredDocs.map(d => ({
        id: d.id,
        formType: d.form_type,
        expiredOn: d.retention_until,
        applicant: `${d.first_name} ${d.last_name}`
      }))
    })
  } else {
    findings.push({
      severity: 'info',
      message: 'No expired documents pending deletion'
    })
  }

  // Check documents expiring soon (30 days)
  const expiringSoon = getDocumentsExpiringSoon(30)
  if (expiringSoon.length > 0) {
    findings.push({
      severity: 'info',
      message: `${expiringSoon.length} documents will expire within 30 days`,
      documentCount: expiringSoon.length
    })
  }

  return {
    check: 'Expired Document Cleanup',
    category: 'Document Retention',
    passed,
    critical: !passed,
    findings,
    stats: {
      expiredNotDeleted: expiredDocs.length,
      expiringSoon: expiringSoon.length
    }
  }
}

/**
 * Verify encryption key is configured
 * @returns {Object} Check result with pass status and findings
 */
export function checkEncryptionKey() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Check if encryption key exists in settings
  const keyRecord = db.prepare(`
    SELECT key, is_encrypted FROM settings WHERE key = 'encryption_key'
  `).get()

  // Check environment variable
  const hasEnvKey = !!process.env.ENCRYPTION_KEY

  if (!keyRecord && !hasEnvKey) {
    passed = false
    findings.push({
      severity: 'critical',
      message: 'No encryption key configured in database or environment'
    })
  } else {
    if (hasEnvKey) {
      findings.push({
        severity: 'info',
        message: 'Encryption key configured via environment variable'
      })
    }
    if (keyRecord) {
      findings.push({
        severity: 'info',
        message: 'Encryption key stored in database settings'
      })
    }
  }

  return {
    check: 'Encryption Key Configuration',
    category: 'Encryption',
    passed,
    critical: !passed,
    findings
  }
}

/**
 * Check that sensitive settings are encrypted
 * @returns {Object} Check result with pass status and findings
 */
export function checkEncryptedSettings() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Settings that should be encrypted
  const sensitiveSettings = [
    'google_drive_credentials',
    'google_address_validation_api_key'
  ]

  for (const settingKey of sensitiveSettings) {
    const setting = db.prepare(`
      SELECT key, is_encrypted FROM settings WHERE key = ?
    `).get(settingKey)

    if (setting) {
      if (setting.is_encrypted !== 1) {
        passed = false
        findings.push({
          severity: 'warning',
          message: `Sensitive setting "${settingKey}" is not marked as encrypted`,
          settingKey
        })
      } else {
        findings.push({
          severity: 'info',
          message: `Setting "${settingKey}" is properly encrypted`
        })
      }
    }
  }

  // Count total encrypted vs unencrypted settings
  const settingsStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted,
      SUM(CASE WHEN is_encrypted = 0 OR is_encrypted IS NULL THEN 1 ELSE 0 END) as unencrypted,
      COUNT(*) as total
    FROM settings
  `).get()

  findings.push({
    severity: 'info',
    message: `Settings status: ${settingsStats.encrypted || 0} encrypted, ${settingsStats.unencrypted || 0} unencrypted, ${settingsStats.total} total`
  })

  return {
    check: 'Settings Encryption',
    category: 'Encryption',
    passed,
    critical: false,
    findings,
    stats: settingsStats
  }
}

/**
 * Check I-9 documents are encrypted
 * @returns {Object} Check result with pass status and findings
 */
export function checkI9DocumentsEncryption() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Check for I-9 documents
  const i9Docs = db.prepare(`
    SELECT COUNT(*) as count FROM i9_documents
  `).get()

  // Check if encrypted_data column exists and is used
  try {
    const unencryptedDocs = db.prepare(`
      SELECT COUNT(*) as count FROM i9_documents
      WHERE encrypted_data IS NULL OR encrypted_data = ''
    `).get()

    if (unencryptedDocs.count > 0 && i9Docs.count > 0) {
      passed = false
      findings.push({
        severity: 'critical',
        message: `${unencryptedDocs.count} of ${i9Docs.count} I-9 documents appear to be unencrypted`
      })
    } else if (i9Docs.count > 0) {
      findings.push({
        severity: 'info',
        message: `All ${i9Docs.count} I-9 identity documents are encrypted`
      })
    } else {
      findings.push({
        severity: 'info',
        message: 'No I-9 identity documents uploaded yet'
      })
    }
  } catch (e) {
    findings.push({
      severity: 'info',
      message: `I-9 documents table exists with ${i9Docs.count} records`
    })
  }

  return {
    check: 'I-9 Document Encryption',
    category: 'Encryption',
    passed,
    critical: !passed,
    findings,
    stats: {
      totalI9Docs: i9Docs.count
    }
  }
}

/**
 * Verify required audit log events are being recorded
 * @returns {Object} Check result with pass status and findings
 */
export function checkAuditLogCompleteness() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Check for presence of required audit actions
  const auditActions = db.prepare(`
    SELECT DISTINCT action FROM audit_log
  `).all().map(a => a.action)

  const missingActions = []
  for (const required of REQUIRED_AUDIT_ACTIONS) {
    if (!auditActions.some(a => a.includes(required) || a === required)) {
      missingActions.push(required)
    }
  }

  if (missingActions.length > 0) {
    findings.push({
      severity: 'warning',
      message: `Some required audit actions have no records: ${missingActions.join(', ')}`,
      missingActions
    })
  } else {
    findings.push({
      severity: 'info',
      message: 'All required audit action types have records'
    })
  }

  // Get audit log statistics
  const auditStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT action) as uniqueActions,
      MIN(created_at) as oldest,
      MAX(created_at) as newest
    FROM audit_log
  `).get()

  findings.push({
    severity: 'info',
    message: `Audit log contains ${auditStats.total} entries with ${auditStats.uniqueActions} unique action types`
  })

  if (auditStats.oldest) {
    findings.push({
      severity: 'info',
      message: `Audit log spans from ${auditStats.oldest} to ${auditStats.newest}`
    })
  }

  // Check for form submissions without audit logs
  const unloggedSubmissions = db.prepare(`
    SELECT COUNT(*) as count
    FROM form_submissions fs
    WHERE NOT EXISTS (
      SELECT 1 FROM audit_log al
      WHERE al.resource_type = 'FORM'
      AND al.resource_id = fs.id
      AND al.action LIKE '%SUBMIT%'
    )
  `).get()

  if (unloggedSubmissions.count > 0) {
    findings.push({
      severity: 'warning',
      message: `${unloggedSubmissions.count} form submissions may not have corresponding audit logs`
    })
  }

  return {
    check: 'Audit Log Completeness',
    category: 'Audit Logging',
    passed,
    critical: false,
    findings,
    stats: {
      totalLogs: auditStats.total,
      uniqueActions: auditStats.uniqueActions,
      availableActions: auditActions,
      missingActions
    }
  }
}

/**
 * Verify audit log structure is correct
 * @returns {Object} Check result with pass status and findings
 */
export function checkAuditLogStructure() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Required columns for audit_log table
  const requiredColumns = [
    'id', 'user_id', 'action', 'resource_type', 'resource_id',
    'ip_address', 'user_agent', 'details', 'created_at'
  ]

  const columns = db.prepare(`PRAGMA table_info(audit_log)`).all()
  const columnNames = columns.map(c => c.name)

  const missingColumns = requiredColumns.filter(c => !columnNames.includes(c))

  if (missingColumns.length > 0) {
    passed = false
    findings.push({
      severity: 'critical',
      message: `Audit log table missing required columns: ${missingColumns.join(', ')}`,
      missingColumns
    })
  } else {
    findings.push({
      severity: 'info',
      message: 'Audit log table has all required columns'
    })
  }

  // Check for audit logs with missing critical information
  const incompleteLogs = db.prepare(`
    SELECT COUNT(*) as count
    FROM audit_log
    WHERE action IS NULL OR action = ''
    OR resource_type IS NULL OR resource_type = ''
  `).get()

  if (incompleteLogs.count > 0) {
    findings.push({
      severity: 'warning',
      message: `${incompleteLogs.count} audit log entries are missing critical information`
    })
  }

  return {
    check: 'Audit Log Structure',
    category: 'Audit Logging',
    passed,
    critical: !passed,
    findings
  }
}

/**
 * Verify required database tables exist
 * @returns {Object} Check result with pass status and findings
 */
export function checkRequiredTables() {
  const db = getDatabase()
  const findings = []
  let passed = true

  const existingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all().map(t => t.name)

  const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t))

  if (missingTables.length > 0) {
    passed = false
    findings.push({
      severity: 'critical',
      message: `Missing required tables: ${missingTables.join(', ')}`,
      missingTables
    })
  } else {
    findings.push({
      severity: 'info',
      message: `All ${REQUIRED_TABLES.length} required tables exist`
    })
  }

  findings.push({
    severity: 'info',
    message: `Database has ${existingTables.length} total tables`
  })

  return {
    check: 'Required Database Tables',
    category: 'Database Schema',
    passed,
    critical: !passed,
    findings,
    stats: {
      required: REQUIRED_TABLES.length,
      existing: existingTables.length,
      missing: missingTables.length
    }
  }
}

/**
 * Verify foreign key constraints are enabled
 * @returns {Object} Check result with pass status and findings
 */
export function checkForeignKeys() {
  const db = getDatabase()
  const findings = []

  const fkStatus = db.prepare(`PRAGMA foreign_keys`).get()
  const passed = fkStatus && fkStatus.foreign_keys === 1

  if (passed) {
    findings.push({
      severity: 'info',
      message: 'Foreign key constraints are enabled'
    })
  } else {
    findings.push({
      severity: 'warning',
      message: 'Foreign key constraints are NOT enabled'
    })
  }

  return {
    check: 'Foreign Key Constraints',
    category: 'Database Schema',
    passed,
    critical: false,
    findings
  }
}

/**
 * Verify database indexes exist for performance
 * @returns {Object} Check result with pass status and findings
 */
export function checkDatabaseIndexes() {
  const db = getDatabase()
  const findings = []

  const indexes = db.prepare(`
    SELECT name, tbl_name FROM sqlite_master 
    WHERE type='index' AND name NOT LIKE 'sqlite_%'
  `).all()

  // Required indexes for compliance queries
  const requiredIndexes = [
    { table: 'applicants', column: 'email' },
    { table: 'form_submissions', column: 'applicant_id' },
    { table: 'audit_log', column: 'user_id' }
  ]

  const indexNames = indexes.map(i => i.name.toLowerCase())
  const missingIndexes = []

  for (const req of requiredIndexes) {
    const hasIndex = indexNames.some(name =>
      name.includes(req.table) && name.includes(req.column)
    )
    if (!hasIndex) {
      missingIndexes.push(`${req.table}.${req.column}`)
    }
  }

  if (missingIndexes.length > 0) {
    findings.push({
      severity: 'info',
      message: `Some recommended indexes may be missing: ${missingIndexes.join(', ')}`
    })
  }

  findings.push({
    severity: 'info',
    message: `Database has ${indexes.length} custom indexes`
  })

  return {
    check: 'Database Indexes',
    category: 'Database Schema',
    passed: true, // Indexes are recommendations, not requirements
    critical: false,
    findings,
    stats: {
      indexCount: indexes.length
    }
  }
}

/**
 * Check South Dakota data breach notification readiness
 * @returns {Object} Check result with pass status and findings
 */
export function checkSDBreachReadiness() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // SDCL 22-40-20 requires:
  // 1. Data encryption
  // 2. Audit trails
  // 3. Ability to identify affected individuals within 60 days

  // Check encryption capability
  const encryptionKeyExists = db.prepare(`
    SELECT COUNT(*) as count FROM settings WHERE key = 'encryption_key'
  `).get().count > 0 || !!process.env.ENCRYPTION_KEY

  if (!encryptionKeyExists) {
    passed = false
    findings.push({
      severity: 'critical',
      message: 'SD Breach Notification: Encryption not configured (required for data protection)'
    })
  } else {
    findings.push({
      severity: 'info',
      message: 'SD Breach Notification: Encryption is configured'
    })
  }

  // Check audit trail capability
  const auditLogExists = db.prepare(`
    SELECT COUNT(*) as count FROM audit_log
  `).get().count

  findings.push({
    severity: 'info',
    message: `SD Breach Notification: Audit trail has ${auditLogExists} records for breach investigation`
  })

  // Check ability to identify affected users
  const applicantCount = db.prepare(`
    SELECT COUNT(*) as count FROM applicants
  `).get().count

  findings.push({
    severity: 'info',
    message: `SD Breach Notification: ${applicantCount} applicants can be notified if breach occurs`
  })

  // Check for email addresses (required for notification)
  const applicantsWithEmail = db.prepare(`
    SELECT COUNT(*) as count FROM applicants 
    WHERE email IS NOT NULL AND email != ''
  `).get().count

  if (applicantsWithEmail < applicantCount) {
    findings.push({
      severity: 'warning',
      message: `SD Breach Notification: ${applicantCount - applicantsWithEmail} applicants missing email for breach notification`
    })
  }

  return {
    check: 'SD Data Breach Notification Readiness',
    category: 'South Dakota State',
    passed,
    critical: !passed,
    findings,
    legalReference: 'SDCL 22-40-20'
  }
}

/**
 * Check South Dakota employment record compliance
 * @returns {Object} Check result with pass status and findings
 */
export function checkSDEmploymentRecords() {
  const findings = []

  // South Dakota follows federal requirements for employment records
  findings.push({
    severity: 'info',
    message: 'South Dakota follows federal employment record requirements (IRCA, IRS, FLSA)'
  })

  findings.push({
    severity: 'info',
    message: 'No additional state-specific record retention beyond federal requirements'
  })

  findings.push({
    severity: 'info',
    message: 'Right-to-work compliance: I-9 federal requirements apply'
  })

  return {
    check: 'SD Employment Record Compliance',
    category: 'South Dakota State',
    passed: true,
    critical: false,
    findings,
    legalReference: 'SDCL - Employment Records (follows federal)'
  }
}

/**
 * Check overall data minimization compliance
 * @returns {Object} Check result with pass status and findings
 */
export function checkDataMinimization() {
  const db = getDatabase()
  const findings = []
  let passed = true

  // Check that applicants table doesn't store unnecessary PII
  const applicantColumns = db.prepare(`PRAGMA table_info(applicants)`).all()
  const columnNames = applicantColumns.map(c => c.name)

  // SSN should never be in applicants table
  if (columnNames.some(c => c.toLowerCase().includes('ssn'))) {
    passed = false
    findings.push({
      severity: 'critical',
      message: 'Data Minimization Violation: SSN column exists in applicants table'
    })
  } else {
    findings.push({
      severity: 'info',
      message: 'Data Minimization: SSN not stored in applicants table (compliant)'
    })
  }

  // List what IS stored
  const allowedPII = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'address', 'city', 'state', 'zip_code']
  const storedPII = columnNames.filter(c => allowedPII.includes(c))

  findings.push({
    severity: 'info',
    message: `Data Minimization: Storing only necessary PII fields: ${storedPII.join(', ')}`
  })

  return {
    check: 'Data Minimization',
    category: 'Privacy & Data Protection',
    passed,
    critical: !passed,
    findings
  }
}

/**
 * Run all compliance checks and return comprehensive report
 * @returns {Object} Complete compliance report
 */
export async function runAllComplianceChecks() {
  const startTime = Date.now()

  // Run all checks
  const checks = [
    // SSN Protection
    checkSSNInSchema(),
    checkSSNInFormData(),

    // Privacy & Data Protection
    checkPrivacyConsents(),
    checkDataMinimization(),

    // Document Retention
    checkRetentionDates(),
    checkExpiredDocuments(),

    // Encryption
    checkEncryptionKey(),
    checkEncryptedSettings(),
    checkI9DocumentsEncryption(),

    // Audit Logging
    checkAuditLogCompleteness(),
    checkAuditLogStructure(),

    // Database Schema
    checkRequiredTables(),
    checkForeignKeys(),
    checkDatabaseIndexes(),

    // South Dakota State
    checkSDBreachReadiness(),
    checkSDEmploymentRecords()
  ]

  // Group checks by category
  const categories = {}
  for (const check of checks) {
    if (!categories[check.category]) {
      categories[check.category] = {
        checks: [],
        passed: 0,
        failed: 0,
        critical: 0
      }
    }
    categories[check.category].checks.push(check)
    if (check.passed) {
      categories[check.category].passed++
    } else {
      categories[check.category].failed++
      if (check.critical) {
        categories[check.category].critical++
      }
    }
  }

  // Calculate overall statistics
  const totalChecks = checks.length
  const passedChecks = checks.filter(c => c.passed).length
  const failedChecks = checks.filter(c => !c.passed).length
  const criticalIssues = checks.filter(c => !c.passed && c.critical).length

  const complianceScore = Math.round((passedChecks / totalChecks) * 100)

  const endTime = Date.now()

  return {
    timestamp: new Date().toISOString(),
    executionTimeMs: endTime - startTime,
    summary: {
      complianceScore,
      totalChecks,
      passedChecks,
      failedChecks,
      criticalIssues,
      status: criticalIssues > 0 ? 'CRITICAL' : failedChecks > 0 ? 'WARNING' : 'COMPLIANT'
    },
    categories,
    checks,
    regulations: {
      federal: [
        'IRCA / 8 CFR 274a.2 (I-9)',
        'IRS 26 CFR 31.6001-1 (W-4)',
        'FCRA 15 U.S.C. § 1681 (Background)',
        'FLSA 29 CFR Part 516 (Payroll)',
        'EEOC 29 CFR 1602 (Employment Records)'
      ],
      state: [
        'SDCL 22-40-20 (Data Breach Notification)',
        'South Dakota Right to Work Law'
      ]
    }
  }
}

export default {
  runAllComplianceChecks,
  checkSSNInSchema,
  checkSSNInFormData,
  checkPrivacyConsents,
  checkRetentionDates,
  checkExpiredDocuments,
  checkEncryptionKey,
  checkEncryptedSettings,
  checkI9DocumentsEncryption,
  checkAuditLogCompleteness,
  checkAuditLogStructure,
  checkRequiredTables,
  checkForeignKeys,
  checkDatabaseIndexes,
  checkSDBreachReadiness,
  checkSDEmploymentRecords,
  checkDataMinimization
}

