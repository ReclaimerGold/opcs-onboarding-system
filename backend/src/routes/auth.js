import express from 'express'
import crypto from 'crypto'
import { findApplicantByCredentials, createApplicant, isFirstUser, verifyPassword, checkPasswordSet, requireAuth, hashPassword } from '../middleware/auth.js'
import { auditLog } from '../services/auditService.js'
import { getDatabase } from '../database/init.js'
import { sendPasswordResetEmail, sendEmail, isMailgunConfigured } from '../services/mailgunService.js'
import { createNotification, notifyAdminsAndManagers } from '../services/notificationService.js'
import { getSetting } from '../utils/getSetting.js'
import { getClientIp } from '../middleware/clientIp.js'

const router = express.Router()

/** Session cookie duration when "Remember me" is checked (30 days). Default is 15 min (set in index.js). */
const SESSION_MAX_AGE_REMEMBER_ME = 30 * 24 * 60 * 60 * 1000

function applyRememberMe(req) {
  if (req.body.rememberMe === true || req.body.rememberMe === 'true') {
    req.session.cookie.maxAge = SESSION_MAX_AGE_REMEMBER_ME
  }
}

/**
 * POST /api/auth/signup
 * Sign up to start the onboarding process
 */
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'First name, last name, and email are required',
        code: 'MISSING_FIELDS'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address',
        code: 'INVALID_EMAIL'
      })
    }

    // Check if applicant already exists
    const existingApplicant = findApplicantByCredentials(firstName, lastName, email)
    if (existingApplicant) {
      // Check if onboarding is complete
      const { getDatabase } = await import('../database/init.js')
      const db = getDatabase()
      const submissions = db.prepare(`
        SELECT COUNT(DISTINCT step_number) as count
        FROM form_submissions
        WHERE applicant_id = ?
      `).get(existingApplicant.id)

      const completedSteps = Math.min(7, submissions?.count ?? 0)
      const isOnboardingComplete = (submissions?.count ?? 0) >= 7

      return res.status(400).json({
        error: isOnboardingComplete
          ? 'An account with this information already exists and onboarding is complete. Please sign in to access your dashboard.'
          : 'An account with this information already exists. Please sign in to continue your onboarding.',
        code: 'ACCOUNT_EXISTS',
        existingAccount: true,
        onboardingComplete: isOnboardingComplete,
        completedSteps
      })
    }

    // Create new applicant (first user automatically becomes admin)
    const applicant = createApplicant(firstName, lastName, email)

    // Set session
    req.session.applicantId = applicant.id
    req.session.applicantEmail = applicant.email
    req.session.isAdmin = applicant.is_admin === 1
    applyRememberMe(req)

    // Audit log
    await auditLog({
      userId: applicant.id,
      action: 'SIGNUP',
      resourceType: 'AUTH',
      resourceId: applicant.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      details: { email: applicant.email, isAdmin: applicant.is_admin === 1, isFirstUser: isFirstUser() }
    })

    // Reload applicant to ensure we have the latest data including is_admin
    const db = getDatabase()
    const fullApplicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(applicant.id)

    // If new user is admin with no password, require password setup so they are sent to /password-setup
    const adminNeedsPasswordSetup = fullApplicant.is_admin === 1 && (!fullApplicant.password_hash || fullApplicant.password_hash === '')
    if (adminNeedsPasswordSetup) {
      return res.json({
        success: true,
        requiresPasswordSetup: true,
        isAdmin: true,
        applicant: {
          id: fullApplicant.id,
          firstName: fullApplicant.first_name,
          lastName: fullApplicant.last_name,
          email: fullApplicant.email,
          isAdmin: true,
          role: fullApplicant.role || 'admin'
        },
        isNewUser: true
      })
    }

    // --- Notification triggers ---
    try {
      // Notify admins/managers of new applicant signup
      notifyAdminsAndManagers({
        type: 'new_applicant_signup',
        title: 'New Applicant Signup',
        message: `${fullApplicant.first_name} ${fullApplicant.last_name} (${fullApplicant.email}) has created an account.`,
        link: '/admin',
        sourceUserId: fullApplicant.id,
        applicantId: fullApplicant.id
      })

      // Check for non-Gmail email
      const emailLower = fullApplicant.email.toLowerCase()
      if (!emailLower.endsWith('@gmail.com')) {
        notifyAdminsAndManagers({
          type: 'non_gmail_email',
          title: 'Non-Gmail Email Address',
          message: `${fullApplicant.first_name} ${fullApplicant.last_name} signed up with a non-Gmail address: ${fullApplicant.email}`,
          link: '/admin',
          sourceUserId: fullApplicant.id,
          applicantId: fullApplicant.id
        })
        const nonGmailAlertEmail = getSetting('non_gmail_alert_email')
        if (nonGmailAlertEmail && isMailgunConfigured()) {
          sendEmail({
            to: nonGmailAlertEmail,
            subject: 'Non-Gmail signup: manual update may be needed',
            text: `${fullApplicant.first_name} ${fullApplicant.last_name} signed up with a non-Gmail address: ${fullApplicant.email}. You may need to manually update things in the admin panel.`
          }).catch(err => console.error('Failed to send non-Gmail alert email:', err.message))
        }
      }

      // Send welcome notification to the applicant
      createNotification({
        recipientId: fullApplicant.id,
        type: 'welcome_message',
        title: 'Welcome to Optimal Prime Services!',
        message: 'Welcome! Please complete your onboarding forms to get started. Click here to begin.',
        link: '/forms'
      })
    } catch (notifError) {
      console.error('Notification trigger error (signup):', notifError.message)
    }

    const role = fullApplicant.role || (fullApplicant.is_admin === 1 ? 'admin' : 'applicant')
    res.json({
      success: true,
      applicant: {
        id: fullApplicant.id,
        firstName: fullApplicant.first_name,
        lastName: fullApplicant.last_name,
        email: fullApplicant.email,
        isAdmin: fullApplicant.is_admin === 1,
        role
      },
      isNewUser: true
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({
      error: 'An unexpected error occurred during signup. Please try again.',
      code: 'SIGNUP_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

/**
 * POST /api/auth/login
 * Phase 1: Check user credentials and determine if password is required
 * Login to continue/resume onboarding process
 */
router.post('/login', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'First name, last name, and email are required',
        code: 'MISSING_FIELDS'
      })
    }

    const applicant = findApplicantByCredentials(firstName, lastName, email)

    if (!applicant) {
      // Track login attempt (before checking if user exists)
      const db = getDatabase()
      try {
        db.prepare(`
          INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          firstName,
          lastName,
          email,
          0, // failed
          getClientIp(req),
          req.get('user-agent'),
          'Account not found',
          null // no applicant_id for failed attempts
        )
      } catch (logErr) {
        console.error('Failed to log login attempt (table missing or schema mismatch?):', logErr?.message)
      }

      // Check for failed login security alert (5+ failures from same IP in 1 hour)
      try {
        const recentFailures = db.prepare(`
          SELECT COUNT(*) as count FROM login_attempts
          WHERE ip_address = ? AND success = 0 AND created_at > datetime('now', '-1 hour')
        `).get(getClientIp(req))
        if (recentFailures && recentFailures.count >= 5) {
          // Only notify if we haven't already in the past hour
          const recentAlert = db.prepare(`
            SELECT id FROM notifications
            WHERE type = 'failed_login_security' AND message LIKE ? AND created_at > datetime('now', '-1 hour')
            LIMIT 1
          `).get(`%${getClientIp(req)}%`)
          if (!recentAlert) {
            notifyAdminsAndManagers({
              type: 'failed_login_security',
              title: 'Failed Login Security Alert',
              message: `${recentFailures.count} failed login attempts from IP ${getClientIp(req)} in the past hour.`,
              link: '/admin'
            })
          }
        }
      } catch (notifError) {
        console.error('Failed login security notification error:', notifError.message)
      }

      return res.status(404).json({
        error: 'No account found with this information. Please sign up to get started.',
        code: 'ACCOUNT_NOT_FOUND',
        notFound: true
      })
    }

    if (applicant.is_active === 0) {
      const db = getDatabase()
      try {
        db.prepare(`
          INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          firstName,
          lastName,
          email,
          0,
          getClientIp(req),
          req.get('user-agent'),
          'Account deactivated',
          applicant.id
        )
      } catch (logErr) {
        console.error('Failed to log login attempt:', logErr?.message)
      }
      return res.status(401).json({
        error: 'This account has been deactivated. Contact an administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      })
    }

    const isAdmin = applicant.is_admin === 1
    const passwordSet = applicant.password_hash !== null && applicant.password_hash !== ''
    // Require password for anyone who has set one (admins and applicants)
    const requiresPassword = passwordSet
    const shouldCompleteLogin = !requiresPassword || password !== undefined

    if (!shouldCompleteLogin) {
      // Phase 1: Return whether password is required or needs setup
      // If admin doesn't have password set, they need to set it up first
      if (isAdmin && !passwordSet) {
        // Create session so they can access /password-setup
        req.session.applicantId = applicant.id
        req.session.isAdmin = true
        req.session.needsPasswordSetup = true
        applyRememberMe(req)

        return res.json({
          success: true,
          requiresPasswordSetup: true,
          isAdmin: true,
          applicant: {
            id: applicant.id,
            firstName: applicant.first_name,
            lastName: applicant.last_name,
            email: applicant.email,
            isAdmin: true
          }
        })
      }

      return res.json({
        success: true,
        requiresPassword,
        isAdmin,
        applicant: {
          id: applicant.id,
          firstName: applicant.first_name,
          lastName: applicant.last_name,
          email: applicant.email,
          isAdmin: applicant.is_admin === 1,
          role: applicant.role || (applicant.is_admin === 1 ? 'admin' : 'applicant')
        }
      })
    }

    if (requiresPassword) {
      if (!passwordSet) {
        // Password not set yet - admin must set up their password first
        // Create session so they can access /password-setup
        req.session.applicantId = applicant.id
        req.session.isAdmin = true
        req.session.needsPasswordSetup = true
        applyRememberMe(req)

        return res.json({
          success: true,
          requiresPasswordSetup: true,
          isAdmin: true,
          applicant: {
            id: applicant.id,
            firstName: applicant.first_name,
            lastName: applicant.last_name,
            email: applicant.email,
            isAdmin: true,
            role: applicant.role || 'admin'
          }
        })
      }

      // Verify against stored hash (guard against corrupted/invalid hash)
      let isValid = false
      try {
        isValid = await verifyPassword(password, applicant.password_hash)
      } catch (verifyErr) {
        console.error('Password verification error (invalid or corrupted hash?):', verifyErr?.message)
        return res.status(500).json({
          error: 'Unable to verify password. Please contact an administrator.',
          code: 'LOGIN_ERROR',
          message: process.env.NODE_ENV === 'development' ? verifyErr?.message : undefined
        })
      }

      if (!isValid) {
        const db = getDatabase()
        try {
          db.prepare(`
            INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            firstName,
            lastName,
            email,
            0, // failed
            getClientIp(req),
            req.get('user-agent'),
            'Invalid password',
            applicant.id
          )
        } catch (logErr) {
          console.error('Failed to log login attempt:', logErr?.message)
        }

        // Check for failed login security alert
        try {
          const recentFailures = db.prepare(`
            SELECT COUNT(*) as count FROM login_attempts
            WHERE ip_address = ? AND success = 0 AND created_at > datetime('now', '-1 hour')
          `).get(getClientIp(req))
          if (recentFailures && recentFailures.count >= 5) {
            const recentAlert = db.prepare(`
              SELECT id FROM notifications
              WHERE type = 'failed_login_security' AND message LIKE ? AND created_at > datetime('now', '-1 hour')
              LIMIT 1
            `).get(`%${getClientIp(req)}%`)
            if (!recentAlert) {
              notifyAdminsAndManagers({
                type: 'failed_login_security',
                title: 'Failed Login Security Alert',
                message: `${recentFailures.count} failed login attempts from IP ${getClientIp(req)} in the past hour.`,
                link: '/admin'
              })
            }
          }
        } catch (notifError) {
          console.error('Failed login security notification error:', notifError.message)
        }

        return res.status(401).json({
          error: 'Invalid password',
          code: 'INVALID_PASSWORD',
          requiresPassword: true
        })
      }
    }

    // Login successful (password verified or not required)
    const db = getDatabase()

    try {
      db.prepare(`
        INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firstName,
        lastName,
        email,
        1, // success
        getClientIp(req),
        req.get('user-agent'),
        null,
        applicant.id
      )
    } catch (logErr) {
      console.error('Failed to log successful login attempt:', logErr?.message)
    }

    // Check onboarding completion status (distinct steps)
    const submissions = db.prepare(`
      SELECT COUNT(DISTINCT step_number) as count
      FROM form_submissions
      WHERE applicant_id = ?
    `).get(applicant.id)

    const completedSteps = Math.min(7, submissions?.count ?? 0)
    const isOnboardingComplete = (submissions?.count ?? 0) >= 7

    // Set session
    req.session.applicantId = applicant.id
    req.session.applicantEmail = applicant.email
    req.session.isAdmin = applicant.is_admin === 1
    applyRememberMe(req)

    // Audit log
    await auditLog({
      userId: applicant.id,
      action: 'LOGIN',
      resourceType: 'AUTH',
      resourceId: applicant.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      details: { email: applicant.email, completedSteps }
    })

    const role = applicant.role || (applicant.is_admin === 1 ? 'admin' : 'applicant')
    return res.json({
      success: true,
      applicant: {
        id: applicant.id,
        firstName: applicant.first_name,
        lastName: applicant.last_name,
        email: applicant.email,
        isAdmin: applicant.is_admin === 1,
        role
      },
      isNewUser: false,
      onboardingComplete: isOnboardingComplete,
      completedSteps,
      totalSteps: 7
    })
  } catch (error) {
    console.error('Login error:', error?.message || error)
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error stack:', error?.stack)
    }
    res.status(500).json({
      error: 'An unexpected error occurred during login. Please try again.',
      code: 'LOGIN_ERROR',
      message: error?.message,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })
  }
})

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  if (req.session.applicantId) {
    await auditLog({
      userId: req.session.applicantId,
      action: 'LOGOUT',
      resourceType: 'AUTH',
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent')
    })
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    res.json({ success: true })
  })
})

