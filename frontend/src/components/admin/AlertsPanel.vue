<template>
  <div v-if="hasAlerts" class="mb-8">
    <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Action Required
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Failed Logins Alert -->
      <div 
        v-if="alerts.failedLogins > 0"
        class="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('navigate', 'activity', { filter: 'failed-logins' })"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-semibold text-red-800">Failed Login Attempts</h3>
            <p class="mt-1 text-sm text-red-700">
              <span class="font-bold text-lg">{{ alerts.failedLogins }}</span> failed login attempts in the last 24 hours
            </p>
            <p class="mt-2 text-xs text-red-600 flex items-center">
              Click to review
              <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>
      </div>

      <!-- Incomplete Onboarding Alert -->
      <div 
        v-if="alerts.incompleteOnboarding > 0"
        class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('navigate', 'active-onboarding')"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-semibold text-yellow-800">Incomplete Onboarding</h3>
            <p class="mt-1 text-sm text-yellow-700">
              <span class="font-bold text-lg">{{ alerts.incompleteOnboarding }}</span> applicants with incomplete onboarding
            </p>
            <p class="mt-2 text-xs text-yellow-600 flex items-center">
              Click to review
              <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>
      </div>

      <!-- Stale Onboarding Alert (no activity in 7+ days) -->
      <div 
        v-if="alerts.staleOnboarding > 0"
        class="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('navigate', 'active-onboarding', { filter: 'stale' })"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-semibold text-orange-800">Stale Onboarding</h3>
            <p class="mt-1 text-sm text-orange-700">
              <span class="font-bold text-lg">{{ alerts.staleOnboarding }}</span> applicants inactive for 7+ days
            </p>
            <p class="mt-2 text-xs text-orange-600 flex items-center">
              Click to review
              <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>
      </div>

      <!-- Compliance Issues Alert -->
      <div 
        v-if="alerts.complianceIssues > 0"
        class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('navigate', 'compliance')"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-semibold text-red-800">Compliance Issues</h3>
            <p class="mt-1 text-sm text-red-700">
              <span class="font-bold text-lg">{{ alerts.complianceIssues }}</span> compliance issues detected
            </p>
            <p class="mt-2 text-xs text-red-600 flex items-center">
              Click to review
              <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>
      </div>

      <!-- Signature Placement Not Configured -->
      <div 
        v-if="alerts.missingSignaturePlacement && alerts.missingSignaturePlacement.length > 0"
        class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('navigate', 'system', { tab: 'pdf-templates' })"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-semibold text-amber-800">Signature placement required</h3>
            <p class="mt-1 text-sm text-amber-700">
              Forms cannot be submitted until signature location is set for:
              <span class="font-medium">{{ formatMissingPlacement(alerts.missingSignaturePlacement) }}</span>.
              Configure in Settings → System → PDF Templates.
            </p>
            <p class="mt-2 text-xs text-amber-600 flex items-center">
              Click to configure
              <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>
      </div>

      <!-- System Errors Alert -->
      <div 
        v-if="alerts.systemErrors > 0"
        class="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        @click="$emit('navigate', 'system')"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-semibold text-purple-800">System Errors</h3>
            <p class="mt-1 text-sm text-purple-700">
              <span class="font-bold text-lg">{{ alerts.systemErrors }}</span> errors in the last 24 hours
            </p>
            <p class="mt-2 text-xs text-purple-600 flex items-center">
              Click to review
              <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- All Clear State -->
  <div v-else class="mb-8">
    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="text-sm font-semibold text-green-800">All Systems Normal</h3>
          <p class="text-sm text-green-700">No critical alerts or action items at this time.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  alerts: {
    type: Object,
    required: true,
    default: () => ({
      failedLogins: 0,
      incompleteOnboarding: 0,
      staleOnboarding: 0,
      complianceIssues: 0,
      systemErrors: 0,
      missingSignaturePlacement: []
    })
  }
})

defineEmits(['navigate'])

function formatMissingPlacement(types) {
  if (!types || !types.length) return ''
  return types.map(t => t === '8850' ? 'Form 8850' : t === 'W4' ? 'W-4' : 'I-9').join(', ')
}

const hasAlerts = computed(() => {
  return props.alerts.failedLogins > 0 ||
         props.alerts.incompleteOnboarding > 0 ||
         props.alerts.staleOnboarding > 0 ||
         props.alerts.complianceIssues > 0 ||
         props.alerts.systemErrors > 0 ||
         (props.alerts.missingSignaturePlacement && props.alerts.missingSignaturePlacement.length > 0)
})
</script>

