import { getDatabase } from '../database/init.js'
import bcrypt from 'bcrypt'

/**
 * Authentication middleware
 * Checks if user is logged in via session and account is active
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.applicantId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const db = getDatabase()
  const applicant = db.prepare('SELECT id, is_active FROM applicants WHERE id = ?').get(req.session.applicantId)
  if (!applicant) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if (applicant.is_active === 0) {
    req.session.destroy(() => { })
    return res.status(401).json({ error: 'Account has been deactivated. Contact an administrator.' })
  }
  req.applicantId = req.session.applicantId
  next()
}

/**
 * Admin authentication middleware
 * Checks if user is authenticated, active, and has admin privileges
 */
export function requireAdmin(req, res, next) {
  if (!req.session || !req.session.applicantId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const db = getDatabase()
  const applicant = db.prepare('SELECT is_admin, is_active FROM applicants WHERE id = ?').get(req.session.applicantId)
  if (!applicant) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if (applicant.is_active === 0) {
    req.session.destroy(() => { })
    return res.status(401).json({ error: 'Account has been deactivated. Contact an administrator.' })
  }
  if (!applicant.is_admin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  req.applicantId = req.session.applicantId
  next()
}

/**
 * Manager authentication middleware
 * Checks if user is authenticated, active, and has manager or admin role
 */
export function requireManager(req, res, next) {
  if (!req.session || !req.session.applicantId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const db = getDatabase()
  const applicant = db.prepare('SELECT role, is_admin, is_active FROM applicants WHERE id = ?').get(req.session.applicantId)
  if (!applicant) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if (applicant.is_active === 0) {
    req.session.destroy(() => { })
    return res.status(401).json({ error: 'Account has been deactivated. Contact an administrator.' })
  }
  if (applicant.role !== 'manager' && applicant.role !== 'admin' && !applicant.is_admin) {
    return res.status(403).json({ error: 'Manager or admin access required' })
  }
  req.applicantId = req.session.applicantId
  next()
}

/**
 * Check if this will be the first user in the system
 * Uses a more robust check to avoid race conditions
 */
export function isFirstUser() {
  const db = getDatabase()
  const result = db.prepare('SELECT COUNT(*) as count FROM applicants').get()
  const count = result ? result.count : 0

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('isFirstUser check:', { count, isFirst: count === 0 })
  }

  return count === 0
}

/**
 * Case-insensitive email/name matching helper
 */
export function normalizeString(str) {
  return str ? str.trim().toLowerCase() : ''
}

/**
 * Find applicant by case-insensitive first name, last name, and email
 */
export function findApplicantByCredentials(firstName, lastName, email) {
  const db = getDatabase()
  const normalizedFirstName = normalizeString(firstName)
  const normalizedLastName = normalizeString(lastName)
  const normalizedEmail = normalizeString(email)

  // Query with normalized comparison - handles both normalized and non-normalized stored data
  const applicant = db.prepare(`
    SELECT *, password_hash FROM applicants 
    WHERE LOWER(TRIM(first_name)) = ?
      AND LOWER(TRIM(last_name)) = ?
      AND LOWER(TRIM(email)) = ?
    LIMIT 1
  `).get(normalizedFirstName, normalizedLastName, normalizedEmail)

  // Debug logging in development
  if (!applicant && process.env.NODE_ENV === 'development') {
    console.log('Login attempt - No match found:', {
      input: { firstName, lastName, email },
      normalized: { normalizedFirstName, normalizedLastName, normalizedEmail }
    })

    // Check if any applicants exist with similar data
    const allApplicants = db.prepare(`
      SELECT id, first_name, last_name, email, 
             LOWER(TRIM(first_name)) as norm_first,
             LOWER(TRIM(last_name)) as norm_last,
             LOWER(TRIM(email)) as norm_email
      FROM applicants
      LIMIT 10
    `).all()

    console.log('Sample applicants in database:', allApplicants)
  }

  return applicant
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  if (!hash) {
    return false
  }
  return await bcrypt.compare(password, hash)
}

/**
 * Check if password is set for an applicant
 */
export function checkPasswordSet(applicantId) {
  const db = getDatabase()
  const applicant = db.prepare('SELECT password_hash FROM applicants WHERE id = ?').get(applicantId)
  return applicant && applicant.password_hash !== null && applicant.password_hash !== ''
}

/**
 * Create new applicant
 * If this is the first user, they automatically become admin
 * Uses a transaction to ensure atomic check-and-insert to prevent race conditions
 */
export function createApplicant(firstName, lastName, email, additionalData = {}) {
  const db = getDatabase()

  // Normalize and trim input data to ensure consistency with findApplicantByCredentials
  const normalizedFirstName = firstName ? firstName.trim() : ''
  const normalizedLastName = lastName ? lastName.trim() : ''
  const normalizedEmail = email ? email.trim().toLowerCase() : ''

  // Use a transaction to atomically check if this is the first user and insert
  // This prevents race conditions where multiple signups happen simultaneously
  const insertApplicant = db.transaction(() => {
    // Check if this is the first user (inside transaction for atomicity)
    const result = db.prepare('SELECT COUNT(*) as count FROM applicants').get()
    const count = result ? result.count : 0
    const firstUser = count === 0

    // Determine admin status:
    // 1. First user always becomes admin
    // 2. Otherwise, only if explicitly set in additionalData (and must be truthy/1)
    let isAdmin = 0
    if (firstUser) {
      isAdmin = 1
    } else if (additionalData.isAdmin !== undefined && additionalData.isAdmin !== null) {
      // Explicitly set - convert to 1 or 0
      isAdmin = (additionalData.isAdmin === true || additionalData.isAdmin === 1) ? 1 : 0
    }
    // Otherwise, isAdmin remains 0 (default)

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('createApplicant:', {
        count,
        firstUser,
        isAdmin,
        email: normalizedEmail,
        explicitAdmin: additionalData.isAdmin,
        additionalDataKeys: Object.keys(additionalData)
      })
    }

    const role = isAdmin ? 'admin' : (additionalData.role === 'manager' || additionalData.role === 'employee' ? additionalData.role : 'applicant')
    const insertResult = db.prepare(`
      INSERT INTO applicants (first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code, is_admin, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      normalizedFirstName,
      normalizedLastName,
      normalizedEmail,
      additionalData.phone || null,
      additionalData.dateOfBirth || null,
      additionalData.address || null,
      additionalData.city || null,
      additionalData.state || null,
      additionalData.zipCode || null,
      isAdmin,
      role
    )

    return { insertResult, isAdmin }
  })

  const { insertResult, isAdmin } = insertApplicant()

  const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(insertResult.lastInsertRowid)

  // Verify the admin status was set correctly
  if (process.env.NODE_ENV === 'development' && applicant) {
    console.log('Created applicant:', {
      id: applicant.id,
      email: applicant.email,
      is_admin: applicant.is_admin,
      expectedAdmin: isAdmin
    })
  }

  return applicant
}

