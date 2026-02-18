<template>
  <div class="compliance-checker">
    <!-- Header with Run Check Button -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Liability Compliance Checker</h2>
        <p class="text-sm text-gray-600 mt-1">
          Verify Federal and South Dakota state compliance for information storage
        </p>
      </div>
      <button
        @click="runComplianceCheck"
        :disabled="loading"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ loading ? 'Running Checks...' : 'Run Compliance Check' }}
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-if="!report && !loading && !error" class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No compliance report</h3>
      <p class="mt-1 text-sm text-gray-500">Click "Run Compliance Check" to verify system compliance</p>
    </div>

    <!-- Report Display -->
    <div v-if="report">
      <!-- Summary Dashboard -->
      <div class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Compliance Score -->
          <div class="bg-white rounded-lg shadow p-6 border-l-4" :class="getScoreBorderClass()">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="text-3xl font-bold" :class="getScoreTextClass()">
                  {{ report.summary.complianceScore }}%
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Compliance Score</p>
                <p class="text-sm" :class="getStatusBadgeClass()">{{ report.summary.status }}</p>
              </div>
            </div>
          </div>

          <!-- Total Checks -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-semibold text-gray-900">{{ report.summary.totalChecks }}</p>
                <p class="text-sm text-gray-500">Total Checks</p>
              </div>
            </div>
          </div>

          <!-- Passed Checks -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-green-100 rounded-full p-3">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-semibold text-green-600">{{ report.summary.passedChecks }}</p>
                <p class="text-sm text-gray-500">Passed</p>
              </div>
            </div>
          </div>

          <!-- Critical Issues -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 rounded-full p-3" :class="report.summary.criticalIssues > 0 ? 'bg-red-100' : 'bg-gray-100'">
                <svg class="h-6 w-6" :class="report.summary.criticalIssues > 0 ? 'text-red-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-2xl font-semibold" :class="report.summary.criticalIssues > 0 ? 'text-red-600' : 'text-gray-400'">
                  {{ report.summary.criticalIssues }}
                </p>
                <p class="text-sm text-gray-500">Critical Issues</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Timestamp -->
        <div class="mt-4 text-sm text-gray-500 flex items-center justify-between">
          <span>Last checked: {{ formatTimestamp(report.timestamp) }}</span>
          <span>Execution time: {{ report.executionTimeMs }}ms</span>
        </div>
      </div>

      <!-- Regulations Reference -->
      <div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-sm font-medium text-blue-800 mb-2">Regulations Verified</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-medium text-blue-700 mb-1">Federal:</p>
            <ul class="text-xs text-blue-600 space-y-0.5">
              <li v-for="reg in report.regulations.federal" :key="reg">• {{ reg }}</li>
            </ul>
          </div>
          <div>
            <p class="text-xs font-medium text-blue-700 mb-1">South Dakota State:</p>
            <ul class="text-xs text-blue-600 space-y-0.5">
              <li v-for="reg in report.regulations.state" :key="reg">• {{ reg }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Category Sections -->
      <div class="space-y-4">
        <div v-for="(category, categoryName) in report.categories" :key="categoryName" class="bg-white rounded-lg shadow overflow-hidden">
          <!-- Category Header -->
          <button
            @click="toggleCategory(categoryName)"
            class="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0 mr-3">
                <span v-if="category.critical > 0" class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100">
                  <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <span v-else-if="category.failed > 0" class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100">
                  <svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <span v-else class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                  <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              <div class="text-left">
                <h3 class="text-lg font-medium text-gray-900">{{ categoryName }}</h3>
                <p class="text-sm text-gray-500">
                  {{ category.passed }} passed, {{ category.failed }} failed
                  <span v-if="category.critical > 0" class="text-red-600 font-medium">({{ category.critical }} critical)</span>
                </p>
              </div>
            </div>
            <svg
              class="h-5 w-5 text-gray-400 transform transition-transform"
              :class="{ 'rotate-180': expandedCategories[categoryName] }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Category Checks -->
          <div v-show="expandedCategories[categoryName]" class="border-t border-gray-200">
            <div v-for="check in category.checks" :key="check.check" class="border-b border-gray-100 last:border-b-0">
              <!-- Check Header -->
              <div class="px-6 py-4 flex items-center justify-between">
                <div class="flex items-center">
                  <span
                    class="inline-flex items-center justify-center h-6 w-6 rounded-full mr-3"
                    :class="check.passed ? 'bg-green-100' : (check.critical ? 'bg-red-100' : 'bg-yellow-100')"
                  >
                    <svg v-if="check.passed" class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="h-4 w-4" :class="check.critical ? 'text-red-600' : 'text-yellow-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  <div>
                    <span class="font-medium text-gray-900">{{ check.check }}</span>
                    <span v-if="check.legalReference" class="ml-2 text-xs text-gray-500">({{ check.legalReference }})</span>
                  </div>
                </div>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="check.passed ? 'bg-green-100 text-green-800' : (check.critical ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')"
                >
                  {{ check.passed ? 'PASS' : (check.critical ? 'CRITICAL' : 'WARNING') }}
                </span>
              </div>

              <!-- Findings -->
              <div v-if="check.findings && check.findings.length > 0" class="px-6 pb-4">
                <div class="bg-gray-50 rounded-md p-3 space-y-2">
                  <div
                    v-for="(finding, idx) in check.findings"
                    :key="idx"
                    class="flex items-start text-sm"
                  >
                    <span
                      class="flex-shrink-0 h-4 w-4 mr-2 mt-0.5"
                      :class="getSeverityIconClass(finding.severity)"
                    >
                      <svg v-if="finding.severity === 'critical'" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else-if="finding.severity === 'warning'" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                      </svg>
                    </span>
                    <span :class="getSeverityTextClass(finding.severity)">{{ finding.message }}</span>
                  </div>
                </div>

                <!-- Stats if available -->
                <div v-if="check.stats" class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="(value, key) in check.stats"
                    :key="key"
                    class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                  >
                    {{ formatStatKey(key) }}: <span class="font-medium ml-1">{{ value }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Button -->
      <div class="mt-6 flex justify-end">
        <button
          @click="exportReport"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Report (JSON)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/services/api'
import { useDateFormat } from '@/composables/useDateFormat.js'

const loading = ref(false)
const error = ref(null)
const report = ref(null)
const expandedCategories = reactive({})

const runComplianceCheck = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get('/admin/compliance-check')
    report.value = response.data
    
    // Auto-expand categories with issues
    for (const [categoryName, category] of Object.entries(report.value.categories)) {
      expandedCategories[categoryName] = category.failed > 0 || category.critical > 0
    }
  } catch (err) {
    console.error('Compliance check error:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to run compliance check'
  } finally {
    loading.value = false
  }
}

const toggleCategory = (categoryName) => {
  expandedCategories[categoryName] = !expandedCategories[categoryName]
}

const { formatDate } = useDateFormat()
const formatTimestamp = formatDate

const formatStatKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const getScoreBorderClass = () => {
  if (!report.value) return 'border-gray-300'
  const score = report.value.summary.complianceScore
  if (score >= 90) return 'border-green-500'
  if (score >= 70) return 'border-yellow-500'
  return 'border-red-500'
}

const getScoreTextClass = () => {
  if (!report.value) return 'text-gray-600'
  const score = report.value.summary.complianceScore
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

const getStatusBadgeClass = () => {
  if (!report.value) return 'text-gray-600'
  const {status} = report.value.summary
  if (status === 'COMPLIANT') return 'text-green-600 font-medium'
  if (status === 'WARNING') return 'text-yellow-600 font-medium'
  return 'text-red-600 font-medium'
}

const getSeverityIconClass = (severity) => {
  switch (severity) {
    case 'critical': return 'text-red-500'
    case 'warning': return 'text-yellow-500'
    default: return 'text-blue-500'
  }
}

const getSeverityTextClass = (severity) => {
  switch (severity) {
    case 'critical': return 'text-red-700'
    case 'warning': return 'text-yellow-700'
    default: return 'text-gray-600'
  }
}

const exportReport = () => {
  if (!report.value) return
  
  const dataStr = JSON.stringify(report.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.compliance-checker {
  @apply w-full;
}
</style>

