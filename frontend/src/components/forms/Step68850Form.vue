<template>
  <div>
    <PrivacyNotice :show-consent="true" v-model:consented="ssnConsented" />
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 6: IRS Form 8850</h2>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Auto-population:</strong> This form automatically fills in information from your previous steps, including your name, email, phone number, address, and date of birth. 
            Please review and complete any remaining required fields.
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
            <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Middle
              <span v-if="formData.middle" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.middle"
              type="text"
              :readonly="!!middleNameLocked"
              :class="middleNameLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="middleNameLocked" class="mt-1 text-xs text-gray-500">Pre-filled from previous step</p>
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
            <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Social Security Number <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.ssn" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.ssn"
              type="text"
              pattern="[0-9]{3}-[0-9]{2}-[0-9]{4}"
              placeholder="XXX-XX-XXXX"
              maxlength="11"
              required
              :class="formData.ssn ? 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary' : 'w-full px-3 py-2 border-2 border-red-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'"
              @input="formatSSN"
            />
            <p v-if="!formData.ssn" class="mt-1 text-xs text-red-600">This field is required</p>
            <p v-else-if="formData.ssn.match(/^\d{3}-\d{2}-\d{4}$/)" class="mt-1 text-xs text-gray-500">Pre-filled from previous step (stored temporarily in browser cookie)</p>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Street Address
              <span v-if="formData.address" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.address"
              type="text"
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 3</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              City
              <span v-if="formData.city" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.city"
              type="text"
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 3</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              State (2 letter)
              <span v-if="formData.state" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.state"
              type="text"
              maxlength="2"
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed uppercase' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 3</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Zip
              <span v-if="formData.zip" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.zip"
              type="text"
              :readonly="!!addressLocked"
              :class="addressLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="addressLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 3</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              County <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
            </label>
            <input
              v-model="formData.county"
              type="text"
              required
              placeholder="e.g. Minnehaha/Lincoln"
              :class="formData.county ? 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary' : 'w-full px-3 py-2 border-2 border-red-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500'"
            />
            <p v-if="!formData.county" class="mt-1 text-xs text-red-600">This field is required</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Telephone
              <span v-if="formData.phone" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.phone"
              type="tel"
              placeholder="(000) 000-0000"
              :readonly="phoneLocked"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary',
                phoneLocked ? 'bg-gray-100 cursor-not-allowed' : '',
                phoneError ? 'border-red-500' : 'border-gray-300'
              ]"
              @input="formatPhone"
              @blur="validatePhone"
            />
            <p v-if="phoneLocked" class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
            <p v-else class="mt-1 text-xs text-gray-500">US phone number only (10 digits)</p>
            <p v-if="phoneError" class="mt-1 text-xs text-red-600">{{ phoneError }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email <span class="text-red-500">*</span>
              <span v-if="formData.email" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              required
              :readonly="!!emailLocked"
              :class="emailLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="emailLocked" class="mt-1 text-xs text-gray-500">Pre-filled from signup</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
              <span v-if="formData.dateOfBirth" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.dateOfBirth"
              type="date"
              :readonly="!!dateOfBirthLocked"
              :class="dateOfBirthLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="dateOfBirthLocked" class="mt-1 text-xs text-gray-500">Pre-filled from Step 1</p>
          </div>
        </div>
        
        <div class="mt-6 space-y-4">
          <div>
            <label class="flex items-start">
              <input v-model="formData.question1" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm">Check here if you received a conditional certification from the state workforce agency</span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question2" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm">Check here if any of the following statements apply to you (TANF, SNAP, veteran, etc.)</span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question3" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm">Check here if you are a veteran and were unemployed for 6+ months during the past year</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Have You Ever Worked For This Employer Before?</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input v-model="formData.previousEmployment" type="radio" value="yes" class="mr-2 text-primary focus:ring-primary" />
                <span>Yes</span>
              </label>
              <label class="flex items-center">
                <input v-model="formData.previousEmployment" type="radio" value="no" class="mr-2 text-primary focus:ring-primary" />
                <span>No</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Show missing required fields warning -->
      <div v-if="missingRequiredFields.length > 0 && !loading" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <strong>Please complete the following required fields:</strong>
            </p>
            <ul class="mt-2 text-sm text-yellow-700 list-disc list-inside">
              <li v-for="field in missingRequiredFields" :key="field">{{ field }}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="!ssnConsented || loading || missingRequiredFields.length > 0"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Complete Onboarding</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import PrivacyNotice from '../PrivacyNotice.vue'
import api from '../../services/api.js'
import { useApplicantData } from '../../composables/useApplicantData.js'
import { getSSNCookie, setSSNCookie } from '../../utils/cookies.js'
import { formatPhoneNumber, validatePhoneNumber } from '../../utils/validation.js'

const emit = defineEmits(['submitted', 'form-data-change'])

const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  middle: '',
  lastName: '',
  ssn: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  county: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  question1: false,
  question2: false,
  question3: false,
  previousEmployment: 'no'
})

const ssnConsented = ref(false)
const loading = ref(false)
const phoneError = ref('')

// Track which fields are locked (auto-populated)
const phoneLocked = ref(false)
const emailLocked = ref(false)
const dateOfBirthLocked = ref(false)
const addressLocked = ref(false)
const middleNameLocked = ref(false)

