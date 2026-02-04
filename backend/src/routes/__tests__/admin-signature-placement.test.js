import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import authRoutes from '../auth.js'
import adminRoutes from '../admin.js'
import { initializeDatabase, getDatabase } from '../../database/init.js'

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
app.use('/api/admin', adminRoutes)

describe('Admin signature placement', () => {
  let sessionCookie = null

  beforeEach(async () => {
    initializeDatabase()
    const db = getDatabase()
    db.exec('DELETE FROM applicants')
    db.exec('DELETE FROM audit_log')
    db.prepare("DELETE FROM settings WHERE key LIKE 'signature_placement_%'").run()

    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ firstName: 'Admin', lastName: 'User', email: 'admin-sig@example.com' })
    expect(signup.status).toBe(200)
    sessionCookie = signup.headers['set-cookie']
  })

  afterEach(() => {
    const db = getDatabase()
    db.prepare("DELETE FROM settings WHERE key LIKE 'signature_placement_%'").run()
    db.exec('DELETE FROM audit_log')
    db.exec('DELETE FROM applicants')
  })

  it('GET /api/admin/settings/signature-placement returns all form types when no query', async () => {
    const res = await request(app)
      .get('/api/admin/settings/signature-placement')
      .set('Cookie', sessionCookie)
      .expect(200)
    expect(res.body).toHaveProperty('W4')
    expect(res.body).toHaveProperty('I9')
    expect(res.body).toHaveProperty('8850')
    expect(Array.isArray(res.body.W4)).toBe(true)
    expect(res.body.W4).toHaveLength(0)
    expect(Array.isArray(res.body.I9)).toBe(true)
    expect(Array.isArray(res.body['8850'])).toBe(true)
  })

  it('GET /api/admin/settings/signature-placement?formType=W4 returns placements array', async () => {
    const res = await request(app)
      .get('/api/admin/settings/signature-placement')
      .query({ formType: 'W4' })
      .set('Cookie', sessionCookie)
      .expect(200)
    expect(res.body).toHaveProperty('formType', 'W4')
    expect(res.body).toHaveProperty('placements')
    expect(Array.isArray(res.body.placements)).toBe(true)
  })

  it('PUT then GET persists signature placement for W4 (legacy single placement)', async () => {
    const placement = {
      mode: 'free_place',
      pageIndex: 0,
      x: 72,
      y: 120,
      width: 180,
      height: 40
    }
    const putRes = await request(app)
      .put('/api/admin/settings/signature-placement')
      .set('Cookie', sessionCookie)
      .send({ formType: 'W4', placement })
      .expect(200)
    expect(putRes.body.success).toBe(true)
    expect(Array.isArray(putRes.body.placements)).toBe(true)
    expect(putRes.body.placements[0]).toMatchObject({ pageIndex: 0, x: 72, y: 120, width: 180, height: 40 })

    const getRes = await request(app)
      .get('/api/admin/settings/signature-placement')
      .query({ formType: 'W4' })
      .set('Cookie', sessionCookie)
      .expect(200)
    expect(getRes.body.placements).toHaveLength(1)
    expect(getRes.body.placements[0]).toMatchObject({ pageIndex: 0, x: 72, y: 120, width: 180, height: 40 })
  })

  it('PUT rejects invalid formType', async () => {
    await request(app)
      .put('/api/admin/settings/signature-placement')
      .set('Cookie', sessionCookie)
      .send({
        formType: 'INVALID',
        placement: { mode: 'free_place', pageIndex: 0, x: 72, y: 120, width: 180, height: 40 }
      })
      .expect(400)
  })

  it('GET rejects invalid formType', async () => {
    await request(app)
      .get('/api/admin/settings/signature-placement')
      .query({ formType: 'INVALID' })
      .set('Cookie', sessionCookie)
      .expect(400)
  })
})
