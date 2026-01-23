<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          OPCS Onboarding System
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ getModeDescription() }}
        </p>
      </div>
      
      <div class="flex justify-center space-x-2 mb-6">
        <button
          @click="switchToSignUp"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            mode === 'signup'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          Sign Up
        </button>
        <button
          @click="switchToSignIn"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            mode === 'signin'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          Sign In
        </button>
        <button
          @click="switchToManager"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            mode === 'manager'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          Manager Login
        </button>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="firstName" class="sr-only">First Name</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
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
              <div v-if="error.includes('already exists') && mode === 'signup'" class="mt-2 text-sm text-red-700">
                <p>Click "Sign In" above to access your account.</p>
              </div>
              <div v-if="error.includes('No account found') && mode !== 'signup'" class="mt-2 text-sm text-red-700">
                <p>Click "Sign Up" above to create a new account.</p>
              </div>
              <div v-if="error.includes('Unable to create account') && mode === 'signup'" class="mt-2 text-sm text-red-700">
                <p>If you already have an account, try clicking "Sign In" above.</p>
              </div>
              <div v-if="error.includes('Access denied') || error.includes('manager privileges')" class="mt-2 text-sm text-red-700">
                <p>Please contact your administrator if you believe you should have manager access.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <span v-if="loading">{{ getButtonLoadingText() }}</span>
            <span v-else>{{ getButtonText() }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('signup') // 'signup', 'signin', or 'manager'
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const loading = ref(false)
const error = ref('')

// Get description based on current mode
const getModeDescription = () => {
  switch (mode.value) {
    case 'signup':
      return 'Start your onboarding process'
    case 'signin':
      return 'Continue your onboarding process'
    case 'manager':
      return 'Manager and administrator access'
    default:
      return 'Start your onboarding process'
  }
}

// Clear error when switching modes
const switchToSignUp = () => {
  error.value = ''
  mode.value = 'signup'
}

const switchToSignIn = () => {
  error.value = ''
  mode.value = 'signin'
}

const switchToManager = () => {
  error.value = ''
  mode.value = 'manager'
}

// Get button text based on mode
const getButtonText = () => {
  switch (mode.value) {
    case 'signup':
      return 'Get Started'
    case 'signin':
      return 'Continue'
    case 'manager':
      return 'Login as Manager'
    default:
      return 'Get Started'
  }
}

// Get button loading text based on mode
const getButtonLoadingText = () => {
  switch (mode.value) {
    case 'signup':
      return 'Creating account...'
    case 'signin':
      return 'Signing in...'
    case 'manager':
      return 'Logging in...'
    default:
      return 'Processing...'
  }
}

const handleSubmit = async () => {
  error.value = ''
  loading.value = true
  
  try {
    // Manager login uses the same login endpoint
    const endpoint = mode.value === 'signup' ? '/auth/signup' : '/auth/login'
    const response = await api.post(endpoint, {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value
    })
    
    if (response.data.success) {
      // Update auth store (will set isAdmin automatically)
      authStore.user = response.data.applicant
      authStore.isAuthenticated = true
      authStore.isAdmin = response.data.applicant?.isAdmin || false
      localStorage.setItem('authToken', 'authenticated')
      
      // Redirect based on user type and onboarding status
      if (authStore.isAdmin) {
        // Admin/Manager always goes to admin dashboard
        router.push('/admin')
      } else if (mode.value === 'manager') {
        // User selected manager login but is not an admin
        error.value = 'Access denied. This account does not have manager privileges.'
        loading.value = false
        return
      } else if (response.data.isNewUser) {
        router.push('/forms')
      } else {
        // Check if onboarding is complete
        if (response.data.onboardingComplete) {
          router.push('/dashboard')
        } else {
          // Resume onboarding
          router.push('/forms')
        }
      }
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
    
    // Use specific error message from backend if available
    if (errorData.error) {
      error.value = errorData.error
    } else {
      // Fallback error messages based on error code or status
      switch (errorCode) {
        case 'MISSING_FIELDS':
          error.value = 'Please fill in all required fields (First Name, Last Name, Email)'
          break
        case 'INVALID_EMAIL':
          error.value = 'Please enter a valid email address'
          break
        case 'ACCOUNT_EXISTS':
          error.value = errorData.onboardingComplete
            ? 'Account already exists and onboarding is complete. Please sign in.'
            : 'Account already exists. Please sign in to continue.'
          break
        case 'ACCOUNT_NOT_FOUND':
          // Only show this error on login/manager, not signup
          if (mode.value !== 'signup') {
            if (mode.value === 'manager') {
              error.value = 'No manager account found with this information. Please verify your credentials or contact your administrator.'
            } else {
              error.value = 'No account found with this information. Please sign up to get started.'
            }
          } else {
            // This shouldn't happen on signup, but if it does, show generic error
            error.value = 'Unable to create account. Please try again.'
          }
          break
        case 'LOGIN_ERROR':
        case 'SIGNUP_ERROR':
          error.value = errorData.error || 'An unexpected error occurred. Please try again.'
          break
        default:
          // Handle HTTP status codes - context-aware messages
          if (statusCode === 400) {
            if (mode.value === 'signup') {
              error.value = 'Unable to create account. Please check your information and try again.'
            } else if (mode.value === 'manager') {
              error.value = 'Unable to sign in as manager. Please check your information and try again.'
            } else {
              error.value = 'Unable to sign in. Please check your information and try again.'
            }
          } else if (statusCode === 404) {
            // 404 on signup shouldn't happen, but if it does, show appropriate message
            if (mode.value === 'signup') {
              error.value = 'Unable to create account. Please try again.'
            } else if (mode.value === 'manager') {
              error.value = 'No manager account found. Please verify your credentials or contact your administrator.'
            } else {
              error.value = 'No account found with this information. Please sign up to create a new account.'
            }
          } else if (statusCode === 500) {
            error.value = 'Server error. Please try again in a few moments.'
          } else {
            if (mode.value === 'signup') {
              error.value = 'Failed to create account. Please check your information and try again.'
            } else if (mode.value === 'manager') {
              error.value = 'Failed to sign in as manager. Please check your information and try again.'
            } else {
              error.value = 'Failed to sign in. Please check your information and try again.'
            }
          }
      }
    }
    
    // Auto-switch mode based on error (only if it makes sense)
    if (errorData.existingAccount && mode.value === 'signup') {
      // User tried to sign up but account exists - switch to sign in
      setTimeout(() => {
        switchToSignIn()
      }, 3000)
    }
    if (errorData.notFound && mode.value !== 'signup' && mode.value !== 'manager') {
      // User tried to sign in but account doesn't exist - switch to sign up
      setTimeout(() => {
        switchToSignUp()
      }, 3000)
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
