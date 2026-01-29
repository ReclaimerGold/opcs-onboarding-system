import axios from 'axios'

// Use VITE_API_BASE_URL when set (e.g. http://localhost:3000/api) so /api requests
// hit the backend directly when the app is served from a host/port that doesn't proxy /api.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || ''
    const skipAuthRedirect = [
      '/auth/login',
      '/auth/signup',
      '/auth/keepalive',
      '/auth/password-status',
      '/auth/set-password',
      '/auth/change-password'
    ].some((path) => requestUrl.includes(path))

    if (error.response?.status === 401 && !skipAuthRedirect) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('opcsSessionLastActivityAt')
      localStorage.removeItem('opcsSessionExpiresAt')

      try {
        const { useAuthStore } = await import('../stores/auth.js')
        const authStore = useAuthStore()
        authStore.user = null
        authStore.isAuthenticated = false
        authStore.isAdmin = false
        authStore.role = null
      } catch (storeError) {
        // Ignore store cleanup failures (e.g., before Pinia is ready)
      }
      window.location.href = '/login'
    }
    // Handle rate limiting errors (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const message = retryAfter
        ? `Too many requests. Please wait ${Math.ceil(retryAfter)} seconds before trying again.`
        : 'Too many requests. Please wait a few minutes before trying again.'

      // Enhance error object with user-friendly message
      error.userMessage = message
      error.isRateLimit = true
    }
    return Promise.reject(error)
  }
)

export default api

