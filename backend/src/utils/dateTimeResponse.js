/**
 * Normalize datetime strings in API responses to ISO 8601 with trailing 'Z' (UTC).
 * SQLite stores CURRENT_TIMESTAMP in UTC but returns values like "2025-02-18 18:00:00"
 * without timezone. Browsers parse that as local time unless we append 'Z'.
 * This ensures all datetime values are interpreted as UTC by the frontend so
 * display timezone conversion (e.g. America/Chicago) is correct for both new and
 * retroactive records.
 *
 * Matches: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS" (no Z or offset)
 */

function isSqliteDateTimeString(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed.length < 19) return false
  if (trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) return false
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(trimmed)
}

function toUTCISOString(value) {
  if (typeof value !== 'string') return value
  const s = value.trim()
  if (s.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) return s
  const normalized = s.replace(' ', 'T')
  return normalized.endsWith('Z') ? normalized : `${normalized}Z`
}

/**
 * Recursively walk a value and normalize any SQLite-style datetime strings to UTC ISO (with Z).
 * @param {*} value - Any JSON-serializable value
 * @returns {*} - New value with datetime strings normalized (objects/arrays are shallow-cloned)
 */
export function normalizeDateTimeStrings(value) {
  if (value === null || value === undefined || typeof value !== 'object') {
    if (typeof value === 'string' && isSqliteDateTimeString(value)) return toUTCISOString(value)
    return value
  }
  if (Array.isArray(value)) {
    return value.map(normalizeDateTimeStrings)
  }
  const out = {}
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string' && isSqliteDateTimeString(v)) {
      out[k] = toUTCISOString(v)
    } else if (Array.isArray(v)) {
      out[k] = normalizeDateTimeStrings(v)
    } else if (v !== null && typeof v === 'object') {
      out[k] = normalizeDateTimeStrings(v)
    } else {
      out[k] = v
    }
  }
  return out
}
