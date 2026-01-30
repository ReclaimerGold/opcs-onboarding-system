import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import formRoutes from '../forms.js'
import authRoutes from '../auth.js'
import { initializeDatabase, getDatabase } from '../../database/init.js'

// Create test app
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

app.use('/api/auth', authRoutes)
app.use('/api/forms', formRoutes)

describe('Form Routes', () => {
  let testUser = null
  let sessionCookie = null

  beforeEach(async () => {
    initializeDatabase()

    // Ensure Google Drive is not used in tests (avoids decrypting real credentials with test key)
    const db = getDatabase()
    db.prepare(`
      DELETE FROM settings WHERE key IN ('google_client_id', 'google_client_secret', 'google_refresh_token', 'google_drive_base_folder_id', 'google_shared_drive_id')
    `).run()

    // Create test user and get session
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      })

    testUser = signupResponse.body.applicant
    sessionCookie = signupResponse.headers['set-cookie']
  })

  afterEach(() => {
    const db = getDatabase()
    db.exec('DELETE FROM form_submissions')
    db.exec('DELETE FROM form_drafts')
    db.exec('DELETE FROM applicants')
    db.exec('DELETE FROM audit_log')
  })

  describe('POST /api/forms/submit/:step', () => {
    it('should submit W-4 form (Step 1)', async () => {
      const formData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '(234) 567-8901',
        ssn: '123-45-6789',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
        city: 'Sioux Falls',
        state: 'SD',
        zipCode: '57101',
        filingStatus: 'single'
      }

      const response = await request(app)
        .post('/api/forms/submit/1')
        .set('Cookie', sessionCookie)
        .send({
          formData,
          ssnConsented: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.submissionId).toBeDefined()
      expect(response.body.filename).toContain('TestUser')
      expect(response.body.filename).toContain('W4')
    })

    it('should reject form submission without SSN consent for W-4', async () => {
      const formData = {
        firstName: 'Test',
        lastName: 'User',
        ssn: '123-45-6789'
      }

      const response = await request(app)
        .post('/api/forms/submit/1')
        .set('Cookie', sessionCookie)
        .send({ formData })
        .expect(400)

      expect(response.body.error).toContain('SSN collection consent')
    })

    it('should reject form submission without authentication', async () => {
      const response = await request(app)
        .post('/api/forms/submit/1')
        .send({ formData: {} })
        .expect(401)

      expect(response.body.error).toContain('Authentication required')
    })
  })

  describe('POST /api/forms/draft/:step', () => {
    it('should save draft form data', async () => {
      const formData = {
        firstName: 'Test',
        lastName: 'User',
        phone: '(234) 567-8901'
      }

      const response = await request(app)
        .post('/api/forms/draft/1')
        .set('Cookie', sessionCookie)
        .send({ formData })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('saved')
    })

    it('should retrieve saved draft', async () => {
      const formData = {
        firstName: 'Test',
        lastName: 'User',
        phone: '(234) 567-8901'
      }

      // Save draft
      await request(app)
        .post('/api/forms/draft/1')
        .set('Cookie', sessionCookie)
        .send({ formData })

      // Retrieve draft
      const response = await request(app)
        .get('/api/forms/draft/1')
        .set('Cookie', sessionCookie)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.formData).toBeDefined()
      expect(response.body.formData.firstName).toBe('Test')
    })
  })
})

