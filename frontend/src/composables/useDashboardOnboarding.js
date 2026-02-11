/**
 * Composable for dashboard/forms onboarding gate.
 * User onboarding is locked until: 1) SSN consent (once, in DB), 2) password set (for admins), 3) signature (once, in DB).
 * Consent and signature are required only once and documented/stored in the DB; user cannot continue until both are done.
 *
 * SINGLETON: Reactive state is shared across all components using this composable.
 * This prevents duplicate onboarding modals when navigating between Dashboard and Forms views.
 * Call resetDashboardOnboarding() on logout to clear cached state.
 */
import { ref, computed, onMounted } from 'vue'
import api from '../services/api.js'
import { getSessionSignature, setSessionSignature } from '../utils/sessionSignature.js'

// ── Shared singleton state ──────────────────────────────────────────────────
const ssnConsentGiven = ref(null) // null = not yet checked, true/false = from API
const passwordSet = ref(false)
const isAdmin = ref(false)
const hasSignatureInDb = ref(false)
const loading = ref(true)

/** Promise for the initial status check – ensures only one check runs. */
let checkPromise = null

// ── Internal helpers ────────────────────────────────────────────────────────

async function _fetchStatus() {
  loading.value = true
  try {
    const res = await api.get('/auth/dashboard-onboarding-status')
    ssnConsentGiven.value = res.data.ssnConsentGiven === true
    passwordSet.value = res.data.passwordSet === true
    isAdmin.value = res.data.isAdmin === true
    hasSignatureInDb.value = res.data.hasSignature === true
    // If user has signature in DB but not in session (e.g. new tab), load it into session for forms
    if (hasSignatureInDb.value && !getSessionSignature()) {
      try {
        const sigRes = await api.get('/auth/signature')
        if (sigRes.data?.signature) {
          setSessionSignature(sigRes.data.signature)
        }
      } catch (e) {
        console.error('Failed to load signature into session', e)
      }
    }
  } catch (err) {
    console.error('Failed to check dashboard onboarding status:', err)
    // Only clear state on auth failure so transient errors don't force the user through the gate again
    const status = err.response?.status
    if (status === 401 || status === 403) {
      ssnConsentGiven.value = false
      passwordSet.value = false
      isAdmin.value = false
      hasSignatureInDb.value = false
    }
    // Otherwise leave refs unchanged (e.g. keep true if already completed)
  } finally {
    loading.value = false
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch onboarding status from the backend.
 * Safe to call multiple times; subsequent calls return the same promise until reset.
 */
function checkStatus() {
  if (!checkPromise) {
    checkPromise = _fetchStatus()
  }
  return checkPromise
}

/**
 * Force-refresh onboarding status from the backend (bypasses cache).
 */
async function refreshStatus() {
  checkPromise = _fetchStatus()
  return checkPromise
}

async function recordConsent() {
  try {
    await api.post('/auth/ssn-consent')
    ssnConsentGiven.value = true
  } catch (err) {
    console.error('Failed to record SSN consent:', err)
    throw err
  }
}

/** Save signature to DB (required once). Call with filled signature data from modal. */
async function saveSignature(signatureData) {
  if (!signatureData || !String(signatureData).trim()) {
    throw new Error('Signature is required')
  }
  await api.post('/auth/save-signature', { signatureData: String(signatureData).trim() })
  hasSignatureInDb.value = true
  setSessionSignature(signatureData)
}

// ── Computed properties ─────────────────────────────────────────────────────

/** Onboarding is complete only when consent + (password if admin) + signature in DB are all done */
const onboardingComplete = computed(() => {
  if (loading.value || ssnConsentGiven.value !== true) return false
  if (isAdmin.value && !passwordSet.value) return false
  return hasSignatureInDb.value === true
})

/** Show modal and lock content until onboarding is complete */
const needsOnboardingModal = computed(
  () => !loading.value && !onboardingComplete.value
)

/** When true, open modal at signature step only (consent and password already done) */
const startAtSignatureOnly = computed(() => {
  if (loading.value || !ssnConsentGiven.value) return false
  if (isAdmin.value && !passwordSet.value) return false
  return !hasSignatureInDb.value
})

// ── Composable entry-point ──────────────────────────────────────────────────

export function useDashboardOnboarding() {
  onMounted(() => {
    // Only auto-check once; subsequent component mounts reuse cached state.
    checkStatus()
  })

  return {
    ssnConsentGiven,
    passwordSet,
    isAdmin,
    loading,
    needsOnboardingModal,
    startAtSignatureOnly,
    checkStatus,
    refreshStatus,
    recordConsent,
    saveSignature
  }
}

/**
 * Reset all singleton state. Must be called on logout so the next user
 * starts with a clean slate.
 */
export function resetDashboardOnboarding() {
  ssnConsentGiven.value = null
  passwordSet.value = false
  isAdmin.value = false
  hasSignatureInDb.value = false
  loading.value = true
  checkPromise = null
}
