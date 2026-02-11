<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Main Content -->
    <div class="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 md:px-8 lg:px-10">
      <div class="w-full max-w-full space-y-6 sm:space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="flex justify-center mb-6">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-20 w-auto"
            />
          </div>
          <h1 class="text-4xl font-extrabold text-gray-900 mb-2">
            {{ loginCopy.pageTitle }}
          </h1>
          <p class="text-lg text-gray-600">
            {{ loginCopy.pageSubtitle }}
          </p>
        </div>

        <!-- Single Login Form -->
        <div class="w-full max-w-md mx-auto">
          <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <!-- Form Header -->
            <div class="text-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                {{ loginCopy.formTitle }}
              </h2>
              <p class="text-sm text-gray-600">
                {{ loginCopy.formSubtitle }}
              </p>
            </div>

            <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <!-- Step indicator -->
        <div class="mb-4 text-center">
          <p class="text-sm text-gray-600">
            <span v-if="!requiresPassword">{{ loginCopy.step1Label }}</span>
            <span v-else>{{ loginCopy.step2Label }}</span>
          </p>
        </div>

        <!-- Instructions -->
        <div v-if="!requiresPassword" class="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p class="text-sm text-blue-800">
            {{ loginCopy.instructionsNameEmail }}
          </p>
        </div>

        <div v-if="requiresPassword" class="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p class="text-sm text-blue-800">
            {{ loginCopy.instructionsPassword }}
          </p>
        </div>

        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="firstName" class="sr-only">First Name</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              required
              :disabled="requiresPassword"
              :class="[
                'appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm',
                requiresPassword ? 'rounded-t-md bg-gray-100 cursor-not-allowed' : 'rounded-t-md'
              ]"
              placeholder="First Name"
            />
          </div>
          <div>
            <label for="lastName" class="sr-only">Last Name</label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              required
              :disabled="requiresPassword"
              :class="[
                'appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm',
                requiresPassword ? 'bg-gray-100 cursor-not-allowed' : ''
              ]"
              placeholder="Last Name"
            />
          </div>
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :disabled="requiresPassword"
              :class="[
                'appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm',
                requiresPassword ? 'bg-gray-100 cursor-not-allowed' : 'rounded-b-md'
              ]"
              placeholder="Email address"
            />
          </div>
          <NonGmailEmailNotice :email="email" />
          <div v-if="requiresPassword">
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <!-- Forgot Password Link -->
        <div v-if="requiresPassword" class="text-right">
          <router-link
            to="/forgot-password"
            class="text-sm text-primary hover:text-primary-light"
          >
            Forgot your password?
          </router-link>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 border border-red-200 p-4">
          <div class="flex items-start">
            <svg class="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-red-800">
                {{ error }}
              </h3>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <span v-if="loading">{{ loginCopy.buttonLoading }}</span>
            <span v-else>{{ loginCopy.buttonLabel }}</span>
          </button>
        </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-6 px-4 sm:px-6 md:px-8 lg:px-10">
      <div class="max-w-full mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div class="text-sm text-gray-600">
          © {{ currentYear }} Optimal Prime Services. All rights reserved.
          <span v-if="appVersion" class="ml-2 text-gray-500">· Version {{ appVersion }}</span>
        </div>
        <div>
          <router-link
            to="/"
            class="text-sm text-primary hover:text-primary-light font-medium transition-colors"
          >
            {{ loginCopy.adminAccessLabel }}
          </router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'
import NonGmailEmailNotice from '../components/NonGmailEmailNotice.vue'

const router = useRouter()
const authStore = useAuthStore()

/**
 * Centralized login copy. All labels and messaging for the single login flow live here.
 */
const loginCopy = {
  pageTitle: 'Onboarding System',
  pageSubtitle: 'Enter your name and email to begin or continue onboarding.',
  formTitle: 'Sign in or get started',
  formSubtitle: 'New employees will get an account; returning users will continue where they left off.',
  step1Label: 'Step 1: Enter your information',
  step2Label: 'Step 2: Enter your password',
  instructionsNameEmail: 'Enter your first name, last name, and email address. We\'ll create an account if you\'re new, or sign you in if you already have one.',
  instructionsPassword: 'This account requires a password. Enter your password to continue.',
  buttonLabel: 'Continue',
  buttonLoading: 'Signing in...',
  adminAccessLabel: 'Admin Access'
}

