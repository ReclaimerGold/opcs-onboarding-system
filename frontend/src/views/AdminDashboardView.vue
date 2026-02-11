<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow">
      <div class="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div class="flex flex-wrap justify-between items-center gap-3 min-h-16 py-3 sm:py-0 sm:h-16">
          <div class="flex items-center space-x-3 min-w-0">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-10 w-auto flex-shrink-0"
            />
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">Admin Dashboard</h1>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:gap-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900 py-2 px-1 min-h-[44px] flex items-center">User Dashboard</router-link>
            <router-link to="/approvals" class="text-gray-600 hover:text-gray-900 py-2 px-1 min-h-[44px] flex items-center">Approvals</router-link>
            <router-link to="/forms" class="text-gray-600 hover:text-gray-900 py-2 px-1 min-h-[44px] flex items-center">Forms</router-link>
            <router-link to="/settings" class="text-gray-600 hover:text-gray-900 py-2 px-1 min-h-[44px] flex items-center">Settings</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900 py-2 px-3 min-h-[44px] flex items-center">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
      <!-- Action Buttons -->
      <div class="mb-6 flex justify-end space-x-3">
        <button
          @click="refreshAll"
          :disabled="isLoading"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
        >
          <svg :class="['w-5 h-5 mr-2', isLoading && 'animate-spin']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        <button
          @click="exportDiagnostics"
          :disabled="exporting"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
        >
          <svg v-if="!exporting" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span v-if="exporting">Exporting...</span>
          <span v-else>Export Diagnostics</span>
        </button>
      </div>

      <!-- Alerts Panel (Priority Section) -->
      <AlertsPanel 
        :alerts="dashboard.alerts.value" 
        @navigate="handleAlertNavigation"
      />

      <!-- Quick Stats Cards -->
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
              <p class="text-2xl font-semibold text-gray-900">{{ dashboard.quickStats.value.totalApplicants }}</p>
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
              <p class="text-2xl font-semibold text-gray-900">{{ dashboard.quickStats.value.completedOnboarding }}</p>
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
              <p class="text-2xl font-semibold text-gray-900">{{ dashboard.quickStats.value.inProgressOnboarding }}</p>
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
              <p class="text-2xl font-semibold text-gray-900">{{ dashboard.quickStats.value.failedLogins }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Tab Navigation -->
      <div class="bg-white shadow rounded-lg">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px overflow-x-auto">
            <button
              @click="activeTab = 'overview'"
              :class="tabClass('overview')"
            >
              Overview
            </button>
            <button
              @click="activeTab = 'active-onboarding'"
              :class="tabClass('active-onboarding')"
            >
              Active Onboarding
              <span v-if="dashboard.quickStats.value.inProgressOnboarding > 0" class="ml-1.5 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                {{ dashboard.quickStats.value.inProgressOnboarding }}
              </span>
            </button>
            <button
              @click="activeTab = 'completed'"
              :class="tabClass('completed')"
            >
              Completed
            </button>
            <button
              @click="activeTab = 'users'"
              :class="tabClass('users')"
            >
              Users
            </button>
            <button
              @click="activeTab = 'documents'"
              :class="tabClass('documents')"
            >
              Documents
            </button>
            <button
              @click="activeTab = 'activity'"
              :class="tabClass('activity')"
            >
              Activity
            </button>
            <button
              @click="activeTab = 'compliance'"
              :class="tabClass('compliance')"
            >
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Compliance
              </span>
            </button>
            <button
              @click="activeTab = 'system'"
              :class="tabClass('system')"
            >
              System
            </button>
          </nav>
        </div>

        <div class="p-6">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Dashboard Overview</h3>
            
            <!-- Workflow Summary -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <h4 class="text-sm font-semibold text-yellow-800 mb-2">Active Onboarding</h4>
                <p class="text-3xl font-bold text-yellow-900">{{ dashboard.workflowGroups.value.active?.length || 0 }}</p>
                <p class="text-sm text-yellow-700 mt-1">applicants in progress</p>
                <button 
                  @click="activeTab = 'active-onboarding'"
                  class="mt-3 text-sm text-yellow-800 hover:text-yellow-900 flex items-center"
                >
                  View all
                  <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <h4 class="text-sm font-semibold text-green-800 mb-2">Completed</h4>
                <p class="text-3xl font-bold text-green-900">{{ dashboard.workflowGroups.value.completed?.length || 0 }}</p>
                <p class="text-sm text-green-700 mt-1">onboarding completed</p>
                <button 
                  @click="activeTab = 'completed'"
                  class="mt-3 text-sm text-green-800 hover:text-green-900 flex items-center"
                >
                  View all
                  <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">Not Started</h4>
                <p class="text-3xl font-bold text-gray-900">{{ dashboard.workflowGroups.value.notStarted?.length || 0 }}</p>
                <p class="text-sm text-gray-600 mt-1">awaiting onboarding</p>
              </div>
            </div>

            <!-- Approval Queue Summary -->
            <div v-if="approvalStats.total > 0" class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <h4 class="text-sm font-semibold text-blue-800 mb-1">Total Approvals</h4>
                <p class="text-2xl font-bold text-blue-900">{{ approvalStats.total }}</p>
              </div>
              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <h4 class="text-sm font-semibold text-yellow-800 mb-1">Pending Review</h4>
                <p class="text-2xl font-bold text-yellow-900">{{ approvalStats.pending }}</p>
              </div>
              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <h4 class="text-sm font-semibold text-green-800 mb-1">Approved</h4>
                <p class="text-2xl font-bold text-green-900">{{ approvalStats.approved }}</p>
              </div>
              <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                <h4 class="text-sm font-semibold text-red-800 mb-1">Rejected</h4>
                <p class="text-2xl font-bold text-red-900">{{ approvalStats.rejected }}</p>
              </div>
              <div class="lg:col-span-4">
                <router-link to="/approvals" class="text-sm text-primary hover:text-blue-700 flex items-center">
                  Go to approval queue
                  <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </router-link>
              </div>
            </div>

            <!-- Recent Activity Summary -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white border rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Recent Login Activity (24h)</h4>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Total Logins</span>
                    <span class="font-semibold">{{ dashboard.quickStats.value.recentLogins }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Failed Attempts</span>
                    <span :class="dashboard.quickStats.value.failedLogins > 0 ? 'font-semibold text-red-600' : 'font-semibold'">
                      {{ dashboard.quickStats.value.failedLogins }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Audit Events</span>
                    <span class="font-semibold">{{ dashboard.quickStats.value.recentAuditLogs }}</span>
                  </div>
                </div>
                <button 
                  @click="activeTab = 'activity'"
                  class="mt-4 text-sm text-primary hover:text-primary-light flex items-center"
                >
                  View activity logs
                  <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div class="bg-white border rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Document Summary</h4>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Form Submissions</span>
                    <span class="font-semibold">{{ dashboard.quickStats.value.totalSubmissions }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">I-9 Documents</span>
                    <span class="font-semibold">{{ dashboard.allI9Documents.value?.length || 0 }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Admin Users</span>
                    <span class="font-semibold">{{ dashboard.quickStats.value.totalAdmins }}</span>
                  </div>
                </div>
                <button 
                  @click="activeTab = 'documents'"
                  class="mt-4 text-sm text-primary hover:text-primary-light flex items-center"
                >
                  View documents
                  <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Active Onboarding Tab -->
          <div v-if="activeTab === 'active-onboarding'">
            <DataTable
              title="Active Onboarding"
              :columns="onboardingColumns"
              :data="onboardingData"
              :loading="dashboard.loading.value.onboarding"
              :pagination="onboardingPagination"
              :filters="onboardingFilters"
              :sort="onboardingSort"
              :quick-filters="onboardingQuickFilters"
              search-placeholder="Search by name or email..."
              @search="handleOnboardingSearch"
              @filter-change="handleOnboardingFilterChange"
              @page-change="handleOnboardingPageChange"
              @limit-change="handleOnboardingLimitChange"
              @sort-change="handleOnboardingSort"
              @export="handleOnboardingExport"
              @refresh="loadOnboardingData"
            >
              <template #cell-progress="{ row }">
                <div class="flex items-center space-x-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px] min-w-[100px]">
                    <div
                      class="bg-primary h-2 rounded-full transition-[width] duration-200"
                      :style="{ width: `${Math.min(100, row.progress ?? 0)}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500">{{ row.completedSteps ?? 0 }}/7</span>
                </div>
              </template>
              <template #cell-status="{ row }">
                <span :class="getStatusBadgeClass(row.status)">
                  {{ formatStatus(row.status) }}
                </span>
              </template>
              <template #cell-isAdmin="{ row }">
                <span :class="getRoleBadgeClass(row.role || (row.isAdmin ? 'admin' : 'applicant'))">
                  {{ formatRole(row.role || (row.isAdmin ? 'admin' : 'applicant')) }}
                </span>
              </template>
            </DataTable>
          </div>

          <!-- Completed Tab -->
          <div v-if="activeTab === 'completed'">
            <DataTable
              title="Completed Onboarding"
              :columns="onboardingColumns"
              :data="completedData"
              :loading="dashboard.loading.value.onboarding"
              :pagination="completedPagination"
              :filters="completedFilters"
              :sort="completedSort"
              search-placeholder="Search by name or email..."
              @search="handleCompletedSearch"
              @filter-change="handleCompletedFilterChange"
              @page-change="handleCompletedPageChange"
              @limit-change="handleCompletedLimitChange"
              @sort-change="handleCompletedSort"
              @export="handleCompletedExport"
              @refresh="loadCompletedData"
            >
              <template #cell-progress="{ row }">
                <div class="flex items-center space-x-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px] min-w-[100px]">
                    <div
                      class="bg-green-500 h-2 rounded-full transition-[width] duration-200"
                      :style="{ width: `${row.status === 'completed' ? 100 : Math.min(100, row.progress ?? 0)}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-green-600 font-medium">Complete</span>
                </div>
              </template>
              <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Completed
                </span>
              </template>
              <template #cell-isAdmin="{ row }">
                <span :class="getRoleBadgeClass(row.role || (row.isAdmin ? 'admin' : 'applicant'))">
                  {{ formatRole(row.role || (row.isAdmin ? 'admin' : 'applicant')) }}
                </span>
              </template>
            </DataTable>
          </div>

          <!-- Users Tab -->
          <div v-if="activeTab === 'users'">
            <div v-if="dashboard.errors.value.users" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span class="text-sm text-red-800">Failed to load users: {{ dashboard.errors.value.users }}</span>
              <button
                type="button"
                @click="loadUsersData"
                class="text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
            <div class="mb-4 flex items-center gap-4">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input
                  v-model="usersIncludeInactive"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary focus:ring-primary"
                  @change="loadUsersData"
                />
                Include deactivated users
              </label>
            </div>
            <DataTable
              title="User Management"
              :columns="usersColumns"
              :data="usersData"
              :loading="dashboard.loading.value.users"
              :pagination="usersPagination"
              :filters="usersFilters"
              :sort="usersSort"
              search-placeholder="Search by name or email..."
              @search="handleUsersSearch"
              @filter-change="handleUsersFilterChange"
              @page-change="handleUsersPageChange"
              @limit-change="handleUsersLimitChange"
              @sort-change="handleUsersSort"
              @refresh="loadUsersData"
            >
              <template #cell-firstName="{ row }">
                <span>{{ row.firstName }}</span>
                <span v-if="row.id === currentUserId" class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary" title="Current user">You</span>
                <span v-if="row.isActive === false" class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-600">Deactivated</span>
              </template>
              <template #cell-role="{ row }">
                <div class="flex items-center space-x-2">
                  <span :class="getRoleBadgeClass(row.role)">{{ formatRole(row.role) }}</span>
                  <select
                    v-if="row.id !== currentUserId && (row.isActive === undefined || row.isActive === true)"
                    :value="row.role"
                    :disabled="updatingRole === row.id"
                    @change="(e) => changeUserRole(row, e.target.value)"
                    class="text-xs border rounded px-2 py-1 bg-white"
                  >
                    <option value="applicant">Applicant</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <span v-else-if="row.id === currentUserId" class="text-xs text-gray-400">(you)</span>
                </div>
              </template>
              <template #cell-assignedManager="{ row }">
                <select
                  v-if="row.role === 'applicant' || row.role === 'employee'"
                  :value="row.assignedManagerId || ''"
                  :disabled="assigningManager === row.id"
                  @change="(e) => assignManagerToUser(row, e.target.value)"
                  class="text-xs border rounded px-2 py-1 bg-white max-w-[180px]"
                >
                  <option value="">None</option>
                  <option v-for="m in managersList" :key="m.id" :value="m.id">
                    {{ m.first_name }} {{ m.last_name }}
                  </option>
                </select>
                <span v-else class="text-xs text-gray-400">N/A</span>
              </template>
              <template #actions="{ row }">
                <button
                  v-if="row.id !== currentUserId && (row.isActive === undefined || row.isActive === true)"
                  type="button"
                  :disabled="deactivatingUserId === row.id"
                  @click="deactivateUserConfirm(row)"
                  class="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {{ deactivatingUserId === row.id ? '...' : 'Deactivate' }}
                </button>
                <span v-else-if="row.id === currentUserId" class="text-xs text-gray-400">—</span>
                <span v-else class="text-xs text-gray-400">—</span>
              </template>
            </DataTable>
          </div>

          <!-- Documents Tab -->
          <div v-if="activeTab === 'documents'">
            <div class="mb-4">
              <div class="border-b border-gray-200">
                <nav class="flex -mb-px">
                  <button
                    @click="documentTab = 'submissions'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      documentTab === 'submissions'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    Form Submissions
                  </button>
                  <button
                    @click="documentTab = 'i9'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      documentTab === 'i9'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    I-9 Documents
                  </button>
                </nav>
              </div>
            </div>

            <!-- Form Submissions -->
            <DataTable
              v-if="documentTab === 'submissions'"
              title="Form Submissions"
              :columns="submissionColumns"
              :data="submissionsData"
              :loading="dashboard.loading.value.submissions"
              :pagination="submissionsPagination"
              :filters="submissionsFilters"
              :sort="submissionsSort"
              search-placeholder="Search submissions..."
              @search="handleSubmissionsSearch"
              @filter-change="handleSubmissionsFilterChange"
              @page-change="handleSubmissionsPageChange"
              @limit-change="handleSubmissionsLimitChange"
              @sort-change="handleSubmissionsSort"
              @export="handleSubmissionsExport"
              @refresh="loadSubmissions"
            >
              <template #actions="{ row }">
                <a
                  :href="row.web_view_link || `/api/forms/submissions/${row.id}/view`"
                  target="_blank"
                  class="text-primary hover:text-primary-light hover:underline text-sm"
                >
                  View PDF
                </a>
                <span v-if="row.web_view_link" class="ml-2 text-xs text-green-600" title="Stored in Google Drive">
                  <svg class="w-3 h-3 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                </span>
              </template>
            </DataTable>

            <!-- I-9 Documents -->
            <DataTable
              v-if="documentTab === 'i9'"
              title="I-9 Documents"
              :columns="i9Columns"
              :data="i9Data"
              :loading="dashboard.loading.value.documents"
              :pagination="i9Pagination"
              :filters="i9Filters"
              :sort="i9Sort"
              search-placeholder="Search I-9 documents..."
              @search="handleI9Search"
              @filter-change="handleI9FilterChange"
              @page-change="handleI9PageChange"
              @limit-change="handleI9LimitChange"
              @sort-change="handleI9Sort"
              @export="handleI9Export"
              @refresh="loadI9Documents"
            >
              <template #cell-document_category="{ row }">
                <span :class="getCategoryBadgeClass(row.document_category)">
                  {{ formatCategory(row.document_category) }}
                </span>
              </template>
              <template #actions="{ row }">
                <a
                  :href="row.web_view_link || `/api/forms/i9/documents/${row.id}/view`"
                  target="_blank"
                  class="text-primary hover:text-primary-light hover:underline text-sm"
                >
                  View
                </a>
                <span v-if="row.web_view_link" class="ml-2 text-xs text-green-600" title="Stored in Google Drive">
                  <svg class="w-3 h-3 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                </span>
              </template>
            </DataTable>
          </div>

          <!-- Activity Tab -->
          <div v-if="activeTab === 'activity'">
            <div class="mb-4">
              <div class="border-b border-gray-200">
                <nav class="flex -mb-px">
                  <button
                    @click="activityTab = 'logins'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      activityTab === 'logins'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    Login Attempts
                  </button>
                  <button
                    @click="activityTab = 'audit'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      activityTab === 'audit'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    Audit Logs
                  </button>
                </nav>
              </div>
            </div>

            <!-- Login Attempts -->
            <DataTable
              v-if="activityTab === 'logins'"
              title="Login Attempts"
              :columns="loginColumns"
              :data="loginsData"
              :loading="dashboard.loading.value.logins"
              :pagination="loginsPagination"
              :filters="loginsFilters"
              :sort="loginsSort"
              :quick-filters="loginQuickFilters"
              search-placeholder="Search login attempts..."
              @search="handleLoginsSearch"
              @filter-change="handleLoginsFilterChange"
              @page-change="handleLoginsPageChange"
              @limit-change="handleLoginsLimitChange"
              @sort-change="handleLoginsSort"
              @export="handleLoginsExport"
              @refresh="loadLoginAttempts"
            >
              <template #cell-success="{ row }">
                <span :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  row.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]">
                  {{ row.success ? 'Success' : 'Failed' }}
                </span>
              </template>
            </DataTable>

            <!-- Audit Logs -->
            <DataTable
              v-if="activityTab === 'audit'"
              title="Audit Logs"
              :columns="auditColumns"
              :data="auditData"
              :loading="dashboard.loading.value.audits"
              :pagination="auditPagination"
              :filters="auditFilters"
              :sort="auditSort"
              search-placeholder="Search audit logs..."
              @search="handleAuditSearch"
              @filter-change="handleAuditFilterChange"
              @page-change="handleAuditPageChange"
              @limit-change="handleAuditLimitChange"
              @sort-change="handleAuditSort"
              @export="handleAuditExport"
              @refresh="loadAuditLogs"
            />
          </div>

          <!-- Compliance Tab -->
          <div v-if="activeTab === 'compliance'">
            <ComplianceChecker />
          </div>

          <!-- System Tab -->
          <div v-if="activeTab === 'system'">
            <div class="mb-4">
              <div class="border-b border-gray-200">
                <nav class="flex -mb-px">
                  <button
                    @click="systemTab = 'health'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      systemTab === 'health'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    System Health
                  </button>
                  <button
                    @click="systemTab = 'tests'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      systemTab === 'tests'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    Tests
                  </button>
                  <button
                    @click="systemTab = 'templates'"
                    :class="[
                      'px-4 py-2 text-sm font-medium border-b-2',
                      systemTab === 'templates'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]"
                  >
                    PDF Templates
                  </button>
                </nav>
              </div>
            </div>

            <!-- System Health -->
            <div v-if="systemTab === 'health'">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="font-semibold text-gray-900 mb-2">Database</h4>
                  <p class="text-sm text-gray-600">Status: <span class="font-medium text-green-600">{{ dashboard.systemHealth.value.database?.status || 'Unknown' }}</span></p>
                  <p class="text-sm text-gray-600">Size: {{ dashboard.systemHealth.value.database?.sizeMB || '0' }} MB</p>
                  <div class="mt-4">
                    <h5 class="text-sm font-medium text-gray-700 mb-2">Table Counts:</h5>
                    <ul class="text-sm text-gray-600 space-y-1">
                      <li v-for="(count, table) in dashboard.systemHealth.value.database?.tables" :key="table">
                        {{ table }}: {{ count }}
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="font-semibold text-gray-900 mb-2">Server</h4>
                  <p class="text-sm text-gray-600">Status: <span class="font-medium text-green-600">{{ dashboard.systemHealth.value.server?.status || 'Unknown' }}</span></p>
                  <p class="text-sm text-gray-600">Node Version: {{ dashboard.systemHealth.value.server?.nodeVersion || 'Unknown' }}</p>
                  <p class="text-sm text-gray-600">Start Time: {{ formatDate(dashboard.systemHealth.value.server?.startTime) }}</p>
                </div>
              </div>
              <!-- Google Drive Utilities -->
              <div class="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-2">Google Drive Utilities</h4>
                
                <!-- Fix Permissions -->
                <div class="mb-4">
                  <p class="text-sm text-gray-600 mb-2">
                    Fix permissions on existing Google Drive files to make them viewable by anyone with the link.
                  </p>
                  <div class="flex items-center space-x-4">
                    <button
                      @click="fixGDrivePermissions"
                      :disabled="fixingPermissions"
                      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center text-sm"
                    >
                      <svg v-if="!fixingPermissions" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <svg v-else class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{{ fixingPermissions ? 'Fixing...' : 'Fix File Permissions' }}</span>
                    </button>
                    <span v-if="permissionFixResult" :class="permissionFixResult.success ? 'text-green-600' : 'text-red-600'" class="text-sm">
                      {{ permissionFixResult.message }}
                    </span>
                  </div>
                </div>
                
                <!-- Regenerate PDFs -->
                <div class="pt-4 border-t border-gray-200">
                  <p class="text-sm text-gray-600 mb-2">
                    Regenerate corrupted PDFs - deletes old files and uploads fresh copies from stored form data.
                  </p>
                  <div class="flex items-center space-x-4">
                    <button
                      @click="regeneratePdfs"
                      :disabled="regeneratingPdfs"
                      class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center text-sm"
                    >
                      <svg v-if="!regeneratingPdfs" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <svg v-else class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{{ regeneratingPdfs ? 'Regenerating...' : 'Regenerate All PDFs' }}</span>
                    </button>
                    <span v-if="regeneratePdfsResult" :class="regeneratePdfsResult.success ? 'text-green-600' : 'text-red-600'" class="text-sm">
                      {{ regeneratePdfsResult.message }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="dashboard.systemHealth.value.recentErrors && dashboard.systemHealth.value.recentErrors.length > 0" class="mt-6">
                <h4 class="font-semibold text-gray-900 mb-2">Recent Errors</h4>
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul class="space-y-2">
                    <li v-for="error in dashboard.systemHealth.value.recentErrors" :key="error.id" class="text-sm text-red-800">
                      <strong>{{ formatDate(error.createdAt) }}:</strong> {{ error.action }} - {{ error.resourceType }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Tests -->
            <div v-if="systemTab === 'tests'">
              <div class="mb-6 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">Unit Tests</h3>
                <button
                  @click="runTests"
                  :disabled="runningTests"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                >
                  <svg v-if="!runningTests" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ runningTests ? 'Running...' : 'Run All Tests' }}</span>
                </button>
              </div>

              <div v-if="!testResults && !runningTests" class="text-center py-12 text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-lg font-medium">No test results yet</p>
                <p class="text-sm mt-2">Click "Run All Tests" to execute backend and frontend unit tests</p>
              </div>

              <div v-if="testResults" class="space-y-6">
                <TestResultsPanel :results="testResults" />
              </div>
            </div>

            <!-- PDF Templates and Signature Placement -->
            <div v-if="systemTab === 'templates'" class="space-y-6">
              <PdfTemplatesPanel />
              <SignaturePlacementPanel />

              <!-- Manager Signature Configuration -->
              <div class="bg-white shadow rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Manager Signature Requirements</h3>
                <p class="text-sm text-gray-500 mb-4">Select which form types require a manager/employer signature. Submitted documents for these forms will enter an approval queue.</p>
                <div class="space-y-2 mb-4">
                  <label v-for="ft in managerSigFormTypes" :key="ft.code" class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      :checked="managerRequiredForms.includes(ft.code)"
                      @change="toggleManagerRequiredForm(ft.code)"
                      class="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {{ ft.label }}
                  </label>
                </div>
                <button @click="saveManagerRequiredForms" :disabled="savingManagerRequired" class="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition">
                  {{ savingManagerRequired ? 'Saving...' : 'Save Requirements' }}
                </button>
                <span v-if="managerRequiredSaveMsg" class="ml-3 text-sm" :class="managerRequiredSaveSuccess ? 'text-green-600' : 'text-red-600'">{{ managerRequiredSaveMsg }}</span>
              </div>

              <!-- Manager/Employer Signature Placement -->
              <SignaturePlacementPanel placementType="manager" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prompt to start PDF template downloads (user must click, then progress modal) -->
    <PdfDownloadPromptDialog
      :open="showPdfDownloadPrompt"
      @start-download="onStartPdfDownload"
    />
    <PdfTemplateDownloadModal
      :open="showPdfDownloadModal"
      @close="showPdfDownloadModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAdminDashboard } from '../composables/useAdminDashboard.js'
import { useTableFilters } from '../composables/useTableFilters.js'
import api from '../services/api.js'
import { exportToCSV } from '../utils/exportUtils.js'

// Components
import AlertsPanel from '../components/admin/AlertsPanel.vue'
import DataTable from '../components/admin/DataTable.vue'
import ComplianceChecker from '../components/admin/ComplianceChecker.vue'
import TestResultsPanel from '../components/admin/TestResultsPanel.vue'
import PdfTemplatesPanel from '../components/admin/PdfTemplatesPanel.vue'
import PdfDownloadPromptDialog from '../components/admin/PdfDownloadPromptDialog.vue'
import PdfTemplateDownloadModal from '../components/admin/PdfTemplateDownloadModal.vue'
import SignaturePlacementPanel from '../components/admin/SignaturePlacementPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const dashboard = useAdminDashboard()

// Tab state
const activeTab = ref('overview')
const documentTab = ref('submissions')
const activityTab = ref('logins')
const systemTab = ref('health')

// Loading states
const exporting = ref(false)
const fixingPermissions = ref(false)
const permissionFixResult = ref(null)
const regeneratingPdfs = ref(false)
const regeneratePdfsResult = ref(null)
const runningTests = ref(false)
const updatingRole = ref(null)
const deactivatingUserId = ref(null)
const usersIncludeInactive = ref(false)
const currentUserId = ref(null)
const testResults = ref(null)
const showPdfDownloadPrompt = ref(false)
const showPdfDownloadModal = ref(false)

// Manager assignment & approval workflow state
const managersList = ref([])
const assigningManager = ref(null)
const approvalStats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })
const managerRequiredForms = ref([])
const savingManagerRequired = ref(false)
const managerRequiredSaveMsg = ref('')
const managerRequiredSaveSuccess = ref(false)
const managerSigFormTypes = [
  { code: 'W4', label: 'W-4' },
  { code: 'I9', label: 'I-9' },
  { code: 'BACKGROUND', label: 'Background Check' },
  { code: 'DIRECT_DEPOSIT', label: 'Direct Deposit' },
  { code: 'ACKNOWLEDGEMENTS', label: 'Acknowledgements' },
  { code: '8850', label: 'Form 8850' },
  { code: '9061', label: 'ETA Form 9061' }
]

async function loadManagersList() {
  try {
    const res = await api.get('/admin/managers')
    managersList.value = res.data || []
  } catch {
    managersList.value = []
  }
}

async function loadApprovalStats() {
  try {
    const res = await api.get('/approvals/stats')
    approvalStats.value = res.data || { total: 0, pending: 0, approved: 0, rejected: 0 }
  } catch {
    approvalStats.value = { total: 0, pending: 0, approved: 0, rejected: 0 }
  }
}

async function loadManagerRequiredForms() {
  try {
    const res = await api.get('/admin/settings/manager-signature-required')
    managerRequiredForms.value = res.data?.forms || []
  } catch {
    managerRequiredForms.value = []
  }
}

function toggleManagerRequiredForm(code) {
  const idx = managerRequiredForms.value.indexOf(code)
  if (idx >= 0) {
    managerRequiredForms.value = managerRequiredForms.value.filter(f => f !== code)
  } else {
    managerRequiredForms.value = [...managerRequiredForms.value, code]
  }
  managerRequiredSaveMsg.value = ''
}

async function saveManagerRequiredForms() {
  savingManagerRequired.value = true
  managerRequiredSaveMsg.value = ''
  try {
    await api.put('/admin/settings/manager-signature-required', { forms: managerRequiredForms.value })
    managerRequiredSaveMsg.value = 'Saved successfully.'
    managerRequiredSaveSuccess.value = true
  } catch (err) {
    managerRequiredSaveMsg.value = err.response?.data?.error || 'Failed to save.'
    managerRequiredSaveSuccess.value = false
  } finally {
    savingManagerRequired.value = false
  }
}

async function assignManagerToUser(user, managerId) {
  assigningManager.value = user.id
  try {
    await api.put(`/admin/users/${user.id}/assign-manager`, {
      managerId: managerId ? parseInt(managerId) : null
    })
    const idx = usersData.value.findIndex(u => u.id === user.id)
    if (idx !== -1) {
      usersData.value[idx] = { ...usersData.value[idx], assignedManagerId: managerId ? parseInt(managerId) : null }
    }
  } catch (err) {
    console.error('Error assigning manager:', err)
    alert(err.response?.data?.error || 'Failed to assign manager')
  } finally {
    assigningManager.value = null
  }
}

function onStartPdfDownload() {
  showPdfDownloadPrompt.value = false
  showPdfDownloadModal.value = true
}

// Computed loading state
const isLoading = computed(() => {
  return Object.values(dashboard.loading.value).some(v => v)
})

// Tab class helper
const tabClass = (tab) => [
  'px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap',
  activeTab.value === tab
    ? 'border-primary text-primary'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
]

// Column definitions
const usersColumns = [
  { key: 'firstName', label: 'First Name', sortable: true },
  { key: 'lastName', label: 'Last Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true, filterType: 'select', options: [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
    { value: 'applicant', label: 'Applicant' }
  ]},
  { key: 'assignedManager', label: 'Assigned Manager' },
  { key: 'createdAt', label: 'Created', type: 'date', sortable: true }
]

