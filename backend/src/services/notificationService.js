import { getDatabase } from '../database/init.js'
import { sendNotificationEmail, sendDigestEmail, isMailgunConfigured } from './mailgunService.js'

/**
 * Notification Type Registry
 * Centralizes all notification type metadata, defaults, and targeting rules.
 */
export const NOTIFICATION_TYPES = {
  // --- Admin/Manager notifications (default: ON for both in-app and email) ---
  no_bank_account: {
    key: 'no_bank_account',
    label: 'No Bank Account',
    description: 'Applicant selected "I DO NOT HAVE A BANK ACCOUNT" on Direct Deposit form',
    category: 'admin',
    priority: 'high',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin', 'manager']
  },
  non_gmail_email: {
    key: 'non_gmail_email',
    label: 'Non-Gmail Email',
    description: 'Applicant signed up with a non-Gmail email address',
    category: 'admin',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin']
  },
  new_applicant_signup: {
    key: 'new_applicant_signup',
    label: 'New Applicant Signup',
    description: 'A new applicant has created an account',
    category: 'admin',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin', 'manager']
  },
  onboarding_complete: {
    key: 'onboarding_complete',
    label: 'Onboarding Completed',
    description: 'An applicant has completed all 7 onboarding form steps',
    category: 'admin',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin', 'manager']
  },
  document_approval_needed: {
    key: 'document_approval_needed',
    label: 'Document Needs Approval',
    description: 'A form submission requires manager/admin signature approval',
    category: 'admin',
    priority: 'high',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin', 'manager']
  },
  stale_onboarding: {
    key: 'stale_onboarding',
    label: 'Stale Onboarding',
    description: 'An applicant has been inactive for 7+ days during onboarding',
    category: 'admin',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'daily_digest',
    targetRoles: ['admin', 'manager']
  },
  failed_login_security: {
    key: 'failed_login_security',
    label: 'Failed Login Alert',
    description: '5+ failed login attempts from the same IP in 1 hour',
    category: 'admin',
    priority: 'high',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin']
  },
  document_retention_expiring: {
    key: 'document_retention_expiring',
    label: 'Document Retention Expiring',
    description: 'A document retention period expires within 30 days',
    category: 'admin',
    priority: 'low',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'daily_digest',
    targetRoles: ['admin']
  },
  i9_document_uploaded: {
    key: 'i9_document_uploaded',
    label: 'I-9 Document Uploaded',
    description: 'An applicant uploaded an I-9 identity document',
    category: 'admin',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['admin', 'manager']
  },

  // --- Applicant notifications (default: in-app ON, email varies) ---
  welcome_message: {
    key: 'welcome_message',
    label: 'Welcome Message',
    description: 'Welcome notification after signing up',
    category: 'applicant',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['applicant', 'employee', 'manager', 'admin']
  },
  form_approved: {
    key: 'form_approved',
    label: 'Form Approved',
    description: 'A submitted form has been approved by a manager',
    category: 'applicant',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['applicant', 'employee', 'manager', 'admin']
  },
  form_rejected: {
    key: 'form_rejected',
    label: 'Form Rejected',
    description: 'A submitted form has been rejected by a manager',
    category: 'applicant',
    priority: 'high',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['applicant', 'employee', 'manager', 'admin']
  },
  onboarding_reminder: {
    key: 'onboarding_reminder',
    label: 'Onboarding Reminder',
    description: 'Reminder to complete onboarding after 3+ days of inactivity',
    category: 'applicant',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['applicant', 'employee', 'manager', 'admin']
  },
  onboarding_complete_confirmation: {
    key: 'onboarding_complete_confirmation',
    label: 'Onboarding Complete',
    description: 'Confirmation that all onboarding steps have been completed',
    category: 'applicant',
    priority: 'medium',
    defaultInApp: true,
    defaultEmail: true,
    defaultEmailFrequency: 'realtime',
    targetRoles: ['applicant', 'employee', 'manager', 'admin']
  }
}

/**
 * Get default preferences for a notification type
 * @param {string} type - Notification type key
 * @returns {{ in_app_enabled: number, email_enabled: number, email_frequency: string }}
 */
function getTypeDefaults(type) {
  const typeDef = NOTIFICATION_TYPES[type]
  if (!typeDef) {
    return { in_app_enabled: 1, email_enabled: 0, email_frequency: 'realtime' }
  }
  return {
    in_app_enabled: typeDef.defaultInApp ? 1 : 0,
    email_enabled: typeDef.defaultEmail ? 1 : 0,
    email_frequency: typeDef.defaultEmailFrequency || 'realtime'
  }
}

