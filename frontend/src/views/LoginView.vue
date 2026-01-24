<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Main Content -->
    <div class="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 md:px-8 lg:px-10">
      <div class="max-w-6xl w-full space-y-8">
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
            Onboarding System
          </h1>
          <p class="text-lg text-gray-600">
            Welcome! What would you like to do?
          </p>
        </div>

        <!-- Tile Selection -->
        <div v-if="!mode || mode === 'selection'" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <!-- Sign Up Tile -->
          <button
            @click="switchToSignUp"
            class="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 group-hover:bg-primary transition-colors mb-4">
                <svg class="h-8 w-8 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Sign Up</h3>
              <p class="text-sm text-gray-600">Start your onboarding process</p>
            </div>
          </button>

          <!-- Sign In Tile -->
          <button
            @click="switchToSignIn"
            class="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 group-hover:bg-primary transition-colors mb-4">
                <svg class="h-8 w-8 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Sign In</h3>
              <p class="text-sm text-gray-600">Continue your onboarding</p>
            </div>
          </button>

          <!-- Manager Login Tile -->
          <button
            @click="switchToManager"
            class="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-transparent hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 group-hover:bg-primary transition-colors mb-4">
                <svg class="h-8 w-8 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Manager Login</h3>
              <p class="text-sm text-gray-600">Administrator access</p>
            </div>
          </button>
        </div>

        <!-- Form Section (shown when mode is selected) -->
        <div v-if="mode && mode !== 'selection'" class="max-w-md mx-auto">
          <div class="bg-white rounded-lg shadow-lg p-8">
            <!-- Back Button -->
            <button
              @click="switchToSelection"
              class="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span class="text-sm font-medium">Back to options</span>
            </button>

            <!-- Mode Header -->
            <div class="text-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                {{ getModeTitle() }}
              </h2>
              <p class="text-sm text-gray-600">
                {{ getModeDescription() }}
              </p>
            </div>

            <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <!-- Step indicator -->
        <div class="mb-4 text-center">
          <p class="text-sm text-gray-600">
            <span v-if="!requiresPassword">Step 1: Enter your information</span>
            <span v-else>Step 2: Enter your password</span>
          </p>
        </div>

        <!-- Instructions -->
        <div v-if="!requiresPassword" class="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p class="text-sm text-blue-800">
            <strong>Getting Started:</strong> Enter your first name, last name, and email address to begin.
          </p>
        </div>

        <div v-if="requiresPassword" class="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p class="text-sm text-blue-800">
            <strong>Administrator Access:</strong> This account requires a password for security.
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
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-6 px-4 sm:px-6 md:px-8 lg:px-10">
      <div class="max-w-full mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div class="text-sm text-gray-600">
          © {{ currentYear }} Optimal Prime Services. All rights reserved.
        </div>
        <div>
          <button
            @click="switchToManager"
            class="text-sm text-primary hover:text-primary-light font-medium transition-colors"
          >
            Admin Access
          </button>
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

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('selection') // 'selection', 'signup', 'signin', or 'manager'
const currentYear = new Date().getFullYear()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const requiresPassword = ref(false)
const loginPhase = ref(1) // 1 = name/email, 2 = password

// Get title based on current mode
const getModeTitle = () => {
  switch (mode.value) {
    case 'signup':
      return 'Create Your Account'
    case 'signin':
      return 'Welcome Back'
    case 'manager':
      return 'Manager Access'
    default:
      return ''
  }
}

// Get description based on current mode
const getModeDescription = () => {
  switch (mode.value) {
    case 'signup':
      return 'Enter your information to begin the onboarding process'
    case 'signin':
      return 'Enter your information to continue where you left off'
    case 'manager':
      return 'Enter your credentials to access the admin dashboard'
    default:
      return ''
  }
}

// Switch to selection mode
const switchToSelection = () => {
  error.value = ''
  mode.value = 'selection'
  requiresPassword.value = false
  loginPhase.value = 1
  password.value = ''
  firstName.value = ''
  lastName.value = ''
  email.value = ''
}

// Clear error when switching modes
const switchToSignUp = () => {
  error.value = ''
  mode.value = 'signup'
  requiresPassword.value = false
  loginPhase.value = 1
  password.value = ''
}

const switchToSignIn = () => {
  error.value = ''
  mode.value = 'signin'
  requiresPassword.value = false
  loginPhase.value = 1
  password.value = ''
}

const switchToManager = () => {
  error.value = ''
  mode.value = 'manager'
  requiresPassword.value = false
  loginPhase.value = 1
  password.value = ''
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
    if (mode.value === 'signup') {
      // Signup flow
      const response = await api.post('/auth/signup', {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value
      })
      
      if (response.data.success) {
        // Update auth store
        authStore.user = response.data.applicant
        authStore.isAuthenticated = true
        authStore.isAdmin = response.data.applicant?.isAdmin || false
        localStorage.setItem('authToken', 'authenticated')
        
        // Check if admin and needs password setup
        if (authStore.isAdmin) {
          // Check password status
          try {
            const passwordStatus = await api.get('/auth/password-status')
            if (passwordStatus.data.requiresPassword) {
              router.push('/password-setup')
              return
            }
          } catch (err) {
            // If check fails, continue to admin dashboard
          }
          router.push('/admin')
        } else {
          router.push('/forms')
        }
      }
    } else {
      // Login flow (signin or manager)
      const loginData = {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value
      }
      
      // If password is provided, include it
      if (requiresPassword.value && password.value) {
        loginData.password = password.value
      }
      
      const response = await api.post('/auth/login', loginData)
      
      if (response.data.success) {
        // Check if password is required (Phase 1 response)
        if (response.data.requiresPassword !== undefined && !password.value) {
          requiresPassword.value = response.data.requiresPassword
          loginPhase.value = 2
          loading.value = false
          return
        }
        
        // Login successful (Phase 2 or no password required)
        authStore.user = response.data.applicant
        authStore.isAuthenticated = true
        authStore.isAdmin = response.data.applicant?.isAdmin || false
        localStorage.setItem('authToken', 'authenticated')
        
        // Redirect based on user type and onboarding status
        if (authStore.isAdmin) {
          // Check if password setup is required
          try {
            const passwordStatus = await api.get('/auth/password-status')
            if (passwordStatus.data.requiresPassword) {
              router.push('/password-setup')
              return
            }
          } catch (err) {
            // If check fails, continue to admin dashboard
          }
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
