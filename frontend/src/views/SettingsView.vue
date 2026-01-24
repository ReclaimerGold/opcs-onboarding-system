<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-3">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-10 w-auto"
            />
            <h1 class="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</router-link>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Google Drive API Configuration</h2>
        
        <form @submit.prevent="handleSave" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google Drive Folder ID
            </label>
            <input
              v-model="settings.google_drive_folder_id"
              type="text"
              placeholder="Leave empty to use root folder"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Optional: Specify a folder ID where employee documents will be stored. Leave empty to use root.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth Client ID <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.google_client_id"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Get this from Google Cloud Console
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth Client Secret <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.google_client_secret"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth Refresh Token <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.google_refresh_token"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Generate this using OAuth2 flow. All credentials are encrypted before storage.
            </p>
          </div>
          
          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Google Maps API Configuration</h3>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Google Maps API Key
              </label>
              <input
                v-model="settings.google_maps_api_key"
                type="text"
                placeholder="Enter your Google Maps API key"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <p class="mt-1 text-xs text-gray-500">
                Required for address autocomplete. Get your API key from 
                <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" class="text-primary hover:underline">Google Cloud Console</a>.
                Enable "Places API" for your project.
              </p>
            </div>
          </div>
          
          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>
          
          <div v-if="success" class="rounded-md bg-green-50 p-4">
            <p class="text-sm text-green-800">Settings saved successfully!</p>
          </div>
          
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <span v-if="loading">Saving...</span>
              <span v-else>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api.js'

const settings = ref({
  google_drive_folder_id: '',
  google_client_id: '',
  google_client_secret: '',
  google_refresh_token: '',
  google_maps_api_key: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

onMounted(async () => {
  try {
    const response = await api.get('/settings')
    settings.value = { ...settings.value, ...response.data }
  } catch (err) {
    console.error('Error loading settings:', err)
  }
})

const handleSave = async () => {
  loading.value = true
  error.value = ''
  success.value = false
  
  try {
    await api.post('/settings', { settings: settings.value })
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save settings'
  } finally {
    loading.value = false
  }
}
</script>

