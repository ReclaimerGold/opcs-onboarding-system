<template>
  <div
    class="fixed bottom-0 inset-x-0 z-50 border-t"
    :class="warningActive ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'"
  >
    <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-3">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span
            class="text-sm font-medium"
            :class="warningActive ? 'text-yellow-900' : 'text-gray-700'"
          >
            Session expires in {{ formattedRemaining }}
          </span>
          <span class="text-xs text-gray-500">
            {{ formattedExpiryLabel }}
          </span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span v-if="warningActive" class="text-xs text-yellow-800">
            You will be signed out in less than 3 minutes due to inactivity.
          </span>
          <button
            v-if="warningActive"
            type="button"
            class="text-xs font-semibold text-yellow-900 hover:text-yellow-700 underline underline-offset-2"
            @click="$emit('extend')"
          >
            Continue session
          </button>
          <span v-if="appVersion" class="text-xs text-gray-500">Version {{ appVersion }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  remainingMs: {
    type: Number,
    required: true
  },
  expiresAt: {
    type: Number,
    required: true
  },
  warningActive: {
    type: Boolean,
    default: false
  }
})

defineEmits(['extend'])

const appVersion = import.meta.env.VITE_APP_VERSION || ''

const formattedRemaining = computed(() => {
  const totalSeconds = Math.max(0, Math.ceil(props.remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

const formattedExpiryLabel = computed(() => {
  if (!props.expiresAt) {
    return ''
  }
  const formattedTime = new Date(props.expiresAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
  return `Logs out at ${formattedTime}`
})
</script>

