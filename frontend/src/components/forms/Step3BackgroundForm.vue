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
          <p class="text-sm text-red-800 font-semibold mt-2">
            <strong>Under penalty of perjury:</strong> Lying on this form is perjury and may result in criminal prosecution.
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
        
        <div class="mt-6 space-y-6">
          <p class="text-sm text-gray-600 mb-4">
            Select one option per question. Do not leave any question unanswered.
          </p>

          <div>
            <fieldset class="space-y-2">
              <legend class="block text-sm font-medium text-gray-700 mb-2">
                Sex offender classification in any state? <span class="text-red-500">*</span>
                <span class="ml-1 text-xs text-red-600">(Required)</span>
              </legend>
              <div class="flex flex-wrap gap-x-6 gap-y-1">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="formData.sexOffender"
                    type="radio"
                    name="sexOffender"
                    value="yes"
                    class="mr-2 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Yes</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="formData.sexOffender"
                    type="radio"
                    name="sexOffender"
                    value="no"
                    class="mr-2 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>No</span>
                </label>
              </div>
            </fieldset>
            <div v-if="formData.sexOffender === 'yes'" class="mt-3 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
              <h4 class="text-sm font-semibold text-gray-800">Offenses</h4>
              <div
                v-for="(offense, idx) in formData.sexOffenderOffenses"
                :key="'sex-' + idx"
                class="rounded border border-gray-200 bg-white p-3 space-y-3"
              >
                <div class="flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-500">Offense {{ idx + 1 }}</span>
                  <button
                    v-if="formData.sexOffenderOffenses.length > 1"
                    type="button"
                    @click="removeSexOffenderOffense(idx)"
                    class="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of offense</label>
                    <input
                      v-model="offense.dateOfOffense"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type of offense</label>
                    <input
                      v-model="offense.typeOfOffense"
                      type="text"
                      placeholder="e.g. misdemeanor, felony"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <textarea
                    v-model="offense.comments"
                    rows="2"
                    placeholder="Additional details..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="button"
                @click="addSexOffenderOffense"
                class="text-sm text-primary hover:text-primary-light font-medium"
              >
                + Add another offense
              </button>
            </div>
          </div>

          <div>
            <fieldset class="space-y-2">
              <legend class="block text-sm font-medium text-gray-700 mb-2">
                Convicted of any crimes in the past 7 years? <span class="text-red-500">*</span>
                <span class="ml-1 text-xs text-red-600">(Required)</span>
              </legend>
              <div class="flex flex-wrap gap-x-6 gap-y-1">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="formData.crimesPast7Years"
                    type="radio"
                    name="crimesPast7Years"
                    value="yes"
                    class="mr-2 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Yes</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="formData.crimesPast7Years"
                    type="radio"
                    name="crimesPast7Years"
                    value="no"
                    class="mr-2 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>No</span>
                </label>
              </div>
            </fieldset>
            <div v-if="formData.crimesPast7Years === 'yes'" class="mt-3 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
              <h4 class="text-sm font-semibold text-gray-800">Offenses</h4>
              <div
                v-for="(offense, idx) in formData.crimes7Offenses"
                :key="'crimes7-' + idx"
                class="rounded border border-gray-200 bg-white p-3 space-y-3"
              >
                <div class="flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-500">Offense {{ idx + 1 }}</span>
                  <button
                    v-if="formData.crimes7Offenses.length > 1"
                    type="button"
                    @click="removeCrimes7Offense(idx)"
                    class="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of offense</label>
                    <input
                      v-model="offense.dateOfOffense"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Type of offense</label>
                    <input
                      v-model="offense.typeOfOffense"
                      type="text"
                      placeholder="e.g. misdemeanor, felony"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <textarea
                    v-model="offense.comments"
                    rows="2"
                    placeholder="Additional details..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="button"
                @click="addCrimes7Offense"
                class="text-sm text-primary hover:text-primary-light font-medium"
              >
                + Add another offense
              </button>
            </div>
          </div>

          <div class="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-md">
            <label class="flex items-start cursor-pointer">
              <input
                v-model="formData.perjuryCertified"
                type="checkbox"
                required
                class="mt-1 mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-amber-900">
                I certify under penalty of perjury that the information I have provided on this form is true and correct. I understand that lying on this form is perjury and may result in criminal prosecution.
              </span>
            </label>
          </div>

          <div class="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
            <label class="flex items-start cursor-pointer">
              <input
                v-model="formData.sdBackgroundCheckAuthorized"
                type="checkbox"
                required
                class="mt-1 mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-blue-800">
                I authorize that the information on this form will be sent to the State of South Dakota to run a background check, and I authorize the submission of this background check request on my behalf using my email address.
              </span>
            </label>
          </div>
        </div>
        
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Upload Photo ID <span class="text-red-500">*</span>
            <span class="ml-1 text-xs text-red-600">(Required)</span>
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            @change="handleFileUpload"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <p v-if="!formData.photoIdFile" class="mt-1 text-xs text-red-600">Please upload a photo of your ID.</p>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="loading || !formData.sexOffender || !formData.crimesPast7Years || !formData.perjuryCertified || !formData.sdBackgroundCheckAuthorized || !formData.photoIdFile"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <span v-if="loading">Generating PDF & saving…</span>
          <span v-else-if="!formData.sexOffender || !formData.crimesPast7Years">Check one option per question to continue</span>
          <span v-else-if="!formData.perjuryCertified || !formData.sdBackgroundCheckAuthorized">Complete the certification and authorization checkboxes to continue</span>
          <span v-else-if="!formData.photoIdFile">Please upload your Photo ID to continue</span>
          <span v-else>Continue to Step 4</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../../services/api.js'
