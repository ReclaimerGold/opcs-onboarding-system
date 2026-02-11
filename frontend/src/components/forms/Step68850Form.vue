<template>
  <div>
    <SSNConsentModal :open="showConsentModal" v-model:consented="ssnConsented" />
    
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
              <span v-if="formData.middleName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.middleName"
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
              <span v-if="formData.zipCode" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.zipCode"
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
            <NonGmailEmailNotice :email="formData.email" />
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
          <p class="text-sm font-medium text-gray-700 mb-2">Check all that apply (targeted group / certification):</p>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question1" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>1.</strong> Check here if you received a conditional certification from the state workforce agency</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question1 }}</span>
              </span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question2" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>2.</strong> Check here if any of the following statements apply to you (TANF, SNAP, veteran, etc.)</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question2 }}</span>
              </span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question3" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>3.</strong> Check here if you are a veteran and were unemployed for 6+ months during the past year</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question3 }}</span>
              </span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question4" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>4.</strong> Check here if you are a designated community resident (age 18–39, Rural Renewal County or Empowerment Zone)</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question4 }}</span>
              </span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question5" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>5.</strong> Check here if you were referred by a vocational rehabilitation agency (state, Employment Network, or VA)</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question5 }}</span>
              </span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question6" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>6.</strong> Check here if you are a qualified summer youth employee (age 16–17, Empowerment Zone)</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question6 }}</span>
              </span>
            </label>
          </div>
          <div>
            <label class="flex items-start">
              <input v-model="formData.question7" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
              <span class="text-sm"><strong>7.</strong> Check here if you are a qualified SNAP (food stamps) recipient</span>
              <span class="ml-1 relative group flex-shrink-0">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Form 8850 explanation">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">{{ tooltips.question7 }}</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <SignaturePad
          :model-value="formData.signatureData"
          @update:model-value="formData.signatureData = $event"
          label="Signature"
          description="Sign above or type your full legal name. This signature will be placed on your Form 8850."
          :required="true"
          :initial-image="formData.signatureData || (sessionSignature || null)"
        />
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
          <span v-if="loading">Generating PDF & saving…</span>
          <span v-else>Continue to Step 7</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import SSNConsentModal from '../SSNConsentModal.vue'
import NonGmailEmailNotice from '../NonGmailEmailNotice.vue'
import SignaturePad from '../ui/SignaturePad.vue'
import api from '../../services/api.js'
import { useApplicantData } from '../../composables/useApplicantData.js'
import { getSSNCookie, setSSNCookie } from '../../utils/cookies.js'
import { formatPhoneNumber, formatSSN as formatSSNUtil, validatePhoneNumber } from '../../utils/validation.js'

const props = defineProps({
  sessionSignature: { type: String, default: null },
  /** When true, consent was already given (e.g. dashboard onboarding); don't show consent modal */
  consentAlreadyGiven: { type: Boolean, default: false }
})
const emit = defineEmits(['submitted', 'form-data-change'])
const { applicantData, loading: loadingApplicant } = useApplicantData()

// Verbatim / official wording from IRS Form 8850 instructions (Instructions for Form 8850, Members of Targeted Groups)
const tooltips = {
  question1: 'Conditional certification: You received a conditional certification (e.g., ETA Form 9062) from a participating agency (for example, the Jobs Corps).',
  question2: 'Member of a targeted group: You are described in one of the targeted groups on Form 8850, such as Qualified IV-A (TANF) recipient, Qualified veteran, Qualified ex-felon, Designated community resident, Vocational rehabilitation referral, Summer youth employee, SNAP recipient, SSI recipient, Long-term family assistance recipient, or Qualified long-term unemployment recipient. See instructions for each group.',
  question3: 'Qualified veteran (unemployed 6+ months): A veteran who is unemployed for a period or periods totaling at least 6 months (whether or not consecutive) in the 1-year period ending on the hiring date. Must have served on active duty (not including training) for more than 180 days or have been discharged for a service-connected disability; no period of active duty of more than 90 days that ended during the 60-day period ending on the hiring date.',
  question4: 'Designated community resident: An individual who is at least age 18 but not yet age 40 on the hiring date and who lives within an empowerment zone or rural renewal county (as defined in the Form 8850 instructions).',
  question5: 'Vocational rehabilitation referral: An individual who has a physical or mental disability resulting in a substantial handicap to employment and who was referred to the employer upon completion of (or while receiving) rehabilitation services by a rehabilitation agency approved by the state, an employment network under the Ticket to Work program, or the Department of Veterans Affairs.',
  question6: 'Summer youth employee: An individual who (1) performs services for the employer between May 1 and September 15, (2) is at least age 16 but not yet age 18 on the hiring date (or on May 1 if later), (3) has never worked for the employer before, and (4) lives within an empowerment zone.',
  question7: 'Recipient of SNAP benefits (food stamps): An individual who is at least age 18 but not yet age 40 on the hiring date and is a member of a family that has received SNAP benefits for the 6-month period ending on the hiring date, or that is no longer eligible under section 6(o) but received SNAP for at least 3 months of the 5-month period ending on the hiring date.'
}

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  ssn: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  county: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  question1: false,
  question2: false,
  question3: false,
  question4: false,
  question5: false,
  question6: false,
  question7: false,
  signatureData: ''
})

const ssnConsented = ref(false)
const loading = ref(false)
const phoneError = ref('')
const CONSENT_STORAGE_KEY = 'opcsSsnConsentAcknowledged'

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

watch(() => props.consentAlreadyGiven, (v) => {
  if (v) ssnConsented.value = true
}, { immediate: true })

// Load applicant data and previous form data to auto-populate all available fields
onMounted(async () => {
  if (props.consentAlreadyGiven) {
    ssnConsented.value = true
  }
  const storedConsent = sessionStorage.getItem(CONSENT_STORAGE_KEY)
  if (storedConsent === 'true') {
    ssnConsented.value = true
  }

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
      formData.value.zipCode = applicant.zipCode || applicant.zip_code
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
        formData.value.middleName = step1Data.middleName
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
        formData.value.middleName = step3Draft.data.formData.middleName
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

  nextTick(() => {
    if (!formData.value.signatureData && props.sessionSignature) {
      formData.value.signatureData = props.sessionSignature
    }
  })
})

watch(() => props.sessionSignature, (sig) => {
  if (sig && !formData.value.signatureData) {
    formData.value.signatureData = sig
    emit('form-data-change', { ...formData.value })
  }
})

watch(ssnConsented, (value) => {
  if (value) {
    sessionStorage.setItem(CONSENT_STORAGE_KEY, 'true')
  }
})

const showConsentModal = computed(() => !props.consentAlreadyGiven && !ssnConsented.value)

// Computed property to check which required fields are missing
const missingRequiredFields = computed(() => {
  const missing = []
  if (!formData.value.ssn) missing.push('Social Security Number')
  if (!formData.value.email) missing.push('Email')
  if (!formData.value.county) missing.push('County')
  if (!formData.value.signatureData) missing.push('Signature')
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
  const value = formatSSNUtil(e.target.value)
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

  if (!formData.value.signatureData) {
    alert('Signature is required.')
    return
  }
  
  loading.value = true
  try {
    await api.post('/forms/submit/6', {
      formData: formData.value,
      ssnConsented: ssnConsented.value
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

