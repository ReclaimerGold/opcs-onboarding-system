<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <img
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png"
              alt="Optimal Prime Services Logo"
              class="h-10 w-auto"
            />
            <h1 class="text-xl font-semibold text-gray-900">Admin setup</h1>
          </div>
          <NotificationBell />
        </div>
      </div>
    </nav>

    <div class="w-full overflow-x-auto">
      <div class="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
        <!-- Progress: Step X of 6 (1 = PDF templates, 2–5 = signature placement, 6 = Email & Forms) -->
        <div class="mb-6">
          <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span class="font-medium">Setup progress</span>
            <span>— Step {{ setupStep }} of 6</span>
          </div>
          <div class="flex gap-2">
            <div
              v-for="s in 6"
              :key="s"
              :class="[
                'h-2 flex-1 rounded-full transition-colors',
                s < setupStep ? 'bg-green-500' : s === setupStep ? 'bg-primary' : 'bg-gray-200'
              ]"
            />
          </div>
          <div class="flex justify-between mt-1 text-xs text-gray-500">
            <span>PDF templates</span>
            <span>W-4</span>
            <span>I-9</span>
            <span>8850</span>
            <span>9061</span>
            <span>Email &amp; Forms</span>
          </div>
        </div>

        <!-- Step 1: Download PDF templates -->
        <template v-if="setupStep === 1">
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-1">Step 1: Download PDF templates</h2>
            <p class="text-sm text-gray-600 mb-4">
              Scan for and download the official IRS and USCIS form templates. Use <strong>Refresh</strong> to check status and <strong>Check for Updates</strong> to download or update all forms. You can also update a single form with its <strong>Update</strong> button.
            </p>
          </div>
          <PdfTemplatesPanel @status-change="onTemplateStatusChange" />
          <div class="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              :disabled="!allTemplatesReady"
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              @click="setupStep = 2"
            >
              Continue to signature placement
            </button>
            <span v-if="!allTemplatesReady" class="text-sm text-gray-500">
              Download all four templates (W-4, I-9, Form 8850, ETA Form 9061) to continue.
            </span>
          </div>
        </template>

        <!-- Steps 2–5: Signature placement (W-4, I-9, 8850, 9061) -->
        <template v-else-if="setupStep >= 2 && setupStep <= 5">
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-1">
              Set up signature placement: {{ currentStepLabel }}
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Add at least one signature placement per form: drag the signature field onto the page where the signature is needed, position and resize it, then click <strong>Save placement</strong>. Not every page requires a signature.
            </p>
            <SignaturePlacementPanel
              :form-type-lock="currentFormType"
              @saved="onPanelSaved"
            />
          </div>

          <!-- Step navigation -->
          <div class="flex flex-wrap items-center gap-4 mb-8">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              @click="setupStep--"
            >
              Back
            </button>
            <button
              v-if="setupStep < 5"
              type="button"
              :disabled="!currentStepComplete"
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              @click="setupStep++"
            >
              Next: {{ nextStepLabel }}
            </button>
            <button
              v-else
              type="button"
              :disabled="!currentStepComplete"
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              @click="setupStep = 6"
            >
              Next: Email &amp; Forms
            </button>
            <span v-if="setupStep < 5 && !currentStepComplete" class="text-sm text-gray-500">
              Add at least one signature placement for {{ currentStepLabel }} to continue.
            </span>
          </div>

          <!-- Optional: API keys (during signature steps) -->
          <div class="border-t border-gray-200 pt-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">API keys and integrations <span class="text-gray-500 font-normal">(optional)</span></h2>
            <p class="text-sm text-gray-600 mb-4">
              Google Drive, Mailgun, and Address Validation can be configured anytime in <router-link to="/settings" class="text-primary hover:underline">Settings</router-link>. Employees can use the system without them.
            </p>
            <router-link
              to="/settings"
              class="inline-flex px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Go to Settings
            </router-link>
          </div>
        </template>

        <!-- Step 6: Email & Forms (required employer info + optional link to Settings) -->
        <template v-else-if="setupStep === 6">
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-1">Step 6: Email &amp; Forms</h2>
            <p class="text-sm text-gray-600 mb-4">
              Enter the required employer information below so it appears on I-9 and Form 8850 and applicants can access onboarding forms. You can add notification emails and other options later in Settings.
            </p>

            <!-- Success state -->
            <div v-if="setupStatus.emailAndFormsConfigured" class="bg-white border border-green-200 rounded-lg p-6 shadow-sm mb-6">
              <div class="flex items-center gap-3 text-green-700">
                <svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-medium">Required employer information is complete. You can continue to the dashboard.</span>
              </div>
            </div>

            <!-- Inline onboarding form (when not yet configured) -->
            <div v-else class="bg-white border rounded-lg p-6 shadow-sm mb-6">
              <h3 class="text-base font-semibold text-gray-900 mb-4">Required employer information</h3>
              <p class="text-sm text-gray-600 mb-4">Fill in the fields below. These values are used on I-9 and Form 8850.</p>
              <form class="space-y-4" @submit.prevent="saveEmployerSettings">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">I-9 / 8850 Employer authorized representative name <span class="text-red-600">(Required)</span></label>
                  <input
                    v-model="employerForm.i9_employer_authorized_rep_name"
                    type="text"
                    placeholder="e.g. Jason"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div class="border-t pt-4 mt-4">
                  <h4 class="text-sm font-semibold text-gray-800 mb-2">Form 8850 employer (Page 2) – required</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer EIN</label>
                      <input
                        :value="employerForm['8850_employer_ein']"
                        type="text"
                        inputmode="numeric"
                        maxlength="12"
                        placeholder="XX-XXXXXXX"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        @input="onEmployerEINInput"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer phone</label>
                      <input
                        :value="employerForm['8850_employer_phone']"
                        type="text"
                        inputmode="tel"
                        placeholder="(XXX) XXX-XXXX"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        @input="onEmployerPhoneInput"
                      />
                    </div>
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer address</label>
                      <input
                        v-model="employerForm['8850_employer_address']"
                        type="text"
                        placeholder="Street address"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer city</label>
                      <input
                        v-model="employerForm['8850_employer_city']"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer state</label>
                      <input
                        v-model="employerForm['8850_employer_state']"
                        type="text"
                        maxlength="2"
                        placeholder="e.g. SD"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer ZIP</label>
                      <input
                        v-model="employerForm['8850_employer_zip']"
                        type="text"
                        placeholder="e.g. 57104"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <div class="border-t pt-4 mt-4">
                  <h4 class="text-sm font-semibold text-gray-800 mb-2">W-4 Educational link <span class="text-gray-500 font-normal">(optional)</span></h4>
                  <p class="text-xs text-gray-500 mb-3">Shown on Step 1 (W-4) as "For Educational Purposes only" — opens in a new window.</p>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">W-4 Educational link (URL)</label>
                      <input
                        v-model="employerForm.w4_educational_link_url"
                        type="url"
                        placeholder="https://..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">W-4 Educational link label</label>
                      <input
                        v-model="employerForm.w4_educational_link_label"
                        type="text"
                        placeholder="e.g. Example of how the new tax form works"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    :disabled="savingEmployer || !employerFormValid"
                    class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ savingEmployer ? 'Saving…' : 'Save employer info' }}
                  </button>
                  <span v-if="!employerFormValid" class="text-sm text-gray-500">Fill all required fields above to enable Save.</span>
                  <span v-if="employerSaveError" class="text-sm text-red-600">{{ employerSaveError }}</span>
                </div>
              </form>
              <p class="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                Optional notification emails (Judy, Daphne, completion, etc.) can be configured in
                <router-link :to="{ path: '/settings', query: { section: 'email-forms' } }" class="text-primary hover:underline">Settings → Email &amp; Forms</router-link>.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              @click="setupStep = 5"
            >
              Back
            </button>
            <button
              type="button"
              :disabled="!setupStatus.emailAndFormsConfigured"
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              @click="goToDashboard"
            >
              Continue to dashboard
            </button>
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
              @click="fetchSetupStatus"
            >
              Refresh status
            </button>
            <span v-if="!setupStatus.emailAndFormsConfigured" class="text-sm text-gray-500">
              Save the required employer fields above, or complete them in Settings → Email &amp; Forms and click Refresh status.
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import SignaturePlacementPanel from '../components/admin/SignaturePlacementPanel.vue'
import PdfTemplatesPanel from '../components/admin/PdfTemplatesPanel.vue'
import NotificationBell from '../components/NotificationBell.vue'
import api from '../services/api.js'
import { formatEIN, formatPhoneNumber } from '../utils/validation.js'

