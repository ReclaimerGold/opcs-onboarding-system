<template>
  <div>
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
            <p class="text-sm text-gray-700 mb-3">
              I have received access to the Optimal Prime Cleaning Services Employee Handbook located online at
              <a href="https://docs.google.com/document/d/16ReSJXndKUYTKubDnUJOLKQZoufrZMmh6xca_HDvkzo/edit?usp=sharing" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Employee Handbook</a>
              and understand that I must abide by all rules outlined in the booklet. If I do not want a physical copy, I know that I can find this at the link above.
            </p>
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="formData.handbookAcknowledgement"
                type="checkbox"
                required
                class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700">
                I have received access to the Optimal Prime Cleaning Services Employee Handbook (linked above) and understand that I must abide by all rules outlined in the booklet. If I do not want a physical copy, I know that I can find this at the link above.
              </span>
            </label>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Emergency Contact</h3>
            <p class="text-sm text-gray-600 mb-3">In case someone is hurt during their training shift, we need an emergency contact on file.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name <span class="text-red-500">*</span>
                  <span class="ml-1 text-xs text-red-600">(Required)</span>
                </label>
                <input
                  v-model="formData.emergencyContactName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  :class="{ 'border-2 border-red-300': emergencyContactError }"
                />
                <p v-if="emergencyContactError" class="mt-1 text-xs text-red-600">{{ emergencyContactError }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Phone <span class="text-red-500">*</span>
                  <span class="ml-1 text-xs text-red-600">(Required)</span>
                </label>
                <input
                  v-model="formData.emergencyContactPhone"
                  type="tel"
                  required
                  placeholder="(XXX) XXX-XXXX"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  :class="{ 'border-2 border-red-300': emergencyContactPhoneError }"
                  @blur="validateEmergencyPhone"
                />
                <p v-if="emergencyContactPhoneError" class="mt-1 text-xs text-red-600">{{ emergencyContactPhoneError }}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Part 3: Employment Agreement (South Dakota At-Will)</h3>
            <div class="prose max-w-none text-sm text-gray-700 space-y-3 mb-4 p-4 bg-gray-50 rounded-md max-h-64 overflow-y-auto">
              <p><strong>Optimal Prime Cleaning Services Employment Agreement</strong></p>
              <p>EMPLOYMENT AGREEMENT MEMORANDUM OR UNDERSTANDING BETWEEN OPTIMAL PRIME CLEANING SERVICES AND EMPLOYEES.</p>
              <p>The purpose of this Memorandum is to set out the basic elements of the agreement between the parties. The undersigned hereby agrees to become an employee of OPTIMAL PRIME CLEANING SERVICES or its appropriate affiliate ("Optimal Prime Cleaning Services") and OPTIMAL PRIME CLEANING SERVICES agrees to employ the above-named individual on terms and conditions established herein.</p>
              <p><strong>1. Representation of employee:</strong> I represent and warrant to Optimal Prime Cleaning Services that I am under no contractual or other restriction or obligation that is inconsistent with the obligations I owe to Optimal Prime Cleaning Services as its employee and in connection with my duties and responsibilities.</p>
              <p><strong>2. At-Will; Initial Training and Review Period:</strong> I understand that employment with Optimal Prime Cleaning Services is on an at-will basis, and that, unless otherwise prohibited by applicable law, employment may be terminated at any time, for any reason, with or without notice. Without modifying the at-will nature of the relationship, Optimal Prime Cleaning Services provides an initial training and review period that, in general, will not exceed ninety (90) days. Optimal Prime Cleaning Services' employment is based on my ability to perform the functions of those tasks assigned to me. Termination will result if, during this initial training and review period or following it, there is an indication I do not possess the required knowledge, skills, and/or abilities to perform the essential functions of the job.</p>
              <p><strong>3. Optimal Prime Cleaning Services Property:</strong> During and after my employment, I will not use any Optimal Prime Cleaning Services property for any purpose other than for the benefit of Optimal Prime Cleaning Services.</p>
            </div>
            <label class="flex items-start gap-3 cursor-pointer mt-3">
              <input
                v-model="formData.employmentAgreementAccepted"
                type="checkbox"
                required
                class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700">I have read and agree to the Employment Agreement above. I understand this is South Dakota's at-will employment clause.</span>
            </label>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
          </div>
          
          <div>
            <SignaturePad
              :model-value="formData.signatureData"
              @update:model-value="formData.signatureData = $event; emit('form-data-change', { ...formData })"
              label="Signature"
              description="Sign above or type your full legal name. This signature will be used on your Form 8850 and other documents."
              :required="true"
              :initial-image="formData.signatureData || (sessionSignature || null)"
            />
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
          <span v-if="loading">Generating PDF & saving…</span>
          <span v-else>Continue to Step 6</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import api from '../../services/api.js'
import { useApplicantData } from '../../composables/useApplicantData.js'
import { useFormDraft } from '../../composables/useFormDraft.js'
import SignaturePad from '../ui/SignaturePad.vue'
import { validatePhoneNumber } from '../../utils/validation.js'

const props = defineProps({
  sessionSignature: { type: String, default: null }
})
const emit = defineEmits(['submitted', 'form-data-change'])
const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  lastName: '',
  date: new Date().toISOString().split('T')[0],
  signatureData: '',
  handbookAcknowledgement: false,
  emergencyContactName: '',
  emergencyContactPhone: '',
  employmentAgreementAccepted: false
})

const loading = ref(false)
const emergencyContactError = ref('')
const emergencyContactPhoneError = ref('')
useFormDraft(5, formData)

function validateEmergencyPhone() {
  if (!formData.value.emergencyContactPhone) {
    emergencyContactPhoneError.value = ''
    return
  }
  const v = validatePhoneNumber(formData.value.emergencyContactPhone)
  emergencyContactPhoneError.value = v.valid ? '' : (v.message || '')
}

watch(() => props.sessionSignature, (sig) => {
  if (sig && !formData.value.signatureData) {
    formData.value.signatureData = sig
    emit('form-data-change', { ...formData.value })
  }
})

// Load applicant data to sync name fields (after draft may have loaded)
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
  nextTick(() => {
    if (!formData.value.signatureData && props.sessionSignature) {
      formData.value.signatureData = props.sessionSignature
    }
  })
})

const handleSubmit = async () => {
  emergencyContactError.value = ''
  emergencyContactPhoneError.value = ''
  if (!formData.value.emergencyContactName?.trim()) {
    emergencyContactError.value = 'Emergency contact name is required.'
    return
  }
  if (!formData.value.emergencyContactPhone?.trim()) {
    emergencyContactPhoneError.value = 'Emergency contact phone is required.'
    return
  }
  const phoneValidation = validatePhoneNumber(formData.value.emergencyContactPhone)
  if (!phoneValidation.valid) {
    emergencyContactPhoneError.value = phoneValidation.message || 'Invalid phone number.'
    return
  }
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

