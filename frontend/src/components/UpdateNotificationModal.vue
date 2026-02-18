<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-notification-title"
    >
      <div class="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg border border-gray-200 bg-white shadow-xl">
        <div class="p-6 overflow-y-auto flex-1">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-7.15L2.09 9.42a1.76 1.76 0 01.777-2.897L17.5 2.5a1.76 1.76 0 012.5 1.765z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h2 id="update-notification-title" class="text-lg font-semibold text-gray-900">
                {{ isFirstTime ? 'Version history' : entry.title }}
              </h2>
              <!-- First time: full version history (newest first) -->
              <template v-if="isFirstTime && versionHistory.length">
                <div class="mt-4 space-y-6">
                  <section
                    v-for="item in versionHistory"
                    :key="item.version"
                    class="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <h3 class="text-sm font-semibold text-gray-800">{{ item.title }}</h3>
                    <p v-if="item.date" class="text-xs text-gray-500 mb-2">{{ item.date }}</p>
                    <div class="space-y-1.5 text-sm text-gray-700">
                      <p v-for="(line, i) in item.summary" :key="i" class="leading-relaxed" v-html="formatSummaryItem(line)"></p>
                    </div>
                  </section>
                </div>
              </template>
              <!-- Subsequent update: single version -->
              <div v-else-if="entry" class="mt-3 space-y-2 text-sm text-gray-700">
                <p v-for="(item, i) in entry.summary" :key="i" class="leading-relaxed" v-html="formatSummaryItem(item)"></p>
              </div>
            </div>
          </div>

          <div class="mt-5">
            <label class="flex cursor-pointer items-start gap-2">
              <input
                v-model="dontShowAgain"
                type="checkbox"
                class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-600">Don't show update notifications again</span>
            </label>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              @click="dismiss"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getUpdateEntry, getVersionHistory, getLatestVersion } from '../config/updateManifest.js'

const STORAGE_LAST_SEEN = 'opcs_update_last_seen_version'
const STORAGE_HIDE_FOREVER = 'opcs_update_hide_notifications'

const authStore = useAuthStore()
const dontShowAgain = ref(false)
const dismissedThisSession = ref(false)

const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '')

const versionHistory = computed(() => getVersionHistory())

const lastSeenVersion = computed(() => {
  try {
    return localStorage.getItem(STORAGE_LAST_SEEN) || ''
  } catch (_) {
    return ''
  }
})

const isFirstTime = computed(() => !lastSeenVersion.value && versionHistory.value.length > 0)

const entry = computed(() => {
  const forApp = getUpdateEntry(appVersion.value)
  if (forApp) return forApp
  const latest = getLatestVersion()
  return latest ? getUpdateEntry(latest) : null
})

const versionToMarkSeen = computed(() => {
  if (isFirstTime.value) return getLatestVersion() || appVersion.value
  return entry.value?.version || appVersion.value
})

const open = computed(() => {
  if (dismissedThisSession.value) return false
  if (!import.meta.env.PROD) return false
  const {role} = authStore
  if (role !== 'admin' && role !== 'manager') return false
  if (!authStore.isAuthenticated) return false
  try {
    if (localStorage.getItem(STORAGE_HIDE_FOREVER) === 'true') return false
  } catch {
    // localStorage unavailable (e.g. private mode)
  }
  if (isFirstTime.value) return true
  if (!entry.value) return false
  if (lastSeenVersion.value === entry.value.version) return false
  return true
})

function formatSummaryItem(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

function dismiss() {
  dismissedThisSession.value = true
  try {
    const version = versionToMarkSeen.value
    if (version) localStorage.setItem(STORAGE_LAST_SEEN, version)
    if (dontShowAgain.value) {
      localStorage.setItem(STORAGE_HIDE_FOREVER, 'true')
    }
  } catch {
    // localStorage unavailable (e.g. private mode)
  }
  dontShowAgain.value = false
}
</script>
