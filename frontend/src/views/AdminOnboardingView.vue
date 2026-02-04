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
        <!-- Progress: Step X of 3 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <span class="font-medium">Signature placement (required)</span>
            <span>— Step {{ signatureStep }} of 3</span>
          </div>
          <div class="flex gap-2">
            <div
              v-for="s in 3"
              :key="s"
              :class="[
                'h-2 flex-1 rounded-full transition-colors',
                s < signatureStep ? 'bg-green-500' : s === signatureStep ? 'bg-primary' : 'bg-gray-200'
              ]"
            />
          </div>
          <div class="flex justify-between mt-1 text-xs text-gray-500">
            <span>W-4</span>
            <span>I-9</span>
            <span>Form 8850</span>
          </div>
        </div>

        <!-- Current step: one form at a time -->
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
            v-if="signatureStep > 1"
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            @click="signatureStep--"
          >
            Back
          </button>
          <button
            v-if="signatureStep < 3"
            type="button"
            :disabled="!currentStepComplete"
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            @click="signatureStep++"
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
          <span v-if="signatureStep < 3 && !currentStepComplete" class="text-sm text-gray-500">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import SignaturePlacementPanel from '../components/admin/SignaturePlacementPanel.vue'
import api from '../services/api.js'

const router = useRouter()
const signatureStep = ref(1)
const setupStatus = ref({
  signaturePlacementComplete: false,
  signaturePlacementReady: { w4: false, i9: false, 8850: false }
})

const stepFormTypes = ['W4', 'I9', '8850']
const stepLabels = { W4: 'W-4', I9: 'I-9', 8850: 'Form 8850' }

const currentFormType = computed(() => stepFormTypes[signatureStep.value - 1] || 'W4')
const currentStepLabel = computed(() => stepLabels[currentFormType.value] || currentFormType.value)
const nextStepLabel = computed(() => {
  if (signatureStep.value >= 3) return ''
  return stepLabels[stepFormTypes[signatureStep.value]] || stepFormTypes[signatureStep.value]
})

const currentStepComplete = computed(() => {
  const key = currentFormType.value === '8850' ? '8850' : currentFormType.value.toLowerCase()
  if (key === 'w4') return !!setupStatus.value.signaturePlacementReady.w4
  if (key === 'i9') return !!setupStatus.value.signaturePlacementReady.i9
  return !!setupStatus.value.signaturePlacementReady['8850']
})

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
