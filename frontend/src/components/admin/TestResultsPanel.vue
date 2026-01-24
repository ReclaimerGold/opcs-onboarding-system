<template>
  <div class="space-y-6">
    <div class="text-sm text-gray-500">
      Last run: {{ formatDate(results.timestamp) }}
    </div>

    <!-- Backend Tests -->
    <div 
      class="border rounded-lg p-6" 
      :class="results.backend?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">Backend Tests</h4>
        <span :class="results.backend?.success ? 'text-green-700 font-bold' : 'text-red-700 font-bold'">
          {{ results.backend?.success ? '✅ Passed' : '❌ Failed' }}
        </span>
      </div>

      <!-- Test Summary -->
      <div v-if="results.backend?.output" class="mb-4 p-4 bg-white rounded border">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Total Tests:</span>
            <span class="ml-2 font-semibold">{{ results.backend.output.numTotalTests || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-gray-600">Passed:</span>
            <span class="ml-2 font-semibold text-green-700">{{ results.backend.output.numPassedTests || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Failed:</span>
            <span class="ml-2 font-semibold text-red-700">{{ results.backend.output.numFailedTests || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Suites:</span>
            <span class="ml-2 font-semibold">{{ results.backend.output.numTotalTestSuites || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="results.backend?.error" class="mb-4 p-4 bg-red-100 border border-red-300 rounded">
        <p class="font-semibold text-red-900">Error:</p>
        <p class="text-red-800 text-sm mt-1">{{ results.backend.error }}</p>
      </div>

      <!-- Verbose Output Toggle -->
      <div>
        <button
          @click="showBackendOutput = !showBackendOutput"
          class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
        >
          <svg class="w-4 h-4 mr-1" :class="showBackendOutput ? 'transform rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          {{ showBackendOutput ? 'Hide' : 'Show' }} Output
        </button>
        <div v-if="showBackendOutput" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
          <pre class="whitespace-pre-wrap">{{ results.backend?.rawOutput || 'No output available' }}</pre>
        </div>
      </div>
    </div>

    <!-- Frontend Tests -->
    <div 
      v-if="results.frontend"
      class="border rounded-lg p-6" 
      :class="results.frontend?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">Frontend Tests</h4>
        <span :class="results.frontend?.success ? 'text-green-700 font-bold' : 'text-red-700 font-bold'">
          {{ results.frontend?.success ? '✅ Passed' : '❌ Failed' }}
        </span>
      </div>

      <!-- Test Summary -->
      <div v-if="results.frontend?.output" class="mb-4 p-4 bg-white rounded border">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Total Suites:</span>
            <span class="ml-2 font-semibold">{{ results.frontend.output.numTotalTestSuites || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-gray-600">Total Tests:</span>
            <span class="ml-2 font-semibold">{{ results.frontend.output.numTotalTests || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-gray-600">Passed:</span>
            <span class="ml-2 font-semibold text-green-700">{{ results.frontend.output.numPassedTests || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-600">Failed:</span>
            <span class="ml-2 font-semibold text-red-700">{{ results.frontend.output.numFailedTests || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="results.frontend?.error" class="mb-4 p-4 bg-red-100 border border-red-300 rounded">
        <p class="font-semibold text-red-900">Error:</p>
        <p class="text-red-800 text-sm mt-1">{{ results.frontend.error }}</p>
      </div>

      <!-- Verbose Output Toggle -->
      <div>
        <button
          @click="showFrontendOutput = !showFrontendOutput"
          class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
        >
          <svg class="w-4 h-4 mr-1" :class="showFrontendOutput ? 'transform rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          {{ showFrontendOutput ? 'Hide' : 'Show' }} Output
        </button>
        <div v-if="showFrontendOutput" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
          <pre class="whitespace-pre-wrap">{{ results.frontend?.rawOutput || 'No output available' }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  results: {
    type: Object,
    required: true
  }
})

const showBackendOutput = ref(false)
const showFrontendOutput = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}
</script>

