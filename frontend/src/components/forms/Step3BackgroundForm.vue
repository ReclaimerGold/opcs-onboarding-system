<template>
  <div class="max-w-4xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 3: Criminal Conviction/Background Check</h2>
        
        <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
          <p class="text-sm text-red-800 font-semibold">
            Please Note: If You Falsify Data You Will Be Terminated. 
            It is Better to Be Upfront and Honest. A Criminal conviction does not necessarily disqualify you from employment.
          </p>
        </div>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Auto-population:</strong> Your name and date of birth were entered during signup and will be automatically filled in. 
            These fields are locked to ensure consistency across all forms.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.firstName"
              type="text"
              required
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">Auto-populated from your profile</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input
              v-model="formData.middleName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.lastName"
              type="text"
              required
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">Auto-populated from your profile</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.dateOfBirth"
              type="date"
              required
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">Auto-populated from your profile</p>
          </div>
        </div>
        
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Address <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.address"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              City <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.city"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              State <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.state"
              type="text"
              required
              maxlength="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.zipCode"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        <div class="mt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Have you ever been convicted of a crime resulting in your classification as a sex offender in any state? <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="formData.sexOffender"
                  type="radio"
                  value="yes"
                  class="mr-2 text-primary focus:ring-primary"
                />
                <span>Yes</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="formData.sexOffender"
                  type="radio"
                  value="no"
                  class="mr-2 text-primary focus:ring-primary"
                />
                <span>No</span>
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Have you been convicted of any crimes in the past 7 years? <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="formData.crimesPast7Years"
                  type="radio"
                  value="yes"
                  class="mr-2 text-primary focus:ring-primary"
                />
                <span>Yes</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="formData.crimesPast7Years"
                  type="radio"
                  value="no"
                  class="mr-2 text-primary focus:ring-primary"
                />
                <span>No</span>
              </label>
            </div>
            <div v-if="formData.crimesPast7Years === 'yes'" class="mt-2">
              <textarea
                v-model="formData.crimeDetails"
                placeholder="Please provide details..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Upload Photo ID <span class="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            @change="handleFileUpload"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Continue to Step 4</span>
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
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  sexOffender: 'no',
  crimesPast7Years: 'no',
  crimeDetails: '',
  photoIdFile: null
})

const loading = ref(false)

// Load applicant data and auto-populate fields
onMounted(async () => {
  if (loadingApplicant.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  if (applicantData.value) {
    formData.value.firstName = applicantData.value.firstName || applicantData.value.first_name || ''
    formData.value.lastName = applicantData.value.lastName || applicantData.value.last_name || ''
    formData.value.dateOfBirth = applicantData.value.dateOfBirth || applicantData.value.date_of_birth || ''
    // Address fields are NOT auto-populated - user enters them in this step
  } else {
    try {
      const response = await api.get('/applicants/me')
      formData.value.firstName = response.data.firstName || response.data.first_name || ''
      formData.value.lastName = response.data.lastName || response.data.last_name || ''
      formData.value.dateOfBirth = response.data.dateOfBirth || response.data.date_of_birth || ''
      // Address fields are NOT auto-populated - user enters them in this step
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }
})

const handleFileUpload = (e) => {
  formData.value.photoIdFile = e.target.files[0]
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('formData', JSON.stringify(formData.value))
    if (formData.value.photoIdFile) {
      formDataToSend.append('document', formData.value.photoIdFile)
    }
    
    await api.post('/forms/submit/3', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    emit('submitted', 3)
  } catch (error) {
    console.error('Submit error:', error)
    alert('Failed to submit form. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

