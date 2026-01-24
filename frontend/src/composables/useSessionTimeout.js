import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'

const SESSION_TIMEOUT_MS = 15 * 60 * 1000
const WARNING_THRESHOLD_MS = 3 * 60 * 1000
const KEEPALIVE_MIN_INTERVAL_MS = 60 * 1000

const STORAGE_LAST_ACTIVITY = 'opcsSessionLastActivityAt'
const STORAGE_EXPIRES_AT = 'opcsSessionExpiresAt'

export function useSessionTimeout() {
  const authStore = useAuthStore()
  const router = useRouter()

  const remainingMs = ref(SESSION_TIMEOUT_MS)
  const expiresAt = ref(Date.now() + SESSION_TIMEOUT_MS)
  const warningActive = computed(() => remainingMs.value > 0 && remainingMs.value <= WARNING_THRESHOLD_MS)
  const isActive = computed(() => authStore.isAuthenticated)

  let intervalId = null
  let lastActivityAt = 0
  let lastKeepaliveAt = 0
  let activityListenersAttached = false
  let isLoggingOut = false
  let sessionConfirmed = false
  let authActivatedAt = 0

  const setExpiresAt = (timestamp) => {
    expiresAt.value = timestamp
    localStorage.setItem(STORAGE_EXPIRES_AT, String(timestamp))
  }

  const clearStoredSession = () => {
    localStorage.removeItem(STORAGE_LAST_ACTIVITY)
    localStorage.removeItem(STORAGE_EXPIRES_AT)
  }

  const updateRemaining = () => {
    const nextRemaining = Math.max(0, expiresAt.value - Date.now())
    remainingMs.value = nextRemaining
    if (nextRemaining === 0) {
      void handleTimeoutLogout()
    }
  }

  const recordActivity = () => {
    if (!isActive.value) {
      return
    }

    const now = Date.now()
    if (now - lastActivityAt < 1000) {
      return
    }

    lastActivityAt = now
    localStorage.setItem(STORAGE_LAST_ACTIVITY, String(now))
    setExpiresAt(now + SESSION_TIMEOUT_MS)
    queueKeepalive()
  }

  const handleTimeoutLogout = async () => {
    if (!isActive.value || isLoggingOut) {
      return
    }

    isLoggingOut = true
    clearStoredSession()
    await authStore.logout()
    isLoggingOut = false
    router.push('/login')
  }

  const keepalive = async () => {
    if (!isActive.value) {
      return
    }

    try {
      const response = await api.post('/auth/keepalive')
      const expiresAtValue = response.data?.expiresAt
      if (expiresAtValue) {
        const parsed = Date.parse(expiresAtValue)
        if (!Number.isNaN(parsed)) {
          setExpiresAt(parsed)
        }
      }
      sessionConfirmed = true
    } catch (error) {
      if (error.response?.status === 401) {
        const now = Date.now()
        if (!sessionConfirmed && now - authActivatedAt < 5000) {
          return
        }
        await handleTimeoutLogout()
      }
    }
  }

  const queueKeepalive = () => {
    const now = Date.now()
    if (now - lastKeepaliveAt < KEEPALIVE_MIN_INTERVAL_MS) {
      return
    }
    lastKeepaliveAt = now
    void keepalive()
  }

  const restoreFromStorage = () => {
    const storedExpiresAt = Number(localStorage.getItem(STORAGE_EXPIRES_AT))
    const storedLastActivity = Number(localStorage.getItem(STORAGE_LAST_ACTIVITY))

    if (Number.isFinite(storedExpiresAt) && storedExpiresAt > Date.now()) {
      expiresAt.value = storedExpiresAt
      return
    }

    if (Number.isFinite(storedLastActivity)) {
      const nextExpiresAt = storedLastActivity + SESSION_TIMEOUT_MS
      if (nextExpiresAt > Date.now()) {
        setExpiresAt(nextExpiresAt)
        return
      }
    }

    setExpiresAt(Date.now() + SESSION_TIMEOUT_MS)
  }

  const attachActivityListeners = () => {
    if (activityListenersAttached) {
      return
    }

    const options = { passive: true }
    window.addEventListener('mousemove', recordActivity, options)
    window.addEventListener('mousedown', recordActivity, options)
    window.addEventListener('keydown', recordActivity, options)
    window.addEventListener('touchstart', recordActivity, options)
    window.addEventListener('scroll', recordActivity, options)
    window.addEventListener('focus', recordActivity)

    activityListenersAttached = true
  }

  const detachActivityListeners = () => {
    if (!activityListenersAttached) {
      return
    }

    window.removeEventListener('mousemove', recordActivity)
    window.removeEventListener('mousedown', recordActivity)
    window.removeEventListener('keydown', recordActivity)
    window.removeEventListener('touchstart', recordActivity)
    window.removeEventListener('scroll', recordActivity)
    window.removeEventListener('focus', recordActivity)

    activityListenersAttached = false
  }

  const start = () => {
    authActivatedAt = Date.now()
    sessionConfirmed = false
    restoreFromStorage()
    updateRemaining()
    lastKeepaliveAt = 0
    if (!intervalId) {
      intervalId = window.setInterval(updateRemaining, 1000)
    }
    attachActivityListeners()
    queueKeepalive()
  }

  const stop = () => {
    detachActivityListeners()
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    remainingMs.value = SESSION_TIMEOUT_MS
  }

  const handleStorage = (event) => {
    if (event.key === STORAGE_EXPIRES_AT && event.newValue) {
      const parsed = Number(event.newValue)
      if (Number.isFinite(parsed)) {
        expiresAt.value = parsed
        updateRemaining()
      }
    }
  }

  watch(isActive, (active) => {
    if (active) {
      start()
      return
    }

    stop()
    clearStoredSession()
  }, { immediate: true })

  onMounted(() => {
    window.addEventListener('storage', handleStorage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('storage', handleStorage)
    stop()
  })

  return {
    remainingMs,
    expiresAt,
    warningActive,
    isActive,
    recordActivity
  }
}

