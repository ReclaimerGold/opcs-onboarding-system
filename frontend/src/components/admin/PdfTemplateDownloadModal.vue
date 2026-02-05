<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-download-title"
    >
      <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 id="pdf-download-title" class="text-lg font-semibold text-gray-900">
                Downloading PDF Form Templates
              </h2>
              <p class="text-sm text-gray-500">
                Official IRS and USCIS forms required for onboarding
              </p>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mb-6">
            <div class="flex justify-between text-sm text-gray-600 mb-1">
              <span>{{ statusMessage }}</span>
              <span v-if="total > 0">{{ current }} / {{ total }}</span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300 ease-out"
                :style="{ width: progressWidth }"
              />
            </div>
          </div>

          <!-- Step list (empty when all templates already present) -->
          <p v-if="done && total === 0" class="text-sm text-gray-600 py-2">
            All form templates are already downloaded.
          </p>
          <ul v-else class="space-y-2">
            <li
              v-for="(step, formType) in steps"
              :key="formType"
              class="flex items-center gap-3 py-2 px-3 rounded-md"
              :class="step.status === 'error' ? 'bg-red-50' : step.status === 'complete' ? 'bg-green-50' : step.status === 'started' ? 'bg-blue-50' : ''"
            >
              <span v-if="step.status === 'pending'" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 text-xs">
                {{ step.index }}
              </span>
              <span v-else-if="step.status === 'started'" class="flex h-6 w-6 shrink-0 items-center justify-center">
                <svg class="h-5 w-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
              <span v-else-if="step.status === 'complete'" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span v-else-if="step.status === 'error'" class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <span class="font-medium text-gray-900">{{ step.name }}</span>
                <span v-if="step.status === 'error' && step.error" class="block text-xs text-red-600 truncate">{{ step.error }}</span>
              </div>
            </li>
          </ul>

          <!-- Done / error message -->
          <div v-if="done" class="mt-6 flex justify-end">
            <button
              type="button"
              class="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
              @click="$emit('close')"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})

defineEmits(['close'])

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const current = ref(0)
const total = ref(0)
const statusMessage = ref('Preparing...')
const steps = ref({}) // { W4: { name, status, index, error? }, ... }
const done = ref(false)

const formNames = { W4: 'Form W-4', I9: 'Form I-9', '8850': 'Form 8850' }

const progressWidth = computed(() => {
  if (total.value <= 0) return '0%'
  return `${Math.round((current.value / total.value) * 100)}%`
})

function getStreamUrl() {
  const base = baseURL.replace(/\/$/, '')
  return `${base}/admin/pdf-templates/download-stream`
}

async function startStream() {
  current.value = 0
  total.value = 0
  statusMessage.value = 'Connecting...'
  steps.value = {}
  done.value = false

  const url = getStreamUrl()
  try {
    const response = await fetch(url, { credentials: 'include' })
    if (!response.ok) {
      throw new Error(response.statusText || 'Download failed')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    // eslint-disable-next-line no-constant-condition -- stream read loop until done
    while (true) {
      const { value, done: streamDone } = await reader.read()
      if (streamDone) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            applyEvent(data)
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6))
        applyEvent(data)
      } catch {
        // ignore trailing line parse errors
      }
    }
  } catch (err) {
    statusMessage.value = 'Download failed'
    console.error('PDF template stream error:', err)
    applyEvent({ status: 'error', message: err.message })
  }
  done.value = true
}

function applyEvent(data) {
  if (data.status === 'done') {
    current.value = data.current ?? total.value
    total.value = data.total ?? total.value
    statusMessage.value = data.message || 'All templates ready.'
    return
  }
  if (data.status === 'error') {
    statusMessage.value = data.message || 'An error occurred.'
    done.value = true
    return
  }
  if (data.formType != null) {
    const name = data.name || formNames[data.formType] || data.formType
    if (!steps.value[data.formType]) {
      const keys = Object.keys(steps.value)
      steps.value[data.formType] = {
        name,
        status: 'pending',
        index: keys.length + 1,
        error: null
      }
    }
    steps.value[data.formType].name = name
    steps.value[data.formType].status = data.status || 'started'
    steps.value[data.formType].error = data.error || null
    if (data.total != null) total.value = data.total
    if (data.current != null) current.value = data.current
    if (data.message) statusMessage.value = data.message
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    startStream()
  }
})
</script>
