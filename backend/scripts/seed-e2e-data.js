/**
 * Seed E2E test data: admin user, regular user, 9061 signature placement, employer settings.
 * Run from backend: node scripts/seed-e2e-data.js
 */
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import { initializeDatabase, getDatabase } from '../src/database/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

initializeDatabase()
const db = getDatabase()

// Seed 9061 signature placement (required for admin setup-status to pass)
const placement = JSON.stringify({
  mode: 'free_place',
  pageIndex: 0,
  x: 72,
  y: 120,
  width: 180,
  height: 40
})

db.prepare(
  `INSERT INTO settings (key, value, is_encrypted, updated_at)
   VALUES (?, ?, 0, CURRENT_TIMESTAMP)
   ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
).run('signature_placement_9061', placement, placement)

// Seed E2E admin user with password
const adminPasswordHash = bcrypt.hashSync('AdminPass123', 10)

db.prepare(`
  INSERT INTO applicants (first_name, last_name, email, password_hash, is_admin, role)
  VALUES (?, ?, ?, ?, 1, 'admin')
  ON CONFLICT(email) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    password_hash = excluded.password_hash,
    is_admin = 1,
    role = 'admin'
`).run('E2E', 'Admin', 'e2e-admin@example.com', adminPasswordHash)

// Seed E2E regular user (no password — signs in with name+email only on first run)
// Reset password_hash and signature_data so the full onboarding modal flow runs each time
db.prepare(`
  INSERT INTO applicants (first_name, last_name, email, is_admin, role)
  VALUES (?, ?, ?, 0, 'applicant')
  ON CONFLICT(email) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    password_hash = NULL,
    signature_data = NULL,
    is_admin = 0,
    role = 'applicant'
`).run('E2E', 'User', 'e2e-user@example.com')

const e2eUser = db.prepare(`
  SELECT id FROM applicants WHERE email = 'e2e-user@example.com'
`).get()

if (e2eUser?.id) {
  db.prepare('DELETE FROM document_approvals WHERE applicant_id = ?').run(e2eUser.id)
  db.prepare('DELETE FROM i9_documents WHERE applicant_id = ?').run(e2eUser.id)
  db.prepare('DELETE FROM form_submissions WHERE applicant_id = ?').run(e2eUser.id)
  db.prepare('DELETE FROM form_drafts WHERE applicant_id = ?').run(e2eUser.id)
  db.prepare('DELETE FROM notifications WHERE recipient_id = ? OR source_user_id = ?').run(e2eUser.id, e2eUser.id)
}

// Remove SSN consent for E2E user so the consent modal shows fresh each run
db.prepare(`
  DELETE FROM privacy_consents
  WHERE consent_type = 'SSN_COLLECTION'
    AND applicant_id = (SELECT id FROM applicants WHERE email = 'e2e-user@example.com')
`).run()

// Seed employer settings required by isEmailAndFormsConfigured()
const employerSettings = [
  ['8850_employer_name', 'Optimal Prime Cleaning Services'],
  ['i9_employer_authorized_rep_name', 'E2E Test Representative'],
  ['i9_employer_authorized_rep_title', 'Owner'],
  ['8850_contact_name', 'Jason King'],
  ['8850_employer_ein', '12-3456789'],
  ['8850_employer_address', '123 Test Street'],
  ['8850_employer_city', 'Test City'],
  ['8850_employer_state', 'TX'],
  ['8850_employer_zip', '75001'],
  ['8850_employer_phone', '555-123-4567'],
  ['employee_handbook_url', 'https://example.com/handbook.pdf'],
  ['employee_handbook_label', 'Open Employee Handbook'],
  ['9061_default_starting_wage', '18.00/hour'],
  ['badge_photo_email', 'hr@optimalprimeservices.com']
]

for (const [key, value] of employerSettings) {
  db.prepare(
    `INSERT INTO settings (key, value, is_encrypted, updated_at)
     VALUES (?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
  ).run(key, value, value)
}

db.close()
console.log('Seeded E2E admin user, regular user, 9061 signature placement, and employer settings')
