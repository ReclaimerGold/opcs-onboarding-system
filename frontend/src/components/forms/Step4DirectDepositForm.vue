<template>
  <div>
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
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <p v-if="!formData.photoFile" class="mt-1 text-xs text-red-600">Please upload a photo for your ID badge.</p>
        </div>
        
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Authorization for Direct Deposit</h3>
          <p class="text-sm text-gray-600 mb-4">
            This authorizes Optimal Prime Cleaning Services to send credit entries electronically 
            to my account(s) indicated below and to other accounts I identify in the future.
          </p>
          
          <!-- Account type: 3 tiles (Checking, Savings, No account) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              type="button"
              @click="formData.accountType = 'checking'"
              :class="'p-4 rounded-xl border-2 text-left transition-all ' + checkingTileClass"
            >
              <div class="flex items-center">
                <div :class="'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mr-3 ' + checkingIconClass">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Checking</h4>
                  <p class="text-xs text-gray-500">Standard checking account</p>
                </div>
                <svg v-if="formData.accountType === 'checking'" class="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </div>
            </button>
            
            <button
              type="button"
              @click="formData.accountType = 'savings'"
              :class="'p-4 rounded-xl border-2 text-left transition-all ' + savingsTileClass"
            >
              <div class="flex items-center">
                <div :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mr-3',
                  savingsIconClass
                ]">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">Savings</h4>
                  <p class="text-xs text-gray-500">Savings account</p>
                </div>
                <svg v-if="formData.accountType === 'savings'" class="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </div>
            </button>
            
            <button
              type="button"
              @click="formData.accountType = 'no-account'"
              :class="'p-4 rounded-xl border-2 text-left transition-all ' + noAccountTileClass"
            >
              <div class="flex items-center">
                <div :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mr-3',
                  noAccountIconClass
                ]">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900">No account</h4>
                  <p class="text-xs text-gray-500">I don't have a bank account</p>
                </div>
                <svg v-if="formData.accountType === 'no-account'" class="w-5 h-5 text-amber-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </div>
            </button>
          </div>
          
          <!-- No account warning -->
          <div v-if="formData.accountType === 'no-account'" class="mb-6 p-4 rounded-lg border-2 border-amber-300 bg-amber-50">
            <p class="text-sm font-medium text-amber-900">
              <strong>Important:</strong> We do not offer checks or pre-paid cards. You are required to obtain a checking or savings account to receive direct deposit of funds.
            </p>
          </div>
          
          <!-- Bank details (only when Checking or Savings selected) -->
          <div v-if="formData.accountType === 'checking' || formData.accountType === 'savings'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  v-model="formData.bankName"
                  type="text"
                  placeholder="e.g. First National Bank"
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
                  placeholder="e.g. 123456789"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  v-model="formData.accountNumber"
                  type="text"
                  placeholder="e.g. 1234567890"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Copy of Voided Check or Printed Bank Paperwork
                <span class="ml-1 text-xs text-gray-500">(Optional)</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                @change="handleBankDocUpload"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
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
        :disabled="loading || !formData.photoFile"
        class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      >
        <span v-if="loading">Generating PDF & saving…</span>
        <span v-else-if="!formData.photoFile">Please upload your ID badge photo to continue</span>
        <span v-else>Continue to Step 5</span>
      </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '../../services/api.js'
import { useFormDraft } from '../../composables/useFormDraft.js'

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
useFormDraft(4, formData)

const checkingTileClass = computed(() => formData.value.accountType === 'checking' ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50')
const savingsTileClass = computed(() => formData.value.accountType === 'savings' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50')
const noAccountTileClass = computed(() => formData.value.accountType === 'no-account' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50')
const checkingIconClass = computed(() => formData.value.accountType === 'checking' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600')
const savingsIconClass = computed(() => formData.value.accountType === 'savings' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600')
const noAccountIconClass = computed(() => formData.value.accountType === 'no-account' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600')

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

