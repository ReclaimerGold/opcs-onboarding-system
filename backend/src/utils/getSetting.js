import { getDatabase } from '../database/init.js'
import { decryptText } from '../services/encryptionService.js'

/** Keys that are stored encrypted; decrypt when reading */
const ENCRYPTED_KEYS = new Set([
  'google_client_id',
  'google_client_secret',
  'google_refresh_token',
  'google_address_validation_api_key',
  'mailgun_api_key'
])

/**
 * Get a single setting value by key.
 * @param {string} key - Setting key
 * @returns {string} - Raw value or empty string if not set
 */
export function getSetting(key) {
  if (!key) return ''
  const db = getDatabase()
  const row = db.prepare('SELECT value, is_encrypted FROM settings WHERE key = ?').get(key)
  if (!row || row.value == null || row.value === '') return ''
  if (row.is_encrypted && ENCRYPTED_KEYS.has(key)) {
    try {
      return decryptText(row.value) || ''
    } catch {
      return ''
    }
  }
  return String(row.value)
}
