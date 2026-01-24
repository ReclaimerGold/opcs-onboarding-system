import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
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

