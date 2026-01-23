import express from 'express'
import { findApplicantByCredentials, createApplicant, isFirstUser } from '../middleware/auth.js'
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
 * Login to continue/resume onboarding process
 */
router.post('/login', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body
    
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
    
    // Log successful login attempt and check onboarding status
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
      applicant.id // applicant_id
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
    
    res.json({
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
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    if (req.session && req.session.applicantId) {
      const { getDatabase } = await import('../database/init.js')
      const db = getDatabase()
      const applicant = db.prepare('SELECT id, first_name, last_name, email FROM applicants WHERE id = ?')
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

export default router

