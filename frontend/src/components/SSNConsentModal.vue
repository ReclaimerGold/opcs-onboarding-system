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
              :disabled="!localConsented"
              @click="confirmConsent"
            >
              I Consent and Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  consented: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:consented'])
const localConsented = ref(false)

watch(
  () => props.open,
  (open) => {
    if (open) {
      localConsented.value = false
    }
  }
)

const confirmConsent = () => {
  if (!localConsented.value) {
    return
  }
  emit('update:consented', true)
}
</script>