/**
 * POST /api/auth/keepalive
 * Refresh session expiration for active users
 */
router.post('/keepalive', requireAuth, (req, res) => {
  req.session.touch()
  const expiresAt = req.session.cookie.expires || req.session.cookie._expires

  res.json({
    success: true,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    timeoutMs: req.session.cookie.maxAge
  })
})

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    if (req.session && req.session.applicantId) {
      const { getDatabase } = await import('../database/init.js')
      const db = getDatabase()
      const applicant = db.prepare('SELECT id, first_name, last_name, email, is_admin, role, is_active FROM applicants WHERE id = ?')
        .get(req.session.applicantId)

      if (applicant) {
        if (applicant.is_active === 0) {
          req.session.destroy(() => { })
          return res.status(401).json({ error: 'Account has been deactivated. Contact an administrator.' })
        }
        const role = applicant.role || (applicant.is_admin === 1 ? 'admin' : 'applicant')
        res.json({
          id: applicant.id,
          firstName: applicant.first_name,
          lastName: applicant.last_name,
          email: applicant.email,
          isAdmin: applicant.is_admin === 1,
          role
        })
      } else {
        res.status(404).json({ error: 'User not found' })
      }
    } else {
      res.status(401).json({ error: 'Not authenticated' })
    }
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to retrieve user information' })
  }
})

