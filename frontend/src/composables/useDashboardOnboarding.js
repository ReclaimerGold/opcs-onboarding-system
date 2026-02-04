/**
 * Composable for dashboard/forms onboarding gate.
 * User onboarding is locked until: 1) SSN consent (once, in DB), 2) password set (for admins), 3) signature (once, in DB).
 * Consent and signature are required only once and documented/stored in the DB; user cannot continue until both are done.
 */
import { ref, computed, onMounted } from 'vue'
import api from '../services/api.js'
import { getSessionSignature, setSessionSignature } from '../utils/sessionSignature.js'

export function useDashboardOnboarding() {
  const ssnConsentGiven = ref(null) // null = loading, true/false = from API
  const passwordSet = ref(false)
  const isAdmin = ref(false)
  const hasSignatureInDb = ref(false)
  const loading = ref(true)

  async function checkStatus() {
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
      ssnConsentGiven.value = false
      passwordSet.value = false
      isAdmin.value = false
      hasSignatureInDb.value = false
    } finally {
      loading.value = false
    }
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

  onMounted(() => {
    checkStatus()
  })

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

  return {
    ssnConsentGiven,
    passwordSet,
    isAdmin,
    loading,
    needsOnboardingModal,
    startAtSignatureOnly,
    checkStatus,
    recordConsent,
    saveSignature
  }
}