const onboardingColumns = [
  { key: 'firstName', label: 'First Name', sortable: true },
  { key: 'lastName', label: 'Last Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'isAdmin', label: 'Role', sortable: true },
  { key: 'progress', label: 'Progress', sortable: true },
  { key: 'status', label: 'Status', sortable: true, filterType: 'select', options: [
    { value: 'in_progress', label: 'In Progress' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'completed', label: 'Completed' }
  ]},
  { key: 'createdAt', label: 'Created', type: 'date', sortable: true }
]

const submissionColumns = [
  { key: 'first_name', label: 'First Name', sortable: true, getValue: (row) => row.first_name },
  { key: 'last_name', label: 'Last Name', sortable: true, getValue: (row) => row.last_name },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'step_number', label: 'Step', sortable: true, filterType: 'select', options: [
    { value: '1', label: 'W-4' },
    { value: '2', label: 'I-9' },
    { value: '3', label: 'Background' },
    { value: '4', label: 'Direct Deposit' },
    { value: '5', label: 'Acknowledgements' },
    { value: '6', label: 'Form 8850' }
  ]},
  { key: 'form_type', label: 'Form Type', sortable: true },
  { key: 'submitted_at', label: 'Submitted', type: 'date', sortable: true },
  { key: 'retention_until', label: 'Retention Until', type: 'date', sortable: true }
]