/**
 * GET /api/auth/dashboard-onboarding-status
 * Check if the user has completed requirements for user onboarding: SSN consent (once, in DB), password (if admin), signature (once, in DB).
 * Used to lock dashboard/forms until all three are done.
 */
router.get('/dashboard-onboarding-status', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const db = getDatabase()
    const consentRow = db.prepare(`
      SELECT 1 FROM privacy_consents
      WHERE applicant_id = ? AND consent_type = 'SSN_COLLECTION'
      LIMIT 1
    `).get(req.session.applicantId)

    const applicant = db.prepare('SELECT is_admin, password_hash, signature_data FROM applicants WHERE id = ?')
      .get(req.session.applicantId)
    const isAdmin = applicant?.is_admin === 1
    const passwordSet = !!(applicant?.password_hash && applicant.password_hash.trim() !== '')
    const hasSignature = !!(applicant?.signature_data && applicant.signature_data.trim() !== '')

    res.json({
      ssnConsentGiven: !!consentRow,
      passwordSet,
      isAdmin,
      hasSignature
    })
  } catch (error) {
    console.error('Dashboard onboarding status error:', error)
    res.status(500).json({ error: 'Failed to check onboarding status' })
  }
})

/**
 * POST /api/auth/ssn-consent
 * Record SSN collection consent once (documented in DB). Required before user onboarding.
 */
