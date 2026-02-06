<template>
  <div class="fixed top-4 right-4 z-[9999] flex flex-col items-end space-y-2 pointer-events-none">
    <transition-group
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-x-8"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-8"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto max-w-sm w-full bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden cursor-pointer"
        @click="handleToastClick(toast)"
      >
        <div class="p-4">
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center"
                :class="getToastIconClasses(toast.type)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
            <!-- Content -->
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ toast.title }}</p>
              <p class="mt-0.5 text-xs text-gray-500 line-clamp-2">{{ toast.message }}</p>
            </div>
            <!-- Dismiss -->
            <button
              @click.stop="dismissToast(toast.id)"
              class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <!-- Progress bar -->
        <div class="h-0.5 bg-gray-100">
          <div
            class="h-full bg-primary transition-all ease-linear"
            :style="{ width: '100%', animation: 'toast-progress 5s linear forwards' }"
          ></div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications.js'

const router = useRouter()
const { toasts, dismissToast, markAsRead } = useNotifications()

function handleToastClick(toast) {
  dismissToast(toast.id)
  if (toast.id && typeof toast.id === 'number') {
    markAsRead(toast.id)
  }
  if (toast.link) {
    router.push(toast.link)
  }
}

function getToastIconClasses(type) {
  const highPriority = ['no_bank_account', 'failed_login_security', 'form_rejected']
  const success = ['form_approved', 'onboarding_complete', 'onboarding_complete_confirmation', 'welcome_message']

  if (highPriority.includes(type)) return 'bg-red-100 text-red-600'
  if (success.includes(type)) return 'bg-green-100 text-green-600'
  return 'bg-blue-100 text-blue-600'
}
</script>

<style scoped>
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
