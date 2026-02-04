import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { auditLog } from '../services/auditService.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

/**
 * GET /api/applicants/me
 * Get current applicant's information
 */
router.get('/me', async (req, res) => {
  try {
    const db = getDatabase()
    const applicant = db.prepare(`
      SELECT id, first_name, last_name, email, phone, date_of_birth, 
             address, city, state, zip_code, hire_date, termination_date, created_at
      FROM applicants 
      WHERE id = ?
    `).get(req.applicantId)

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' })
    }

    await auditLog({
      userId: req.applicantId,
      action: 'VIEW',
      resourceType: 'APPLICANT',
      resourceId: req.applicantId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      id: applicant.id,
      firstName: applicant.first_name,
      lastName: applicant.last_name,
      email: applicant.email,
      phone: applicant.phone,
      dateOfBirth: applicant.date_of_birth,
      address: applicant.address,
      city: applicant.city,
      state: applicant.state,
      zipCode: applicant.zip_code,
      hireDate: applicant.hire_date,
      terminationDate: applicant.termination_date,
      createdAt: applicant.created_at,
      // Also include camelCase versions for compatibility
      first_name: applicant.first_name,
      last_name: applicant.last_name
    })
  } catch (error) {
    console.error('Get applicant error:', error)
    res.status(500).json({ error: 'Failed to retrieve applicant information' })
  }
})

/**
 * PUT /api/applicants/me
 * Update current applicant's information
 */
router.put('/me', async (req, res) => {
  try {
    const db = getDatabase()
    const { phone, dateOfBirth, address, city, state, zipCode } = req.body

    db.prepare(`
      UPDATE applicants 
      SET phone = ?, date_of_birth = ?, address = ?, city = ?, state = ?, zip_code = ?
      WHERE id = ?
    `).run(phone, dateOfBirth, address, city, state, zipCode, req.applicantId)

    await auditLog({
      userId: req.applicantId,
      action: 'UPDATE',
      resourceType: 'APPLICANT',
      resourceId: req.applicantId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { fields: Object.keys(req.body) }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Update applicant error:', error)
    res.status(500).json({ error: 'Failed to update applicant information' })
  }
})

/**
 * GET /api/applicants/me/progress
 * Get form completion progress
 */
router.get('/me/progress', async (req, res) => {
  try {
    const db = getDatabase()
    // Latest submission per step (for progress and list)
    const submissions = db.prepare(`
      SELECT step_number, form_type, submitted_at, pdf_filename
      FROM form_submissions
      WHERE applicant_id = ?
        AND (step_number, submitted_at) IN (
          SELECT step_number, MAX(submitted_at) FROM form_submissions WHERE applicant_id = ? GROUP BY step_number
        )
      ORDER BY step_number
    `).all(req.applicantId, req.applicantId)

    const totalSteps = 6
    const completedSteps = submissions.length
    const progress = (completedSteps / totalSteps) * 100

    res.json({
      totalSteps,
      completedSteps,
      progress: Math.round(progress),
      submissions: submissions.map(s => ({
        stepNumber: s.step_number,
        formType: s.form_type,
        submittedAt: s.submitted_at,
        pdfFilename: s.pdf_filename
      }))
    })
  } catch (error) {
    console.error('Get progress error:', error)
    res.status(500).json({ error: 'Failed to retrieve progress' })
  }
})

export default router

