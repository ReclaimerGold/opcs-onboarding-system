<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Main Content -->
    <div class="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 md:px-8 lg:px-10">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <div class="flex justify-center mb-6">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-20 w-auto"
            />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {{ pageTitle }}
          </h1>
          <p class="text-gray-600">
            {{ pageDescription }}
          </p>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <!-- Loading State -->
          <div v-if="verifying" class="text-center py-8">
            <svg class="animate-spin mx-auto h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-gray-600">Verifying your reset link...</p>
          </div>

          <!-- Invalid Token State -->
          <div v-else-if="tokenInvalid" class="text-center py-8">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Invalid or Expired Link</h3>
            <p class="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <router-link
              to="/forgot-password"
              class="inline-block px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Request New Reset Link
            </router-link>
          </div>

          <!-- Success State -->
          <div v-else-if="success" class="text-center py-8">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Password Reset Successful</h3>
            <p class="text-gray-600 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <router-link
              to="/login"
              class="inline-block px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Go to Login
            </router-link>
          </div>

          <!-- Reset Form -->
          <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Error Message -->
            <div v-if="error" class="rounded-md bg-red-50 border border-red-200 p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div class="ml-3">
                  <p class="text-sm text-red-800">{{ error }}</p>
                </div>
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                New Password <span class="text-red-500">*</span>
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                minlength="8"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter new password (minimum 8 characters)"
              />
              <p class="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span class="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                minlength="8"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Confirm new password"
              />
              <p v-if="passwordMismatch" class="mt-1 text-xs text-red-600">Passwords do not match</p>
            </div>

            <div>
              <button
                type="submit"
                :disabled="loading || passwordMismatch || !isPasswordValid"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Password...
                </span>
                <span v-else>Reset Password</span>
              </button>
            </div>

            <div class="text-center">
              <router-link
                to="/login"
                class="text-sm text-primary hover:text-primary-light"
              >
                Back to login
              </router-link>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-6 px-4 sm:px-6 md:px-8 lg:px-10">
      <div class="max-w-full mx-auto text-center">
        <p class="text-sm text-gray-600">
          &copy; {{ currentYear }} Optimal Prime Services. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api.js'

const route = useRoute()
const router = useRouter()
const currentYear = new Date().getFullYear()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const verifying = ref(true)
const tokenInvalid = ref(false)
const success = ref(false)
const error = ref('')

const passwordMismatch = computed(() => {
  return password.value && confirmPassword.value && password.value !== confirmPassword.value
})

const isPasswordValid = computed(() => {
  return password.value.length >= 8 && confirmPassword.value.length >= 8 && !passwordMismatch.value
})

const pageTitle = computed(() => {
  if (tokenInvalid.value) return 'Link Expired'
  if (success.value) return 'Success!'
  return 'Set New Password'
})

const pageDescription = computed(() => {
  if (tokenInvalid.value) return 'This reset link is no longer valid.'
  if (success.value) return 'Your password has been updated.'
  return 'Enter your new password below.'
})

onMounted(async () => {
  // Get token from query params
  token.value = route.query.token || ''
  
  if (!token.value) {
    tokenInvalid.value = true
    verifying.value = false
    return
  }
  
  // Verify token is valid
  try {
    const response = await api.get('/auth/verify-reset-token', {
      params: { token: token.value }
    })
    
    if (!response.data.valid) {
      tokenInvalid.value = true
    }
  } catch (err) {
    tokenInvalid.value = true
  } finally {
    verifying.value = false
  }
})

const handleSubmit = async () => {
  if (!isPasswordValid.value || !token.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/auth/reset-password', {
      token: token.value,
      password: password.value,
      confirmPassword: confirmPassword.value
    })
    
    if (response.data.success) {
      success.value = true
    }
  } catch (err) {
    const errorData = err.response?.data || {}
    
    if (errorData.code === 'INVALID_TOKEN') {
      tokenInvalid.value = true
    } else {
      error.value = errorData.error || 'Failed to reset password. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
