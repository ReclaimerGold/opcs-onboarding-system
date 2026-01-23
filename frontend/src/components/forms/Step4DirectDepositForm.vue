<template>
  <div class="max-w-4xl mx-auto">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 4: Name Badge Photo and Bank Information</h2>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Note:</strong> Please provide your bank information for direct deposit. All fields are optional unless marked as required.
          </p>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Photo For ID Badge</h3>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Upload Photo <span class="text-red-500">*</span>
            <span class="ml-1 text-xs text-red-600">(Required)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            @change="handlePhotoUpload"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Authorization for Direct Deposit</h3>
          <p class="text-sm text-gray-600 mb-4">
            This authorizes Optimal Prime Cleaning Services to send credit entries electronically 
            to my account(s) indicated below and to other accounts I identify in the future.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                v-model="formData.bankName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
              <input
                v-model="formData.routingNumber"
                type="text"
                pattern="[0-9]{9}"
                maxlength="9"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                v-model="formData.accountNumber"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <select
                v-model="formData.accountType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Please Select</option>
                <option value="no-account">I DO NOT HAVE A BANK ACCOUNT</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          </div>
          
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Copy of Voided Check or Printed Bank Paperwork
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              @change="handleBankDocUpload"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <p class="mt-4 text-sm text-gray-600">
            This authorization will be in effect until the Company receives a written termination notice 
            from myself and has reasonable opportunity to act on it.
          </p>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Continue to Step 5</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../services/api.js'

const emit = defineEmits(['submitted'])

const formData = ref({
  photoFile: null,
  bankName: '',
  routingNumber: '',
  accountNumber: '',
  accountType: '',
  bankDocFile: null
})

const loading = ref(false)

const handlePhotoUpload = (e) => {
  formData.value.photoFile = e.target.files[0]
}

const handleBankDocUpload = (e) => {
  formData.value.bankDocFile = e.target.files[0]
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('formData', JSON.stringify(formData.value))
    if (formData.value.photoFile) {
      formDataToSend.append('photo', formData.value.photoFile)
    }
    if (formData.value.bankDocFile) {
      formDataToSend.append('bankDoc', formData.value.bankDocFile)
    }
    
    await api.post('/forms/submit/4', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    emit('submitted', 4)
  } catch (error) {
    console.error('Submit error:', error)
    alert('Failed to submit form. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

