import { ref, shallowRef } from 'vue'
import api from '../services/api.js'

let cachedTimezone = null
let formOptionsPromise = null

/**
 * Fetches display timezone from form-options (cached). Returns empty string if not set (browser default).
 * @returns {Promise<string>}
 */
async function getTimezone() {
  if (cachedTimezone !== null) return cachedTimezone
  if (!formOptionsPromise) {
    formOptionsPromise = api.get('/settings/form-options').then((res) => {
      const tz = res.data?.timezone
      cachedTimezone = typeof tz === 'string' ? tz : ''
      return cachedTimezone
    }).catch(() => {
      cachedTimezone = ''
      return ''
    })
  }
  return formOptionsPromise
}

/**
 * Composable for formatting dates in the app's configured timezone.
 * Uses GET /api/settings/form-options timezone; falls back to browser local when not set.
 */
export function useDateFormat() {
  const timezone = shallowRef('')
  const ready = ref(false)

  getTimezone().then((tz) => {
    timezone.value = tz
    ready.value = true
  })

  /**
   * Format a date string or Date for display in the configured timezone.
   * @param {string|Date} dateInput - ISO date string or Date
   * @param {Intl.DateTimeFormatOptions} [options] - Intl options (default: date + time)
   * @returns {string}
   */
  function formatDate(dateInput, options = {}) {
    if (dateInput == null || dateInput === '') return 'N/A'
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    if (Number.isNaN(date.getTime())) return 'N/A'
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...options
    }
    const tz = timezone.value
    return date.toLocaleString('en-US', tz ? { ...defaultOptions, timeZone: tz } : defaultOptions)
  }

  /**
   * Format for date only (no time).
   */
  function formatDateOnly(dateInput) {
    return formatDate(dateInput, { hour: undefined, minute: undefined })
  }

  /**
   * Format as time only (e.g. "2:30 PM").
   */
  function formatTime(dateInput) {
    if (dateInput == null || dateInput === '') return ''
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    if (Number.isNaN(date.getTime())) return ''
    const tz = timezone.value
    return date.toLocaleTimeString('en-US', tz ? { hour: 'numeric', minute: '2-digit', timeZone: tz } : { hour: 'numeric', minute: '2-digit' })
  }

  /**
   * Format for relative time (e.g. "5m ago"). Absolute fallback uses configured timezone.
   */
  function formatRelativeTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'))
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDateOnly(date)
  }

  return { formatDate, formatDateOnly, formatTime, formatRelativeTime, timezone, ready }
}

/**
 * Call after admin saves settings (e.g. timezone) so next format uses fresh value.
 */
export function invalidateDateFormatCache() {
  cachedTimezone = null
  formOptionsPromise = null
}
