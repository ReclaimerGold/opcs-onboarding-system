<template>
  <div>
    <!-- W-4 Disclaimer -->
    <div class="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r">
      <h3 class="text-sm font-semibold text-gray-900 mb-2">Federal W-4 - Employee's Withholding Certificate</h3>
      <p class="text-xs text-gray-700 mb-2">
        Complete Form W-4 so that your employer can withhold the correct federal income tax from your pay. 
        Give Form W-4 to your employer. Your withholding is subject to review by the IRS.
      </p>
      <p class="text-xs text-gray-700 mb-2">
        <strong>Important:</strong> Does your name match the name on your social security card? If not, to ensure 
        you get credit for your earnings, contact SSA at 1-800-772-1213 or go to 
        <a href="https://www.ssa.gov" target="_blank" class="text-primary hover:underline">www.ssa.gov</a>.
      </p>
      <p class="text-xs text-gray-700">
        If you want to view form w-4 you can also 
        <a href="https://www.irs.gov/pub/irs-pdf/fw4.pdf" target="_blank" class="text-primary hover:underline">click here to go to the IRS Website</a>.
      </p>
    </div>
    
    <PrivacyNotice :show-consent="true" v-model:consented="ssnConsented" />
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 1: Personal Information & W-4</h2>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Auto-population:</strong> Your name, email, and phone number were entered during signup and will be 
            automatically filled in. These fields are locked to ensure consistency across all forms.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.firstName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your legal first name as it appears on your Social Security card. This field is pre-filled from your signup and cannot be changed.
                </span>
              </span>
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
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your middle name or middle initial (if applicable). This is optional.
                </span>
              </span>
            </label>
            <input
              v-model="formData.middleName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.lastName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your legal last name as it appears on your Social Security card. This field is pre-filled from your signup and cannot be changed.
                </span>
              </span>
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
              Phone Number
              <span v-if="formData.phone" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  US phone number in format (XXX) XXX-XXXX. Entered once during signup and will be used across all forms.
                </span>
              </span>
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
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.email" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your email address. We use Google for login access - it's best to provide that email address if possible. Entered once during signup.
                </span>
              </span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              required
              readonly
              :class="[
                'w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed',
                emailError ? 'border-red-500' : 'border-gray-300'
              ]"
            />
            <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed. We use Google for login access.</p>
            <p v-if="emailError" class="mt-1 text-xs text-red-600">{{ emailError }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Social Security Number <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your 9-digit Social Security Number in format XXX-XX-XXXX. Must match the name on your Social Security card. This will only be included in the PDF document, never stored in our database.
                </span>
              </span>
            </label>
            <input
              v-model="formData.ssn"
              type="text"
              pattern="[0-9]{3}-[0-9]{2}-[0-9]{4}"
              placeholder="XXX-XX-XXXX"
              maxlength="11"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              @input="formatSSN"
            />
            <p class="mt-1 text-xs text-gray-500">Format: XXX-XX-XXXX. Must match your Social Security card.</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span class="text-red-500">*</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your date of birth in MM/DD/YYYY format. This must match your Social Security card and other identification documents.
                </span>
              </span>
            </label>
            <input
              v-model="formData.dateOfBirth"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div class="md:col-span-2">
            <AddressSearch
              v-if="googleMapsApiKey"
              v-model="formData.address"
              label="Address"
              :required="true"
              description="Start typing your address and select from suggestions. This will auto-fill city, state, and zip code."
              placeholder="Start typing your address..."
              :api-key="googleMapsApiKey"
              @address-selected="handleAddressSelected"
            />
            <div v-else>
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
              State (2 letter) <span class="text-red-500">*</span>
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Two-letter state abbreviation (e.g., CA, NY, TX). Use uppercase letters.
                </span>
              </span>
            </label>
            <input
              v-model="formData.state"
              type="text"
              maxlength="2"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase"
              @input="formData.state = formData.state.toUpperCase()"
            />
            <p class="mt-1 text-xs text-gray-500">Two-letter state code (e.g., CA, NY, TX)</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Zip Code <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.zipCode"
              type="text"
              pattern="[0-9]{5}(-[0-9]{4})?"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        <div class="mt-6 border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">W-4 Section C: Filing Status</h3>
          <p class="text-sm text-gray-600 mb-4">
            Select your filing status. This determines how much federal income tax is withheld from your pay.
          </p>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                v-model="formData.filingStatus"
                type="radio"
                value="single"
                required
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>Single or Married Filing Separately</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.filingStatus"
                type="radio"
                value="married"
                required
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>Married Filing Jointly or Qualifying Widower</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.filingStatus"
                type="radio"
                value="head"
                required
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>Head of Household <span class="text-xs text-gray-500">(Check only if you're unmarried and pay more than half the costs of keeping up a home for yourself and a qualifying individual)</span></span>
            </label>
          </div>
          <p v-if="!formData.filingStatus" class="mt-2 text-xs text-red-600">Please select a filing status</p>
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Step 2: Multiple Jobs or Spouse</h3>
          <p class="text-sm text-gray-600 mb-4">
            Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly 
            and your spouse also works.
          </p>
          <p class="text-xs text-gray-500 mb-4">
            <strong>Step 2 Clarifications:</strong> The correct amount of withholding depends on the income earned 
            from all of these jobs. Do only one of the following. (a) Use the estimator at 
            <a href="https://www.irs.gov/W4App" target="_blank" class="text-primary hover:underline">www.irs.gov/W4App</a> 
            for the most accurate withholding for this step (and Steps 3-4); or (b) Use the Multiple Jobs Worksheet 
            on page 3 and enter the result in Step 4(c) below for roughly accurate withholding; or (c) If there are 
            only two jobs total, you may check this box. Do the same on Form W-4 for the other job. This option is 
            accurate for jobs with similar pay; otherwise, more tax than necessary may be withheld.
          </p>
          <p class="text-xs text-gray-500 mb-4">
            <strong>TIP:</strong> To be accurate, submit a 2023 Form W-4 for all other jobs. If you (or your spouse) have 
            self-employment income, including as an independent contractor, use the estimator. Complete Steps 3-4(b) 
            on Form W-4 for only ONE of these jobs. Leave those steps blank for the other jobs. (Your withholding will 
            be most accurate if you complete Steps 3-4(b) on the Form W-4 for the highest-paying job)
          </p>
          <label class="flex items-center">
            <input
              v-model="formData.multipleJobs"
              type="checkbox"
              class="mr-2 text-primary focus:ring-primary"
            />
            <span>Check here if you hold more than one job at a time, or are married filing jointly and your spouse also works</span>
          </label>
        </div>
        
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Number of Qualifying Children Under 17
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Enter the number of qualifying children under age 17. Each child reduces your withholding by $2,000 per year.
                </span>
              </span>
            </label>
            <input
              v-model.number="formData.qualifyingChildren"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p v-if="formData.qualifyingChildren > 0" class="mt-1 text-xs text-gray-600">
              Credit: ${{ (formData.qualifyingChildren * 2000).toLocaleString() }} ({{ formData.qualifyingChildren }} × $2,000)
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Number of Dependents
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Enter the number of other dependents (not qualifying children). Each dependent reduces your withholding by $500 per year.
                </span>
              </span>
            </label>
            <input
              v-model.number="formData.dependents"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p v-if="formData.dependents > 0" class="mt-1 text-xs text-gray-600">
              Credit: ${{ (formData.dependents * 500).toLocaleString() }} ({{ formData.dependents }} × $500)
            </p>
          </div>
        </div>
        
        <div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
          <p class="text-sm text-yellow-800">
            <strong>Step 3 Auto Calculate:</strong> The credits for qualifying children and dependents are automatically calculated above.
          </p>
        </div>
      </div>
      
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <button
            type="button"
            @click="saveDraft"
            :disabled="isSaving"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Draft</span>
          </button>
          <span v-if="lastSaved" class="text-xs text-gray-500">
            Draft saved {{ formatTime(lastSaved) }}
          </span>
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          :title="getSubmitButtonTooltip()"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Continue to Step 2</span>
        </button>
        <div v-if="getSubmitButtonTooltip()" class="mt-2 text-xs text-red-600">
          {{ getSubmitButtonTooltip() }}
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import PrivacyNotice from '../PrivacyNotice.vue'
import AddressSearch from '../ui/AddressSearch.vue'
import api from '../../services/api.js'
import { useFormDraft } from '../../composables/useFormDraft.js'
import { useApplicantData } from '../../composables/useApplicantData.js'
import { formatPhoneNumber, validatePhoneNumber, validateEmail as validateEmailUtil, formatEmail } from '../../utils/validation.js'
import { getSSNCookie, setSSNCookie } from '../../utils/cookies.js'

const emit = defineEmits(['submitted', 'form-data-change'])

const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  phone: '',
  email: '',
  ssn: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  filingStatus: 'single',
  multipleJobs: false,
  qualifyingChildren: 0,
  dependents: 0
})

