import { ref, shallowRef } from 'vue'
import api from '../services/api.js'

let cachedTimezone = null
let formOptionsPromise = null

/**
 * Parse a value as a Date, treating SQLite-style datetimes (no 'Z') as UTC.
 * Backend now sends Z, but retroactive or legacy responses may not; this ensures correct display.
 */
function parseAsUTC(value) {
  if (value == null) return null
  if (value instanceof Date) return value
  if (typeof value !== 'string') return new Date(value)
  const s = value.trim()
  if (!s) return new Date(NaN)
  let normalized = s
  if (!s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
    normalized = s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z')
  }
  return new Date(normalized)
}

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
    const date = parseAsUTC(dateInput)
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
    const date = parseAsUTC(dateInput)
    if (Number.isNaN(date.getTime())) return ''
    const tz = timezone.value
    return date.toLocaleTimeString('en-US', tz ? { hour: 'numeric', minute: '2-digit', timeZone: tz } : { hour: 'numeric', minute: '2-digit' })
  }

  /**
   * Format for relative time (e.g. "5m ago"). Absolute fallback uses configured timezone.
   */
  function formatRelativeTime(dateStr) {
    if (!dateStr) return ''
    const date = parseAsUTC(dateStr)
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
 * Get the current cached timezone (sync). Returns '' before first fetch or when unset.
 * Used by non-Vue code (e.g. exportUtils) to format dates in the app timezone.
 */
export function getCachedTimezone() {
  return cachedTimezone ?? ''
}

/**
 * Format a date value in the app's configured timezone (sync, uses cache).
 * Use this in plain JS modules (e.g. export). Falls back to browser local if cache not yet loaded.
 * @param {string|Date|number} value - UTC timestamp or date string or Date
 * @returns {string}
 */
export function formatDateWithAppTimezone(value) {
  if (value == null || value === '') return ''
  const date = parseAsUTC(value)
  if (Number.isNaN(date.getTime())) return ''
  const tz = getCachedTimezone()
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }
  return date.toLocaleString('en-US', tz ? { ...options, timeZone: tz } : options)
}

/**
 * Get today's date as YYYY-MM-DD in the app's configured timezone.
 * Use for filters (e.g. "Today") and default form dates so they match the user's day.
 */
export function getTodayInAppTimezone() {
  const tz = getCachedTimezone()
  return new Date().toLocaleDateString('en-CA', tz ? { timeZone: tz } : {})
}

/**
 * Call after admin saves settings (e.g. timezone) so next format uses fresh value.
 */
export function invalidateDateFormatCache() {
  cachedTimezone = null
  formOptionsPromise = null
}
