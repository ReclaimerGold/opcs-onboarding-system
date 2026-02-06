import { ref, onMounted, onUnmounted } from 'vue'
import api from '../services/api.js'

// Shared state (singleton pattern like useDashboardOnboarding)
const unreadCount = ref(0)
const notifications = ref([])
const notificationsTotal = ref(0)
const loading = ref(false)
const toasts = ref([])
let pollInterval = null
let initialized = false
let lastKnownCount = 0

const POLL_INTERVAL_MS = 30 * 1000 // 30 seconds
const MAX_TOASTS = 3
const TOAST_DURATION_MS = 5000

/**
 * Composable for managing notifications state and polling.
 * Uses shared singleton state so all components see the same data.
 */
export function useNotifications() {
  /**
   * Fetch unread count (lightweight, for bell badge)
   */
  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count')
      const newCount = data.count || 0

      // Show toast if count increased (new notifications arrived)
      if (initialized && newCount > lastKnownCount) {
        // Fetch the newest notification to show as toast
        try {
          const { data: listData } = await api.get('/notifications', {
            params: { unreadOnly: true, limit: newCount - lastKnownCount }
          })
          if (listData.notifications) {
            for (const notif of listData.notifications.slice(0, MAX_TOASTS)) {
              addToast(notif)
            }
          }
        } catch {
          // Silent fail for toast fetch
        }
      }

      lastKnownCount = newCount
      unreadCount.value = newCount
      initialized = true
    } catch {
      // Silent fail for polling
    }
  }

  /**
   * Fetch full notification list (on demand, e.g. when bell is clicked)
   */
  async function fetchNotifications({ unreadOnly = false, limit = 20, offset = 0 } = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/notifications', {
        params: { unreadOnly: unreadOnly.toString(), limit, offset }
      })
      notifications.value = data.notifications || []
      notificationsTotal.value = data.total || 0
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a single notification as read
   */
  async function markAsRead(notificationId) {
    try {
      await api.post(`/notifications/${notificationId}/read`)
      // Update local state
      const notif = notifications.value.find(n => n.id === notificationId)
      if (notif) notif.is_read = 1
      if (unreadCount.value > 0) unreadCount.value--
      lastKnownCount = unreadCount.value
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    try {
      await api.post('/notifications/read-all')
      notifications.value.forEach(n => { n.is_read = 1 })
      unreadCount.value = 0
      lastKnownCount = 0
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  /**
   * Delete a notification
   */
  async function deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}`)
      const idx = notifications.value.findIndex(n => n.id === notificationId)
      if (idx !== -1) {
        const wasUnread = notifications.value[idx].is_read === 0
        notifications.value.splice(idx, 1)
        notificationsTotal.value--
        if (wasUnread && unreadCount.value > 0) {
          unreadCount.value--
          lastKnownCount = unreadCount.value
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  /**
   * Add a toast notification
   */
  function addToast(notification) {
    // Limit active toasts
    if (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift()
    }

    const toast = {
      id: notification.id || Date.now(),
      title: notification.title,
      message: notification.message,
      link: notification.link,
      type: notification.type,
      createdAt: Date.now()
    }

    toasts.value.push(toast)

    // Auto-dismiss after duration
    setTimeout(() => {
      dismissToast(toast.id)
    }, TOAST_DURATION_MS)
  }

  /**
   * Dismiss a toast
   */
  function dismissToast(toastId) {
    const idx = toasts.value.findIndex(t => t.id === toastId)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
  }

  /**
   * Start polling for unread count
   */
  function startPolling() {
    if (pollInterval) return
    fetchUnreadCount()
    pollInterval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
  }

  /**
   * Stop polling
   */
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  /**
   * Reset state (on logout)
   */
  function resetNotifications() {
    stopPolling()
    unreadCount.value = 0
    notifications.value = []
    notificationsTotal.value = 0
    toasts.value = []
    initialized = false
    lastKnownCount = 0
  }

  return {
    unreadCount,
    notifications,
    notificationsTotal,
    loading,
    toasts,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addToast,
    dismissToast,
    startPolling,
    stopPolling,
    resetNotifications
  }
}
