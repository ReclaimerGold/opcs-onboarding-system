<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ssn-reprompt-title"
    >
      <div class="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
        <div class="p-6">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg class="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 id="ssn-reprompt-title" class="text-lg font-semibold text-gray-900">
                SSN session expired
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                Your SSN was stored temporarily and has expired. Please re-enter it so we can fill your W-4, I-9, and Form 8850 correctly.
              </p>
            </div>
          </div>

          <div class="mt-5">
            <label for="ssn-reprompt-input" class="block text-sm font-medium text-gray-700 mb-1">
              Social Security Number <span class="text-red-500">*</span>
            </label>
            <input
              id="ssn-reprompt-input"
              v-model="localSSN"
              type="text"
              inputmode="numeric"
              maxlength="11"
              placeholder="XXX-XX-XXXX"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              :class="{ 'border-red-500': error }"
              @input="onInput"
            />
            <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
            <p v-else class="mt-1 text-xs text-gray-500">Format: XXX-XX-XXXX. Not stored in the database; used only to fill forms.</p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              :disabled="!isValidSSN"
              class="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleContinue"
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
import { formatSSN, validateSSN } from '../utils/validation.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['saved'])

const localSSN = ref('')
const error = ref('')

const isValidSSN = computed(() => {
  if (!localSSN.value) return false
  const result = validateSSN(localSSN.value)
  return result.valid
})

function onInput(e) {
  localSSN.value = formatSSN(e.target.value)
  error.value = ''
}

function handleContinue() {
  if (!isValidSSN.value) {
    const result = validateSSN(localSSN.value)
    error.value = result.message || 'Enter a valid SSN (XXX-XX-XXXX)'
    return
  }
  error.value = ''
  emit('saved', localSSN.value)
  localSSN.value = ''
}

watch(() => props.open, (open) => {
  if (open) {
    localSSN.value = ''
    error.value = ''
  }
})
</script>