const i9Columns = [
  { key: 'first_name', label: 'First Name', sortable: true },
  { key: 'last_name', label: 'Last Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'document_type', label: 'Document Type', sortable: true },
  { key: 'document_category', label: 'Category', sortable: true, filterType: 'select', options: [
    { value: 'listA', label: 'List A' },
    { value: 'listB', label: 'List B' },
    { value: 'listC', label: 'List C' }
  ]},
  { key: 'file_name', label: 'Filename', sortable: true },
  { key: 'uploaded_at', label: 'Uploaded', type: 'date', sortable: true }
]

const loginColumns = [
  { key: 'created_at', label: 'Time', type: 'date', sortable: true },
  { key: 'name', label: 'Name', sortable: true, getValue: (row) => 
    row.applicant_first_name && row.applicant_last_name 
      ? `${row.applicant_first_name} ${row.applicant_last_name}` 
      : `${row.first_name} ${row.last_name}` 
  },
  { key: 'email', label: 'Email', sortable: true, getValue: (row) => row.applicant_email || row.email },
  { key: 'success', label: 'Status', sortable: true, filterType: 'select', options: [
    { value: 'true', label: 'Success' },
    { value: 'false', label: 'Failed' }
  ]},
  { key: 'ip_address', label: 'IP Address', sortable: true },
  { key: 'error_message', label: 'Error', sortable: false }
]

const auditColumns = [
  { key: 'created_at', label: 'Time', type: 'date', sortable: true },
  { key: 'action', label: 'Action', sortable: true, filterType: 'select', options: [] },
  { key: 'resource_type', label: 'Resource', sortable: true, filterType: 'select', options: [] },
  { key: 'userName', label: 'User', sortable: true, getValue: (row) => 
    row.first_name && row.last_name 
      ? `${row.first_name} ${row.last_name}` 
      : row.user_id ? `User ${row.user_id}` : 'System'
  },
  { key: 'ip_address', label: 'IP', sortable: true },
  { key: 'details', label: 'Details', sortable: false, format: (val) => {
    if (!val) return '-'
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val
      return JSON.stringify(parsed).substring(0, 50) + '...'
    } catch { return val?.substring?.(0, 50) || '-' }
  }}
]

