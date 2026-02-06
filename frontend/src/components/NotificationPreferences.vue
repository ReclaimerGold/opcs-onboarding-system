<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-3">
            <img
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png"
              alt="Optimal Prime Services Logo"
              class="h-10 w-auto"
            />
            <h1 class="text-xl font-semibold text-gray-900">Notification Preferences</h1>
          </div>
          <div class="flex items-center space-x-4">
            <NotificationBell />
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900 text-sm">Back to Dashboard</router-link>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <svg class="animate-spin h-8 w-8 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-500">Loading preferences...</p>
      </div>

      <template v-else>
        <!-- Success banner -->
        <div v-if="saveMessage" class="mb-6 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {{ saveMessage }}
        </div>

        <!-- Reset button -->
        <div class="flex justify-end mb-4">
          <button
            @click="handleReset"
            class="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reset to defaults
          </button>
        </div>

        <!-- Admin/Manager Notifications -->
        <div v-if="adminPreferences.length > 0" class="bg-white shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Admin & Manager Notifications</h2>
            <p class="text-sm text-gray-500 mt-1">Notifications about applicant activity and system events.</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="pref in adminPreferences"
              :key="pref.type"
              class="px-6 py-4 flex items-center justify-between"
            >
              <div class="flex-1 mr-6">
                <p class="text-sm font-medium text-gray-900">{{ pref.label }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ pref.description }}</p>
              </div>
              <div class="flex items-center space-x-6">
                <!-- In-app toggle -->
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="pref.in_app_enabled"
                    @change="updatePref(pref.type, 'in_app_enabled', $event.target.checked)"
                    class="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-xs text-gray-600">In-app</span>
                </label>
                <!-- Email toggle -->
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="pref.email_enabled"
                    @change="updatePref(pref.type, 'email_enabled', $event.target.checked)"
                    class="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-xs text-gray-600">Email</span>
                </label>
                <!-- Email frequency -->
                <select
                  :value="pref.email_frequency"
                  @change="updatePref(pref.type, 'email_frequency', $event.target.value)"
                  :disabled="!pref.email_enabled"
                  class="text-xs border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="realtime">Real-time</option>
                  <option value="daily_digest">Daily digest</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Applicant Notifications -->
        <div v-if="applicantPreferences.length > 0" class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Your Notifications</h2>
            <p class="text-sm text-gray-500 mt-1">Personal notifications about your onboarding progress.</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="pref in applicantPreferences"
              :key="pref.type"
              class="px-6 py-4 flex items-center justify-between"
            >
              <div class="flex-1 mr-6">
                <p class="text-sm font-medium text-gray-900">{{ pref.label }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ pref.description }}</p>
              </div>
              <div class="flex items-center space-x-6">
                <!-- In-app toggle -->
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="pref.in_app_enabled"
                    @change="updatePref(pref.type, 'in_app_enabled', $event.target.checked)"
                    class="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-xs text-gray-600">In-app</span>
                </label>
                <!-- Email toggle -->
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="pref.email_enabled"
                    @change="updatePref(pref.type, 'email_enabled', $event.target.checked)"
                    class="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-xs text-gray-600">Email</span>
                </label>
                <!-- Email frequency -->
                <select
                  :value="pref.email_frequency"
                  @change="updatePref(pref.type, 'email_frequency', $event.target.value)"
                  :disabled="!pref.email_enabled"
                  class="text-xs border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="realtime">Real-time</option>
                  <option value="daily_digest">Daily digest</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api.js'
import NotificationBell from './NotificationBell.vue'

const preferences = ref([])
const loading = ref(true)
const saveMessage = ref('')

const adminPreferences = computed(() => preferences.value.filter(p => p.category === 'admin'))
const applicantPreferences = computed(() => preferences.value.filter(p => p.category === 'applicant'))

onMounted(async () => {
  await fetchPreferences()
})

async function fetchPreferences() {
  loading.value = true
  try {
    const { data } = await api.get('/notifications/preferences')
    preferences.value = data.preferences || []
  } catch (error) {
    console.error('Failed to fetch preferences:', error)
  } finally {
    loading.value = false
  }
}

async function updatePref(type, field, value) {
  // Update local state immediately
  const pref = preferences.value.find(p => p.type === type)
  if (pref) {
    if (field === 'in_app_enabled' || field === 'email_enabled') {
      pref[field] = value ? 1 : 0
    } else {
      pref[field] = value
    }
  }

  // Save to server
  try {
    await api.put('/notifications/preferences', {
      preferences: [{
        type,
        [field]: field === 'email_frequency' ? value : (value ? 1 : 0)
      }]
    })
    showSaveMessage()
  } catch (error) {
    console.error('Failed to save preference:', error)
    // Revert on error
    await fetchPreferences()
  }
}

async function handleReset() {
  try {
    await api.post('/notifications/preferences/reset')
    await fetchPreferences()
    showSaveMessage('Preferences reset to defaults')
  } catch (error) {
    console.error('Failed to reset preferences:', error)
  }
}

let saveTimeout = null
function showSaveMessage(msg = 'Preferences saved') {
  saveMessage.value = msg
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveMessage.value = ''
  }, 2000)
}
</script>
