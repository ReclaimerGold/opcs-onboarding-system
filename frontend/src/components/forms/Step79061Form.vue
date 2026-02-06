<template>
  <div>
    <SSNConsentModal :open="showConsentModal" v-model:consented="ssnConsented" />
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 7: ETA Form 9061</h2>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Auto-population:</strong> This form automatically fills in information from your previous steps, including your name, SSN, address, date of birth, and targeted group selections from Form 8850. 
            Please review and complete any remaining required fields.
          </p>
        </div>

        <!-- Section: Applicant Information -->
        <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Applicant Information</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              Middle Initial
              <span v-if="formData.middleName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.middleName"
              type="text"
              maxlength="1"
              :readonly="!!middleNameLocked"
              :class="middleNameLocked ? 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed' : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary'"
            />
            <p v-if="middleNameLocked" class="mt-1 text-xs text-gray-500">Pre-filled from previous step</p>
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

        <!-- Section: Have you worked for this employer before? -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Have you worked for this employer before?
            <span v-if="previousEmploymentAutoFilled" class="ml-1 text-xs text-green-600">(Auto-filled from Form 8850)</span>
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input v-model="formData.workedForEmployerBefore" type="radio" value="yes" class="mr-2 text-primary focus:ring-primary" />
              <span>Yes</span>
            </label>
            <label class="flex items-center">
              <input v-model="formData.workedForEmployerBefore" type="radio" value="no" class="mr-2 text-primary focus:ring-primary" />
              <span>No</span>
            </label>
          </div>
          <div v-if="formData.workedForEmployerBefore === 'yes'" class="mt-3 ml-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Date of Employment</label>
            <input
              v-model="formData.lastEmploymentDate"
              type="date"
              class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <!-- Section: Targeted Group Eligibility -->
        <h3 class="text-lg font-semibold text-gray-800 mt-8 mb-4 border-b pb-2">Targeted Group Eligibility</h3>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Note:</strong> Check all categories that apply to you. When a category is checked, additional detail fields may appear. 
            Categories selected on your Form 8850 have been auto-checked below.
          </p>
        </div>

        <div class="space-y-6">
          <!-- Box 12: Qualified IV-A Recipient (TANF) -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isTANFRecipient" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">12. Qualified IV-A Recipient (TANF)</span>
                <p class="text-xs text-gray-500 mt-1">Check if you received Temporary Assistance for Needy Families (TANF)</p>
              </div>
            </label>
            <div v-if="formData.isTANFRecipient" class="mt-3 ml-8 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name of Primary Benefits Recipient</label>
                <input v-model="formData.tanfPrimaryRecipient" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City and State Where Benefits Were Received</label>
                <input v-model="formData.tanfBenefitsLocation" type="text" placeholder="e.g. Sioux Falls, SD" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>

          <!-- Box 13: Qualified Veteran -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isVeteran" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">13. Qualified Veteran</span>
                <p class="text-xs text-gray-500 mt-1">Check if you are a veteran of the U.S. Armed Forces</p>
              </div>
            </label>
            <div v-if="formData.isVeteran" class="mt-3 ml-8 space-y-3">
              <div>
                <label class="flex items-start">
                  <input v-model="formData.veteranReceivesSNAP" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Veteran receives or received SNAP (food stamps) benefits</span>
                </label>
              </div>
              <div v-if="formData.veteranReceivesSNAP">
                <label class="block text-sm font-medium text-gray-700 mb-1">Name of Primary Benefits Recipient</label>
                <input v-model="formData.veteranSNAPRecipient" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div v-if="formData.veteranReceivesSNAP">
                <label class="block text-sm font-medium text-gray-700 mb-1">City and State Where Benefits Were Received</label>
                <input v-model="formData.veteranSNAPLocation" type="text" placeholder="e.g. Sioux Falls, SD" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="flex items-start">
                  <input v-model="formData.veteranDisabled" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Service-connected disability</span>
                </label>
              </div>
              <div>
                <label class="flex items-start">
                  <input v-model="formData.veteranUnemployed6Months" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Unemployed for a combined period of at least 6 months during the past year</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Box 14: Qualified Ex-Felon -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isExFelon" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">14. Qualified Ex-Felon</span>
                <p class="text-xs text-gray-500 mt-1">Check if you have a felony conviction</p>
              </div>
            </label>
            <div v-if="formData.isExFelon" class="mt-3 ml-8 space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date of Conviction</label>
                  <input v-model="formData.felonyConvictionDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Release Date</label>
                  <input v-model="formData.felonyReleaseDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Conviction Type</label>
                <div class="flex space-x-4">
                  <label class="flex items-center">
                    <input v-model="formData.felonyFederal" type="checkbox" class="mr-2 text-primary focus:ring-primary" />
                    <span class="text-sm">Federal</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="formData.felonyState" type="checkbox" class="mr-2 text-primary focus:ring-primary" />
                    <span class="text-sm">State</span>
                  </label>
                </div>
              </div>
              <div v-if="formData.felonyState">
                <label class="block text-sm font-medium text-gray-700 mb-1">State of Conviction</label>
                <input v-model="formData.felonyStateName" type="text" maxlength="2" placeholder="e.g. SD" class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase" />
              </div>
              <div>
                <label class="flex items-start">
                  <input v-model="formData.felonyWorkRelease" type="checkbox" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Currently in a Work Release Program</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Box 15: Designated Community Resident -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isDesignatedCommunityResident" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">15. Designated Community Resident</span>
                <p class="text-xs text-gray-500 mt-1">Check if you are age 18-39 and reside in a Rural Renewal County or Empowerment Zone</p>
              </div>
            </label>
          </div>

          <!-- Box 16: Vocational Rehabilitation Referral -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isVocationalRehab" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">16. Vocational Rehabilitation Referral</span>
                <p class="text-xs text-gray-500 mt-1">Check if you were referred by a rehabilitation agency approved by the state, an Employment Network under the Ticket to Work Program, or the Department of Veterans Affairs</p>
              </div>
            </label>
            <div v-if="formData.isVocationalRehab" class="mt-3 ml-8">
              <label class="block text-sm font-medium text-gray-700 mb-2">Referral Source</label>
              <div class="space-y-2">
                <label class="flex items-start">
                  <input v-model="formData.rehabReferralSource" type="radio" value="state_agency" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Rehabilitation agency approved by the state</span>
                </label>
                <label class="flex items-start">
                  <input v-model="formData.rehabReferralSource" type="radio" value="employment_network" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Employment Network under the Ticket to Work Program</span>
                </label>
                <label class="flex items-start">
                  <input v-model="formData.rehabReferralSource" type="radio" value="va" class="mt-1 mr-2 text-primary focus:ring-primary" />
                  <span class="text-sm">Department of Veterans Affairs</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Box 17: Qualified Summer Youth Employee -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isSummerYouth" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">17. Qualified Summer Youth Employee</span>
                <p class="text-xs text-gray-500 mt-1">Check if you are age 16-17 and are being hired for summer employment in an Empowerment Zone</p>
              </div>
            </label>
          </div>

          <!-- Box 18: Qualified SNAP Recipient -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isSNAPRecipient" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">18. Qualified SNAP (Food Stamps) Recipient</span>
                <p class="text-xs text-gray-500 mt-1">Check if you received SNAP (food stamps) benefits</p>
              </div>
            </label>
            <div v-if="formData.isSNAPRecipient" class="mt-3 ml-8 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name of Primary Benefits Recipient</label>
                <input v-model="formData.snapPrimaryRecipient" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City and State Where Benefits Were Received</label>
                <input v-model="formData.snapBenefitsLocation" type="text" placeholder="e.g. Sioux Falls, SD" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>

          <!-- Box 19: Qualified SSI Recipient -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isSSIRecipient" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">19. Qualified SSI Recipient</span>
                <p class="text-xs text-gray-500 mt-1">Check if you received or are receiving Supplemental Security Income (SSI)</p>
              </div>
            </label>
          </div>

          <!-- Box 20: Long-Term Family Assistance Recipient -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isLongTermTANF" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">20. Long-Term Family Assistance Recipient</span>
                <p class="text-xs text-gray-500 mt-1">Check if you are a long-term recipient of Temporary Assistance for Needy Families (TANF)</p>
              </div>
            </label>
            <div v-if="formData.isLongTermTANF" class="mt-3 ml-8 space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name of Primary Benefits Recipient</label>
                <input v-model="formData.longTermTANFRecipient" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City and State Where Benefits Were Received</label>
                <input v-model="formData.longTermTANFLocation" type="text" placeholder="e.g. Sioux Falls, SD" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>

          <!-- Box 21: Qualified Long-Term Unemployment Recipient -->
          <div class="border border-gray-200 rounded-lg p-4">
            <label class="flex items-start">
              <input v-model="formData.isLongTermUnemployed" type="checkbox" class="mt-1 mr-3 text-primary focus:ring-primary" />
              <div>
                <span class="text-sm font-medium">21. Qualified Long-Term Unemployment Recipient</span>
                <p class="text-xs text-gray-500 mt-1">Check if you are a qualified long-term unemployment recipient</p>
              </div>
            </label>
            <div v-if="formData.isLongTermUnemployed" class="mt-3 ml-8">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City and State Where Unemployment Claims Were Filed</label>
                <input v-model="formData.unemploymentClaimsLocation" type="text" placeholder="e.g. Sioux Falls, SD" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <SignaturePad
          :model-value="formData.signatureData"
          @update:model-value="formData.signatureData = $event"
          label="Signature"
          description="Sign above or type your full legal name. This signature will be placed on your ETA Form 9061."
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
          <span v-if="loading">Submitting...</span>
          <span v-else>Complete Onboarding</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import SSNConsentModal from '../SSNConsentModal.vue'