const router = useRouter()
/** 1 = PDF templates, 2 = W-4 signature, 3 = I-9 signature, 4 = 8850 signature, 5 = 9061 signature */
const setupStep = ref(1)
/** Template status from PdfTemplatesPanel (status-change). Used to enable "Continue" on step 1. */
const templateStatus = ref({})
const setupStatus = ref({
  signaturePlacementComplete: false,
  signaturePlacementReady: { w4: false, i9: false, 8850: false, 9061: false },
  emailAndFormsConfigured: false
})

/** Step 6: inline employer + W-4 educational form (required for Email & Forms) */
const employerForm = ref({
  i9_employer_authorized_rep_name: '',
  '8850_employer_ein': '',
  '8850_employer_address': '',
  '8850_employer_city': '',
  '8850_employer_state': '',
  '8850_employer_zip': '',
  '8850_employer_phone': '',
  w4_educational_link_url: '',
  w4_educational_link_label: ''
})
const savingEmployer = ref(false)
const employerSaveError = ref('')

const stepFormTypes = ['W4', 'I9', '8850', '9061']
const stepLabels = { W4: 'W-4', I9: 'I-9', 8850: 'Form 8850', 9061: 'ETA Form 9061' }

/** All four PDF templates exist (from panel status). */
const allTemplatesReady = computed(() => {
  const t = templateStatus.value
  return Object.keys(t).length >= 4 && Object.values(t).every((x) => x && x.exists === true)
})