// Emit form data changes for real-time preview (debounced)
let emitDebounceTimer = null
watch(formData, () => {
  if (emitDebounceTimer) {
    clearTimeout(emitDebounceTimer)
  }
  emitDebounceTimer = setTimeout(() => {
    emit('form-data-change', { ...formData.value })
  }, 300) // 300ms debounce for form data changes
}, { deep: true })

// Load applicant data and previous form data to auto-populate all available fields
onMounted(async () => {
  // Wait for applicant data to load
  if (loadingApplicant.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  let applicant = null
  
  // Load applicant data
  if (applicantData.value) {
    applicant = applicantData.value
  } else {
    // Try to load directly if composable didn't work
    try {
      const response = await api.get('/applicants/me')
      applicant = response.data
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }
  
  if (applicant) {
    // Auto-populate from applicant record
    formData.value.firstName = applicant.firstName || applicant.first_name || ''
    formData.value.lastName = applicant.lastName || applicant.last_name || ''
    
    // Email and phone from signup
    if (applicant.email) {
      formData.value.email = applicant.email
      emailLocked.value = true
    }
    if (applicant.phone) {
      formData.value.phone = applicant.phone
      phoneLocked.value = true
    }
    
    // Date of birth from Step 1
    if (applicant.dateOfBirth || applicant.date_of_birth) {
      formData.value.dateOfBirth = applicant.dateOfBirth || applicant.date_of_birth
      dateOfBirthLocked.value = true
    }
    
    // Address fields from Step 3 (stored in applicant record)
    if (applicant.address) {
      formData.value.address = applicant.address
      addressLocked.value = true
    }
    if (applicant.city) {
      formData.value.city = applicant.city
      addressLocked.value = true
    }
    if (applicant.state) {
      formData.value.state = applicant.state
      addressLocked.value = true
    }
    if (applicant.zipCode || applicant.zip_code) {
      formData.value.zip = applicant.zipCode || applicant.zip_code
      addressLocked.value = true
    }
  }
  
  // Try to load middle name and phone from Step 1 or Step 3 drafts
  try {
    // Check Step 1 draft first
    const step1Draft = await api.get('/forms/draft/1')
    if (step1Draft.data?.success && step1Draft.data?.formData) {
      const step1Data = step1Draft.data.formData
      
      // Load middle name
      if (step1Data.middleName) {
        formData.value.middle = step1Data.middleName
        middleNameLocked.value = true
      }
      
      // Load phone if not already loaded from applicant record
      if (!formData.value.phone && step1Data.phone) {
        formData.value.phone = step1Data.phone
        phoneLocked.value = true
      }
    } else {
      // Check Step 3 draft for middle name
      const step3Draft = await api.get('/forms/draft/3')
      if (step3Draft.data?.success && step3Draft.data?.formData?.middleName) {
        formData.value.middle = step3Draft.data.formData.middleName
        middleNameLocked.value = true
      }
    }
  } catch (error) {
    // Drafts might not exist, that's okay
    console.log('No drafts found for additional fields')
  }
  
  // Load SSN from cookie if available (temporary storage, expires in 1 hour)
  const savedSSN = getSSNCookie()
  if (savedSSN && savedSSN.match(/^\d{3}-\d{2}-\d{4}$/)) {
    formData.value.ssn = savedSSN
  }
})

// Computed property to check which required fields are missing
const missingRequiredFields = computed(() => {
  const missing = []
  if (!formData.value.ssn) missing.push('Social Security Number')
  if (!formData.value.email) missing.push('Email')
  if (!formData.value.county) missing.push('County')
  // Check phone validation if phone is provided but not locked
  if (formData.value.phone && !phoneLocked.value && phoneError.value) {
    missing.push('Valid Phone Number')
  }
  return missing
})

const formatPhone = (e) => {
  const formatted = formatPhoneNumber(e.target.value)
  formData.value.phone = formatted
  phoneError.value = ''
}

const validatePhone = () => {
  if (!formData.value.phone) {
    phoneError.value = ''
    return
  }
  const validation = validatePhoneNumber(formData.value.phone)
  if (!validation.valid) {
    phoneError.value = validation.message
  } else {
    phoneError.value = ''
  }
}

const formatSSN = (e) => {
  let value = e.target.value.replace(/\D/g, '')
  if (value.length >= 6) {
    value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 9)
  } else if (value.length >= 3) {
    value = value.slice(0, 3) + '-' + value.slice(3)
  }
  formData.value.ssn = value
  
  // Save to cookie when SSN is complete (XXX-XX-XXXX format)
  if (value.match(/^\d{3}-\d{2}-\d{4}$/)) {
    setSSNCookie(value)
  }
}

const handleSubmit = async () => {
  if (!ssnConsented.value) {
    alert('Please consent to SSN collection to continue')
    return
  }
  
  // Validate phone if provided and not locked
  if (formData.value.phone && !phoneLocked.value) {
    const phoneValidation = validatePhoneNumber(formData.value.phone)
    if (!phoneValidation.valid) {
      phoneError.value = phoneValidation.message
      alert('Please fix the phone number error before submitting.')
      return
    }
  }
  
  // Check for missing required fields
  if (missingRequiredFields.value.length > 0) {
    alert('Please complete all required fields before submitting.')
    return
  }
  
  loading.value = true
  try {
    await api.post('/forms/submit/6', {
      formData: formData.value,
      ssnConsented: true
    })
    emit('submitted', 6)
  } catch (error) {
    console.error('Submit error:', error)
    alert('Failed to submit form. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