import SignaturePad from '../ui/SignaturePad.vue'
import api from '../../services/api.js'
import { useApplicantData } from '../../composables/useApplicantData.js'
import { getSSNCookie, setSSNCookie } from '../../utils/cookies.js'
import { formatSSN as formatSSNUtil } from '../../utils/validation.js'

const props = defineProps({
  sessionSignature: { type: String, default: null },
  /** When true, consent was already given (e.g. dashboard onboarding); don't show consent modal */
  consentAlreadyGiven: { type: Boolean, default: false }
})
const emit = defineEmits(['submitted', 'form-data-change'])
const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  ssn: '',
  dateOfBirth: '',
  workedForEmployerBefore: 'no',
  lastEmploymentDate: '',
  // Targeted group fields
  isTANFRecipient: false,
  tanfPrimaryRecipient: '',
  tanfBenefitsLocation: '',
  isVeteran: false,
  veteranReceivesSNAP: false,
  veteranSNAPRecipient: '',
  veteranSNAPLocation: '',
  veteranDisabled: false,
  veteranUnemployed6Months: false,
  isExFelon: false,
  felonyConvictionDate: '',
  felonyReleaseDate: '',
  felonyFederal: false,
  felonyState: false,
  felonyStateName: '',
  felonyWorkRelease: false,
  isDesignatedCommunityResident: false,
  isVocationalRehab: false,
  rehabReferralSource: '',
  isSummerYouth: false,
  isSNAPRecipient: false,
  snapPrimaryRecipient: '',
  snapBenefitsLocation: '',
  isSSIRecipient: false,
  isLongTermTANF: false,
  longTermTANFRecipient: '',
  longTermTANFLocation: '',
  isLongTermUnemployed: false,
  unemploymentClaimsLocation: '',
  signatureData: ''
})