// Quick filters
const onboardingQuickFilters = [
  { label: 'In Progress', filters: { status: 'in_progress' } },
  { label: 'Not Started', filters: { status: 'not_started' } },
  { label: 'Admins Only', filters: { isAdmin: 'true' } }
]

const loginQuickFilters = [
  { label: 'Failed Only', filters: { success: 'false' } },
  { label: 'Success Only', filters: { success: 'true' } },
  { label: 'Today', filters: { startDate: new Date().toISOString().split('T')[0] } }
]

// Filter state for each table
const onboardingFilters = ref({ status: 'in_progress' })
const onboardingPagination = ref({ page: 1, limit: 25, total: 0 })
const onboardingSort = ref({ key: 'createdAt', direction: 'desc' })
const onboardingSearch = ref('')
const onboardingData = ref([])

const completedFilters = ref({ status: 'completed' })
const completedPagination = ref({ page: 1, limit: 25, total: 0 })
const completedSort = ref({ key: 'createdAt', direction: 'desc' })
const completedSearch = ref('')
const completedData = ref([])

const submissionsFilters = ref({})
const submissionsPagination = ref({ page: 1, limit: 25, total: 0 })
const submissionsSort = ref({ key: 'submitted_at', direction: 'desc' })
const submissionsSearch = ref('')
const submissionsData = ref([])

