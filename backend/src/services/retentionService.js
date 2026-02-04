import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { getDatabase } from '../database/init.js'
import { deleteFromGoogleDrive } from './googleDriveService.js'
import { auditLog } from './auditService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LOCAL_STORAGE_DIR = path.join(__dirname, '../../storage/encrypted-pdfs')
const LOCAL_I9_STORAGE_DIR = path.join(__dirname, '../../storage/encrypted-i9-docs')

/**
 * Process expired documents for deletion
 * Should be run as a scheduled job (e.g., daily)
 * Deletes from Google Drive and/or local encrypted storage and clears DB references.
 */
export async function processExpiredDocuments() {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]

  // Find documents that have passed their retention date (in GDrive or local)
  const expiredDocs = db.prepare(`
    SELECT id, applicant_id, form_type, pdf_filename, google_drive_id, pdf_encrypted_path
    FROM form_submissions
    WHERE retention_until < ?
    AND (
      (google_drive_id IS NOT NULL AND google_drive_id != '')
      OR (pdf_encrypted_path IS NOT NULL AND pdf_encrypted_path != '')
    )
  `).all(today)

  console.log(`Found ${expiredDocs.length} expired documents to process`)

  for (const doc of expiredDocs) {
    try {
      // Delete from Google Drive if present
      if (doc.google_drive_id) {
        await deleteFromGoogleDrive(doc.google_drive_id)
      }

      // Delete local encrypted file if present
      if (doc.pdf_encrypted_path) {
        const localPath = path.join(LOCAL_STORAGE_DIR, doc.pdf_encrypted_path)
        try {
          await fs.unlink(localPath)
        } catch (unlinkErr) {
          console.warn(`Could not delete local file ${localPath}:`, unlinkErr.message)
        }
      }

      // Update database record: clear both storage references
      db.prepare(`
        UPDATE form_submissions
        SET google_drive_id = '', pdf_encrypted_path = NULL
        WHERE id = ?
      `).run(doc.id)

      await auditLog({
        userId: doc.applicant_id,
        action: 'DELETE_RETENTION',
        resourceType: 'DOCUMENT',
        resourceId: doc.id,
        details: {
          formType: doc.form_type,
          filename: doc.pdf_filename,
          reason: 'Retention period expired'
        }
      })

      console.log(`Deleted expired document: ${doc.pdf_filename}`)
    } catch (error) {
      console.error(`Error processing expired document ${doc.id}:`, error)
    }
  }

  // Process expired I-9 identity documents (same retention as I-9 form per IRCA)
  const expiredI9Docs = db.prepare(`
    SELECT id, applicant_id, file_name, google_drive_id, file_path
    FROM i9_documents
    WHERE retention_until IS NOT NULL AND retention_until < ?
    AND (google_drive_id != '' OR file_path IS NOT NULL)
  `).all(today)

  for (const doc of expiredI9Docs) {
    try {
      if (doc.google_drive_id) {
        await deleteFromGoogleDrive(doc.google_drive_id)
      }
      if (doc.file_path) {
        const localPath = path.join(LOCAL_I9_STORAGE_DIR, doc.file_path)
        try {
          await fs.unlink(localPath)
        } catch (unlinkErr) {
          console.warn(`Could not delete I-9 local file ${localPath}:`, unlinkErr.message)
        }
      }
      db.prepare(`
        UPDATE i9_documents SET google_drive_id = '', file_path = NULL WHERE id = ?
      `).run(doc.id)
      await auditLog({
        userId: doc.applicant_id,
        action: 'DELETE_RETENTION',
        resourceType: 'I9_DOCUMENT',
        resourceId: doc.id,
        details: { file_name: doc.file_name, reason: 'Retention period expired' }
      })
      console.log(`Deleted expired I-9 document: ${doc.file_name}`)
    } catch (error) {
      console.error(`Error processing expired I-9 document ${doc.id}:`, error)
    }
  }

  return expiredDocs.length + expiredI9Docs.length
}

/**
 * Get documents expiring soon (within 30 days)
 */
export function getDocumentsExpiringSoon(days = 30) {
  const db = getDatabase()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  const dateStr = futureDate.toISOString().split('T')[0]
  
  return db.prepare(`
    SELECT fs.*, a.first_name, a.last_name, a.email
    FROM form_submissions fs
    JOIN applicants a ON fs.applicant_id = a.id
    WHERE fs.retention_until BETWEEN date('now') AND ?
    AND fs.google_drive_id IS NOT NULL
    AND fs.google_drive_id != ''
    ORDER BY fs.retention_until
  `).all(dateStr)
}

/**
 * Start retention service scheduler
 * Runs daily at midnight
 */
export function startRetentionScheduler() {
  // Run immediately on start
  processExpiredDocuments().catch(console.error)
  
  // Then run daily
  const msPerDay = 24 * 60 * 60 * 1000
  setInterval(() => {
    processExpiredDocuments().catch(console.error)
  }, msPerDay)
  
  console.log('Retention service scheduler started')
}

