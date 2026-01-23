import { getDatabase } from '../database/init.js'

/**
 * Log an audit event
 * Required for I-9 electronic storage compliance
 */
export async function auditLog({
  userId,
  action,
  resourceType,
  resourceId,
  ipAddress,
  userAgent,
  details = {}
}) {
  const db = getDatabase()
  
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      action,
      resourceType,
      resourceId || null,
      ipAddress || null,
      userAgent || null,
      JSON.stringify(details)
    )
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Get audit logs for a resource
 */
export function getAuditLogs(resourceType, resourceId, limit = 100) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT * FROM audit_log
    WHERE resource_type = ? AND resource_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(resourceType, resourceId, limit)
}

/**
 * Get audit logs for a user
 */
export function getUserAuditLogs(userId, limit = 100) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT * FROM audit_log
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit)
}