const i9Filters = ref({})
const i9Pagination = ref({ page: 1, limit: 25, total: 0 })
const i9Sort = ref({ key: 'uploaded_at', direction: 'desc' })
const i9Search = ref('')
const i9Data = ref([])

const loginsFilters = ref({})
const loginsPagination = ref({ page: 1, limit: 25, total: 0 })
const loginsSort = ref({ key: 'created_at', direction: 'desc' })
const loginsSearch = ref('')
const loginsData = ref([])

const auditFilters = ref({})
const auditPagination = ref({ page: 1, limit: 25, total: 0 })
const auditSort = ref({ key: 'created_at', direction: 'desc' })
const auditSearch = ref('')
const auditData = ref([])

const usersFilters = ref({})
const usersPagination = ref({ page: 1, limit: 25, total: 0 })
const usersSort = ref({ key: 'created_at', direction: 'desc' })
const usersSearch = ref('')
const usersData = ref([])

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString()
}

const formatStatus = (status) => {
  const map = { completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started' }
  return map[status] || status
}

const formatCategory = (cat) => {
  const map = { listA: 'List A', listB: 'List B', listC: 'List C' }
  return map[cat] || cat
}

const getStatusBadgeClass = (status) => {
  const base = 'px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center'
  const colors = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    not_started: 'bg-gray-100 text-gray-800'
  }
  return `${base} ${colors[status] || 'bg-gray-100 text-gray-800'}`
}

