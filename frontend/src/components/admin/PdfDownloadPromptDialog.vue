<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-prompt-title"
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
              <h2 id="pdf-prompt-title" class="text-lg font-semibold text-gray-900">
                PDF templates required
              </h2>
              <p class="text-sm text-gray-500">
                Official IRS and USCIS forms required for onboarding
              </p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            Before you can set up signature placement, the system needs to download the PDF form templates (W-4, I-9, and Form 8850). Click the button below to start the download.
          </p>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
              @click="$emit('startDownload')"
            >
              Download PDF templates
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false }
})

defineEmits(['startDownload'])
</script>
