<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">User Dashboard</router-link>
            <router-link to="/forms" class="text-gray-600 hover:text-gray-900">Forms</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Export Diagnostics Button -->
      <div class="mb-6 flex justify-end">
        <button
          @click="exportDiagnostics"
          :disabled="exporting"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
        >
          <svg v-if="!exporting" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span v-if="exporting">Exporting...</span>
          <span v-else>Export Diagnostics for Cursor</span>
        </button>
      </div>

      <!-- Dashboard Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Applicants</p>
              <p class="text-2xl font-semibold text-gray-900">{{ dashboardStats.applicants?.total || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Completed Onboarding</p>
              <p class="text-2xl font-semibold text-gray-900">{{ dashboardStats.onboarding?.completed || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">In Progress</p>
              <p class="text-2xl font-semibold text-gray-900">{{ dashboardStats.onboarding?.inProgress || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Failed Logins (24h)</p>
              <p class="text-2xl font-semibold text-gray-900">{{ dashboardStats.activity?.failedLogins || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white shadow rounded-lg">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              @click="activeTab = 'login-attempts'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'login-attempts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Login Attempts
            </button>
            <button
              @click="activeTab = 'onboarding'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'onboarding'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Onboarding Status
            </button>
            <button
              @click="activeTab = 'audit-logs'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'audit-logs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Audit Logs
            </button>
            <button
              @click="activeTab = 'system-health'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'system-health'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              System Health
            </button>
          </nav>
        </div>

        <div class="p-6">
          <!-- Login Attempts Tab -->
          <div v-if="activeTab === 'login-attempts'">
            <div class="mb-4 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Login Attempts</h3>
              <div class="flex space-x-2">
                <select v-model="loginFilter" @change="loadLoginAttempts" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                  <option value="">All</option>
                  <option value="true">Success Only</option>
                  <option value="false">Failed Only</option>
                </select>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="attempt in loginAttempts" :key="attempt.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(attempt.created_at) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ attempt.applicant_first_name && attempt.applicant_last_name 
                        ? `${attempt.applicant_first_name} ${attempt.applicant_last_name}`
                        : `${attempt.first_name} ${attempt.last_name}` }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ attempt.applicant_email || attempt.email }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="[
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                        attempt.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      ]">
                        {{ attempt.success ? 'Success' : 'Failed' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ attempt.ip_address || 'N/A' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">{{ attempt.error_message || '-' }}</td>
                  </tr>
                  <tr v-if="loginAttempts.length === 0">
                    <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No login attempts found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Onboarding Status Tab -->
          <div v-if="activeTab === 'onboarding'">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Onboarding Status</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="app in onboardingStatus" :key="app.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ app.firstName }} {{ app.lastName }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ app.email }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center space-x-2">
                        <span v-if="app.isAdmin" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Admin</span>
                        <span v-else class="text-sm text-gray-400">User</span>
                        <button
                          v-if="app.id !== currentUserId"
                          @click="toggleAdminStatus(app)"
                          :disabled="updatingAdmin === app.id"
                          class="text-xs px-2 py-1 rounded border transition-colors"
                          :class="app.isAdmin 
                            ? 'border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50' 
                            : 'border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50'"
                        >
                          <span v-if="updatingAdmin === app.id">...</span>
                          <span v-else>{{ app.isAdmin ? 'Remove Admin' : 'Make Admin' }}</span>
                        </button>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ app.completedSteps }}/{{ app.totalSteps }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full" :style="{ width: `${app.progress}%` }"></div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="[
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                        app.status === 'completed' ? 'bg-green-100 text-green-800' :
                        app.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      ]">
                        {{ app.status === 'completed' ? 'Completed' : app.status === 'in_progress' ? 'In Progress' : 'Not Started' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(app.createdAt) }}</td>
                  </tr>
                  <tr v-if="onboardingStatus.length === 0">
                    <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No applicants found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Audit Logs Tab -->
          <div v-if="activeTab === 'audit-logs'">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="log in auditLogs" :key="log.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(log.created_at) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ log.action }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.resource_type }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : log.user_id ? `User ${log.user_id}` : 'System' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.ip_address || 'N/A' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">{{ formatDetails(log.details) }}</td>
                  </tr>
                  <tr v-if="auditLogs.length === 0">
                    <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No audit logs found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- System Health Tab -->
          <div v-if="activeTab === 'system-health'">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Database</h4>
                <p class="text-sm text-gray-600">Status: <span class="font-medium text-green-600">{{ systemHealth.database?.status || 'Unknown' }}</span></p>
                <p class="text-sm text-gray-600">Size: {{ systemHealth.database?.sizeMB || '0' }} MB</p>
                <div class="mt-4">
                  <h5 class="text-sm font-medium text-gray-700 mb-2">Table Counts:</h5>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li v-for="(count, table) in systemHealth.database?.tables" :key="table">
                      {{ table }}: {{ count }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Server</h4>
                <p class="text-sm text-gray-600">Status: <span class="font-medium text-green-600">{{ systemHealth.server?.status || 'Unknown' }}</span></p>
                <p class="text-sm text-gray-600">Node Version: {{ systemHealth.server?.nodeVersion || 'Unknown' }}</p>
                <p class="text-sm text-gray-600">Start Time: {{ formatDate(systemHealth.server?.startTime) }}</p>
              </div>
            </div>
            <div v-if="systemHealth.recentErrors && systemHealth.recentErrors.length > 0" class="mt-6">
              <h4 class="font-semibold text-gray-900 mb-2">Recent Errors</h4>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul class="space-y-2">
                  <li v-for="error in systemHealth.recentErrors" :key="error.id" class="text-sm text-red-800">
                    <strong>{{ formatDate(error.createdAt) }}:</strong> {{ error.action }} - {{ error.resourceType }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login-attempts')
const dashboardStats = ref({})
const loginAttempts = ref([])
const onboardingStatus = ref([])
const auditLogs = ref([])
const systemHealth = ref({})
const loginFilter = ref('')
const exporting = ref(false)
const updatingAdmin = ref(null)
const currentUserId = ref(null)

onMounted(async () => {
  // Get current user ID
  try {
    const userResponse = await api.get('/auth/me')
    currentUserId.value = userResponse.data.id
  } catch (error) {
    console.error('Error fetching current user:', error)
  }
  
  await loadDashboardStats()
  await loadLoginAttempts()
  await loadOnboardingStatus()
  await loadAuditLogs()
  await loadSystemHealth()
})

const loadDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard')
    dashboardStats.value = response.data
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  }
}

const loadLoginAttempts = async () => {
  try {
    const params = loginFilter.value ? { success: loginFilter.value } : {}
    const response = await api.get('/admin/login-attempts', { params })
    loginAttempts.value = response.data.attempts || []
  } catch (error) {
    console.error('Error loading login attempts:', error)
  }
}

const loadOnboardingStatus = async () => {
  try {
    const response = await api.get('/admin/onboarding-status')
    onboardingStatus.value = response.data.applicants || []
  } catch (error) {
    console.error('Error loading onboarding status:', error)
  }
}

const loadAuditLogs = async () => {
  try {
    const response = await api.get('/admin/audit-logs')
    auditLogs.value = response.data.logs || []
  } catch (error) {
    console.error('Error loading audit logs:', error)
  }
}

const loadSystemHealth = async () => {
  try {
    const response = await api.get('/admin/system-health')
    systemHealth.value = response.data
  } catch (error) {
    console.error('Error loading system health:', error)
  }
}

const exportDiagnostics = async () => {
  exporting.value = true
  try {
    const response = await api.get('/diagnostics/export')
    const markdown = response.data.markdown || response.data.data
    
    // Copy to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(markdown)
      alert('Diagnostics exported! Markdown copied to clipboard. You can paste it directly into Cursor.')
    } else {
      // Fallback: show in textarea
      const textarea = document.createElement('textarea')
      textarea.value = markdown
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('Diagnostics exported! Markdown copied to clipboard.')
    }
  } catch (error) {
    console.error('Error exporting diagnostics:', error)
    alert('Failed to export diagnostics. Please try again.')
  } finally {
    exporting.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString()
}

const formatDetails = (details) => {
  if (!details) return '-'
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details
    return JSON.stringify(parsed).substring(0, 100)
  } catch {
    return details.substring(0, 100)
  }
}

const toggleAdminStatus = async (user) => {
  if (!confirm(`Are you sure you want to ${user.isAdmin ? 'remove' : 'grant'} administrator privileges for ${user.firstName} ${user.lastName}?`)) {
    return
  }
  
  updatingAdmin.value = user.id
  try {
    const response = await api.put(`/admin/users/${user.id}/admin`, {
      isAdmin: !user.isAdmin
    })
    
    if (response.data.success) {
      // Update local state
      const index = onboardingStatus.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        onboardingStatus.value[index].isAdmin = !user.isAdmin
      }
      
      // Reload dashboard stats to update admin count
      await loadDashboardStats()
      
      alert(response.data.message)
    }
  } catch (error) {
    console.error('Error updating admin status:', error)
    alert(error.response?.data?.error || 'Failed to update admin status')
  } finally {
    updatingAdmin.value = null
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

