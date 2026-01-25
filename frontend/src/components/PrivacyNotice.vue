<template>
  <div class="bg-blue-50 border-l-4 border-primary p-6 mb-6 rounded-r-lg">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">
          Social Security Number Collection Notice
        </h3>
        <div class="text-sm text-gray-700 space-y-2">
          <p class="font-medium">We are requesting your Social Security Number (SSN) for the following purposes:</p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li><strong>Form W-4:</strong> Required by the IRS for federal tax withholding</li>
            <li><strong>Form I-9:</strong> Required by USCIS for employment eligibility verification</li>
            <li><strong>Form 8850:</strong> Required for Work Opportunity Tax Credit determination</li>
          </ul>
          <p class="font-medium mt-4">Your SSN will be:</p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li>Used <strong>ONLY</strong> for the above legally-required documents</li>
            <li><strong>NOT</strong> stored in our database</li>
            <li>Included only in encrypted PDF documents</li>
            <li>Retained per federal law (3-4 years depending on document type)</li>
            <li>Accessible only to authorized HR personnel</li>
          </ul>
          <p class="mt-4 font-semibold text-gray-900">
            Providing your SSN is mandatory for employment eligibility.
          </p>
        </div>
        <div v-if="showConsent" class="mt-4">
          <label class="flex items-start">
            <input
              type="checkbox"
              v-model="consented"
              class="mt-1 mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              required
            />
            <span class="text-sm text-gray-700">
              I understand and consent to the collection and use of my Social Security Number as described above.
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineModel } from 'vue'

defineProps({
  showConsent: {
    type: Boolean,
    default: false
  }
})

const consented = defineModel('consented', { type: Boolean, default: false })
</script>