const ssnConsented = ref(false)
const loading = ref(false)
const phoneError = ref('')
const emailError = ref('')
const googleMapsApiKey = ref('')

// Track if phone/email have been set (to lock them)
const phoneLocked = ref(false)
const emailLocked = ref(false)

// Draft functionality
const { isSaving, lastSaved, saveDraft } = useFormDraft(1, formData)

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

// Load applicant data and settings
onMounted(async () => {
  // Wait for applicant data to load
  if (loadingApplicant.value) {
    // Wait a bit for data to load
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Load applicant data
  if (applicantData.value) {
    formData.value.firstName = applicantData.value.firstName || ''
    formData.value.lastName = applicantData.value.lastName || ''
    formData.value.email = applicantData.value.email || ''
    formData.value.phone = applicantData.value.phone || ''
    
    // Lock fields if they were set during signup
    if (applicantData.value.email) {
      emailLocked.value = true
    }
    if (applicantData.value.phone) {
      phoneLocked.value = true
    }
  } else {
    // Try to load directly if composable didn't work
    try {
      const response = await api.get('/applicants/me')
      formData.value.firstName = response.data.firstName || ''
      formData.value.lastName = response.data.lastName || ''
      formData.value.email = response.data.email || ''
      formData.value.phone = response.data.phone || ''
      
      if (response.data.email) emailLocked.value = true
      if (response.data.phone) phoneLocked.value = true
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }
  
  // Load Google Maps API key
  try {
    const settingsResponse = await api.get('/settings/google-maps-key')
    googleMapsApiKey.value = settingsResponse.data.apiKey || ''
  } catch (error) {
    // Fallback to full settings endpoint
    try {
      const settingsResponse = await api.get('/settings')
      googleMapsApiKey.value = settingsResponse.data.google_maps_api_key || ''
    } catch (err) {
      console.error('Error loading Google Maps API key:', err)
    }
  }
  
  // Load SSN from cookie if available (temporary storage, expires in 1 hour)
  const savedSSN = getSSNCookie()
  if (savedSSN && savedSSN.match(/^\d{3}-\d{2}-\d{4}$/)) {
    formData.value.ssn = savedSSN
  }
})

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
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

const validateEmail = () => {
  if (!formData.value.email) {
    emailError.value = ''
    return
  }
  const validation = validateEmailUtil(formData.value.email)
  if (!validation.valid) {
    emailError.value = validation.message
  } else {
    emailError.value = ''
    formData.value.email = formatEmail(formData.value.email)
  }
}

const handleAddressSelected = (address) => {
  if (address) {
    formData.value.address = address.street || formData.value.address
    formData.value.city = address.city || formData.value.city
    formData.value.state = address.state || formData.value.state
    formData.value.zipCode = address.zip || formData.value.zipCode
  }
}

const getSubmitButtonTooltip = () => {
  const issues = []
  
  if (!ssnConsented.value) {
    issues.push('SSN consent required')
  }
  if (!formData.value.filingStatus) {
    issues.push('Filing status not selected (Section C)')
  }
  if (!formData.value.ssn || !formData.value.ssn.match(/^\d{3}-\d{2}-\d{4}$/)) {
    issues.push('Valid SSN required')
  }
  if (!formData.value.state || formData.value.state.length !== 2) {
    issues.push('State required (2 letters)')
  }
  if (phoneError.value) {
    issues.push('Phone number error')
  }
  if (emailError.value) {
    issues.push('Email error')
  }
  
  if (issues.length > 0) {
    return 'Please fix: ' + issues.join(', ')
  }
  return ''
}

const handleSubmit = async () => {
  // Collect all validation errors
  const errors = []
  
  if (!ssnConsented.value) {
    errors.push('Please consent to SSN collection to continue')
  }
  
  // Validate required fields
  if (!formData.value.firstName) {
    errors.push('First name is required')
  }
  if (!formData.value.lastName) {
    errors.push('Last name is required')
  }
  if (!formData.value.email) {
    errors.push('Email is required')
  }
  if (!formData.value.ssn || !formData.value.ssn.match(/^\d{3}-\d{2}-\d{4}$/)) {
    errors.push('Valid Social Security Number is required (format: XXX-XX-XXXX)')
  }
  if (!formData.value.dateOfBirth) {
    errors.push('Date of birth is required')
  }
  if (!formData.value.address) {
    errors.push('Address is required')
  }
  if (!formData.value.city) {
    errors.push('City is required')
  }
  if (!formData.value.state || formData.value.state.length !== 2) {
    errors.push('State is required (2-letter abbreviation)')
  }
  if (!formData.value.zipCode || !formData.value.zipCode.match(/^\d{5}(-\d{4})?$/)) {
    errors.push('Valid zip code is required')
  }
  if (!formData.value.filingStatus) {
    errors.push('Filing status is required (Section C)')
  }
  
  // Validate phone if provided and not locked
  if (!phoneLocked.value && formData.value.phone) {
    const phoneValidation = validatePhoneNumber(formData.value.phone)
    if (!phoneValidation.valid) {
      phoneError.value = phoneValidation.message
      errors.push(phoneValidation.message)
    }
  }
  
  // Validate email
  const emailValidation = validateEmailUtil(formData.value.email)
  if (!emailValidation.valid) {
    emailError.value = emailValidation.message
    errors.push(emailValidation.message)
  }
  
  // Show all errors
  if (errors.length > 0) {
    alert('Please fix the following errors:\n\n' + errors.join('\n'))
    return
  }
  
  loading.value = true
  try {
    await api.post('/forms/submit/1', {
      formData: formData.value,
      ssnConsented: true
    })
    emit('submitted', 1)
  } catch (error) {
    console.error('Submit error:', error)
    const errorMessage = error.response?.data?.error || 'Failed to submit form. Please try again.'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>