router.post('/ssn-consent', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const db = getDatabase()
    const existing = db.prepare(`
      SELECT 1 FROM privacy_consents
      WHERE applicant_id = ? AND consent_type = 'SSN_COLLECTION'
      LIMIT 1
    `).get(req.session.applicantId)

    if (!existing) {
      db.prepare(`
        INSERT INTO privacy_consents (applicant_id, consent_type, consent_text, ip_address)
        VALUES (?, ?, ?, ?)
      `).run(
        req.session.applicantId,
        'SSN_COLLECTION',
        'Consented to SSN collection (dashboard onboarding)',
        getClientIp(req)
      )
    }

    res.json({ success: true })
  } catch (error) {
    console.error('SSN consent recording error:', error)
    res.status(500).json({ error: 'Failed to record consent' })
  }
})

/**
 * POST /api/auth/save-signature
 * Save the user's signature once (stored in DB). Required before dashboard/forms access. Cannot continue until filled.
 */
router.post('/save-signature', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { signatureData } = req.body
    if (!signatureData || typeof signatureData !== 'string' || !signatureData.trim()) {
      return res.status(400).json({ error: 'Signature data is required' })
    }
    // Allow data URL (e.g. data:image/png;base64,...) or plain base64
    const trimmed = signatureData.trim()
    if (trimmed.length > 500000) {
      return res.status(400).json({ error: 'Signature data too large' })
    }

    const db = getDatabase()
    db.prepare('UPDATE applicants SET signature_data = ? WHERE id = ?')
      .run(trimmed, req.session.applicantId)

    await auditLog({
      userId: req.session.applicantId,
      action: 'SIGNATURE_SAVED',
      resourceType: 'APPLICANT',
      resourceId: req.session.applicantId,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      details: { note: 'User onboarding signature saved' }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Save signature error:', error)
    res.status(500).json({ error: 'Failed to save signature' })
  }
})