const getCategoryBadgeClass = (category) => {
  const base = 'px-2 py-1 text-xs font-semibold rounded-full'
  const colors = {
    listA: 'bg-green-100 text-green-800',
    listB: 'bg-blue-100 text-blue-800',
    listC: 'bg-purple-100 text-purple-800'
  }
  return `${base} ${colors[category] || 'bg-gray-100 text-gray-800'}`
}

const formatRole = (role) => {
  const map = { admin: 'Admin', manager: 'Manager', employee: 'Employee', applicant: 'Applicant' }
  return map[role] || role || 'Applicant'
}

const getRoleBadgeClass = (role) => {
  const base = 'px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center'
  const colors = {
    admin: 'bg-blue-100 text-blue-800',
    manager: 'bg-indigo-100 text-indigo-800',
    employee: 'bg-green-100 text-green-800',
    applicant: 'bg-gray-100 text-gray-800'
  }
  return `${base} ${colors[role] || 'bg-gray-100 text-gray-800'}`
}

// Data loading functions
const loadOnboardingData = async () => {
  const params = {
    search: onboardingSearch.value,
    status: onboardingFilters.value.status,
    isAdmin: onboardingFilters.value.isAdmin,
    page: onboardingPagination.value.page,
    limit: onboardingPagination.value.limit,
    sortKey: onboardingSort.value.key,
    sortDir: onboardingSort.value.direction
  }
  const result = await dashboard.loadOnboardingStatus(params)
  onboardingData.value = result.applicants || []
  if (result.pagination) {
    onboardingPagination.value.total = result.pagination.total
  }
}

const loadCompletedData = async () => {
  const params = {
    search: completedSearch.value,
    status: 'completed',
    page: completedPagination.value.page,
    limit: completedPagination.value.limit,
    sortKey: completedSort.value.key,
    sortDir: completedSort.value.direction
  }
  const result = await dashboard.loadOnboardingStatus(params)
  completedData.value = result.applicants || []
  if (result.pagination) {
    completedPagination.value.total = result.pagination.total
  }
}

const loadSubmissions = async () => {
  const params = {
    search: submissionsSearch.value,
    ...submissionsFilters.value,
    page: submissionsPagination.value.page,
    limit: submissionsPagination.value.limit,
    sortKey: submissionsSort.value.key,
    sortDir: submissionsSort.value.direction
  }
  const result = await dashboard.loadAllSubmissions(params)
  submissionsData.value = result.submissions || []
  if (result.pagination) {
    submissionsPagination.value.total = result.pagination.total
  }
}

const loadI9Documents = async () => {
  const params = {
    search: i9Search.value,
    ...i9Filters.value,
    page: i9Pagination.value.page,
    limit: i9Pagination.value.limit,
    sortKey: i9Sort.value.key,
    sortDir: i9Sort.value.direction
  }
  const result = await dashboard.loadAllI9Documents(params)
  i9Data.value = result.documents || []
  if (result.pagination) {
    i9Pagination.value.total = result.pagination.total
  }
}

const loadUsersData = async () => {
  const params = {
    search: usersSearch.value || undefined,
    role: usersFilters.value?.role || undefined,
    page: usersPagination.value.page,
    limit: usersPagination.value.limit,
    sortKey: usersSort.value.key,
    sortDir: usersSort.value.direction
  }
  if (usersIncludeInactive.value) {
    params.includeInactive = '1'
  }
  const result = await dashboard.loadUsers(params)
  usersData.value = Array.isArray(result.users) ? result.users : []
  if (result.pagination) {
    usersPagination.value = {
      ...usersPagination.value,
      total: result.pagination.total ?? 0
    }
  }
}

const loadLoginAttempts = async () => {
  const params = {
    search: loginsSearch.value,
    ...loginsFilters.value,
    page: loginsPagination.value.page,
    limit: loginsPagination.value.limit,
    sortKey: loginsSort.value.key,
    sortDir: loginsSort.value.direction
  }
  const result = await dashboard.loadLoginAttempts(params)
  loginsData.value = result.attempts || []
  if (result.pagination) {
    loginsPagination.value.total = result.pagination.total
  }
}

const loadAuditLogs = async () => {
  const params = {
    search: auditSearch.value,
    ...auditFilters.value,
    page: auditPagination.value.page,
    limit: auditPagination.value.limit,
    sortKey: auditSort.value.key,
    sortDir: auditSort.value.direction
  }
  const result = await dashboard.loadAuditLogs(params)
  auditData.value = result.logs || []
  if (result.pagination) {
    auditPagination.value.total = result.pagination.total
  }
  // Update filter options from response
  if (result.filterOptions) {
    const actionCol = auditColumns.find(c => c.key === 'action')
    if (actionCol) {
      actionCol.options = result.filterOptions.actions?.map(a => ({ value: a, label: a })) || []
    }
    const resourceCol = auditColumns.find(c => c.key === 'resource_type')
    if (resourceCol) {
      resourceCol.options = result.filterOptions.resourceTypes?.map(r => ({ value: r, label: r })) || []
    }
  }
}

