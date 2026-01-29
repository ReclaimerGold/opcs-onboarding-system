import express from 'express'
import { findApplicantByCredentials, createApplicant, isFirstUser, verifyPassword, checkPasswordSet, requireAuth } from '../middleware/auth.js'
import { auditLog } from '../services/auditService.js'
import { getDatabase } from '../database/init.js'

const router = express.Router()

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
        SELECT COUNT(*) as count 
        FROM form_submissions 
        WHERE applicant_id = ?
      `).get(existingApplicant.id)
      
      const completedSteps = submissions.count || 0
      const isOnboardingComplete = completedSteps >= 6
      
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
    
    // Audit log
    await auditLog({
      userId: applicant.id,
      action: 'SIGNUP',
      resourceType: 'AUTH',
      resourceId: applicant.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { email: applicant.email, isAdmin: applicant.is_admin === 1, isFirstUser: isFirstUser() }
    })
    
    // Reload applicant to ensure we have the latest data including is_admin
    const db = getDatabase()
    const fullApplicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(applicant.id)
    
    res.json({
      success: true,
      applicant: {
        id: fullApplicant.id,
        firstName: fullApplicant.first_name,
        lastName: fullApplicant.last_name,
        email: fullApplicant.email,
        isAdmin: fullApplicant.is_admin === 1
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
      // Log failed login attempt
      db.prepare(`
        INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firstName,
        lastName,
        email,
        0, // failed
        req.ip,
        req.get('user-agent'),
        'Account not found',
        null // no applicant_id for failed attempts
      )
      
      return res.status(404).json({ 
        error: 'No account found with this information. Please sign up to get started.',
        code: 'ACCOUNT_NOT_FOUND',
        notFound: true
      })
    }
    
    const isAdmin = applicant.is_admin === 1
    const passwordSet = applicant.password_hash !== null && applicant.password_hash !== ''
    const requiresPassword = isAdmin // All admins require password
    const shouldCompleteLogin = !requiresPassword || password !== undefined
    
    if (!shouldCompleteLogin) {
      // Phase 1: Return whether password is required or needs setup
      // If admin doesn't have password set, they need to set it up first
      if (isAdmin && !passwordSet) {
        // Create session so they can access /password-setup
        req.session.applicantId = applicant.id
        req.session.isAdmin = true
        req.session.needsPasswordSetup = true
        
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
          isAdmin: applicant.is_admin === 1
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
      
      // Verify against stored hash
      const isValid = await verifyPassword(password, applicant.password_hash)
      
      if (!isValid) {
        const db = getDatabase()
        db.prepare(`
          INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          firstName,
          lastName,
          email,
          0, // failed
          req.ip,
          req.get('user-agent'),
          'Invalid password',
          applicant.id
        )
        
        return res.status(401).json({
          error: 'Invalid password',
          code: 'INVALID_PASSWORD',
          requiresPassword: true
        })
      }
    }
    
    // Login successful (password verified or not required)
    const db = getDatabase()
    
    db.prepare(`
      INSERT INTO login_attempts (first_name, last_name, email, success, ip_address, user_agent, error_message, applicant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      firstName,
      lastName,
      email,
      1, // success
      req.ip,
      req.get('user-agent'),
      null,
      applicant.id
    )
    
    // Check onboarding completion status
    const submissions = db.prepare(`
      SELECT COUNT(*) as count 
      FROM form_submissions 
      WHERE applicant_id = ?
    `).get(applicant.id)
    
    const completedSteps = submissions.count || 0
    const isOnboardingComplete = completedSteps >= 6
    
    // Set session
    req.session.applicantId = applicant.id
    req.session.applicantEmail = applicant.email
    req.session.isAdmin = applicant.is_admin === 1
    
    // Audit log
    await auditLog({
      userId: applicant.id,
      action: 'LOGIN',
      resourceType: 'AUTH',
      resourceId: applicant.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { email: applicant.email, completedSteps }
    })
    
    return res.json({
      success: true,
      applicant: {
        id: applicant.id,
        firstName: applicant.first_name,
        lastName: applicant.last_name,
        email: applicant.email,
        isAdmin: applicant.is_admin === 1
      },
      isNewUser: false,
      onboardingComplete: isOnboardingComplete,
      completedSteps,
      totalSteps: 6
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      error: 'An unexpected error occurred during login. Please try again.',
      code: 'LOGIN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      ipAddress: req.ip,
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
      const applicant = db.prepare('SELECT id, first_name, last_name, email, is_admin FROM applicants WHERE id = ?')
        .get(req.session.applicantId)
      
      if (applicant) {
        res.json({
          id: applicant.id,
          firstName: applicant.first_name,
          lastName: applicant.last_name,
          email: applicant.email,
          isAdmin: applicant.is_admin === 1
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
 * Set password for admin user (initial setup)
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
    
    if (!applicant.is_admin) {
      return res.status(403).json({ error: 'Only administrators can set passwords' })
    }
    
    // Check if password already set (unless force flag)
    if (applicant.password_hash && !req.body.force) {
      return res.status(400).json({
        error: 'Password already set. Use change-password endpoint to update it.',
        code: 'PASSWORD_ALREADY_SET'
      })
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
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { isInitialSetup: !applicant.password_hash }
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
      ipAddress: req.ip,
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

export default router

