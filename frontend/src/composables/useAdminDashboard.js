import { ref, computed } from 'vue'
import api from '../services/api.js'

/**
 * Composable for managing admin dashboard data and alerts
 */
export function useAdminDashboard() {
  // Dashboard stats
  const dashboardStats = ref({})
  const onboardingStatus = ref([])
  const loginAttempts = ref([])
  const auditLogs = ref([])
  const systemHealth = ref({})
  const allSubmissions = ref([])
  const allI9Documents = ref([])
  const complianceReport = ref(null)

  // Loading states
  const loading = ref({
    dashboard: false,
    onboarding: false,
    logins: false,
    audits: false,
    health: false,
    submissions: false,
    documents: false,
    compliance: false,
    users: false
  })

  // Error states
  const errors = ref({})

  // Computed alerts based on dashboard data
  const alerts = computed(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Count stale onboarding (in progress but no recent activity)
    const staleCount = onboardingStatus.value.filter(app => {
      if (app.status !== 'in_progress') return false
      const lastActivity = app.lastSubmission ? new Date(app.lastSubmission) : new Date(app.createdAt)
      return lastActivity < sevenDaysAgo
    }).length

    // Count compliance issues
    let complianceIssues = 0
    if (complianceReport.value?.summary) {
      complianceIssues = complianceReport.value.summary.criticalIssues || 0
    }

    const ready = dashboardStats.value.signaturePlacementReady || {}
    const missingSignaturePlacement = [].concat(
      !ready.w4 ? ['W4'] : [],
      !ready.i9 ? ['I9'] : [],
      !ready['8850'] ? ['8850'] : []
    )

    return {
      failedLogins: dashboardStats.value.activity?.failedLogins || 0,
      incompleteOnboarding: dashboardStats.value.onboarding?.inProgress || 0,
      staleOnboarding: staleCount,
      complianceIssues,
      systemErrors: systemHealth.value.recentErrors?.length || 0,
      missingSignaturePlacement
    }
  })

  // Workflow-grouped onboarding data
  const workflowGroups = computed(() => {
    const active = onboardingStatus.value.filter(app => app.status === 'in_progress')
    const completed = onboardingStatus.value.filter(app => app.status === 'completed')
    const notStarted = onboardingStatus.value.filter(app => app.status === 'not_started')

    return { active, completed, notStarted }
  })

  // Quick stats
  const quickStats = computed(() => ({
    totalApplicants: dashboardStats.value.applicants?.total || 0,
    totalAdmins: dashboardStats.value.applicants?.admins || 0,
    completedOnboarding: dashboardStats.value.onboarding?.completed || 0,
    inProgressOnboarding: dashboardStats.value.onboarding?.inProgress || 0,
    notStartedOnboarding: dashboardStats.value.onboarding?.notStarted || 0,
    recentLogins: dashboardStats.value.activity?.recentLogins || 0,
    failedLogins: dashboardStats.value.activity?.failedLogins || 0,
    totalSubmissions: dashboardStats.value.activity?.totalSubmissions || 0,
    recentAuditLogs: dashboardStats.value.activity?.recentAuditLogs || 0
  }))

  // Load functions
  const loadDashboardStats = async () => {
    loading.value.dashboard = true
    try {
      const response = await api.get('/admin/dashboard')
      dashboardStats.value = response.data
      errors.value.dashboard = null
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      errors.value.dashboard = error.message
    } finally {
      loading.value.dashboard = false
    }
  }

  const loadOnboardingStatus = async (params = {}) => {
    loading.value.onboarding = true
    try {
      const response = await api.get('/admin/onboarding-status', { params })
      const applicants = response.data.applicants || []
      // Only update shared onboardingStatus when loading full list (no status filter);
      // filtered loads (e.g. status=completed) are for tab tables and must not overwrite
      // the shared ref so Overview counts and workflow groups stay correct.
      if (params.status === undefined || params.status === '') {
        onboardingStatus.value = applicants
      }
      errors.value.onboarding = null
      return { ...response.data, applicants }
    } catch (error) {
      console.error('Error loading onboarding status:', error)
      errors.value.onboarding = error.message
      return { applicants: [], pagination: { total: 0 } }
    } finally {
      loading.value.onboarding = false
    }
  }

  const loadLoginAttempts = async (params = {}) => {
    loading.value.logins = true
    try {
      const response = await api.get('/admin/login-attempts', { params })
      loginAttempts.value = response.data.attempts || []
      errors.value.logins = null
      return response.data
    } catch (error) {
      console.error('Error loading login attempts:', error)
      errors.value.logins = error.message
      return { attempts: [], total: 0 }
    } finally {
      loading.value.logins = false
    }
  }

  const loadAuditLogs = async (params = {}) => {
    loading.value.audits = true
    try {
      const response = await api.get('/admin/audit-logs', { params })
      auditLogs.value = response.data.logs || []
      errors.value.audits = null
      return response.data
    } catch (error) {
      console.error('Error loading audit logs:', error)
      errors.value.audits = error.message
      return { logs: [], total: 0 }
    } finally {
      loading.value.audits = false
    }
  }

  const loadSystemHealth = async () => {
    loading.value.health = true
    try {
      const response = await api.get('/admin/system-health')
      systemHealth.value = response.data
      errors.value.health = null
    } catch (error) {
      console.error('Error loading system health:', error)
      errors.value.health = error.message
    } finally {
      loading.value.health = false
    }
  }

  const loadAllSubmissions = async (params = {}) => {
    loading.value.submissions = true
    try {
      const response = await api.get('/admin/submissions', { params })
      allSubmissions.value = response.data.submissions || []
      errors.value.submissions = null
      return response.data
    } catch (error) {
      console.error('Error loading submissions:', error)
      errors.value.submissions = error.message
      return { submissions: [], total: 0 }
    } finally {
      loading.value.submissions = false
    }
  }

  const loadAllI9Documents = async (params = {}) => {
    loading.value.documents = true
    try {
      const response = await api.get('/admin/i9-documents', { params })
      allI9Documents.value = response.data.documents || []
      errors.value.documents = null
      return response.data
    } catch (error) {
      console.error('Error loading I-9 documents:', error)
      errors.value.documents = error.message
      return { documents: [], total: 0 }
    } finally {
      loading.value.documents = false
    }
  }

  const loadUsers = async (params = {}) => {
    loading.value.users = true
    errors.value.users = null
    try {
      const response = await api.get('/admin/users', { params })
      const { data } = response
      if (!data || typeof data !== 'object') {
        errors.value.users = 'Invalid response from server'
        return { users: [], pagination: { total: 0 } }
      }
      return {
        users: Array.isArray(data.users) ? data.users : [],
        pagination: data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 }
      }
    } catch (error) {
      console.error('Error loading users:', error)
      const status = error.response?.status
      const msg = error.response?.data?.error || error.message
      errors.value.users = status ? `${msg} (${status})` : msg
      return { users: [], pagination: { total: 0 } }
    } finally {
      loading.value.users = false
    }
  }

  const updateUserRole = async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role })
    return response.data
  }

  const deactivateUser = async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  }

  const loadComplianceReport = async () => {
    loading.value.compliance = true
    try {
      const response = await api.get('/admin/compliance-check')
      complianceReport.value = response.data
      errors.value.compliance = null
    } catch (error) {
      console.error('Error loading compliance report:', error)
      errors.value.compliance = error.message
    } finally {
      loading.value.compliance = false
    }
  }

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      loadDashboardStats(),
      loadOnboardingStatus(),
      loadLoginAttempts(),
      loadAuditLogs(),
      loadSystemHealth(),
      loadAllSubmissions(),
      loadAllI9Documents(),
      loadComplianceReport()
    ])
  }

  // Note: loadUsers is not in loadAllData to avoid loading users on every dashboard load

  // Refresh specific data
  const refresh = async (type) => {
    switch (type) {
      case 'dashboard':
        await loadDashboardStats()
        break
      case 'onboarding':
        await loadOnboardingStatus()
        break
      case 'logins':
        await loadLoginAttempts()
        break
      case 'audits':
        await loadAuditLogs()
        break
      case 'health':
        await loadSystemHealth()
        break
      case 'submissions':
        await loadAllSubmissions()
        break
      case 'documents':
        await loadAllI9Documents()
        break
      case 'users':
        await loadUsers()
        break
      case 'compliance':
        await loadComplianceReport()
        break
      default:
        await loadAllData()
    }
  }

  return {
    // State
    dashboardStats,
    onboardingStatus,
    loginAttempts,
    auditLogs,
    systemHealth,
    allSubmissions,
    allI9Documents,
    complianceReport,
    loading,
    errors,

    // Computed
    alerts,
    workflowGroups,
    quickStats,

    // Methods
    loadDashboardStats,
    loadOnboardingStatus,
    loadLoginAttempts,
    loadAuditLogs,
    loadSystemHealth,
    loadAllSubmissions,
    loadAllI9Documents,
    loadUsers,
    updateUserRole,
    deactivateUser,
    loadComplianceReport,
    loadAllData,
    refresh
  }
}