/**
 * GET /api/auth/signature
 * Get the current user's stored signature (for loading into session on dashboard/forms).
 */
router.get('/signature', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const db = getDatabase()
    const row = db.prepare('SELECT signature_data FROM applicants WHERE id = ?')
      .get(req.session.applicantId)

    if (!row || !row.signature_data || !row.signature_data.trim()) {
      return res.status(404).json({ error: 'No signature on file' })
    }

    res.json({ signature: row.signature_data })
  } catch (error) {
    console.error('Get signature error:', error)
    res.status(500).json({ error: 'Failed to get signature' })
  }
})

/**
 * GET /api/auth/password-status
 * Check if password is set for current user
 */
router.get('/password-status', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const db = getDatabase()
    const applicant = db.prepare('SELECT is_admin, password_hash FROM applicants WHERE id = ?')
      .get(req.session.applicantId)

    if (!applicant) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isAdmin = applicant.is_admin === 1
    const passwordSet = applicant.password_hash !== null && applicant.password_hash !== ''
    const requiresPassword = isAdmin && !passwordSet

    res.json({
      passwordSet,
      requiresPassword,
      isAdmin
    })
  } catch (error) {
    console.error('Password status error:', error)
    res.status(500).json({ error: 'Failed to check password status' })
  }
})

