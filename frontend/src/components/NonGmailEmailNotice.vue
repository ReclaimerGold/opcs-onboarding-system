<template>
  <div
    v-if="showNotice"
    class="mt-2 rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800"
    role="status"
  >
    <p class="font-medium">Non-Gmail address</p>
    <p class="mt-1">
      We may not be able to properly send calendar invites for shifts, or provide Google Drive access to paystubs.
      An <strong>@gmail.com</strong> address is preferred.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Current email value; notice shows when set and not ending in @gmail.com */
  email: { type: String, default: '' }
})

const showNotice = computed(() => {
  const e = (props.email || '').trim().toLowerCase()
  if (!e) return false
  return !e.endsWith('@gmail.com')
})
</script>
