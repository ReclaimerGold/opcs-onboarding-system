import { defineStore } from 'pinia'
import api from '../services/api.js'
import { clearSSNCookie } from '../utils/cookies.js'
import { clearSessionSignature } from '../utils/sessionSignature.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    role: null // admin | manager | employee | applicant
  }),

  actions: {
    async signup(firstName, lastName, email) {
      try {
        const response = await api.post('/auth/signup', {
          firstName,
          lastName,
          email
        })

        const { applicant } = response.data
        this.user = applicant
        this.isAuthenticated = true
        this.role = applicant?.role || (applicant?.isAdmin ? 'admin' : 'applicant')
        this.isAdmin = applicant?.isAdmin ?? (this.role === 'admin')
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

        const { applicant } = response.data
        this.user = applicant
        this.isAuthenticated = true
        this.role = applicant?.role || (applicant?.isAdmin ? 'admin' : 'applicant')
        this.isAdmin = applicant?.isAdmin ?? (this.role === 'admin')
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
        this.role = null
        localStorage.removeItem('authToken')
        // Clear SSN cookie on logout for security
        clearSSNCookie()
        clearSessionSignature()
      }
    },

    async fetchUser() {
      try {
        const response = await api.get('/auth/me')
        const { data } = response
        this.user = data
        this.isAuthenticated = true
        this.role = data.role || (data.isAdmin ? 'admin' : 'applicant')
        this.isAdmin = data.isAdmin ?? (this.role === 'admin')
        return data
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
        this.isAdmin = false
        this.role = null
        throw error
      }
    }
  }
})

