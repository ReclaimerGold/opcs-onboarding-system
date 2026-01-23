import { getDatabase } from '../database/init.js'

/**
 * Authentication middleware
 * Checks if user is logged in via session
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.applicantId) {
    req.applicantId = req.session.applicantId
    next()
  } else {
    res.status(401).json({ error: 'Authentication required' })
  }
}

/**
 * Admin authentication middleware
 * Checks if user is authenticated and has admin privileges
 */
export function requireAdmin(req, res, next) {
  if (!req.session || !req.session.applicantId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  const db = getDatabase()
  const applicant = db.prepare('SELECT is_admin FROM applicants WHERE id = ?')
    .get(req.session.applicantId)
  
  if (!applicant || !applicant.is_admin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  req.applicantId = req.session.applicantId
  next()
}

/**
 * Check if this will be the first user in the system
 */
export function isFirstUser() {
  const db = getDatabase()
  const count = db.prepare('SELECT COUNT(*) as count FROM applicants').get()
  return count.count === 0
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
  
  const applicant = db.prepare(`
    SELECT * FROM applicants 
    WHERE LOWER(TRIM(first_name)) = ? 
      AND LOWER(TRIM(last_name)) = ? 
      AND LOWER(TRIM(email)) = ?
  `).get(normalizedFirstName, normalizedLastName, normalizedEmail)
  
  return applicant
}

/**
 * Create new applicant
 * If this is the first user, they automatically become admin
 */
export function createApplicant(firstName, lastName, email, additionalData = {}) {
  const db = getDatabase()
  
  // Check if this is the first user
  const firstUser = isFirstUser()
  const isAdmin = firstUser ? 1 : (additionalData.isAdmin || 0)
  
  const result = db.prepare(`
    INSERT INTO applicants (first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    firstName,
    lastName,
    email,
    additionalData.phone || null,
    additionalData.dateOfBirth || null,
    additionalData.address || null,
    additionalData.city || null,
    additionalData.state || null,
    additionalData.zipCode || null,
    isAdmin
  )
  
  return db.prepare('SELECT * FROM applicants WHERE id = ?').get(result.lastInsertRowid)
}