// Event handlers for onboarding table
const handleOnboardingSearch = (search) => {
  onboardingSearch.value = search
  onboardingPagination.value.page = 1
  loadOnboardingData()
}
const handleOnboardingFilterChange = (filters) => {
  onboardingFilters.value = filters
  onboardingPagination.value.page = 1
  loadOnboardingData()
}
const handleOnboardingPageChange = (page) => {
  onboardingPagination.value.page = page
  loadOnboardingData()
}
const handleOnboardingLimitChange = (limit) => {
  onboardingPagination.value.limit = limit
  onboardingPagination.value.page = 1
  loadOnboardingData()
}
const handleOnboardingSort = (sort) => {
  onboardingSort.value = sort
  loadOnboardingData()
}
const handleOnboardingExport = () => {
  window.open(`/api/admin/onboarding-status/export?${new URLSearchParams({
    search: onboardingSearch.value,
    status: onboardingFilters.value.status || '',
    isAdmin: onboardingFilters.value.isAdmin || ''
  })}`, '_blank')
}

// Event handlers for completed table
const handleCompletedSearch = (search) => {
  completedSearch.value = search
  completedPagination.value.page = 1
  loadCompletedData()
}
const handleCompletedFilterChange = (filters) => {
  completedFilters.value = { ...filters, status: 'completed' }
  completedPagination.value.page = 1
  loadCompletedData()
}
const handleCompletedPageChange = (page) => {
  completedPagination.value.page = page
  loadCompletedData()
}
const handleCompletedLimitChange = (limit) => {
  completedPagination.value.limit = limit
  completedPagination.value.page = 1
  loadCompletedData()
}
const handleCompletedSort = (sort) => {
  completedSort.value = sort
  loadCompletedData()
}
const handleCompletedExport = () => {
  window.open(`/api/admin/onboarding-status/export?status=completed&search=${completedSearch.value}`, '_blank')
}

// Event handlers for submissions table
const handleSubmissionsSearch = (search) => {
  submissionsSearch.value = search
  submissionsPagination.value.page = 1
  loadSubmissions()
}
const handleSubmissionsFilterChange = (filters) => {
  submissionsFilters.value = filters
  submissionsPagination.value.page = 1
  loadSubmissions()
}
const handleSubmissionsPageChange = (page) => {
  submissionsPagination.value.page = page
  loadSubmissions()
}
const handleSubmissionsLimitChange = (limit) => {
  submissionsPagination.value.limit = limit
  submissionsPagination.value.page = 1
  loadSubmissions()
}
const handleSubmissionsSort = (sort) => {
  submissionsSort.value = sort
  loadSubmissions()
}
const handleSubmissionsExport = () => {
  const params = new URLSearchParams({ search: submissionsSearch.value, ...submissionsFilters.value })
  window.open(`/api/admin/submissions/export?${params}`, '_blank')
}

// Event handlers for I-9 documents table
const handleI9Search = (search) => {
  i9Search.value = search
  i9Pagination.value.page = 1
  loadI9Documents()
}
const handleI9FilterChange = (filters) => {
  i9Filters.value = filters
  i9Pagination.value.page = 1
  loadI9Documents()
}
const handleI9PageChange = (page) => {
  i9Pagination.value.page = page
  loadI9Documents()
}
const handleI9LimitChange = (limit) => {
  i9Pagination.value.limit = limit
  i9Pagination.value.page = 1
  loadI9Documents()
}
const handleI9Sort = (sort) => {
  i9Sort.value = sort
  loadI9Documents()
}
const handleI9Export = () => {
  const params = new URLSearchParams({ search: i9Search.value, ...i9Filters.value })
  window.open(`/api/admin/i9-documents/export?${params}`, '_blank')
}

// Event handlers for users table
const handleUsersSearch = (search) => {
  usersSearch.value = search
  usersPagination.value.page = 1
  loadUsersData()
}
const handleUsersFilterChange = (filters) => {
  usersFilters.value = filters
  usersPagination.value.page = 1
  loadUsersData()
}
const handleUsersPageChange = (page) => {
  usersPagination.value.page = page
  loadUsersData()
}
const handleUsersLimitChange = (limit) => {
  usersPagination.value.limit = limit
  usersPagination.value.page = 1
  loadUsersData()
}
const handleUsersSort = (sort) => {
  usersSort.value = sort
  loadUsersData()
}