const currentYear = new Date().getFullYear()
const appVersion = import.meta.env.VITE_APP_VERSION || ''
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const requiresPassword = ref(false)
const loginPhase = ref(1) // 1 = name/email, 2 = password

const handleSubmit = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const credentials = {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value
    }
    if (requiresPassword.value && password.value) {
      credentials.password = password.value
    }

    // Try login first (existing users)
    let response
    try {
      response = await api.post('/auth/login', credentials)
    } catch (loginErr) {
      const status = loginErr.response?.status
      const code = loginErr.response?.data?.code
      if (status === 404 || code === 'ACCOUNT_NOT_FOUND') {
        // No account: create one (signup)
        response = await api.post('/auth/signup', {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value
        })
      } else {
        throw loginErr
      }
    }

    if (response?.data?.success) {
      // Admin needs password setup
      if (response.data.requiresPasswordSetup) {
        const {applicant} = response.data
        authStore.user = applicant
        authStore.isAuthenticated = true
        authStore.isAdmin = true
        authStore.role = applicant?.role || 'admin'
        localStorage.setItem('authToken', 'authenticated')
        router.push('/password-setup')
        return
      }
      // Phase 1: password required, show password field
      if (response.data.requiresPassword !== undefined && !password.value) {
        requiresPassword.value = response.data.requiresPassword
        loginPhase.value = 2
        loading.value = false
        return
      }
      // Success: set session and redirect
      const {applicant} = response.data
      authStore.user = applicant
      authStore.isAuthenticated = true
      authStore.isAdmin = applicant?.isAdmin || false
      authStore.role = applicant?.role || (applicant?.isAdmin ? 'admin' : 'applicant')
      localStorage.setItem('authToken', 'authenticated')
      if (authStore.isAdmin) {
        router.push('/admin')
      } else if (response.data.isNewUser) {
        router.push('/forms')
      } else if (response.data.onboardingComplete) {
        router.push('/dashboard')
      } else {
        router.push('/forms')
      }
      return
    }
  } catch (err) {
    // Handle network errors
    if (!err.response) {
      error.value = 'Unable to connect to server. Please check your internet connection and try again.'
      return
    }
    
    const errorData = err.response?.data || {}
    const errorCode = errorData.code
    const statusCode = err.response?.status
    
    // Handle rate limiting errors (429)
    if (statusCode === 429 || err.isRateLimit) {
      error.value = err.userMessage || errorData.message || 'Too many requests. Please wait a few minutes before trying again.'
      loading.value = false
      return
    }
    
    // Account exists (from signup): show password field if this account requires one
    if (statusCode === 400 && errorCode === 'ACCOUNT_EXISTS') {
      try {
        const loginCheck = await api.post('/auth/login', {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value
        })
        if (loginCheck.data?.requiresPassword) {
          requiresPassword.value = true
          loginPhase.value = 2
          error.value = 'An account with this information already exists. Please enter your password below.'
        } else {
          error.value = errorData.error || 'An account with this information already exists. Please try again.'
        }
      } catch {
        error.value = errorData.error || 'An account with this information already exists. Please try again.'
      }
      loading.value = false
      return
    }
    
    // Use specific error message from backend if available
    if (errorData.error) {
      error.value = errorData.error
    } else {
      switch (errorCode) {
        case 'MISSING_FIELDS':
          error.value = 'Please fill in all required fields (First Name, Last Name, Email)'
          break
        case 'INVALID_EMAIL':
          error.value = 'Please enter a valid email address'
          break
        case 'ACCOUNT_NOT_FOUND':
          error.value = 'No account found. We tried to create one but something went wrong. Please try again.'
          break
        case 'LOGIN_ERROR':
        case 'SIGNUP_ERROR':
          error.value = errorData.error || 'An unexpected error occurred. Please try again.'
          break
        default:
          if (statusCode === 400) {
            error.value = 'Please check your information and try again.'
          } else if (statusCode === 404) {
            error.value = 'No account found. Please try again.'
          } else if (statusCode === 500) {
            // Prefer backend message when present (error.message from server or error.details for stack in dev)
            error.value = errorData.message || errorData.error || errorData.details || 'Server error. Please try again in a few moments.'
          } else {
            error.value = 'Something went wrong. Please check your information and try again.'
          }
      }
    }
    
    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth error:', {
        code: errorCode,
        status: statusCode,
        message: errorData.error,
        details: errorData.details,
        fullError: err
      })
    }
  } finally {
    loading.value = false
  }
}
</script>
