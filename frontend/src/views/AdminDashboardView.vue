<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-3">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-10 w-auto"
            />
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
    
    <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8">
      <!-- Action Buttons -->
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
            <button
              @click="activeTab = 'tests'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'tests'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Tests
            </button>
            <button
              @click="activeTab = 'documents'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Documents
            </button>
            <button
              @click="activeTab = 'pdf-templates'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2',
                activeTab === 'pdf-templates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              PDF Templates
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

          <!-- Documents Tab -->
          <div v-if="activeTab === 'documents'">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">All Documents</h3>
              
              <!-- Tabs for Documents -->
              <div class="border-b border-gray-200 mb-4">
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
                    Form Submissions ({{ allSubmissions.length }})
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
                    I-9 Documents ({{ allI9Documents.length }})
                  </button>
                </nav>
              </div>
            </div>

            <!-- Form Submissions -->
            <div v-if="documentTab === 'submissions'">
              <div v-if="allSubmissions.length === 0" class="text-center py-8 text-gray-500">
                <p>No form submissions found.</p>
              </div>
              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention Until</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="submission in allSubmissions" :key="submission.id">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ submission.first_name }} {{ submission.last_name }}</div>
                        <div class="text-sm text-gray-500">{{ submission.email }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ getStepName(submission.step_number) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ submission.pdf_filename }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ formatDate(submission.submitted_at) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ formatDate(submission.retention_until) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          :href="`/api/forms/submissions/${submission.id}/view`"
                          target="_blank"
                          class="text-primary hover:text-primary-light hover:underline"
                        >
                          View PDF
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- I-9 Documents -->
            <div v-if="documentTab === 'i9'">
              <div v-if="allI9Documents.length === 0" class="text-center py-8 text-gray-500">
                <p>No I-9 documents found.</p>
              </div>
              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="doc in allI9Documents" :key="doc.id">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ doc.first_name }} {{ doc.last_name }}</div>
                        <div class="text-sm text-gray-500">{{ doc.email }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ doc.document_type || 'N/A' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span :class="[
                          'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          doc.document_category === 'listA' ? 'bg-green-100 text-green-800' :
                          doc.document_category === 'listB' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        ]">
                          {{ doc.document_category === 'listA' ? 'List A' : doc.document_category === 'listB' ? 'List B' : 'List C' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ doc.file_name }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ formatDate(doc.uploaded_at) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          @click="viewI9Document(doc.id)"
                          class="text-primary hover:text-primary-light hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tests Tab -->
          <div v-if="activeTab === 'tests'">
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
                <span v-if="runningTests">Running Tests...</span>
                <span v-else>Run All Tests</span>
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
              <div class="text-sm text-gray-500 mb-4">
                Last run: {{ formatDate(testResults.timestamp) }}
              </div>

              <!-- Backend Tests -->
              <div class="border rounded-lg p-6" :class="testResults.backend?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-gray-900">Backend Tests</h4>
                  <span :class="testResults.backend?.success ? 'text-green-700 font-bold' : 'text-red-700 font-bold'">
                    {{ testResults.backend?.success ? '✅ Passed' : '❌ Failed' }}
                  </span>
                </div>

                <!-- Test Summary -->
                <div v-if="testResults.backend?.output" class="mb-4 p-4 bg-white rounded border">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">Total Tests:</span>
                      <span class="ml-2 font-semibold">{{ testResults.backend.output.numTotalTests || 'N/A' }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Passed:</span>
                      <span class="ml-2 font-semibold text-green-700">{{ testResults.backend.output.numPassedTests || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Failed:</span>
                      <span class="ml-2 font-semibold text-red-700">{{ testResults.backend.output.numFailedTests || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Suites:</span>
                      <span class="ml-2 font-semibold">{{ testResults.backend.output.numTotalTestSuites || 'N/A' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="testResults.backend?.error" class="mb-4 p-4 bg-red-100 border border-red-300 rounded">
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex-1">
                      <p class="font-semibold text-red-900">Error:</p>
                      <p class="text-red-800 text-sm mt-1">{{ testResults.backend.error }}</p>
                      <p v-if="testResults.backend.code" class="text-red-700 text-xs mt-1">Exit Code: {{ testResults.backend.code }}</p>
                      <p v-if="testResults.backend.signal" class="text-red-700 text-xs mt-1">Signal: {{ testResults.backend.signal }}</p>
                    </div>
                  </div>
                </div>

                <!-- Command Used -->
                <div v-if="testResults.backend?.command" class="mb-4 text-xs text-gray-600">
                  <strong>Command:</strong> <code class="bg-gray-100 px-2 py-1 rounded">{{ testResults.backend.command }}</code>
                </div>

                <!-- Verbose Output -->
                <div class="mb-4">
                  <button
                    @click="showBackendOutput = !showBackendOutput"
                    class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                  >
                    <svg class="w-4 h-4 mr-1" :class="showBackendOutput ? 'transform rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {{ showBackendOutput ? 'Hide' : 'Show' }} Verbose Output
                  </button>
                  <div v-if="showBackendOutput" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <pre class="whitespace-pre-wrap">{{ testResults.backend.rawOutput || 'No output available' }}</pre>
                  </div>
                </div>

                <!-- Stderr Output -->
                <div v-if="testResults.backend?.stderr" class="mb-4">
                  <button
                    @click="showBackendStderr = !showBackendStderr"
                    class="flex items-center text-sm font-medium text-red-700 hover:text-red-900 mb-2"
                  >
                    <svg class="w-4 h-4 mr-1" :class="showBackendStderr ? 'transform rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {{ showBackendStderr ? 'Hide' : 'Show' }} Error Output (stderr)
                  </button>
                  <div v-if="showBackendStderr" class="bg-red-900 text-red-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <pre class="whitespace-pre-wrap">{{ testResults.backend.stderr }}</pre>
                  </div>
                </div>
              </div>

              <!-- Frontend Tests -->
              <div class="border rounded-lg p-6" :class="testResults.frontend?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-gray-900">Frontend Tests</h4>
                  <span :class="testResults.frontend?.success ? 'text-green-700 font-bold' : 'text-red-700 font-bold'">
                    {{ testResults.frontend?.success ? '✅ Passed' : '❌ Failed' }}
                  </span>
                </div>

                <!-- Test Summary -->
                <div v-if="testResults.frontend?.output" class="mb-4 p-4 bg-white rounded border">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">Total Suites:</span>
                      <span class="ml-2 font-semibold">{{ testResults.frontend.output.numTotalTestSuites || 'N/A' }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Total Tests:</span>
                      <span class="ml-2 font-semibold">{{ testResults.frontend.output.numTotalTests || 'N/A' }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Passed:</span>
                      <span class="ml-2 font-semibold text-green-700">{{ testResults.frontend.output.numPassedTests || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">Failed:</span>
                      <span class="ml-2 font-semibold text-red-700">{{ testResults.frontend.output.numFailedTests || 0 }}</span>
                    </div>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="testResults.frontend?.error" class="mb-4 p-4 bg-red-100 border border-red-300 rounded">
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <div class="flex-1">
                      <p class="font-semibold text-red-900">Error:</p>
                      <p class="text-red-800 text-sm mt-1">{{ testResults.frontend.error }}</p>
                      <p v-if="testResults.frontend.code" class="text-red-700 text-xs mt-1">Exit Code: {{ testResults.frontend.code }}</p>
                      <p v-if="testResults.frontend.signal" class="text-red-700 text-xs mt-1">Signal: {{ testResults.frontend.signal }}</p>
                    </div>
                  </div>
                </div>

                <!-- Command Used -->
                <div v-if="testResults.frontend?.command" class="mb-4 text-xs text-gray-600">
                  <strong>Command:</strong> <code class="bg-gray-100 px-2 py-1 rounded">{{ testResults.frontend.command }}</code>
                </div>

                <!-- Verbose Output -->
                <div class="mb-4">
                  <button
                    @click="showFrontendOutput = !showFrontendOutput"
                    class="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                  >
                    <svg class="w-4 h-4 mr-1" :class="showFrontendOutput ? 'transform rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {{ showFrontendOutput ? 'Hide' : 'Show' }} Verbose Output
                  </button>
                  <div v-if="showFrontendOutput" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <pre class="whitespace-pre-wrap">{{ testResults.frontend.rawOutput || 'No output available' }}</pre>
                  </div>
                </div>

                <!-- Stderr Output -->
                <div v-if="testResults.frontend?.stderr" class="mb-4">
                  <button
                    @click="showFrontendStderr = !showFrontendStderr"
                    class="flex items-center text-sm font-medium text-red-700 hover:text-red-900 mb-2"
                  >
                    <svg class="w-4 h-4 mr-1" :class="showFrontendStderr ? 'transform rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {{ showFrontendStderr ? 'Hide' : 'Show' }} Error Output (stderr)
                  </button>
                  <div v-if="showFrontendStderr" class="bg-red-900 text-red-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <pre class="whitespace-pre-wrap">{{ testResults.frontend.stderr }}</pre>
                  </div>
                </div>
              </div>
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

          <!-- PDF Templates Tab -->
          <div v-if="activeTab === 'pdf-templates'">
            <div class="mb-6 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">PDF Form Templates</h3>
              <div class="flex space-x-2">
                <button
                  @click="refreshTemplateStatus"
                  :disabled="loadingTemplates"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
                >
                  <svg v-if="!loadingTemplates" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refresh Status
                </button>
                <button
                  @click="updateAllTemplates"
                  :disabled="updatingTemplates"
                  class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center"
                >
                  <svg v-if="!updatingTemplates" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ updatingTemplates ? 'Updating...' : 'Check for Updates' }}
                </button>
              </div>
            </div>

            <!-- Info Box -->
            <div class="mb-6 bg-blue-50 border-l-4 border-blue-400 rounded-md p-4">
              <div class="flex">
                <svg class="h-5 w-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <div class="text-sm text-blue-800">
                  <strong>About PDF Templates:</strong> These are official fillable PDF forms downloaded from IRS and USCIS. 
                  The system automatically checks for updates every 24 hours. When a new version is detected (indicated by different revision or checksum), 
                  the previous version is archived for reference.
                </div>
              </div>
            </div>

            <!-- Template Cards -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div 
                v-for="(template, formType) in pdfTemplates" 
                :key="formType"
                class="bg-white border rounded-lg shadow-sm overflow-hidden"
              >
                <!-- Card Header -->
                <div class="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 class="font-semibold text-gray-900">{{ template.name }}</h4>
                    <p class="text-xs text-gray-500">{{ template.agency }}</p>
                  </div>
                  <span 
                    :class="[
                      'px-2 py-1 text-xs rounded-full font-medium',
                      template.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ template.exists ? 'Cached' : 'Not Downloaded' }}
                  </span>
                </div>

                <!-- Card Body -->
                <div class="p-4 space-y-3">
                  <!-- Revision Info -->
                  <div v-if="template.metadata?.pdfInfo?.revision" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span class="text-gray-600">Revision:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ template.metadata.pdfInfo.revision }}</span>
                  </div>

                  <!-- Page Count -->
                  <div v-if="template.metadata?.pdfInfo?.pageCount" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-gray-600">Pages:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ template.metadata.pdfInfo.pageCount }}</span>
                  </div>

                  <!-- Form Fields -->
                  <div v-if="template.metadata?.pdfInfo?.formFieldCount" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span class="text-gray-600">Fillable Fields:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ template.metadata.pdfInfo.formFieldCount }}</span>
                  </div>

                  <!-- File Size -->
                  <div v-if="template.metadata?.fileSize" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <span class="text-gray-600">Size:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ formatFileSize(template.metadata.fileSize) }}</span>
                  </div>

                  <!-- Downloaded -->
                  <div v-if="template.metadata?.downloadedAt" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-gray-600">Downloaded:</span>
                    <span class="ml-2 text-gray-900">{{ formatDate(template.metadata.downloadedAt) }}</span>
                  </div>

                  <!-- Last Checked -->
                  <div v-if="template.metadata?.lastCheckedAt" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span class="text-gray-600">Last Checked:</span>
                    <span class="ml-2 text-gray-900">{{ formatDate(template.metadata.lastCheckedAt) }}</span>
                  </div>

                  <!-- Checksum (truncated) -->
                  <div v-if="template.metadata?.checksum" class="flex items-center text-sm">
                    <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span class="text-gray-600">Checksum:</span>
                    <span class="ml-2 font-mono text-xs text-gray-900">{{ template.metadata.checksum.substring(0, 16) }}...</span>
                  </div>

                  <!-- Status Badges -->
                  <div class="flex flex-wrap gap-2 mt-3">
                    <span v-if="template.needsUpdate" class="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                      Update Check Due
                    </span>
                    <span v-if="template.isStale" class="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                      Stale (30+ days old)
                    </span>
                    <span v-if="template.metadata?.lastError" class="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                      Last Error: {{ template.metadata.lastError.substring(0, 30) }}...
                    </span>
                  </div>
                </div>

                <!-- Card Footer - Actions -->
                <div class="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                  <div class="flex space-x-2">
                    <button
                      v-if="template.exists"
                      @click="previewTemplate(formType)"
                      class="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      Preview PDF
                    </button>
                    <button
                      @click="updateSingleTemplate(formType)"
                      :disabled="updatingTemplates"
                      class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 focus:outline-none"
                    >
                      Update
                    </button>
                  </div>
                  <span v-if="template.versionCount > 1" class="text-xs text-gray-500">
                    {{ template.versionCount - 1 }} archived
                  </span>
                </div>

                <!-- Archived Versions Expandable -->
                <div v-if="template.archivedVersions && template.archivedVersions.length > 0">
                  <button
                    @click="toggleArchive(formType)"
                    class="w-full px-4 py-2 text-sm text-left text-gray-600 hover:bg-gray-50 flex items-center justify-between border-t"
                  >
                    <span>View Archived Versions ({{ template.archivedVersions.length }})</span>
                    <svg 
                      class="w-4 h-4 transition-transform"
                      :class="{ 'rotate-180': expandedArchives[formType] }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div v-if="expandedArchives[formType]" class="px-4 pb-4 bg-gray-50 border-t">
                    <div class="space-y-2 mt-2">
                      <div 
                        v-for="version in template.archivedVersions" 
                        :key="version.filename"
                        class="flex items-center justify-between py-2 px-3 bg-white rounded border text-sm"
                      >
                        <div>
                          <div class="font-medium text-gray-900">{{ version.revision || 'Unknown Revision' }}</div>
                          <div class="text-xs text-gray-500">
                            {{ formatDate(version.archivedAt) }} • {{ formatFileSize(version.fileSize) }}
                          </div>
                        </div>
                        <button
                          @click="previewArchivedTemplate(formType, version.filename)"
                          class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No templates state -->
            <div v-if="Object.keys(pdfTemplates).length === 0 && !loadingTemplates" class="text-center py-12 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-lg font-medium">No PDF templates loaded</p>
              <p class="text-sm mt-2">Click "Check for Updates" to download the official IRS/USCIS forms</p>
            </div>

            <!-- Update Results -->
            <div v-if="templateUpdateResults" class="mt-6">
              <div :class="[
                'rounded-lg p-4 border',
                templateUpdateResults.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              ]">
                <h4 class="font-medium mb-2">{{ templateUpdateResults.message }}</h4>
                <ul v-if="templateUpdateResults.updated && templateUpdateResults.updated.length > 0" class="text-sm space-y-1">
                  <li v-for="type in templateUpdateResults.updated" :key="type" class="text-green-700">
                    ✓ {{ type }} template updated
                  </li>
                </ul>
                <ul v-if="templateUpdateResults.errors && templateUpdateResults.errors.length > 0" class="text-sm space-y-1 mt-2">
                  <li v-for="err in templateUpdateResults.errors" :key="err.type" class="text-red-700">
                    ✗ {{ err.type }}: {{ err.error }}
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login-attempts')
const documentTab = ref('submissions')
const dashboardStats = ref({})
const loginAttempts = ref([])
const onboardingStatus = ref([])
const auditLogs = ref([])
const systemHealth = ref({})
const allSubmissions = ref([])
const allI9Documents = ref([])
const loginFilter = ref('')
const exporting = ref(false)
const runningTests = ref(false)
const testResults = ref(null)
const showBackendOutput = ref(false)
const showBackendStderr = ref(false)
const showFrontendOutput = ref(false)
const showFrontendStderr = ref(false)
const updatingAdmin = ref(null)
const currentUserId = ref(null)

// PDF Templates state
const pdfTemplates = ref({})
const loadingTemplates = ref(false)
const updatingTemplates = ref(false)
const templateUpdateResults = ref(null)
const expandedArchives = ref({})

const stepNames = {
  1: 'W-4',
  2: 'I-9',
  3: 'Background',
  4: 'Direct Deposit',
  5: 'Acknowledgements',
  6: 'Form 8850'
}

const getStepName = (step) => {
  return stepNames[step] || `Step ${step}`
}

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
  await loadAllSubmissions()
  await loadAllI9Documents()
  await loadPdfTemplateStatus()
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

const loadAllSubmissions = async () => {
  try {
    const response = await api.get('/admin/submissions')
    allSubmissions.value = response.data.submissions || []
  } catch (error) {
    console.error('Error loading all submissions:', error)
  }
}

const loadAllI9Documents = async () => {
  try {
    const response = await api.get('/admin/i9-documents')
    allI9Documents.value = response.data.documents || []
  } catch (error) {
    console.error('Error loading all I-9 documents:', error)
  }
}

const viewI9Document = (documentId) => {
  window.open(`/api/forms/i9/documents/${documentId}/view`, '_blank')
}

// Watch for tab changes to load documents when needed
watch(activeTab, (newTab) => {
  if (newTab === 'documents') {
    loadAllSubmissions()
    loadAllI9Documents()
  }
  if (newTab === 'pdf-templates') {
    loadPdfTemplateStatus()
  }
})

const runTests = async () => {
  runningTests.value = true
  testResults.value = null
  showBackendOutput.value = false
  showBackendStderr.value = false
  showFrontendOutput.value = false
  showFrontendStderr.value = false
  
  // Switch to tests tab if not already there
  if (activeTab.value !== 'tests') {
    activeTab.value = 'tests'
  }
  
  try {
    const response = await api.post('/admin/tests/run')
    testResults.value = response.data.results
    
    // Auto-expand error outputs if tests failed
    if (testResults.value.backend && !testResults.value.backend.success) {
      showBackendOutput.value = true
      if (testResults.value.backend.stderr) {
        showBackendStderr.value = true
      }
    }
    if (testResults.value.frontend && !testResults.value.frontend.success) {
      showFrontendOutput.value = true
      if (testResults.value.frontend.stderr) {
        showFrontendStderr.value = true
      }
    }
  } catch (error) {
    console.error('Error running tests:', error)
    testResults.value = {
      timestamp: new Date().toISOString(),
      backend: {
        success: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
        rawOutput: error.response?.data?.message || 'Failed to execute test command'
      },
      frontend: null
    }
    showBackendOutput.value = true
  } finally {
    runningTests.value = false
  }
}

const exportDiagnostics = async () => {
  exporting.value = true
  try {
    // Include test results if available
    const params = {}
    if (testResults.value) {
      params.testResults = JSON.stringify(testResults.value)
    }
    const response = await api.get('/diagnostics/export', { params })
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

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// PDF Template functions
const loadPdfTemplateStatus = async () => {
  loadingTemplates.value = true
  try {
    const response = await api.get('/admin/pdf-templates/status')
    pdfTemplates.value = response.data.templates || {}
  } catch (error) {
    console.error('Error loading PDF template status:', error)
  } finally {
    loadingTemplates.value = false
  }
}

const refreshTemplateStatus = async () => {
  await loadPdfTemplateStatus()
}

const updateAllTemplates = async () => {
  updatingTemplates.value = true
  templateUpdateResults.value = null
  try {
    const response = await api.post('/admin/pdf-templates/update?force=true')
    templateUpdateResults.value = response.data
    await loadPdfTemplateStatus()
  } catch (error) {
    console.error('Error updating templates:', error)
    templateUpdateResults.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to update templates'
    }
  } finally {
    updatingTemplates.value = false
  }
}

const updateSingleTemplate = async (formType) => {
  updatingTemplates.value = true
  templateUpdateResults.value = null
  try {
    const response = await api.post(`/admin/pdf-templates/update?formType=${formType}&force=true`)
    templateUpdateResults.value = response.data
    await loadPdfTemplateStatus()
  } catch (error) {
    console.error(`Error updating ${formType} template:`, error)
    templateUpdateResults.value = {
      success: false,
      message: error.response?.data?.error || `Failed to update ${formType} template`
    }
  } finally {
    updatingTemplates.value = false
  }
}

const previewTemplate = (formType) => {
  window.open(`/api/admin/pdf-templates/${formType}/preview`, '_blank')
}

const previewArchivedTemplate = (formType, filename) => {
  window.open(`/api/admin/pdf-templates/${formType}/archive/${encodeURIComponent(filename)}`, '_blank')
}

const toggleArchive = (formType) => {
  expandedArchives.value[formType] = !expandedArchives.value[formType]
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
      
      // Check if password setup is required for newly promoted admin
      if (response.data.requiresPasswordSetup && !user.isAdmin) {
        alert(`${response.data.message}\n\nNote: This user will need to set a password before accessing admin features.`)
      } else {
        alert(response.data.message)
      }
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

