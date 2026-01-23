import { getDatabase } from '../database/init.js'
import { deleteFromGoogleDrive } from './googleDriveService.js'
import { auditLog } from './auditService.js'

/**
 * Process expired documents for deletion
 * Should be run as a scheduled job (e.g., daily)
 */
export async function processExpiredDocuments() {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  
  // Find documents that have passed their retention date
  const expiredDocs = db.prepare(`
    SELECT id, applicant_id, form_type, pdf_filename, google_drive_id
    FROM form_submissions
    WHERE retention_until < ?
    AND google_drive_id IS NOT NULL
    AND google_drive_id != ''
  `).all(today)
  
  console.log(`Found ${expiredDocs.length} expired documents to process`)
  
  for (const doc of expiredDocs) {
    try {
      // Delete from Google Drive
      if (doc.google_drive_id) {
        await deleteFromGoogleDrive(doc.google_drive_id)
      }
      
      // Update database record
      db.prepare(`
        UPDATE form_submissions
        SET google_drive_id = NULL
        WHERE id = ?
      `).run(doc.id)
      
      // Audit log
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
  
  return expiredDocs.length
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

