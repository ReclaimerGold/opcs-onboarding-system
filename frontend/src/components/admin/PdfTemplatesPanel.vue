<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">PDF Form Templates</h3>
      <div class="flex space-x-2">
        <button
          @click="refreshStatus"
          :disabled="loading"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
        >
          <svg v-if="!loading" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Refresh
        </button>
        <button
          @click="updateAllTemplates"
          :disabled="updating"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
        >
          <svg v-if="!updating" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ updating ? 'Updating...' : 'Check for Updates' }}
        </button>
      </div>
    </div>

    <!-- Info Box -->
    <div class="mb-6 bg-blue-50 border-l-4 border-blue-400 rounded-md p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="text-sm text-blue-800">
          <strong>About PDF Templates:</strong> These are official fillable PDF forms downloaded from IRS and USCIS. 
          The system automatically checks for updates every 24 hours.
        </div>
      </div>
    </div>

    <!-- Template Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div 
        v-for="(template, formType) in templates" 
        :key="formType"
        class="bg-white border rounded-lg shadow-sm overflow-hidden"
      >
        <div class="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h4 class="font-semibold text-gray-900">{{ template.name }}</h4>
            <p class="text-xs text-gray-500">{{ template.agency }}</p>
          </div>
          <span 
            :class="[
              'px-2 py-1 text-xs rounded-full font-medium',
              template.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]"
          >
            {{ template.exists ? 'Cached' : 'Not Downloaded' }}
          </span>
        </div>

        <div class="p-4 space-y-3 text-sm">
          <div v-if="template.metadata?.pdfInfo?.revision" class="flex items-center">
            <span class="text-gray-600 w-24">Revision:</span>
            <span class="font-medium">{{ template.metadata.pdfInfo.revision }}</span>
          </div>
          <div v-if="template.metadata?.pdfInfo?.pageCount" class="flex items-center">
            <span class="text-gray-600 w-24">Pages:</span>
            <span class="font-medium">{{ template.metadata.pdfInfo.pageCount }}</span>
          </div>
          <div v-if="template.metadata?.fileSize" class="flex items-center">
            <span class="text-gray-600 w-24">Size:</span>
            <span class="font-medium">{{ formatFileSize(template.metadata.fileSize) }}</span>
          </div>
          <div v-if="template.metadata?.downloadedAt" class="flex items-center">
            <span class="text-gray-600 w-24">Downloaded:</span>
            <span class="font-medium">{{ formatDate(template.metadata.downloadedAt) }}</span>
          </div>
        </div>

        <div class="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
          <div class="flex space-x-2">
            <button
              v-if="template.exists"
              @click="previewTemplate(formType)"
              class="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-light"
            >
              Preview
            </button>
            <button
              @click="updateSingleTemplate(formType)"
              :disabled="updating"
              class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              Update
            </button>
          </div>
          <span v-if="template.versionCount > 1" class="text-xs text-gray-500">
            {{ template.versionCount - 1 }} archived
          </span>
        </div>
      </div>
    </div>

    <!-- No templates state -->
    <div v-if="Object.keys(templates).length === 0 && !loading" class="text-center py-12 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-lg font-medium">No PDF templates loaded</p>
      <p class="text-sm mt-2">Click "Check for Updates" to download the official IRS/USCIS forms</p>
    </div>

    <!-- Update Results -->
    <div v-if="updateResults" class="mt-6">
      <div :class="[
        'rounded-lg p-4 border',
        updateResults.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      ]">
        <h4 class="font-medium mb-2">{{ updateResults.message }}</h4>
        <ul v-if="updateResults.updated && updateResults.updated.length > 0" class="text-sm space-y-1">
          <li v-for="type in updateResults.updated" :key="type" class="text-green-700">
            ✓ {{ type }} template updated
          </li>
        </ul>
        <ul v-if="updateResults.errors && updateResults.errors.length > 0" class="text-sm space-y-1 mt-2">
          <li v-for="err in updateResults.errors" :key="err.type" class="text-red-700">
            ✗ {{ err.type }}: {{ err.error }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api.js'
import { useDateFormat } from '../../composables/useDateFormat.js'

const emit = defineEmits(['status-change'])

const templates = ref({})
const loading = ref(false)
const updating = ref(false)
const updateResults = ref(null)

const loadTemplateStatus = async () => {
  loading.value = true
  try {
    const response = await api.get('/admin/pdf-templates/status')
    templates.value = response.data.templates || {}
    emit('status-change', templates.value)
  } catch (error) {
    console.error('Error loading PDF template status:', error)
  } finally {
    loading.value = false
  }
}

const refreshStatus = async () => {
  await loadTemplateStatus()
}

const updateAllTemplates = async () => {
  updating.value = true
  updateResults.value = null
  try {
    const response = await api.post('/admin/pdf-templates/update?force=true')
    updateResults.value = response.data
    await loadTemplateStatus()
  } catch (error) {
    console.error('Error updating templates:', error)
    updateResults.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to update templates'
    }
  } finally {
    updating.value = false
  }
}

const updateSingleTemplate = async (formType) => {
  updating.value = true
  updateResults.value = null
  try {
    const response = await api.post(`/admin/pdf-templates/update?formType=${formType}&force=true`)
    updateResults.value = response.data
    await loadTemplateStatus()
  } catch (error) {
    console.error(`Error updating ${formType} template:`, error)
    updateResults.value = {
      success: false,
      message: error.response?.data?.error || `Failed to update ${formType} template`
    }
  } finally {
    updating.value = false
  }
}

const previewTemplate = (formType) => {
  window.open(`/api/admin/pdf-templates/${formType}/preview`, '_blank')
}

const { formatDate } = useDateFormat()

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

onMounted(() => {
  loadTemplateStatus()
})
</script>