/**
 * POST /api/auth/set-password
 * Set password for any authenticated user (initial setup)
 * Both admins and applicants can set their initial password
 */
router.post('/set-password', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { password, confirmPassword } = req.body

    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: 'Password and confirmation are required',
        code: 'MISSING_FIELDS'
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      })
    }

    const db = getDatabase()
    const applicant = db.prepare('SELECT is_admin, password_hash FROM applicants WHERE id = ?')
      .get(req.session.applicantId)

    if (!applicant) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if password already set (unless force flag - admin only for force)
    if (applicant.password_hash && !req.body.force) {
      return res.status(400).json({
        error: 'Password already set. Use change-password endpoint to update it.',
        code: 'PASSWORD_ALREADY_SET'
      })
    }

    // Force flag requires admin
    if (req.body.force && !applicant.is_admin) {
      return res.status(403).json({ error: 'Only administrators can force password reset' })
    }

    // Hash password
    const { hashPassword } = await import('../middleware/auth.js')
    const passwordHash = await hashPassword(password)

    // Update password
    db.prepare('UPDATE applicants SET password_hash = ? WHERE id = ?')
      .run(passwordHash, req.session.applicantId)

    // Audit log
    await auditLog({
      userId: req.session.applicantId,
      action: 'SET_PASSWORD',
      resourceType: 'AUTH',
      resourceId: req.session.applicantId,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      details: { isInitialSetup: !applicant.password_hash, isAdmin: applicant.is_admin === 1 }
    })

    res.json({
      success: true,
      message: 'Password set successfully'
    })
  } catch (error) {
    console.error('Set password error:', error)
    res.status(500).json({
      error: 'Failed to set password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

/**
 * POST /api/auth/change-password
 * Change existing password for admin user
 */
router.post('/change-password', async (req, res) => {
  try {
    if (!req.session || !req.session.applicantId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'Current password, new password, and confirmation are required',
        code: 'MISSING_FIELDS'
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New passwords do not match',
        code: 'PASSWORD_MISMATCH'
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      })
    }

    const db = getDatabase()
    const applicant = db.prepare('SELECT is_admin, password_hash FROM applicants WHERE id = ?')
      .get(req.session.applicantId)

    if (!applicant) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!applicant.is_admin) {
      return res.status(403).json({ error: 'Only administrators can change passwords' })
    }

    // Verify current password
    const passwordSet = applicant.password_hash !== null && applicant.password_hash !== ''

    if (!passwordSet) {
      return res.status(400).json({
        error: 'Password not set yet. Use set-password endpoint first.',
        code: 'PASSWORD_NOT_SET'
      })
    }

    const currentPasswordValid = await verifyPassword(currentPassword, applicant.password_hash)

    if (!currentPasswordValid) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      })
    }

    // Hash new password
    const { hashPassword } = await import('../middleware/auth.js')
    const passwordHash = await hashPassword(newPassword)

    // Update password
    db.prepare('UPDATE applicants SET password_hash = ? WHERE id = ?')
      .run(passwordHash, req.session.applicantId)

    // Audit log
    await auditLog({
      userId: req.session.applicantId,
      action: 'CHANGE_PASSWORD',
      resourceType: 'AUTH',
      resourceId: req.session.applicantId,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      error: 'Failed to change password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

/**
 * POST /api/auth/forgot-password
 * Request password reset email (no auth required)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      })
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Check if Mailgun is configured
    if (!isMailgunConfigured()) {
      return res.status(503).json({
        error: 'Email service is not configured. Please contact an administrator.',
        code: 'EMAIL_NOT_CONFIGURED'
      })
    }

    const db = getDatabase()

    // Look up applicant by email only
    const applicant = db.prepare(`
      SELECT id, first_name, email 
      FROM applicants 
      WHERE LOWER(TRIM(email)) = ?
    `).get(normalizedEmail)

    // Always return success message to prevent user enumeration
    const genericSuccessMessage = 'If an account exists with this email, we have sent password reset instructions.'

    if (!applicant) {
      // Log the attempt but don't reveal if account exists
      console.log('Password reset requested for non-existent email:', normalizedEmail)
      return res.json({
        success: true,
        message: genericSuccessMessage
      })
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')

    // Hash the token for storage (don't store plaintext)
    const tokenHash = await hashPassword(token)

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Delete any existing tokens for this applicant
    db.prepare('DELETE FROM password_reset_tokens WHERE applicant_id = ?').run(applicant.id)

    // Insert new token
    db.prepare(`
      INSERT INTO password_reset_tokens (applicant_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(applicant.id, tokenHash, expiresAt)

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:9999'
    const resetLink = `${frontendUrl}/reset-password?token=${token}`

    // Send email
    try {
      await sendPasswordResetEmail(applicant.email, applicant.first_name, resetLink)

      // Audit log
      await auditLog({
        userId: applicant.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'AUTH',
        resourceId: applicant.id,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        details: { email: applicant.email }
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Clean up token if email failed
      db.prepare('DELETE FROM password_reset_tokens WHERE applicant_id = ?').run(applicant.id)

      return res.status(503).json({
        error: 'Failed to send email. Please try again later or contact support.',
        code: 'EMAIL_SEND_FAILED'
      })
    }

    res.json({
      success: true,
      message: genericSuccessMessage
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      error: 'An error occurred. Please try again later.',
      code: 'FORGOT_PASSWORD_ERROR'
    })
  }
})

/**
 * GET /api/auth/verify-reset-token
 * Verify if a reset token is valid (no auth required)
 */
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required'
      })
    }

    const db = getDatabase()

    // Get all non-expired tokens
    const tokens = db.prepare(`
      SELECT id, applicant_id, token_hash, expires_at
      FROM password_reset_tokens
      WHERE expires_at > datetime('now')
    `).all()

    // Check if any token matches
    for (const row of tokens) {
      const isMatch = await verifyPassword(token, row.token_hash)
      if (isMatch) {
        return res.json({ valid: true })
      }
    }

    res.status(400).json({
      valid: false,
      error: 'Invalid or expired token'
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    res.status(500).json({
      valid: false,
      error: 'Failed to verify token'
    })
  }
})

