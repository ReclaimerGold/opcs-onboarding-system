import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import authRoutes from '../auth.js'
import { initializeDatabase, getDatabase } from '../../database/init.js'

// Create test app
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  beforeEach(() => {
    // Initialize fresh database for each test
    initializeDatabase()
  })

  afterEach(() => {
    // Clean up test database
    const db = getDatabase()
    db.exec('DELETE FROM applicants')
    db.exec('DELETE FROM login_attempts')
    db.exec('DELETE FROM audit_log')
  })

  describe('POST /api/auth/signup', () => {
    it('should create a new applicant account', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.applicant).toBeDefined()
      expect(response.body.applicant.firstName).toBe('John')
      expect(response.body.applicant.lastName).toBe('Doe')
      expect(response.body.applicant.email).toBe('john.doe@example.com')
      expect(response.body.isNewUser).toBe(true)
    })

    it('should make first user an admin', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com'
        })
        .expect(200)

      expect(response.body.applicant.isAdmin).toBe(true)
    })

    it('should reject signup with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John'
          // Missing lastName and email
        })
        .expect(400)

      expect(response.body.error).toContain('required')
      expect(response.body.code).toBe('MISSING_FIELDS')
    })

    it('should reject signup with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email'
        })
        .expect(400)

      expect(response.body.error).toContain('valid email')
      expect(response.body.code).toBe('INVALID_EMAIL')
    })

    it('should reject duplicate signup', async () => {
      // Create first account
      await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        })
        .expect(200)

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        })
        .expect(400)

      expect(response.body.code).toBe('ACCOUNT_EXISTS')
      expect(response.body.existingAccount).toBe(true)
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com'
        })
    })

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.applicant).toBeDefined()
      expect(response.body.applicant.email).toBe('jane.smith@example.com')
      expect(response.body.isNewUser).toBe(false)
    })

    it('should reject login with incorrect credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          firstName: 'Wrong',
          lastName: 'Name',
          email: 'wrong@example.com'
        })
        .expect(404)

      expect(response.body.code).toBe('ACCOUNT_NOT_FOUND')
      expect(response.body.notFound).toBe(true)
    })

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          firstName: 'Jane'
          // Missing lastName and email
        })
        .expect(400)

      expect(response.body.error).toContain('required')
      expect(response.body.code).toBe('MISSING_FIELDS')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First create and login
      await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        })

      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info when authenticated', async () => {
      // Signup to create session
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        })

      const cookies = signupResponse.headers['set-cookie']
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)
        .expect(200)

      expect(response.body.email).toBe('test@example.com')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.error).toBe('Not authenticated')
    })
  })
})

