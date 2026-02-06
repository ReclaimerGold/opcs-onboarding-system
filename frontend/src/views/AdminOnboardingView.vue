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
        </div>
      </div>
    </nav>

    <div class="w-full overflow-x-auto">
      <div class="mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8 min-w-[1000px] max-w-[1400px]">
        <!-- Progress: Step X of 5 (1 = PDF templates, 2–5 = signature placement) -->
        <div class="mb-6">
          <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span class="font-medium">Setup progress</span>
            <span>— Step {{ setupStep }} of 5</span>
          </div>
          <div class="flex gap-2">
            <div
              v-for="s in 5"
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
            <span>Form 8850</span>
            <span>Form 9061</span>
          </div>
        </div>

        <!-- Step 1: Download PDF templates (same as admin area: scan + download) -->
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
        <template v-else>
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
            <template v-else>
              <button
                type="button"
                :disabled="!setupStatus.signaturePlacementComplete"
                class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                @click="goToDashboard"
              >
                Continue to dashboard
              </button>
            </template>
            <span v-if="setupStep < 5 && !currentStepComplete" class="text-sm text-gray-500">
              Add at least one signature placement for {{ currentStepLabel }} to continue.
            </span>
          </div>

          <!-- Optional: API keys -->
          <div class="border-t border-gray-200 pt-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">API keys and integrations <span class="text-gray-500 font-normal">(optional)</span></h2>
            <p class="text-sm text-gray-600 mb-4">
              Google Drive, Mailgun, and Address Validation can be configured anytime in <router-link to="/settings" class="text-primary hover:underline">Settings</router-link>. Employees can use the system without them.
            </p>
            <div class="flex gap-3">
              <router-link
                to="/settings"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Go to Settings
              </router-link>
              <button
                type="button"
                :disabled="!setupStatus.signaturePlacementComplete"
                class="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="goToDashboard"
              >
                I'll do this later
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import SignaturePlacementPanel from '../components/admin/SignaturePlacementPanel.vue'
import PdfTemplatesPanel from '../components/admin/PdfTemplatesPanel.vue'
import api from '../services/api.js'

const router = useRouter()
/** 1 = PDF templates, 2 = W-4 signature, 3 = I-9 signature, 4 = 8850 signature, 5 = 9061 signature */
const setupStep = ref(1)
/** Template status from PdfTemplatesPanel (status-change). Used to enable "Continue" on step 1. */
const templateStatus = ref({})
const setupStatus = ref({
  signaturePlacementComplete: false,
  signaturePlacementReady: { w4: false, i9: false, 8850: false, 9061: false }
})

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

function onTemplateStatusChange(templates) {
  templateStatus.value = templates || {}
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
  router.push('/admin')
}

onMounted(() => {
  fetchSetupStatus()
})
</script>
