/**
 * Cookie utility functions for secure client-side storage
 * Note: SSN is stored in cookies temporarily (1 hour) for user convenience
 * SSN is NEVER stored in the database - only in PDFs and temporary cookies
 */

/**
 * Set a cookie with expiration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} hours - Hours until expiration (default: 1)
 */
export function setCookie(name, value, hours = 1) {
  const expires = new Date()
  expires.setTime(expires.getTime() + hours * 60 * 60 * 1000)

  // Use secure settings
  const isProduction = import.meta.env.PROD
  const secureFlag = isProduction ? '; Secure' : ''
  const sameSite = '; SameSite=Strict'

  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/${secureFlag}${sameSite}`
}

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
  }
  return null
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * Set SSN in cookie (temporary storage, expires in 1 hour)
 * Also records a session flag so the re-prompt modal can distinguish between
 * "SSN was never entered" and "SSN cookie expired".
 * @param {string} ssn - Social Security Number (formatted: XXX-XX-XXXX)
 */
export function setSSNCookie(ssn) {
  if (ssn && ssn.match(/^\d{3}-\d{2}-\d{4}$/)) {
    setCookie('temp_ssn', ssn, 1) // 1 hour expiration
    sessionStorage.setItem('opcs_ssn_entered', 'true')
  }
}

/**
 * Get SSN from cookie
 * @returns {string|null} SSN or null if not found or expired
 */
export function getSSNCookie() {
  return getCookie('temp_ssn')
}

/**
 * Clear SSN cookie and session flag (call when user logs out or session ends)
 */
export function clearSSNCookie() {
  deleteCookie('temp_ssn')
  sessionStorage.removeItem('opcs_ssn_entered')
}

/**
 * Check whether the user entered their SSN at any point during this browser session.
 * Used by the SSN re-prompt modal to distinguish between "SSN was never entered"
 * (first-time user, form collects it) and "SSN cookie expired" (show re-prompt).
 * @returns {boolean}
 */
export function wasSSNEnteredThisSession() {
  return sessionStorage.getItem('opcs_ssn_entered') === 'true'
}

