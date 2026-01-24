<template>
  <div class="max-w-md mx-auto">
    <div class="bg-white shadow-md rounded-lg p-6">
      <div class="flex justify-center mb-6">
        <img 
          src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
          alt="Optimal Prime Services Logo" 
          class="h-16 w-auto"
        />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">Set Administrator Password</h2>
      
      <div v-if="message" :class="[
        'mb-4 p-4 rounded-md',
        messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
      ]">
        {{ message }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            New Password <span class="text-red-500">*</span>
            <span class="ml-1 text-xs text-red-600">(Required)</span>
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Enter password (minimum 8 characters)"
          />
          <p class="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span class="text-red-500">*</span>
            <span class="ml-1 text-xs text-red-600">(Required)</span>
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Confirm password"
          />
          <p v-if="passwordMismatch" class="mt-1 text-xs text-red-600">Passwords do not match</p>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="handleCancel"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading || passwordMismatch || !isFormValid"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            <span v-if="loading">Setting Password...</span>
            <span v-else>Set Password</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api.js'

const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref('')

const passwordMismatch = computed(() => {
  return password.value && confirmPassword.value && password.value !== confirmPassword.value
})

const isFormValid = computed(() => {
  return password.value.length >= 8 && confirmPassword.value.length >= 8 && !passwordMismatch.value
})

const handleSubmit = async () => {
  if (passwordMismatch.value) {
    message.value = 'Passwords do not match'
    messageType.value = 'error'
    return
  }

  if (password.value.length < 8) {
    message.value = 'Password must be at least 8 characters long'
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''

  try {
    const response = await api.post('/auth/set-password', {
      password: password.value,
      confirmPassword: confirmPassword.value
    })

    if (response.data.success) {
      message.value = 'Password set successfully! Redirecting...'
      messageType.value = 'success'
      
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    }
  } catch (err) {
    const errorData = err.response?.data || {}
    message.value = errorData.error || 'Failed to set password. Please try again.'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/admin')
}
</script>

