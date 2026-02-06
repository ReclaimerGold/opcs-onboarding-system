import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserPreferences,
  updateUserPreference,
  resetUserPreferences,
  NOTIFICATION_TYPES
} from '../services/notificationService.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

/**
 * GET /api/notifications
 * List notifications for the current user (paginated).
 * Query params: unreadOnly (boolean), limit (number), offset (number)
 */
router.get('/', (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true'
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = parseInt(req.query.offset) || 0

    const result = getNotificationsForUser(req.applicantId, { unreadOnly, limit, offset })
    res.json(result)
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to retrieve notifications' })
  }
})

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the bell badge.
 */
router.get('/unread-count', (req, res) => {
  try {
    const count = getUnreadCount(req.applicantId)
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Failed to retrieve unread count' })
  }
})

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.post('/:id/read', (req, res) => {
  try {
    const notificationId = parseInt(req.params.id)
    const success = markAsRead(notificationId, req.applicantId)

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user.
 */
router.post('/read-all', (req, res) => {
  try {
    const count = markAllAsRead(req.applicantId)
    res.json({ success: true, count })
  } catch (error) {
    console.error('Mark all as read error:', error)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

/**
 * DELETE /api/notifications/:id
 * Dismiss/delete a notification.
 */
router.delete('/:id', (req, res) => {
  try {
    const notificationId = parseInt(req.params.id)
    const success = deleteNotification(notificationId, req.applicantId)

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

/**
 * GET /api/notifications/preferences
 * Get the current user's notification preferences (merged with defaults).
 */
router.get('/preferences', async (req, res) => {
  try {
    const { getDatabase } = await import('../database/init.js')
    const db = getDatabase()
    const user = db.prepare('SELECT role, is_admin FROM applicants WHERE id = ?').get(req.applicantId)
    const role = user?.role || (user?.is_admin === 1 ? 'admin' : 'applicant')

    const preferences = getUserPreferences(req.applicantId, role)
    res.json({ preferences })
  } catch (error) {
    console.error('Get preferences error:', error)
    res.status(500).json({ error: 'Failed to retrieve preferences' })
  }
})

/**
 * PUT /api/notifications/preferences
 * Update notification preferences (batch).
 * Body: { preferences: [{ type, in_app_enabled, email_enabled, email_frequency }] }
 */
router.put('/preferences', (req, res) => {
  try {
    const { preferences } = req.body

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'preferences must be an array' })
    }

    for (const pref of preferences) {
      if (!pref.type || !NOTIFICATION_TYPES[pref.type]) {
        continue // Skip unknown types
      }

      // Validate email_frequency if provided
      if (pref.email_frequency && !['realtime', 'daily_digest', 'disabled'].includes(pref.email_frequency)) {
        continue
      }

      updateUserPreference(req.applicantId, pref.type, {
        in_app_enabled: pref.in_app_enabled,
        email_enabled: pref.email_enabled,
        email_frequency: pref.email_frequency
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

/**
 * POST /api/notifications/preferences/reset
 * Reset all notification preferences to defaults.
 */
router.post('/preferences/reset', (req, res) => {
  try {
    resetUserPreferences(req.applicantId)
    res.json({ success: true })
  } catch (error) {
    console.error('Reset preferences error:', error)
    res.status(500).json({ error: 'Failed to reset preferences' })
  }
})

export default router
