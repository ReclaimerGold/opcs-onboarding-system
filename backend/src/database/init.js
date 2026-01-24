import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../../database/onboarding.db')
const dbDir = path.dirname(dbPath)

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

export function initializeDatabase() {
  // Applicants table (NO SSN - compliant with data minimization)
  db.exec(`
    CREATE TABLE IF NOT EXISTS applicants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      date_of_birth TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      hire_date TEXT,
      termination_date TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Add is_admin column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE applicants ADD COLUMN is_admin INTEGER DEFAULT 0`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Add password_hash column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE applicants ADD COLUMN password_hash TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Form submissions with retention tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      form_type TEXT NOT NULL,
      form_data TEXT,
      pdf_filename TEXT,
      pdf_encrypted_path TEXT,
      google_drive_id TEXT NOT NULL,
      retention_until DATE,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
    )
  `)
  
  // Add google_drive_id column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE form_submissions ADD COLUMN google_drive_id TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }
  
  // Make google_drive_id required (set default for existing records)
  try {
    // Update any null google_drive_id values (migration)
    db.exec(`UPDATE form_submissions SET google_drive_id = '' WHERE google_drive_id IS NULL`)
  } catch (error) {
    // Ignore if column doesn't exist yet
  }

  // Add web_view_link column if it doesn't exist (migration for Google Drive direct links)
  try {
    db.exec(`ALTER TABLE form_submissions ADD COLUMN web_view_link TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Audit log for compliance (required for I-9 electronic storage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Settings (API keys encrypted)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      is_encrypted INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Privacy consent tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS privacy_consents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      consent_type TEXT NOT NULL,
      consent_text TEXT,
      consented_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
    )
  `)

  // Form drafts for saving progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS form_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      form_data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
      UNIQUE(applicant_id, step_number)
    )
  `)

  // Login attempts tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      success INTEGER DEFAULT 0,
      ip_address TEXT,
      user_agent TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE SET NULL
    )
  `)

  // I-9 Identity Documents storage
  db.exec(`
    CREATE TABLE IF NOT EXISTS i9_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_category TEXT NOT NULL,
      document_name TEXT,
      file_path TEXT,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      google_drive_id TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
      UNIQUE(applicant_id, document_type, document_category)
    )
  `)
  
  // Add google_drive_id column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE i9_documents ADD COLUMN google_drive_id TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }
  
  // Make file_path nullable (migration)
  try {
    // Update any null google_drive_id values (migration)
    db.exec(`UPDATE i9_documents SET google_drive_id = '' WHERE google_drive_id IS NULL`)
  } catch (error) {
    // Ignore if column doesn't exist yet
  }

  // Add web_view_link column if it doesn't exist (migration for Google Drive direct links)
  try {
    db.exec(`ALTER TABLE i9_documents ADD COLUMN web_view_link TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_applicants_email ON applicants(email);
    CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at);
    CREATE INDEX IF NOT EXISTS idx_applicants_name ON applicants(first_name, last_name);
    CREATE INDEX IF NOT EXISTS idx_form_submissions_applicant ON form_submissions(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_form_submissions_retention ON form_submissions(retention_until);
    CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_form_submissions_step ON form_submissions(step_number);
    CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions(form_type);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
    CREATE INDEX IF NOT EXISTS idx_privacy_consents_applicant ON privacy_consents(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_form_drafts_applicant ON form_drafts(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_form_drafts_step ON form_drafts(applicant_id, step_number);
    CREATE INDEX IF NOT EXISTS idx_applicants_admin ON applicants(is_admin);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_applicant ON login_attempts(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX IF NOT EXISTS idx_i9_documents_applicant ON i9_documents(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_i9_documents_type ON i9_documents(document_type, document_category);
    CREATE INDEX IF NOT EXISTS idx_i9_documents_uploaded_at ON i9_documents(uploaded_at);
    CREATE INDEX IF NOT EXISTS idx_i9_documents_category ON i9_documents(document_category);
  `)

  console.log('Database initialized successfully')
  
  // Set default password for existing admin users (for testing)
  // This will be called asynchronously after bcrypt is available
  setDefaultPasswordsForAdmins().catch(err => {
    console.warn('Could not set default passwords for admins:', err.message)
  })
}

/**
 * Set default password 'opcs' for existing admin users who don't have a password set
 * This is for testing purposes
 */
async function setDefaultPasswordsForAdmins() {
  try {
    const { hashPassword } = await import('../middleware/auth.js')
    const db = getDatabase()
    
    // Get all admin users without passwords
    const adminsWithoutPassword = db.prepare(`
      SELECT id FROM applicants 
      WHERE is_admin = 1 
        AND (password_hash IS NULL OR password_hash = '')
    `).all()
    
    if (adminsWithoutPassword.length > 0) {
      const defaultPassword = 'opcs'
      const defaultHash = await hashPassword(defaultPassword)
      
      for (const admin of adminsWithoutPassword) {
        db.prepare('UPDATE applicants SET password_hash = ? WHERE id = ?')
          .run(defaultHash, admin.id)
      }
      
      console.log(`Set default password for ${adminsWithoutPassword.length} admin user(s)`)
    }
  } catch (error) {
    // If bcrypt is not available yet, this will be called later
    // Don't fail initialization if this fails
    console.warn('Could not set default passwords for admins:', error.message)
  }
}

export function getDatabase() {
  return db
}

export default db

