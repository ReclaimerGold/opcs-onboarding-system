<template>
  <div class="max-w-4xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 5: Employment Acknowledgements</h2>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Auto-population:</strong> Your name was entered during signup and will be automatically filled in. 
            These fields are locked to ensure consistency across all forms.
          </p>
        </div>
        
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Part 1: At Will Employment - Training and Review Period</h3>
            <div class="prose max-w-none text-sm text-gray-700 space-y-3">
              <p>I understand that employment with Optimal Prime Cleaning Services is on an at-will basis, and that, unless otherwise prohibited by applicable law, employment may be terminated at any time, for any reason, with or without notice.</p>
              <p>Optimal Prime Cleaning Services provides an initial training and review period that, in general, will not exceed ninety (90) days.</p>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Part 2: Employment Handbook Acknowledgement</h3>
            <p class="text-sm text-gray-700">
              I have received access to the Optimal Prime Cleaning Services Employee Handbook located online at 
              <a href="https://www.optimalprimeservices.com/team" target="_blank" class="text-primary hover:underline">www.optimalprimeservices.com/team</a> 
              and understand that I must abide by all rules outlined in the booklet.
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                First Name <span class="text-red-500">*</span>
                <span class="ml-1 text-xs text-red-600">(Required)</span>
              </label>
              <input
                v-model="formData.firstName"
                type="text"
                required
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span class="text-red-500">*</span>
                <span class="ml-1 text-xs text-red-600">(Required)</span>
              </label>
              <input
                v-model="formData.lastName"
                type="text"
                required
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Signature</label>
            <div class="border-2 border-dashed border-gray-300 rounded-md p-4 h-32 flex items-center justify-center">
              <p class="text-gray-500 text-sm">Digital signature will be captured</p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              v-model="formData.date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Continue to Step 6</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api.js'
import { useApplicantData } from '../../composables/useApplicantData.js'

const emit = defineEmits(['submitted'])

const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  lastName: '',
  date: new Date().toISOString().split('T')[0]
})

const loading = ref(false)

// Load applicant data to sync name fields
onMounted(async () => {
  // Wait for applicant data to load
  if (loadingApplicant.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Load applicant data
  if (applicantData.value) {
    formData.value.firstName = applicantData.value.firstName || ''
    formData.value.lastName = applicantData.value.lastName || ''
  } else {
    // Try to load directly if composable didn't work
    try {
      const response = await api.get('/applicants/me')
      formData.value.firstName = response.data.firstName || ''
      formData.value.lastName = response.data.lastName || ''
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await api.post('/forms/submit/5', { formData: formData.value })
    emit('submitted', 5)
  } catch (error) {
    console.error('Submit error:', error)
    alert('Failed to submit form. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