/**
 * POST /api/auth/reset-password
 * Reset password using token (no auth required)
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body

    if (!token) {
      return res.status(400).json({
        error: 'Reset token is required',
        code: 'MISSING_TOKEN'
      })
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        error: 'Password and confirmation are required',
        code: 'MISSING_FIELDS'
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      })
    }

    const db = getDatabase()

    // Get all non-expired tokens
    const tokens = db.prepare(`
      SELECT id, applicant_id, token_hash, expires_at
      FROM password_reset_tokens
      WHERE expires_at > datetime('now')
    `).all()

    // Find matching token
    let matchedToken = null
    for (const row of tokens) {
      const isMatch = await verifyPassword(token, row.token_hash)
      if (isMatch) {
        matchedToken = row
        break
      }
    }

    if (!matchedToken) {
      return res.status(400).json({
        error: 'Invalid or expired reset link. Please request a new password reset.',
        code: 'INVALID_TOKEN'
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update applicant password
    db.prepare('UPDATE applicants SET password_hash = ? WHERE id = ?')
      .run(passwordHash, matchedToken.applicant_id)

    // Delete all tokens for this applicant
    db.prepare('DELETE FROM password_reset_tokens WHERE applicant_id = ?')
      .run(matchedToken.applicant_id)

    // Audit log
    await auditLog({
      userId: matchedToken.applicant_id,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'AUTH',
      resourceId: matchedToken.applicant_id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      error: 'Failed to reset password. Please try again.',
      code: 'RESET_PASSWORD_ERROR'
    })
  }
})

export default router