/** For setupStep 2–5, the form type for signature placement. */
const currentFormType = computed(() => stepFormTypes[setupStep.value - 2] || 'W4')
const currentStepLabel = computed(() => stepLabels[currentFormType.value] || currentFormType.value)
const nextStepLabel = computed(() => {
  if (setupStep.value >= 5) return ''
  return stepLabels[stepFormTypes[setupStep.value - 1]] || stepFormTypes[setupStep.value - 1]
})

const currentStepComplete = computed(() => {
  const ft = currentFormType.value
  const key = ft === '8850' ? '8850' : ft === '9061' ? '9061' : ft.toLowerCase()
  if (key === 'w4') return !!setupStatus.value.signaturePlacementReady.w4
  if (key === 'i9') return !!setupStatus.value.signaturePlacementReady.i9
  if (key === '9061') return !!setupStatus.value.signaturePlacementReady['9061']
  return !!setupStatus.value.signaturePlacementReady['8850']
})

/** Step 6: all required employer fields non-empty (trimmed) */
const employerFormValid = computed(() => {
  const f = employerForm.value
  return !!(
    (f.i9_employer_authorized_rep_name || '').trim() &&
    (f['8850_employer_ein'] || '').replace(/\D/g, '').length === 9 &&
    (f['8850_employer_address'] || '').trim() &&
    (f['8850_employer_city'] || '').trim() &&
    (f['8850_employer_state'] || '').trim() &&
    (f['8850_employer_zip'] || '').trim() &&
    (f['8850_employer_phone'] || '').replace(/\D/g, '').length === 10
  )
})

function onTemplateStatusChange(templates) {
  templateStatus.value = templates || {}
}

async function loadEmployerSettings() {
  try {
    const res = await api.get('/settings')
    const s = res.data || {}
    employerForm.value = {
      i9_employer_authorized_rep_name: s.i9_employer_authorized_rep_name || '',
      '8850_employer_ein': s['8850_employer_ein'] ? formatEIN(s['8850_employer_ein']) : '',
      '8850_employer_address': s['8850_employer_address'] || '',
      '8850_employer_city': s['8850_employer_city'] || '',
      '8850_employer_state': s['8850_employer_state'] || '',
      '8850_employer_zip': s['8850_employer_zip'] || '',
      '8850_employer_phone': s['8850_employer_phone'] ? formatPhoneNumber(s['8850_employer_phone']) : '',
      w4_educational_link_url: s.w4_educational_link_url || '',
      w4_educational_link_label: s.w4_educational_link_label || ''
    }
  } catch (err) {
    console.error('Load employer settings:', err)
  }
}

function onEmployerEINInput(e) {
  employerForm.value['8850_employer_ein'] = formatEIN(e.target.value)
}

function onEmployerPhoneInput(e) {
  employerForm.value['8850_employer_phone'] = formatPhoneNumber(e.target.value)
}

async function saveEmployerSettings() {
  if (!employerFormValid.value || savingEmployer.value) return
  savingEmployer.value = true
  employerSaveError.value = ''
  try {
    await api.post('/settings', {
      settings: {
        i9_employer_authorized_rep_name: (employerForm.value.i9_employer_authorized_rep_name || '').trim(),
        '8850_employer_ein': (employerForm.value['8850_employer_ein'] || '').replace(/\D/g, '').length === 9 ? employerForm.value['8850_employer_ein'] : '',
        '8850_employer_address': (employerForm.value['8850_employer_address'] || '').trim(),
        '8850_employer_city': (employerForm.value['8850_employer_city'] || '').trim(),
        '8850_employer_state': (employerForm.value['8850_employer_state'] || '').trim().slice(0, 2),
        '8850_employer_zip': (employerForm.value['8850_employer_zip'] || '').trim(),
        '8850_employer_phone': (employerForm.value['8850_employer_phone'] || '').replace(/\D/g, '').length === 10 ? employerForm.value['8850_employer_phone'] : '',
        w4_educational_link_url: (employerForm.value.w4_educational_link_url || '').trim(),
        w4_educational_link_label: (employerForm.value.w4_educational_link_label || '').trim()
      }
    })
    await fetchSetupStatus()
  } catch (err) {
    employerSaveError.value = err.response?.data?.error || 'Failed to save. Try again.'
  } finally {
    savingEmployer.value = false
  }
}

async function fetchSetupStatus() {
  try {
    const res = await api.get('/admin/setup-status')
    setupStatus.value = res.data
  } catch (err) {
    console.error('Setup status error:', err)
  }
}

function onPanelSaved() {
  fetchSetupStatus()
}

function goToDashboard() {
  if (!setupStatus.value.signaturePlacementComplete) return
  if (setupStep.value === 6 && !setupStatus.value.emailAndFormsConfigured) return
  router.push('/admin')
}

watch(setupStep, (step) => {
  if (step === 6) loadEmployerSettings()
})

onMounted(() => {
  fetchSetupStatus()
  if (setupStep.value === 6) loadEmployerSettings()
})
</script>
