import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import authRoutes from './routes/auth.js'
import applicantRoutes from './routes/applicants.js'
import formRoutes from './routes/forms.js'
import settingsRoutes from './routes/settings.js'
import adminRoutes from './routes/admin.js'
import approvalRoutes from './routes/approvals.js'
import diagnosticsRoutes from './routes/diagnostics.js'
import addressRoutes from './routes/address.js'
import notificationRoutes from './routes/notifications.js'
import { initializeDatabase } from './database/init.js'
import { startRetentionScheduler } from './services/retentionService.js'
import { auditMiddleware } from './middleware/audit.js'
import { clientIpMiddleware, getClientIp } from './middleware/clientIp.js'
import { initializeTemplates, updateAllTemplates } from './services/pdfTemplateService.js'
import { sendDigestEmails, checkStaleOnboarding, checkOnboardingReminders, checkDocumentRetention } from './services/notificationService.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
const BetterSqlite3SessionStore = require('better-sqlite3-session-store')
const SqliteStore = BetterSqlite3SessionStore(session)

const sessionsDbPath = path.join(__dirname, '../database/sessions.db')
const sessionsDbDir = path.dirname(sessionsDbPath)
if (!fs.existsSync(sessionsDbDir)) {
  fs.mkdirSync(sessionsDbDir, { recursive: true })
}
const sessionsDb = new Database(sessionsDbPath)

const app = express()
const PORT = process.env.PORT || 3000

// Client IP: use trusted proxy setting so we get real client IP from X-Forwarded-For
// when behind a reverse proxy. See middleware/clientIp.js and Settings → Trusted proxy IPs.
app.set('trust proxy', false)

// Initialize database
initializeDatabase()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9999',
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Session configuration
// Note: secure cookies require HTTPS. Set SECURE_COOKIES=true when serving over HTTPS.
// For local development/testing over HTTP, leave SECURE_COOKIES unset or set to 'false'.
const isSecureCookies = process.env.SECURE_COOKIES === 'true'

// Resolve real client IP when behind a trusted proxy (must run before rate limit and audit)
app.use(clientIpMiddleware)

app.use(session({
  store: new SqliteStore({
    client: sessionsDb,
    expired: {
      clear: true,
      intervalMs: 15 * 60 * 1000 // 15 minutes
    }
  }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: isSecureCookies,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  }
}))

// Rate limiting - per-user for authenticated requests so form wizard burst doesn't hit limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // requests per window per key (higher for form wizard: progress, drafts, applicant, i9 docs, etc.)
  keyGenerator: (req) => (req.session?.applicantId ? `user-${req.session.applicantId}` : getClientIp(req)),
  standardHeaders: true,
  legacyHeaders: false
})

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute - reduced for testing
  max: 100, // limit each IP to 100 auth requests per windowMs (signup/login attempts) - increased for testing
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health'
  }
})

// Apply rate limiting
app.use('/api/auth', authLimiter)
app.use('/api/', generalLimiter)

// Audit middleware
app.use('/api/', auditMiddleware)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/applicants', applicantRoutes)
app.use('/api/forms', formRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/diagnostics', diagnosticsRoutes)
app.use('/api/address', addressRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check (version from Docker build-arg when built from release tag)
app.get('/api/health', (req, res) => {
  const payload = { status: 'ok' }
  if (process.env.VERSION) {
    payload.version = process.env.VERSION
  }
  res.json(payload)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  startRetentionScheduler()

  // PDF templates are downloaded when the first admin opens the dashboard (see admin download-stream endpoint)

  // Schedule periodic template update checks (every 24 hours)
  const TEMPLATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
  setInterval(async () => {
    console.log('Running scheduled PDF template update check...')
    try {
      const results = await updateAllTemplates(false)
      const updated = Object.entries(results).filter(([, r]) => r.updated)
      if (updated.length > 0) {
        console.log('Template updates:', updated.map(([type]) => type).join(', '))
      } else {
        console.log('All templates are up to date')
      }
    } catch (error) {
      console.error('Scheduled template update check failed:', error.message)
    }
  }, TEMPLATE_CHECK_INTERVAL)

  // Notification scheduled tasks (run daily at startup + every 24 hours)
  const NOTIFICATION_CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

  const runNotificationChecks = async () => {
    console.log('Running scheduled notification checks...')
    try {
      checkStaleOnboarding()
      console.log('  Stale onboarding check complete')
    } catch (error) {
      console.error('  Stale onboarding check failed:', error.message)
    }

    try {
      checkOnboardingReminders()
      console.log('  Onboarding reminders check complete')
    } catch (error) {
      console.error('  Onboarding reminders check failed:', error.message)
    }

    try {
      checkDocumentRetention()
      console.log('  Document retention check complete')
    } catch (error) {
      console.error('  Document retention check failed:', error.message)
    }

    try {
      await sendDigestEmails()
      console.log('  Digest emails sent')
    } catch (error) {
      console.error('  Digest emails failed:', error.message)
    }
  }

  // Run initial check after a 30-second delay (let server finish starting)
  setTimeout(runNotificationChecks, 30 * 1000)

  // Schedule daily checks
  setInterval(runNotificationChecks, NOTIFICATION_CHECK_INTERVAL)
})

