import { defineStore } from 'pinia'
import api from '../services/api.js'
import { clearSSNCookie } from '../utils/cookies.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false
  }),

  actions: {
    async signup(firstName, lastName, email) {
      try {
        const response = await api.post('/auth/signup', {
          firstName,
          lastName,
          email
        })
        
        this.user = response.data.applicant
        this.isAuthenticated = true
        this.isAdmin = response.data.applicant?.isAdmin || false
        localStorage.setItem('authToken', 'authenticated')
        
        return { success: true, isNewUser: response.data.isNewUser }
      } catch (error) {
        console.error('Signup error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Signup failed',
          existingAccount: error.response?.data?.existingAccount
        }
      }
    },

    async login(firstName, lastName, email) {
      try {
        const response = await api.post('/auth/login', {
          firstName,
          lastName,
          email
        })
        
        this.user = response.data.applicant
        this.isAuthenticated = true
        this.isAdmin = response.data.applicant?.isAdmin || false
        localStorage.setItem('authToken', 'authenticated')
        
        return { success: true, isNewUser: response.data.isNewUser }
      } catch (error) {
        console.error('Login error:', error)
        return { 
          success: false, 
          error: error.response?.data?.error || 'Login failed',
          notFound: error.response?.data?.notFound
        }
      }
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.isAuthenticated = false
        this.isAdmin = false
        localStorage.removeItem('authToken')
        // Clear SSN cookie on logout for security
        clearSSNCookie()
      }
    },

    async fetchUser() {
      try {
        const response = await api.get('/auth/me')
        this.user = response.data
        this.isAuthenticated = true
        this.isAdmin = response.data.isAdmin || false
        return response.data
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
        this.isAdmin = false
        throw error
      }
    }
  }
})

