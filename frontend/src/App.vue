<template>
  <div>
    <router-view />
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
import { watch } from 'vue'
import SessionFooter from './components/SessionFooter.vue'
import { useSessionTimeout } from './composables/useSessionTimeout.js'

const { remainingMs, expiresAt, warningActive, isActive, recordActivity } = useSessionTimeout()

watch(isActive, (active) => {
  document.body.classList.toggle('has-session-footer', active)
}, { immediate: true })
</script>

