<template>
  <div class="relative" ref="bellRef">
    <button
      @click="toggleDropdown"
      class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
      aria-label="Notifications"
    >
      <!-- Bell icon -->
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <!-- Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
          <div class="flex items-center space-x-2">
            <button
              v-if="unreadCount > 0"
              @click="handleMarkAllRead"
              class="text-xs text-primary hover:text-primary-light font-medium"
            >
              Mark all as read
            </button>
          </div>
        </div>

        <!-- Notification list -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="py-8 text-center">
            <svg class="animate-spin h-6 w-6 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <div v-else-if="notifications.length === 0" class="py-8 text-center text-sm text-gray-500">
            No notifications
          </div>

          <div v-else>
            <div
              v-for="notif in notifications"
              :key="notif.id"
              @click="handleNotificationClick(notif)"
              class="px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 'bg-blue-50/50': !notif.is_read }"
            >
              <div class="flex items-start space-x-3">
                <!-- Type icon -->
                <div class="flex-shrink-0 mt-0.5">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="getIconClasses(notif.type)"
                  >
                    <component :is="getIconComponent(notif.type)" class="w-4 h-4" />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-gray-900 truncate" :class="{ 'font-semibold': !notif.is_read }">
                      {{ notif.title }}
                    </p>
                    <button
                      @click.stop="handleDelete(notif.id)"
                      class="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p class="text-xs text-gray-600 mt-0.5 line-clamp-2">{{ notif.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatRelativeTime(notif.created_at) }}</p>
                </div>

                <!-- Unread dot -->
                <div v-if="!notif.is_read" class="flex-shrink-0 mt-2">
                  <div class="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <router-link
            to="/notifications/preferences"
            @click="isOpen = false"
            class="text-xs text-gray-500 hover:text-gray-700"
          >
            Manage preferences
          </router-link>
          <span v-if="notificationsTotal > notifications.length" class="text-xs text-gray-400">
            Showing {{ notifications.length }} of {{ notificationsTotal }}
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications.js'

const router = useRouter()
const bellRef = ref(null)
const isOpen = ref(false)

const {
  unreadCount,
  notifications,
  notificationsTotal,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  startPolling,
  stopPolling
} = useNotifications()

onMounted(() => {
  startPolling()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event) {
  if (bellRef.value && !bellRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    fetchNotifications({ limit: 15 })
  }
}

async function handleNotificationClick(notif) {
  if (!notif.is_read) {
    await markAsRead(notif.id)
  }
  isOpen.value = false
  if (notif.link) {
    router.push(notif.link)
  }
}

async function handleMarkAllRead() {
  await markAllAsRead()
}

async function handleDelete(id) {
  await deleteNotification(id)
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'))
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getIconClasses(type) {
  const map = {
    no_bank_account: 'bg-red-100 text-red-600',
    non_gmail_email: 'bg-yellow-100 text-yellow-600',
    new_applicant_signup: 'bg-blue-100 text-blue-600',
    onboarding_complete: 'bg-green-100 text-green-600',
    document_approval_needed: 'bg-amber-100 text-amber-600',
    stale_onboarding: 'bg-orange-100 text-orange-600',
    failed_login_security: 'bg-red-100 text-red-600',
    document_retention_expiring: 'bg-purple-100 text-purple-600',
    i9_document_uploaded: 'bg-blue-100 text-blue-600',
    welcome_message: 'bg-green-100 text-green-600',
    form_approved: 'bg-green-100 text-green-600',
    form_rejected: 'bg-red-100 text-red-600',
    onboarding_reminder: 'bg-yellow-100 text-yellow-600',
    onboarding_complete_confirmation: 'bg-green-100 text-green-600'
  }
  return map[type] || 'bg-gray-100 text-gray-600'
}

// Simple SVG icon components by type
function getIconComponent(type) {
  const icons = {
    no_bank_account: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ]),
    non_gmail_email: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
    ]),
    failed_login_security: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' })
    ]),
    form_rejected: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }

  // Default icon for types without specific icons
  const defaultIcon = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' })
  ])

  return icons[type] || defaultIcon
}
</script>
