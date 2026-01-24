<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ label || 'Street Address' }}
        <span v-if="required" class="text-red-500">*</span>
      </label>
      <p v-if="description" class="text-xs text-gray-500 mb-2">{{ description }}</p>
      
      <input
        ref="addressInput"
        type="text"
        :value="modelValue"
        :placeholder="placeholder || 'Enter your street address (e.g., 123 Main Street)'"
        :required="required"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
        @input="handleInput"
        @blur="handleBlur"
      />
      
      <!-- Simple status messages -->
      <div v-if="statusMessage" class="mt-2 text-sm" :class="statusClass">
        {{ statusMessage }}
      </div>
      
      <!-- Helper text for users -->
      <p v-if="!statusMessage" class="mt-1 text-xs text-gray-400">
        {{ apiKey ? 'We can verify your address after you enter it' : 'Enter your full street address' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  label: String,
  modelValue: String,
  required: Boolean,
  description: String,
  placeholder: String,
  apiKey: String
})

const emit = defineEmits(['update:modelValue', 'address-selected'])

const addressInput = ref(null)
const validating = ref(false)
const statusMessage = ref('')
const statusType = ref('') // 'success', 'info', 'error'

const statusClass = computed(() => {
  switch (statusType.value) {
    case 'success': return 'text-green-600'
    case 'info': return 'text-blue-600'
    case 'error': return 'text-red-600'
    default: return 'text-gray-500'
  }
})

const handleInput = (e) => {
  const value = e.target.value
  emit('update:modelValue', value)
  
  // Clear status when typing
  statusMessage.value = ''
  statusType.value = ''
}

const getCurrentAddressValue = () => {
  return (addressInput.value?.value || props.modelValue || '').trim()
}

const handleBlur = async () => {
  const currentValue = getCurrentAddressValue()
  // Only auto-validate if API is configured and address is long enough
  if (props.apiKey && currentValue.length >= 10) {
    await validateAddress(currentValue)
  } else if (currentValue.length >= 5) {
    // Try to parse the address manually
    parseAndEmitAddress(currentValue)
  }
}

let lastValidationRequestId = 0

const validateAddress = async (addressValue = '') => {
  const currentValue = (addressValue || getCurrentAddressValue()).trim()
  if (!props.apiKey || !currentValue) return
  const requestId = ++lastValidationRequestId
  
  validating.value = true
  statusMessage.value = 'Checking address...'
  statusType.value = 'info'
  
  try {
    const response = await fetch('/api/address/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address: currentValue })
    })
    
    if (!response.ok) {
      throw new Error('Validation failed')
    }
    
    const result = await response.json()
    if (requestId !== lastValidationRequestId) {
      return
    }
    
    if (result.success && result.address) {
      // Update address field if corrected
      if (result.formattedAddress && result.corrected) {
        emit('update:modelValue', result.formattedAddress)
      }
      
      // Emit parsed address to parent
      emit('address-selected', {
        street: result.address.street || currentValue,
        city: result.address.city || '',
        state: result.address.state || '',
        zip: result.address.zip || ''
      })
      
      statusMessage.value = '✓ Address verified'
      statusType.value = 'success'
    } else {
      // Fall back to manual parsing
      parseAndEmitAddress(currentValue)
      statusMessage.value = 'Please check your address and fill in city, state, and zip below'
      statusType.value = 'info'
    }
  } catch (error) {
    console.error('Address validation error:', error)
    // Fall back to manual parsing
    parseAndEmitAddress(currentValue)
    statusMessage.value = 'Please fill in city, state, and zip below'
    statusType.value = 'info'
  } finally {
    validating.value = false
  }
}

// Simple address parsing
const parseAndEmitAddress = (addressString) => {
  if (!addressString) return
  
  const parts = addressString.split(',').map(p => p.trim())
  
  const parsed = {
    street: parts[0] || addressString,
    city: '',
    state: '',
    zip: ''
  }
  
  if (parts.length >= 2) {
    parsed.city = parts[1] || ''
  }
  
  if (parts.length >= 3) {
    const lastPart = parts[2] || ''
    const match = lastPart.match(/([A-Z]{2})\s*(\d{5})?/i)
    if (match) {
      parsed.state = (match[1] || '').toUpperCase()
      parsed.zip = match[2] || ''
    }
  }
  
  emit('address-selected', parsed)
}

watch(
  () => props.apiKey,
  async (newKey, oldKey) => {
    if (newKey && !oldKey) {
      await nextTick()
      const currentValue = getCurrentAddressValue()
      if (currentValue.length >= 10) {
        validateAddress(currentValue)
      }
    }
  }
)
</script>
