import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import applicantRoutes from './routes/applicants.js'
import formRoutes from './routes/forms.js'
import settingsRoutes from './routes/settings.js'
import adminRoutes from './routes/admin.js'
import diagnosticsRoutes from './routes/diagnostics.js'
import { initializeDatabase } from './database/init.js'
import { startRetentionScheduler } from './services/retentionService.js'
import { auditMiddleware } from './middleware/audit.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

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
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Rate limiting - more lenient for auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs (signup/login attempts)
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/diagnostics', diagnosticsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  // Start retention service scheduler
  startRetentionScheduler()
})