import { useApplicantData } from '../../composables/useApplicantData.js'

const emit = defineEmits(['submitted'])

const { applicantData, loading: loadingApplicant } = useApplicantData()

const emptyOffense = () => ({ dateOfOffense: '', typeOfOffense: '', comments: '' })

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  sexOffender: '',
  crimesPast7Years: '',
  crimeDetails: '',
  sexOffenderOffenses: [emptyOffense()],
  crimes7Offenses: [emptyOffense()],
  perjuryCertified: false,
  sdBackgroundCheckAuthorized: false,
  photoIdFile: null
})

const loading = ref(false)
const addressLocked = ref(false)
const middleNameLocked = ref(false)

function addSexOffenderOffense() {
  formData.value.sexOffenderOffenses.push(emptyOffense())
}
function removeSexOffenderOffense(index) {
  formData.value.sexOffenderOffenses.splice(index, 1)
}
function addCrimes7Offense() {
  formData.value.crimes7Offenses.push(emptyOffense())
}
function removeCrimes7Offense(index) {
  formData.value.crimes7Offenses.splice(index, 1)
}

// When "Yes" is selected, ensure at least one offense entry
watch(() => formData.value.sexOffender, (val) => {
  if (val === 'yes' && (!formData.value.sexOffenderOffenses || formData.value.sexOffenderOffenses.length === 0)) {
    formData.value.sexOffenderOffenses = [emptyOffense()]
  }
})
watch(() => formData.value.crimesPast7Years, (val) => {
  if (val === 'yes' && (!formData.value.crimes7Offenses || formData.value.crimes7Offenses.length === 0)) {
    formData.value.crimes7Offenses = [emptyOffense()]
  }
})

// Load applicant data and auto-populate fields (applicant first, then Step 1 draft as fallback)
onMounted(async () => {
  if (loadingApplicant.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  let applicant = applicantData.value
  if (!applicant) {
    try {
      const response = await api.get('/applicants/me')
      applicant = response.data
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }

  if (applicant) {
    formData.value.firstName = applicant.firstName || applicant.first_name || ''
    formData.value.lastName = applicant.lastName || applicant.last_name || ''
    formData.value.dateOfBirth = applicant.dateOfBirth || applicant.date_of_birth || ''
    // Address from applicant (set after Step 1 submit)
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

  // Step 1 draft as fallback for address, DOB, and middle name
  try {
    const step1Draft = await api.get('/forms/draft/1')
    if (step1Draft.data.success && step1Draft.data.formData) {
      const step1Data = step1Draft.data.formData

      // Address fallback when applicant has no address yet
      if (!formData.value.address && step1Data.address) {
        formData.value.address = step1Data.address
        addressLocked.value = true
      }
      if (!formData.value.city && step1Data.city) {
        formData.value.city = step1Data.city
        addressLocked.value = true
      }
      if (!formData.value.state && step1Data.state) {
        formData.value.state = step1Data.state
        addressLocked.value = true
      }
      if (!formData.value.zipCode && step1Data.zipCode) {
        formData.value.zipCode = step1Data.zipCode
        addressLocked.value = true
      }

      // DOB fallback when applicant has no DOB yet
      if (!formData.value.dateOfBirth && step1Data.dateOfBirth) {
        formData.value.dateOfBirth = step1Data.dateOfBirth
      }

      // Middle name from Step 1 only (applicant table has no middle name)
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

