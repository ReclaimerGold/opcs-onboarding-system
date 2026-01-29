<template>
  <div>
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
            Address fields from Step 1 will also be auto-populated if available. These fields are locked to ensure consistency across all forms.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.firstName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
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
              Middle Name
              <span v-if="formData.middleName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.middleName"
              type="text"
              :readonly="!!middleNameLocked"
              :class="middleNameLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="middleNameLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 1</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.lastName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
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
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.dateOfBirth" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.dateOfBirth"
              type="date"
              required
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">Pre-filled from Step 1 - cannot be changed</p>
          </div>
        </div>
        
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Address <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.address" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.address"
              type="text"
              required
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 1</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              City <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.city" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.city"
              type="text"
              required
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 1</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              State <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.state" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.state"
              type="text"
              required
              maxlength="2"
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed uppercase' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase'"
              @input="formData.state = formData.state.toUpperCase()"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 1</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.zipCode" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.zipCode"
              type="text"
              required
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 1</p>
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
            Upload Photo ID
            <!-- TODO: Re-add required after PDF testing -->
            <!-- <span class="text-red-500">*</span> -->
            <span class="ml-1 text-xs text-gray-500">(Optional for now)</span>
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            @change="handleFileUpload"
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
const addressLocked = ref(false)
const middleNameLocked = ref(false)

// Load applicant data and auto-populate fields
onMounted(async () => {
  if (loadingApplicant.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  if (applicantData.value) {
    formData.value.firstName = applicantData.value.firstName || applicantData.value.first_name || ''
    formData.value.lastName = applicantData.value.lastName || applicantData.value.last_name || ''
    formData.value.dateOfBirth = applicantData.value.dateOfBirth || applicantData.value.date_of_birth || ''
  } else {
    try {
      const response = await api.get('/applicants/me')
      formData.value.firstName = response.data.firstName || response.data.first_name || ''
      formData.value.lastName = response.data.lastName || response.data.last_name || ''
      formData.value.dateOfBirth = response.data.dateOfBirth || response.data.date_of_birth || ''
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }
  
  // Load address fields from Step 1 draft
  try {
    const step1Draft = await api.get('/forms/draft/1')
    if (step1Draft.data.success && step1Draft.data.formData) {
      const step1Data = step1Draft.data.formData
      
      // Auto-populate address fields from Step 1
      if (step1Data.address) {
        formData.value.address = step1Data.address
        addressLocked.value = true
      }
      if (step1Data.city) {
        formData.value.city = step1Data.city
        addressLocked.value = true
      }
      if (step1Data.state) {
        formData.value.state = step1Data.state
        addressLocked.value = true
      }
      if (step1Data.zipCode) {
        formData.value.zipCode = step1Data.zipCode
        addressLocked.value = true
      }
      
      // Auto-populate middle name if available
      if (step1Data.middleName) {
        formData.value.middleName = step1Data.middleName
        middleNameLocked.value = true
      }
    }
  } catch (error) {
    console.error('Error loading Step 1 draft:', error)
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