const ssnConsented = ref(false)
const loading = ref(false)
const CONSENT_STORAGE_KEY = 'opcsSsnConsentAcknowledged'

// Track which fields are locked (auto-populated)
const dateOfBirthLocked = ref(false)
const middleNameLocked = ref(false)
const previousEmploymentAutoFilled = ref(false)

// Emit form data changes for real-time preview (debounced)
let emitDebounceTimer = null
watch(formData, () => {
  if (emitDebounceTimer) {
    clearTimeout(emitDebounceTimer)
  }
  emitDebounceTimer = setTimeout(() => {
    emit('form-data-change', { ...formData.value })
  }, 300)
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
    
    // Date of birth from Step 1
    if (applicant.dateOfBirth || applicant.date_of_birth) {
      formData.value.dateOfBirth = applicant.dateOfBirth || applicant.date_of_birth
      dateOfBirthLocked.value = true
    }
  }

  // Load middle name from Step 1 or Step 3 drafts
  try {
    const step1Draft = await api.get('/forms/draft/1')
    if (step1Draft.data?.success && step1Draft.data?.formData) {
      const step1Data = step1Draft.data.formData
      if (step1Data.middleName) {
        formData.value.middleName = step1Data.middleName.charAt(0)
        middleNameLocked.value = true
      }
    } else {
      const step3Draft = await api.get('/forms/draft/3')
      if (step3Draft.data?.success && step3Draft.data?.formData?.middleName) {
        formData.value.middleName = step3Draft.data.formData.middleName.charAt(0)
        middleNameLocked.value = true
      }
    }
  } catch (error) {
    console.log('No drafts found for additional fields')
  }

  // Load data from Step 6 (8850) draft to auto-populate targeted group selections
  try {
    const step6Draft = await api.get('/forms/draft/6')
    if (step6Draft.data?.success && step6Draft.data?.formData) {
      const step6Data = step6Draft.data.formData
      
      // Auto-populate "worked before" from 8850
      if (step6Data.previousEmployment) {
        formData.value.workedForEmployerBefore = step6Data.previousEmployment
        previousEmploymentAutoFilled.value = true
      }

      // Map 8850 checkbox answers to 9061 targeted group checkboxes
      // question1 = conditional certification (TANF-related)
      // question2 = applies to TANF, SNAP, veteran, etc.
      // question3 = veteran unemployed 6+ months
      if (step6Data.question1) {
        formData.value.isTANFRecipient = true
      }
      if (step6Data.question2) {
        // question2 is a general checkbox indicating any targeted group applies
        // We can't determine which specific groups, so we don't auto-check individual boxes
        // The user will need to select specific groups on the 9061
      }
      if (step6Data.question3) {
        formData.value.isVeteran = true
        formData.value.veteranUnemployed6Months = true
      }
    }
  } catch (error) {
    console.log('No 8850 draft found for auto-population')
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
  if (!formData.value.signatureData) missing.push('Signature')
  return missing
})

const formatSSN = (e) => {
  const value = formatSSNUtil(e.target.value)
  formData.value.ssn = value
  // Save to cookie when SSN is complete
  if (value.match(/^\d{3}-\d{2}-\d{4}$/)) {
    setSSNCookie(value)
  }
}

const handleSubmit = async () => {
  if (!ssnConsented.value) {
    alert('Please consent to SSN collection to continue')
    return
  }
  
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
    await api.post('/forms/submit/7', {
      formData: formData.value,
      ssnConsented: ssnConsented.value
    })
    emit('submitted', 7)
  } catch (error) {
    console.error('Submit error:', error)
    alert('Failed to submit form. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>
