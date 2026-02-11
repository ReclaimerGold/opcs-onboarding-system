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
  // role: admin | manager | employee | applicant (centrally managed)
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
      role TEXT DEFAULT 'applicant' CHECK(role IN ('admin', 'manager', 'employee', 'applicant')),
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

  // Add role column for centralized user management (Admin, Manager, Employee, Applicant)
  const validRoles = ['admin', 'manager', 'employee', 'applicant']
  try {
    db.exec(`ALTER TABLE applicants ADD COLUMN role TEXT DEFAULT 'applicant'`)
  } catch (error) {
    // Column already exists
  }
  // Backfill: existing admins get role 'admin', everyone else with invalid/missing role gets 'applicant'
  db.exec(`UPDATE applicants SET role = 'admin' WHERE is_admin = 1`)
  db.exec(`UPDATE applicants SET role = 'applicant' WHERE role IS NULL OR role = '' OR role NOT IN (${validRoles.map(r => `'${r}'`).join(',')})`)

  // Soft-delete: is_active = 0 means deactivated (preserves audit/retention compliance)
  try {
    db.exec(`ALTER TABLE applicants ADD COLUMN is_active INTEGER DEFAULT 1`)
  } catch (error) {
    // Column already exists
  }
  db.exec(`UPDATE applicants SET is_active = 1 WHERE is_active IS NULL`)

  // User onboarding: signature stored once per applicant (required before dashboard/forms access)
  try {
    db.exec(`ALTER TABLE applicants ADD COLUMN signature_data TEXT`)
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

  // Pending approval: PDF stored locally until manager signoff, then uploaded to Drive and blob erased
  try {
    db.exec(`ALTER TABLE form_submissions ADD COLUMN pending_pdf_path TEXT`)
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

  // Password reset tokens for forgot password functionality
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
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

  // Add retention_until to i9_documents (IRCA: same retention as I-9 form)
  try {
    db.exec(`ALTER TABLE i9_documents ADD COLUMN retention_until DATE`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Add document metadata columns for I-9 re-upload (number, issuing authority, expiration)
  try {
    db.exec(`ALTER TABLE i9_documents ADD COLUMN document_number TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE i9_documents ADD COLUMN issuing_authority TEXT`)
  } catch (error) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE i9_documents ADD COLUMN expiration_date DATE`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Migrate i9_documents to allow multiple versions per category (remove UNIQUE constraint)
  // SQLite cannot DROP UNIQUE; recreate table without UNIQUE and copy data (run only once)
  const i9Schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='i9_documents'").get()
  if (i9Schema && i9Schema.sql && i9Schema.sql.includes('UNIQUE(applicant_id, document_type, document_category)')) {
    try {
      db.exec(`
        CREATE TABLE i9_documents_new (
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
          web_view_link TEXT,
          retention_until DATE,
          document_number TEXT,
          issuing_authority TEXT,
          expiration_date DATE,
          FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
        )
      `)
      db.exec(`
        INSERT INTO i9_documents_new (id, applicant_id, document_type, document_category, document_name, file_path, file_name, file_size, mime_type, google_drive_id, uploaded_at, web_view_link, retention_until, document_number, issuing_authority, expiration_date)
        SELECT id, applicant_id, document_type, document_category, document_name, file_path, file_name, file_size, mime_type, COALESCE(google_drive_id, ''), uploaded_at, web_view_link, retention_until,
          COALESCE(document_number, ''), COALESCE(issuing_authority, ''), expiration_date
        FROM i9_documents
      `)
      db.exec(`DROP TABLE i9_documents`)
      db.exec(`ALTER TABLE i9_documents_new RENAME TO i9_documents`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_i9_documents_applicant ON i9_documents(applicant_id)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_i9_documents_type ON i9_documents(document_type, document_category)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_i9_documents_uploaded_at ON i9_documents(uploaded_at)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_i9_documents_category ON i9_documents(document_category)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_i9_documents_retention ON i9_documents(retention_until)`)
    } catch (error) {
      console.warn('i9_documents versioning migration:', error.message)
    }
  }

  // Document approvals for manager/admin signature workflow
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      manager_id INTEGER,
      step_number INTEGER NOT NULL,
      form_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
      FOREIGN KEY (manager_id) REFERENCES applicants(id) ON DELETE SET NULL
    )
  `)

  // Add assigned_manager_id to applicants for manager assignment workflow
  try {
    db.exec(`ALTER TABLE applicants ADD COLUMN assigned_manager_id INTEGER REFERENCES applicants(id) ON DELETE SET NULL`)
  } catch (error) {
    // Column already exists, ignore
  }

  // Notifications for centralized notification system
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      source_user_id INTEGER,
      is_read INTEGER DEFAULT 0,
      email_sent INTEGER DEFAULT 0,
      email_sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES applicants(id) ON DELETE CASCADE,
      FOREIGN KEY (source_user_id) REFERENCES applicants(id) ON DELETE SET NULL
    )
  `)

  // Notification preferences per user per notification type
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      in_app_enabled INTEGER DEFAULT 1,
      email_enabled INTEGER DEFAULT 1,
      email_frequency TEXT DEFAULT 'realtime' CHECK(email_frequency IN ('realtime', 'daily_digest', 'disabled')),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
      UNIQUE(applicant_id, type)
    )
  `)

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
    CREATE INDEX IF NOT EXISTS idx_i9_documents_retention ON i9_documents(retention_until);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_applicant ON password_reset_tokens(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_document_approvals_submission ON document_approvals(submission_id);
    CREATE INDEX IF NOT EXISTS idx_document_approvals_applicant ON document_approvals(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_document_approvals_manager ON document_approvals(manager_id);
    CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON document_approvals(status);
    CREATE INDEX IF NOT EXISTS idx_document_approvals_created ON document_approvals(created_at);
    CREATE INDEX IF NOT EXISTS idx_applicants_assigned_manager ON applicants(assigned_manager_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(email_sent);
    CREATE INDEX IF NOT EXISTS idx_notification_preferences_applicant ON notification_preferences(applicant_id);
    CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(applicant_id, type);
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