const changeUserRole = async (user, newRole) => {
  if (user.role === newRole) return
  if (!confirm(`Change ${user.firstName} ${user.lastName} to ${formatRole(newRole)}?`)) {
    return
  }
  updatingRole.value = user.id
  try {
    const result = await dashboard.updateUserRole(user.id, newRole)
    if (result.success) {
      const idx = usersData.value.findIndex(u => u.id === user.id)
      if (idx !== -1) {
        usersData.value[idx] = { ...usersData.value[idx], role: newRole, isAdmin: newRole === 'admin' }
      }
      loadOnboardingData()
      loadCompletedData()
      dashboard.loadDashboardStats()
      if (result.requiresPasswordSetup && newRole === 'admin') {
        alert(`${result.message}\n\nThis user will need to set a password before accessing admin features.`)
      } else {
        alert(result.message)
      }
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    alert(error.response?.data?.error || 'Failed to update role')
  } finally {
    updatingRole.value = null
  }
}

const deactivateUserConfirm = async (user) => {
  if (!confirm(`Deactivate ${user.firstName} ${user.lastName}? They will not be able to log in. Their records are retained for compliance.`)) {
    return
  }
  deactivatingUserId.value = user.id
  try {
    const result = await dashboard.deactivateUser(user.id)
    if (result.success) {
      if (usersIncludeInactive.value) {
        const idx = usersData.value.findIndex(u => u.id === user.id)
        if (idx !== -1) {
          usersData.value[idx] = { ...usersData.value[idx], isActive: false }
        }
      } else {
        usersData.value = usersData.value.filter(u => u.id !== user.id)
        usersPagination.value.total = Math.max(0, (usersPagination.value.total || 1) - 1)
      }
      loadOnboardingData()
      loadCompletedData()
      dashboard.loadDashboardStats()
      alert(result.message)
    }
  } catch (error) {
    console.error('Error deactivating user:', error)
    alert(error.response?.data?.error || 'Failed to deactivate user')
  } finally {
    deactivatingUserId.value = null
  }
}

// Event handlers for login attempts table
const handleLoginsSearch = (search) => {
  loginsSearch.value = search
  loginsPagination.value.page = 1
  loadLoginAttempts()
}
const handleLoginsFilterChange = (filters) => {
  loginsFilters.value = filters
  loginsPagination.value.page = 1
  loadLoginAttempts()
}
const handleLoginsPageChange = (page) => {
  loginsPagination.value.page = page
  loadLoginAttempts()
}
const handleLoginsLimitChange = (limit) => {
  loginsPagination.value.limit = limit
  loginsPagination.value.page = 1
  loadLoginAttempts()
}
const handleLoginsSort = (sort) => {
  loginsSort.value = sort
  loadLoginAttempts()
}
const handleLoginsExport = () => {
  const params = new URLSearchParams({ search: loginsSearch.value, ...loginsFilters.value })
  window.open(`/api/admin/login-attempts/export?${params}`, '_blank')
}

// Event handlers for audit logs table
const handleAuditSearch = (search) => {
  auditSearch.value = search
  auditPagination.value.page = 1
  loadAuditLogs()
}
const handleAuditFilterChange = (filters) => {
  auditFilters.value = filters
  auditPagination.value.page = 1
  loadAuditLogs()
}
const handleAuditPageChange = (page) => {
  auditPagination.value.page = page
  loadAuditLogs()
}
const handleAuditLimitChange = (limit) => {
  auditPagination.value.limit = limit
  auditPagination.value.page = 1
  loadAuditLogs()
}
const handleAuditSort = (sort) => {
  auditSort.value = sort
  loadAuditLogs()
}
const handleAuditExport = () => {
  const params = new URLSearchParams({ search: auditSearch.value, ...auditFilters.value })
  window.open(`/api/admin/audit-logs/export?${params}`, '_blank')
}

// Other handlers
const viewI9Document = (documentId) => {
  window.open(`/api/forms/i9/documents/${documentId}/view`, '_blank')
}

// Fix Google Drive file permissions
const fixGDrivePermissions = async () => {
  if (!confirm('This will set public viewer permissions on all Google Drive files. Continue?')) {
    return
  }
  
  fixingPermissions.value = true
  permissionFixResult.value = null
  
  try {
    const response = await api.post('/admin/fix-gdrive-permissions')
    permissionFixResult.value = {
      success: true,
      message: `Fixed ${response.data.results.success} of ${response.data.results.total} files`
    }
  } catch (error) {
    permissionFixResult.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to fix permissions'
    }
  } finally {
    fixingPermissions.value = false
  }
}

// Regenerate all PDFs
const regeneratePdfs = async () => {
  if (!confirm('This will delete all existing Google Drive PDFs and regenerate them from stored form data. This may take a while. Continue?')) {
    return
  }
  
  regeneratingPdfs.value = true
  regeneratePdfsResult.value = null
  
  try {
    const response = await api.post('/admin/regenerate-pdfs')
    regeneratePdfsResult.value = {
      success: true,
      message: `Regenerated ${response.data.results.success} of ${response.data.results.total} PDFs`
    }
    // Refresh the dashboard data to show updated documents
    dashboard.loadAll()
  } catch (error) {
    regeneratePdfsResult.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to regenerate PDFs'
    }
  } finally {
    regeneratingPdfs.value = false
  }
}

const handleAlertNavigation = (tab, options = {}) => {
  activeTab.value = tab
  if (options.tab === 'pdf-templates' && tab === 'system') {
    systemTab.value = 'templates'
  }
  if (options.filter === 'failed-logins') {
    activityTab.value = 'logins'
    loginsFilters.value = { success: 'false' }
    loadLoginAttempts()
  }
  if (options.filter === 'stale') {
    // Filter for stale onboarding
    onboardingFilters.value = { status: 'in_progress' }
    loadOnboardingData()
  }
}

const refreshAll = async () => {
  await dashboard.loadAllData()
  loadOnboardingData()
  loadCompletedData()
  if (activeTab.value === 'users') {
    loadUsersData()
  }
  loadSubmissions()
  loadI9Documents()
  loadLoginAttempts()
  loadAuditLogs()
}

const runTests = async () => {
  runningTests.value = true
  testResults.value = null
  
  try {
    const response = await api.post('/admin/tests/run')
    testResults.value = response.data.results
  } catch (error) {
    console.error('Error running tests:', error)
    testResults.value = {
      timestamp: new Date().toISOString(),
      backend: { success: false, error: error.message },
      frontend: null
    }
  } finally {
    runningTests.value = false
  }
}

const exportDiagnostics = async () => {
  exporting.value = true
  try {
    const params = {}
    if (testResults.value) {
      params.testResults = JSON.stringify(testResults.value)
    }
    const response = await api.get('/diagnostics/export', { params })
    const markdown = response.data.markdown || response.data.data
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(markdown)
      alert('Diagnostics exported! Markdown copied to clipboard.')
    }
  } catch (error) {
    console.error('Error exporting diagnostics:', error)
    alert('Failed to export diagnostics.')
  } finally {
    exporting.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'active-onboarding') {
    loadOnboardingData()
  } else if (newTab === 'completed') {
    loadCompletedData()
  } else if (newTab === 'users') {
    ensureCurrentUserId()
    loadUsersData()
  } else if (newTab === 'documents') {
    if (documentTab.value === 'submissions') {
      loadSubmissions()
    } else {
      loadI9Documents()
    }
  } else if (newTab === 'activity') {
    if (activityTab.value === 'logins') {
      loadLoginAttempts()
    } else {
      loadAuditLogs()
    }
  }
})

watch(documentTab, (newTab) => {
  if (newTab === 'submissions') {
    loadSubmissions()
  } else {
    loadI9Documents()
  }
})

watch(activityTab, (newTab) => {
  if (newTab === 'logins') {
    loadLoginAttempts()
  } else {
    loadAuditLogs()
  }
})

// Ensure current user id is available (for Users tab "You" badge and restrictions)
function ensureCurrentUserId() {
  if (currentUserId.value != null) return
  const id = authStore.user?.id
  if (id != null) {
    currentUserId.value = id
    return
  }
  api.get('/auth/me').then((r) => { currentUserId.value = r.data?.id }).catch(() => {})
}

// Initialize
onMounted(async () => {
  ensureCurrentUserId()
  try {
    const userResponse = await api.get('/auth/me')
    currentUserId.value = userResponse.data.id
  } catch (error) {
    console.error('Error fetching current user:', error)
  }

  // If any PDF templates are missing, show prompt dialog first; user clicks to start download
  try {
    const statusRes = await api.get('/admin/pdf-templates/status')
    const templates = statusRes.data?.templates || {}
    const anyMissing = Object.values(templates).some((t) => t && t.exists === false)
    if (anyMissing) {
      showPdfDownloadPrompt.value = true
    }
  } catch (error) {
    console.error('Error checking PDF template status:', error)
  }
  
  await dashboard.loadAllData()
  loadOnboardingData()

  // Load manager/approval related data
  loadManagersList()
  loadApprovalStats()
  loadManagerRequiredForms()
})
</script>