/**
 * Get user's preference for a specific notification type.
 * Falls back to type defaults if no preference is stored.
 * @param {number} userId
 * @param {string} type
 * @returns {{ in_app_enabled: number, email_enabled: number, email_frequency: string }}
 */
function getUserPreferenceForType(userId, type) {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT in_app_enabled, email_enabled, email_frequency
    FROM notification_preferences
    WHERE applicant_id = ? AND type = ?
  `).get(userId, type)

  if (row) return row
  return getTypeDefaults(type)
}

/**
 * Create a notification for a single recipient.
 * Checks preferences, creates DB record, and optionally sends email.
 * @param {Object} params
 * @param {number} params.recipientId - Who receives the notification
 * @param {string} params.type - Notification type key
 * @param {string} params.title - Short display title
 * @param {string} params.message - Notification body
 * @param {string} [params.link] - Optional in-app route
 * @param {number} [params.sourceUserId] - Who triggered the notification
 * @returns {number|null} - The created notification ID, or null if suppressed by preferences
 */
export function createNotification({ recipientId, type, title, message, link, sourceUserId }) {
  const db = getDatabase()
  const prefs = getUserPreferenceForType(recipientId, type)

  // If both channels are disabled, skip entirely
  if (!prefs.in_app_enabled && !prefs.email_enabled) {
    return null
  }

  // Insert notification record (always, for audit trail — mark read if in-app disabled)
  const result = db.prepare(`
    INSERT INTO notifications (recipient_id, type, title, message, link, source_user_id, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    recipientId,
    type,
    title,
    message,
    link || null,
    sourceUserId || null,
    prefs.in_app_enabled ? 0 : 1
  )

  const notificationId = result.lastInsertRowid

  // Send email if enabled and frequency is realtime
  if (prefs.email_enabled && prefs.email_frequency === 'realtime' && isMailgunConfigured()) {
    // Send email asynchronously (don't block notification creation)
    const recipient = db.prepare('SELECT first_name, email FROM applicants WHERE id = ?').get(recipientId)
    if (recipient) {
      sendNotificationEmail(recipient.email, recipient.first_name, { type, title, message, link })
        .then(() => {
          db.prepare('UPDATE notifications SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(notificationId)
        })
        .catch(err => {
          console.error(`Failed to send notification email to ${recipient.email}:`, err.message)
        })
    }
  }

  return Number(notificationId)
}

/**
 * Resolve recipients for admin/manager notifications.
 * Returns IDs of: all active admins + the applicant's assigned manager (if set).
 * @param {number} [applicantId] - The applicant whose manager should be notified
 * @returns {number[]}
 */
function resolveAdminAndManagerRecipients(applicantId) {
  const db = getDatabase()
  const recipientIds = new Set()

  // All active admins
  const admins = db.prepare(`
    SELECT id FROM applicants
    WHERE (is_admin = 1 OR role = 'admin') AND is_active = 1
  `).all()
  admins.forEach(a => recipientIds.add(a.id))

  // Assigned manager for the applicant
  if (applicantId) {
    const applicant = db.prepare('SELECT assigned_manager_id FROM applicants WHERE id = ?').get(applicantId)
    if (applicant?.assigned_manager_id) {
      recipientIds.add(applicant.assigned_manager_id)
    }
  }

  return Array.from(recipientIds)
}

/**
 * Send a notification to all admins and the applicant's assigned manager.
 * @param {Object} params
 * @param {string} params.type - Notification type key
 * @param {string} params.title - Short display title
 * @param {string} params.message - Notification body
 * @param {string} [params.link] - Optional in-app route
 * @param {number} [params.sourceUserId] - Who triggered the notification
 * @param {number} [params.applicantId] - The applicant this notification is about (resolves their manager)
 */
export function notifyAdminsAndManagers({ type, title, message, link, sourceUserId, applicantId }) {
  const recipients = resolveAdminAndManagerRecipients(applicantId)

  // Don't notify the source user about their own action
  const filtered = sourceUserId
    ? recipients.filter(id => id !== sourceUserId)
    : recipients

  for (const recipientId of filtered) {
    try {
      createNotification({ recipientId, type, title, message, link, sourceUserId })
    } catch (err) {
      console.error(`Failed to create notification for recipient ${recipientId}:`, err.message)
    }
  }
}

/**
 * Get notifications for a user, paginated.
 * @param {number} userId
 * @param {Object} [options]
 * @param {boolean} [options.unreadOnly=false]
 * @param {number} [options.limit=20]
 * @param {number} [options.offset=0]
 * @returns {{ notifications: Array, total: number }}
 */
export function getNotificationsForUser(userId, { unreadOnly = false, limit = 20, offset = 0 } = {}) {
  const db = getDatabase()

  let whereClause = 'WHERE n.recipient_id = ?'
  const params = [userId]

  if (unreadOnly) {
    whereClause += ' AND n.is_read = 0'
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM notifications n ${whereClause}
  `).get(...params).count

  const notifications = db.prepare(`
    SELECT
      n.id,
      n.type,
      n.title,
      n.message,
      n.link,
      n.source_user_id,
      n.is_read,
      n.created_at,
      s.first_name as source_first_name,
      s.last_name as source_last_name
    FROM notifications n
    LEFT JOIN applicants s ON n.source_user_id = s.id
    ${whereClause}
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  return { notifications, total }
}

/**
 * Get unread notification count for a user.
 * @param {number} userId
 * @returns {number}
 */
export function getUnreadCount(userId) {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0').get(userId)
  return row?.count || 0
}

/**
 * Mark a single notification as read.
 * @param {number} notificationId
 * @param {number} userId - Must be the recipient
 * @returns {boolean}
 */
export function markAsRead(notificationId, userId) {
  const db = getDatabase()
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?').run(notificationId, userId)
  return result.changes > 0
}

/**
 * Mark all notifications as read for a user.
 * @param {number} userId
 * @returns {number} Number of notifications marked
 */
export function markAllAsRead(userId) {
  const db = getDatabase()
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0').run(userId)
  return result.changes
}

/**
 * Delete a notification.
 * @param {number} notificationId
 * @param {number} userId - Must be the recipient
 * @returns {boolean}
 */
export function deleteNotification(notificationId, userId) {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM notifications WHERE id = ? AND recipient_id = ?').run(notificationId, userId)
  return result.changes > 0
}

/**
 * Get all notification preferences for a user, merged with type defaults.
 * @param {number} userId
 * @param {string} [userRole] - Filter types relevant to this role
 * @returns {Array<Object>}
 */
export function getUserPreferences(userId, userRole) {
  const db = getDatabase()

  // Get stored preferences
  const stored = db.prepare('SELECT type, in_app_enabled, email_enabled, email_frequency FROM notification_preferences WHERE applicant_id = ?').all(userId)
  const storedMap = {}
  stored.forEach(p => { storedMap[p.type] = p })

  const result = []
  for (const [typeKey, typeDef] of Object.entries(NOTIFICATION_TYPES)) {
    // Filter by role category: admins/managers see admin types, everyone sees applicant types
    if (userRole) {
      if (typeDef.category === 'admin' && !['admin', 'manager'].includes(userRole)) {
        continue
      }
    }

    const pref = storedMap[typeKey]
    const defaults = getTypeDefaults(typeKey)

    result.push({
      type: typeKey,
      label: typeDef.label,
      description: typeDef.description,
      category: typeDef.category,
      priority: typeDef.priority,
      in_app_enabled: pref ? pref.in_app_enabled : defaults.in_app_enabled,
      email_enabled: pref ? pref.email_enabled : defaults.email_enabled,
      email_frequency: pref ? pref.email_frequency : defaults.email_frequency
    })
  }

  return result
}

/**
 * Update a user's preference for a specific notification type.
 * @param {number} userId
 * @param {string} type
 * @param {Object} settings - { in_app_enabled?, email_enabled?, email_frequency? }
 */
export function updateUserPreference(userId, type, settings) {
  const db = getDatabase()

  // Validate type exists
  if (!NOTIFICATION_TYPES[type]) {
    throw new Error(`Unknown notification type: ${type}`)
  }

  const existing = db.prepare('SELECT id FROM notification_preferences WHERE applicant_id = ? AND type = ?').get(userId, type)

  if (existing) {
    const sets = []
    const params = []

    if (settings.in_app_enabled !== undefined) {
      sets.push('in_app_enabled = ?')
      params.push(settings.in_app_enabled ? 1 : 0)
    }
    if (settings.email_enabled !== undefined) {
      sets.push('email_enabled = ?')
      params.push(settings.email_enabled ? 1 : 0)
    }
    if (settings.email_frequency !== undefined) {
      sets.push('email_frequency = ?')
      params.push(settings.email_frequency)
    }

    if (sets.length > 0) {
      sets.push('updated_at = CURRENT_TIMESTAMP')
      params.push(userId, type)
      db.prepare(`UPDATE notification_preferences SET ${sets.join(', ')} WHERE applicant_id = ? AND type = ?`).run(...params)
    }
  } else {
    const defaults = getTypeDefaults(type)
    db.prepare(`
      INSERT INTO notification_preferences (applicant_id, type, in_app_enabled, email_enabled, email_frequency, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      userId,
      type,
      settings.in_app_enabled !== undefined ? (settings.in_app_enabled ? 1 : 0) : defaults.in_app_enabled,
      settings.email_enabled !== undefined ? (settings.email_enabled ? 1 : 0) : defaults.email_enabled,
      settings.email_frequency !== undefined ? settings.email_frequency : defaults.email_frequency
    )
  }
}

/**
 * Reset a user's preferences to defaults (delete all stored prefs).
 * @param {number} userId
 */
export function resetUserPreferences(userId) {
  const db = getDatabase()
  db.prepare('DELETE FROM notification_preferences WHERE applicant_id = ?').run(userId)
}

/**
 * Send digest emails for all users who have digest-frequency notifications pending.
 * Called by the daily scheduler.
 */
export async function sendDigestEmails() {
  if (!isMailgunConfigured()) {
    console.log('Mailgun not configured, skipping digest emails')
    return
  }

  const db = getDatabase()

  // Find users who have unread, un-emailed notifications with digest frequency
  const recipients = db.prepare(`
    SELECT DISTINCT n.recipient_id, a.first_name, a.email
    FROM notifications n
    JOIN applicants a ON n.recipient_id = a.id
    JOIN notification_preferences np ON np.applicant_id = n.recipient_id AND np.type = n.type
    WHERE n.email_sent = 0
      AND n.is_read = 0
      AND np.email_enabled = 1
      AND np.email_frequency = 'daily_digest'
      AND a.is_active = 1
  `).all()

  // Also include users with default digest preferences (no stored pref row)
  const digestTypeKeys = Object.entries(NOTIFICATION_TYPES)
    .filter(([, def]) => def.defaultEmailFrequency === 'daily_digest')
    .map(([key]) => key)

  if (digestTypeKeys.length > 0) {
    const placeholders = digestTypeKeys.map(() => '?').join(',')
    const additionalRecipients = db.prepare(`
      SELECT DISTINCT n.recipient_id, a.first_name, a.email
      FROM notifications n
      JOIN applicants a ON n.recipient_id = a.id
      WHERE n.email_sent = 0
        AND n.is_read = 0
        AND n.type IN (${placeholders})
        AND a.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM notification_preferences np
          WHERE np.applicant_id = n.recipient_id AND np.type = n.type
        )
    `).all(...digestTypeKeys)

    // Merge unique
    const existingIds = new Set(recipients.map(r => r.recipient_id))
    additionalRecipients.forEach(r => {
      if (!existingIds.has(r.recipient_id)) {
        recipients.push(r)
      }
    })
  }

  for (const recipient of recipients) {
    try {
      // Get all pending digest notifications for this user
      const notifications = db.prepare(`
        SELECT n.id, n.type, n.title, n.message, n.link, n.created_at
        FROM notifications n
        LEFT JOIN notification_preferences np ON np.applicant_id = n.recipient_id AND np.type = n.type
        WHERE n.recipient_id = ?
          AND n.email_sent = 0
          AND n.is_read = 0
          AND (
            (np.email_enabled = 1 AND np.email_frequency = 'daily_digest')
            OR (np.id IS NULL AND n.type IN (${digestTypeKeys.map(() => '?').join(',')}))
          )
        ORDER BY n.created_at DESC
      `).all(recipient.recipient_id, ...digestTypeKeys)

      if (notifications.length === 0) continue

      await sendDigestEmail(recipient.email, recipient.first_name, notifications)

      // Mark all as email_sent
      const ids = notifications.map(n => n.id)
      const placeholders = ids.map(() => '?').join(',')
      db.prepare(`UPDATE notifications SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(...ids)

      console.log(`Sent digest email to ${recipient.email} with ${notifications.length} notifications`)
    } catch (err) {
      console.error(`Failed to send digest email to ${recipient.email}:`, err.message)
    }
  }
}

/**
 * Scheduled check: Notify admins/managers about stale onboarding (inactive 7+ days).
 * Should be called once daily.
 */
export function checkStaleOnboarding() {
  const db = getDatabase()

  // Find applicants with incomplete onboarding who haven't had activity in 7+ days
  const staleApplicants = db.prepare(`
    SELECT a.id, a.first_name, a.last_name, a.email,
      MAX(COALESCE(fs.submitted_at, a.created_at)) as last_activity
    FROM applicants a
    LEFT JOIN form_submissions fs ON fs.applicant_id = a.id
    WHERE a.is_active = 1
      AND (a.role = 'applicant' OR a.role = 'employee')
      AND (SELECT COUNT(DISTINCT step_number) FROM form_submissions WHERE applicant_id = a.id) < 7
    GROUP BY a.id
    HAVING julianday('now') - julianday(last_activity) >= 7
  `).all()

  for (const applicant of staleApplicants) {
    // Don't send duplicate stale notifications within 7 days
    const recentNotif = db.prepare(`
      SELECT id FROM notifications
      WHERE recipient_id IN (SELECT id FROM applicants WHERE is_admin = 1 OR role = 'admin')
        AND type = 'stale_onboarding'
        AND message LIKE ?
        AND created_at > datetime('now', '-7 days')
      LIMIT 1
    `).get(`%${applicant.first_name} ${applicant.last_name}%`)

    if (recentNotif) continue

    notifyAdminsAndManagers({
      type: 'stale_onboarding',
      title: 'Stale Onboarding',
      message: `${applicant.first_name} ${applicant.last_name} (${applicant.email}) has been inactive for 7+ days with incomplete onboarding.`,
      link: '/admin',
      applicantId: applicant.id
    })
  }
}

/**
 * Scheduled check: Send onboarding reminders to applicants inactive for 3+ days.
 * Should be called once daily.
 */
export function checkOnboardingReminders() {
  const db = getDatabase()

  const inactiveApplicants = db.prepare(`
    SELECT a.id, a.first_name, a.last_name, a.email,
      MAX(COALESCE(fs.submitted_at, a.created_at)) as last_activity
    FROM applicants a
    LEFT JOIN form_submissions fs ON fs.applicant_id = a.id
    WHERE a.is_active = 1
      AND (a.role = 'applicant' OR a.role = 'employee')
      AND (SELECT COUNT(DISTINCT step_number) FROM form_submissions WHERE applicant_id = a.id) < 7
    GROUP BY a.id
    HAVING julianday('now') - julianday(last_activity) >= 3
  `).all()

  for (const applicant of inactiveApplicants) {
    // Don't send duplicate reminders within 3 days
    const recentNotif = db.prepare(`
      SELECT id FROM notifications
      WHERE recipient_id = ?
        AND type = 'onboarding_reminder'
        AND created_at > datetime('now', '-3 days')
      LIMIT 1
    `).get(applicant.id)

    if (recentNotif) continue

    createNotification({
      recipientId: applicant.id,
      type: 'onboarding_reminder',
      title: 'Complete Your Onboarding',
      message: 'You have incomplete onboarding forms. Please log in and finish your onboarding process.',
      link: '/forms'
    })
  }
}

/**
 * Scheduled check: Notify admins about document retention approaching expiration (within 30 days).
 * Should be called once daily.
 */
export function checkDocumentRetention() {
  const db = getDatabase()

  const expiringDocuments = db.prepare(`
    SELECT fs.id, fs.form_type, fs.retention_until, fs.pdf_filename,
      a.first_name, a.last_name, a.email
    FROM form_submissions fs
    JOIN applicants a ON fs.applicant_id = a.id
    WHERE fs.retention_until IS NOT NULL
      AND fs.retention_until <= date('now', '+30 days')
      AND fs.retention_until > date('now')
  `).all()

  for (const doc of expiringDocuments) {
    // Don't send duplicate retention notifications within 30 days
    const recentNotif = db.prepare(`
      SELECT id FROM notifications
      WHERE type = 'document_retention_expiring'
        AND message LIKE ?
        AND created_at > datetime('now', '-30 days')
      LIMIT 1
    `).get(`%${doc.pdf_filename}%`)

    if (recentNotif) continue

    notifyAdminsAndManagers({
      type: 'document_retention_expiring',
      title: 'Document Retention Expiring',
      message: `${doc.form_type} for ${doc.first_name} ${doc.last_name} (${doc.pdf_filename}) retention expires on ${doc.retention_until}.`,
      link: '/admin'
    })
  }
}
