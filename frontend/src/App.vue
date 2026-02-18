<template>
  <div>
    <router-view />
    <UpdateNotificationModal />
    <NotificationToast v-if="isAuthenticated" />
    <SessionFooter
      v-if="isActive"
      :remaining-ms="remainingMs"
      :expires-at="expiresAt"
      :warning-active="warningActive"
      @extend="recordActivity"
    />
  </div>
</template>

<script setup>
import { watch, computed, onMounted } from 'vue'
import SessionFooter from './components/SessionFooter.vue'
import NotificationToast from './components/NotificationToast.vue'
import UpdateNotificationModal from './components/UpdateNotificationModal.vue'
import { useSessionTimeout } from './composables/useSessionTimeout.js'
import { useNotifications } from './composables/useNotifications.js'

const { remainingMs, expiresAt, warningActive, isActive, recordActivity } = useSessionTimeout()
const { startPolling, stopPolling, resetNotifications } = useNotifications()

const isAuthenticated = computed(() => !!localStorage.getItem('authToken'))

watch(isActive, (active) => {
  document.body.classList.toggle('has-session-footer', active)
}, { immediate: true })

// Start notification polling when authenticated
watch(isAuthenticated, (authed) => {
  if (authed) {
    startPolling()
  } else {
    resetNotifications()
  }
}, { immediate: true })
</script>

