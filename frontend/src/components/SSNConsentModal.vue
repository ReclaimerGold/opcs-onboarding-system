<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl">
        <div class="p-6">
          <!-- Slide 1: SSN Consent -->
          <template v-if="slide === 1">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Social Security Number Collection Notice
                </h3>
                <p class="text-sm text-gray-600">
                  Please review and acknowledge before continuing.
                </p>
              </div>
            </div>

            <div class="mt-5 text-sm text-gray-700 space-y-3">
              <p class="font-medium">
                We are requesting your Social Security Number (SSN) for the following purposes:
              </p>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li><strong>Form W-4:</strong> Required by the IRS for federal tax withholding</li>
                <li><strong>Form I-9:</strong> Required by USCIS for employment eligibility verification</li>
                <li><strong>Form 8850:</strong> Required for Work Opportunity Tax Credit determination</li>
              </ul>
              <p class="font-medium">
                Your SSN will be:
              </p>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Used <strong>ONLY</strong> for the above legally-required documents</li>
                <li><strong>NOT</strong> stored in our database</li>
                <li>Included only in encrypted PDF documents</li>
                <li>Retained per federal law (3-4 years depending on document type)</li>
                <li>Accessible only to authorized HR personnel</li>
              </ul>
              <p class="font-semibold text-gray-900">
                Employment cannot continue without your consent to SSN collection.
              </p>
            </div>

            <div class="mt-5">
              <label class="flex items-start">
                <input
                  type="checkbox"
                  v-model="localConsented"
                  class="mt-1 mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span class="text-sm text-gray-700">
                  I understand and consent to the collection and use of my Social Security Number as described above.
                </span>
              </label>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-light disabled:opacity-50"
                :disabled="!localConsented || checkingPassword"
                @click="handleConsentClick"
              >
                <span v-if="checkingPassword" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
                <span v-else>I Consent and Continue</span>
              </button>
            </div>
          </template>

          <!-- Slide 2: Password Setup -->
          <template v-if="slide === 2">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Secure Your Account
                </h3>
                <p class="text-sm text-gray-600">
                  Set a password to protect your information for future logins.
                </p>
              </div>
            </div>

            <div class="mt-5 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r">
              <p class="text-sm text-blue-800">
                <strong>Why set a password?</strong> Your onboarding information is sensitive. 
                Setting a password ensures only you can access and complete your forms.
              </p>
            </div>

            <div v-if="passwordError" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-800">{{ passwordError }}</p>
            </div>

            <form @submit.prevent="handleSetPassword" class="mt-5 space-y-4">
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                  Password <span class="text-red-500">*</span>
                  <span class="ml-1 text-xs text-red-600">(Required)</span>
                </label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                  minlength="8"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter password (minimum 8 characters)"
                />
                <p class="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span class="text-red-500">*</span>
                  <span class="ml-1 text-xs text-red-600">(Required)</span>
                </label>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  required
                  minlength="8"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Confirm password"
                />
                <p v-if="passwordMismatch" class="mt-1 text-xs text-red-600">Passwords do not match</p>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  @click="slide = 1"
                  class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  :disabled="settingPassword || passwordMismatch || !isPasswordValid"
                  class="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-light disabled:opacity-50"
                >
                  <span v-if="settingPassword" class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Password...
                  </span>
                  <span v-else>Set Password & Continue</span>
                </button>
              </div>
            </form>
          </template>

          <!-- Slide 3: Add your Signature -->
          <template v-if="slide === 3">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Add your signature
                </h3>
                <p class="text-sm text-gray-600">
                  Your signature will be used on W-4, I-9, and other forms so you won't need to re-enter it each time.
                </p>
              </div>
            </div>

            <div class="mt-5 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r">
              <p class="text-sm text-blue-800">
                <strong>One-time setup:</strong> Draw or type your signature below. It will auto-populate on all onboarding forms.
              </p>
            </div>

            <div class="mt-5">
              <SignaturePad
                v-model="onboardingSignature"
                label="Your signature"
                :required="true"
                :width="360"
                :height="120"
              />
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                @click="slide = 2"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Back
              </button>
              <button
                type="button"
                :disabled="!onboardingSignature"
                class="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-light disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                @click="handleSignatureContinue"
              >
                Continue
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import api from '../services/api.js'
import SignaturePad from './ui/SignaturePad.vue'
import { setSessionSignature } from '../utils/sessionSignature.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  consented: {
    type: Boolean,
    default: false
  },
  /** When true, open at signature step only (consent and password already done this session or previously) */
  startAtSignature: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:consented', 'signature'])

// Slide state: 1 = consent, 2 = password setup, 3 = add signature
const slide = ref(1)
const localConsented = ref(false)
const checkingPassword = ref(false)
const onboardingSignature = ref(null)

// Password form state
const password = ref('')
const confirmPassword = ref('')
const settingPassword = ref(false)
const passwordError = ref('')

const passwordMismatch = computed(() => {
  return password.value && confirmPassword.value && password.value !== confirmPassword.value
})

const isPasswordValid = computed(() => {
  return password.value.length >= 8 && confirmPassword.value.length >= 8 && !passwordMismatch.value
})

// Reset state when modal opens
watch(
  () => [props.open, props.startAtSignature],
  ([open, startAtSignature]) => {
    if (open) {
      if (startAtSignature) {
        slide.value = 3
        localConsented.value = true
        password.value = ''
        confirmPassword.value = ''
        passwordError.value = ''
        onboardingSignature.value = null
      } else {
        slide.value = 1
        localConsented.value = false
        password.value = ''
        confirmPassword.value = ''
        passwordError.value = ''
        onboardingSignature.value = null
      }
    }
  }
)

// Handle consent click - check if password is already set, then show signature step
const handleConsentClick = async () => {
  if (!localConsented.value) {
    return
  }

  checkingPassword.value = true
  
  try {
    const response = await api.get('/auth/password-status')
    
    if (response.data.passwordSet) {
      // Password already set, go to signature step
      slide.value = 3
    } else {
      // No password set, show password setup then signature
      slide.value = 2
    }
  } catch (error) {
    console.error('Failed to check password status:', error)
    slide.value = 2
  } finally {
    checkingPassword.value = false
  }
}

// Handle password setup
const handleSetPassword = async () => {
  if (!isPasswordValid.value) {
    return
  }

  settingPassword.value = true
  passwordError.value = ''

  try {
    const response = await api.post('/auth/set-password', {
      password: password.value,
      confirmPassword: confirmPassword.value
    })

    if (response.data.success) {
      // Password set successfully, go to signature step
      slide.value = 3
    }
  } catch (error) {
    const errorData = error.response?.data || {}
    passwordError.value = errorData.error || 'Failed to set password. Please try again.'
  } finally {
    settingPassword.value = false
  }
}

// Handle signature step complete - save for session, notify parent, and close modal
function handleSignatureContinue() {
  if (!onboardingSignature.value) return
  setSessionSignature(onboardingSignature.value)
  emit('signature', onboardingSignature.value)
  emit('update:consented', true)
}
</script>
