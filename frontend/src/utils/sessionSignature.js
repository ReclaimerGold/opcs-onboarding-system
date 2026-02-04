/**
 * Session-scoped signature storage for onboarding.
 * Used to auto-populate the signature on forms after the applicant adds it in the initial onboarding modal.
 * Cleared on logout; sessionStorage is cleared when the tab closes.
 */

const SESSION_SIGNATURE_KEY = 'opcs_session_signature'

export function setSessionSignature(base64DataUrl) {
  if (base64DataUrl) {
    sessionStorage.setItem(SESSION_SIGNATURE_KEY, base64DataUrl)
  } else {
    sessionStorage.removeItem(SESSION_SIGNATURE_KEY)
  }
}

export function getSessionSignature() {
  return sessionStorage.getItem(SESSION_SIGNATURE_KEY)
}

export function clearSessionSignature() {
  sessionStorage.removeItem(SESSION_SIGNATURE_KEY)
}
