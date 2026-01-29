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
            Reset Your Password
          </h1>
          <p class="text-gray-600">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <!-- Form Card -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <!-- Back Link -->
          <router-link
            to="/login"
            class="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="text-sm font-medium">Back to login</span>
          </router-link>

          <!-- Success Message -->
          <div v-if="submitted" class="text-center py-8">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
            <p class="text-gray-600 mb-6">
              If an account exists with <strong>{{ email }}</strong>, we've sent password reset instructions.
            </p>
            <p class="text-sm text-gray-500 mb-6">
              Didn't receive an email? Check your spam folder or try again.
            </p>
            <div class="space-y-3">
              <button
                @click="resetForm"
                class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Try Another Email
              </button>
              <router-link
                to="/login"
                class="block w-full px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-center"
              >
                Back to Login
              </router-link>
            </div>
          </div>

          <!-- Form -->
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
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span class="text-red-500">*</span>
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <button
                type="submit"
                :disabled="loading || !email"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
                <span v-else>Send Reset Instructions</span>
              </button>
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
import { ref } from 'vue'
import api from '../services/api.js'

const currentYear = new Date().getFullYear()

const email = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

const handleSubmit = async () => {
  if (!email.value) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    await api.post('/auth/forgot-password', {
      email: email.value
    })
    
    // Always show success to prevent email enumeration
    submitted.value = true
  } catch (err) {
    const errorData = err.response?.data || {}
    
    if (errorData.code === 'EMAIL_NOT_CONFIGURED') {
      error.value = 'Email service is not available. Please contact an administrator.'
    } else if (errorData.code === 'EMAIL_SEND_FAILED') {
      error.value = 'Failed to send email. Please try again later.'
    } else {
      // For other errors, still show success to prevent enumeration
      submitted.value = true
    }
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  email.value = ''
  submitted.value = false
  error.value = ''
}
</script>
