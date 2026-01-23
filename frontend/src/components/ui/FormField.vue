<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
      <span v-if="tooltip" class="ml-1 relative group">
        <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
          {{ tooltip }}
        </span>
      </span>
    </label>
    <p v-if="description" class="text-xs text-gray-500 mb-1">{{ description }}</p>
    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :required="required"
      :disabled="disabled"
      :readonly="readonly"
      :placeholder="placeholder"
      :pattern="pattern"
      :maxlength="maxlength"
      :class="[
        'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary',
        disabled || readonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
        error ? 'border-red-500' : 'border-gray-300'
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  id: String,
  label: String,
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  required: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  placeholder: String,
  pattern: String,
  maxlength: [String, Number],
  description: String,
  tooltip: String,
  error: String
})

defineEmits(['update:modelValue', 'blur'])
</script>

