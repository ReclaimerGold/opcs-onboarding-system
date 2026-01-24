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
            <h1 class="text-xl font-semibold text-gray-900">Onboarding Dashboard</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link v-if="authStore.isAdmin" to="/admin" class="text-gray-600 hover:text-gray-900">Admin</router-link>
            <router-link v-if="authStore.isAdmin" to="/settings" class="text-gray-600 hover:text-gray-900">Settings</router-link>
            <router-link to="/forms" class="text-gray-600 hover:text-gray-900">Forms</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8">
      <!-- Progress Overview -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Onboarding Status</h2>
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Progress Card -->
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-700 mb-1">Overall Progress</p>
                <p class="text-2xl font-bold text-blue-900">{{ progress }}%</p>
                <p class="text-xs text-blue-600 mt-1">{{ completedStepsCount }}/6 steps completed</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Forms Submitted Card -->
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-700 mb-1">Forms Submitted</p>
                <p class="text-2xl font-bold text-green-900">{{ submissions.length }}</p>
                <p class="text-xs text-green-600 mt-1">{{ submissions.length === 6 ? 'All complete!' : `${6 - submissions.length} remaining` }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <svg class="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- I-9 Documents Card -->
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-700 mb-1">I-9 Documents</p>
                <p class="text-2xl font-bold text-purple-900">{{ i9DocumentsCount }}</p>
                <p class="text-xs text-purple-600 mt-1">{{ i9DocumentsStatus }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <button
              @click="scrollToDocuments"
              class="mt-2 w-full text-xs text-purple-700 hover:text-purple-900 font-medium underline"
            >
              View Documents →
            </button>
          </div>

          <!-- Current Step Card -->
          <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-yellow-700 mb-1">Current Step</p>
                <p class="text-2xl font-bold text-yellow-900">{{ currentStepName }}</p>
                <p class="text-xs text-yellow-600 mt-1">{{ currentStepStatus }}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <router-link
              v-if="currentStep && canAccessStep(currentStep)"
              :to="`/forms?step=${currentStep}`"
              class="mt-2 w-full text-xs text-yellow-700 hover:text-yellow-900 font-medium underline block text-center"
            >
              Continue →
            </router-link>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="flex justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Overall Progress</span>
            <span class="text-sm font-medium text-gray-900">{{ progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div
              class="bg-primary h-4 rounded-full transition-all duration-300"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <component
            v-for="step in 6"
            :key="step"
            :is="getStepComponent(step)"
            :to="isStepCompleted(step) ? null : getStepLink(step)"
            :href="isStepCompleted(step) ? getStepLink(step) : null"
            :target="isStepCompleted(step) ? '_blank' : null"
            :class="[
              'flex flex-col items-center group relative transition-all',
              !canAccessStep(step) && !isStepCompleted(step) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            <div class="relative flex items-center justify-center">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                  getStepStatus(step).status === 'completed'
                    ? 'bg-green-500 text-white shadow-md'
                    : getStepStatus(step).status === 'current' && completedStepsCount < 6
                    ? 'bg-primary text-white ring-4 ring-primary/30 animate-pulse'
                    : getStepStatus(step).status === 'current'
                    ? 'bg-primary text-white ring-4 ring-primary/30'
                    : canAccessStep(step)
                    ? 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    : 'bg-gray-200 text-gray-600'
                ]"
              >
                <svg 
                  v-if="getStepStatus(step).status === 'completed'" 
                  class="w-6 h-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <svg 
                  v-else-if="!canAccessStep(step)" 
                  class="w-6 h-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span v-else>{{ step }}</span>
              </div>
            </div>
            <div class="mt-2 text-center">
              <div 
                :class="[
                  'text-xs font-medium transition-colors whitespace-nowrap',
                  getStepStatus(step).status === 'completed'
                    ? 'text-green-600'
                    : getStepStatus(step).status === 'current'
                    ? 'text-primary'
                    : canAccessStep(step)
                    ? 'text-gray-600 group-hover:text-gray-900'
                    : 'text-gray-600'
                ]"
              >
                {{ getStepName(step) }}
              </div>
            </div>
          </component>
        </div>

        <!-- Quick Document Access -->
        <div v-if="submissions.length > 0 || i9DocumentsCount > 0" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Quick Document Access</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Submitted Forms -->
            <div v-if="submissions.length > 0" class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Submitted Forms ({{ submissions.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="submission in submissions.slice(0, 3)"
                  :key="submission.id"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-gray-700">{{ getStepName(submission.step_number) }}</span>
                  <a
                    :href="getSubmissionLink(submission)"
                    target="_blank"
                    class="text-primary hover:text-primary-light hover:underline font-medium"
                  >
                    View PDF →
                  </a>
                </div>
                <div v-if="submissions.length > 3" class="text-xs text-gray-500 pt-1">
                  +{{ submissions.length - 3 }} more form{{ submissions.length - 3 !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>

            <!-- I-9 Documents -->
            <div v-if="i9DocumentsCount > 0" class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                I-9 Documents ({{ i9DocumentsCount }})
              </h4>
              <div class="space-y-2">
                <div v-if="hasListA" class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 flex items-center">
                    <span class="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mr-2">A</span>
                    List A Document
                  </span>
                  <button
                    @click="viewDocument(getDocumentByCategory('listA').id)"
                    class="text-primary hover:text-primary-light hover:underline font-medium"
                  >
                    View →
                  </button>
                </div>
                <div v-if="hasListB" class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 flex items-center">
                    <span class="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-2">B</span>
                    List B Document
                  </span>
                  <button
                    @click="viewDocument(getDocumentByCategory('listB').id)"
                    class="text-primary hover:text-primary-light hover:underline font-medium"
                  >
                    View →
                  </button>
                </div>
                <div v-if="hasListC" class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 flex items-center">
                    <span class="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mr-2">C</span>
                    List C Document
                  </span>
                  <button
                    @click="viewDocument(getDocumentByCategory('listC').id)"
                    class="text-primary hover:text-primary-light hover:underline font-medium"
                  >
                    View →
                  </button>
                </div>
                <button
                  @click="scrollToDocuments"
                  class="text-xs text-gray-600 hover:text-gray-900 font-medium underline pt-1"
                >
                  View all documents →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Document History -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Form Submissions</h2>
        
        <div v-if="submissions.length === 0" class="text-center py-8 text-gray-500">
          <p>No forms submitted yet.</p>
          <router-link to="/forms" class="mt-4 inline-block text-primary hover:underline">
            Start filling out forms →
          </router-link>
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retention Until
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="submission in submissions" :key="submission.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ getStepName(submission.step_number) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    :href="getSubmissionLink(submission)"
                    target="_blank"
                    class="text-primary hover:text-primary-light hover:underline"
                  >
                    {{ submission.pdf_filename }}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(submission.submitted_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(submission.retention_until) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <a
                    :href="getSubmissionLink(submission)"
                    target="_blank"
                    class="text-primary hover:text-primary-light"
                  >
                    View PDF
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- I-9 Identity Documents -->
      <div id="i9-documents" class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-900">I-9 Identity Documents</h2>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">
              Status: <span :class="i9DocumentsComplete ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'">
                {{ i9DocumentsComplete ? 'Complete' : 'In Progress' }}
              </span>
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- List A Document -->
          <div :class="[
            'p-4 rounded-lg border-2',
            hasListA
              ? 'border-green-200 bg-green-50'
              : (hasListB && hasListC)
                ? 'border-gray-200 bg-gray-50'
                : 'border-yellow-200 bg-yellow-50'
          ]">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mr-2">A</div>
                <h3 class="font-semibold text-gray-900">List A Document</h3>
              </div>
              <span v-if="hasListA" class="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                (Uploaded)
              </span>
              <span v-else-if="hasListB && hasListC" class="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                (Not Required)
              </span>
              <span v-else class="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                (Required)
              </span>
            </div>
            
            <div v-if="hasListA" class="space-y-3">
              <div>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>File:</strong> {{ getDocumentByCategory('listA').file_name }}
                </p>
                <p class="text-xs text-gray-500">
                  Uploaded: {{ formatDate(getDocumentByCategory('listA').uploaded_at) }}
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="viewDocument(getDocumentByCategory('listA').id)"
                  class="flex-1 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  View
                </button>
                <button
                  @click="$refs.listAFileInput.click()"
                  :disabled="uploading.listA"
                  class="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >
                  {{ uploading.listA ? 'Uploading...' : 'Replace' }}
                </button>
              </div>
              <p v-if="uploadError.listA" class="text-xs text-red-600">{{ uploadError.listA }}</p>
            </div>
            
            <div v-else>
              <p v-if="hasListB && hasListC" class="text-sm text-gray-600 mb-3">
                <span class="text-gray-500">ℹ️</span> List A document is not required. You have provided List B + List C documents.
              </p>
              <p v-else class="text-sm text-yellow-800 mb-3 font-medium">
                ⚠️ {{ getListAStatus.message }}. Please upload your document.
              </p>
              <input
                ref="listAFileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="handleFileUpload('listA', $event)"
                class="hidden"
              />
              <button
                @click="$refs.listAFileInput.click()"
                :disabled="uploading.listA || (hasListB && hasListC)"
                :class="[
                  'w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50',
                  (hasListB && hasListC)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-light'
                ]"
              >
                {{ uploading.listA ? 'Uploading...' : 'Upload Document' }}
              </button>
              <p v-if="uploadError.listA" class="mt-2 text-xs text-red-600">{{ uploadError.listA }}</p>
            </div>
          </div>
          
          <!-- List B Document -->
          <div :class="[
            'p-4 rounded-lg border-2',
            hasListB
              ? 'border-blue-200 bg-blue-50'
              : hasListA
                ? 'border-gray-200 bg-gray-50'
                : (hasListC && !hasListB)
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
          ]">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-2">B</div>
                <h3 class="font-semibold text-gray-900">List B Document</h3>
              </div>
              <span v-if="hasListB" class="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                (Uploaded)
              </span>
              <span v-else-if="hasListA" class="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                (Not Required)
              </span>
              <span v-else-if="hasListC && !hasListB" class="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                (Required)
              </span>
              <span v-else class="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                (Required)
              </span>
            </div>
            
            <div v-if="hasListB" class="space-y-3">
              <div>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>File:</strong> {{ getDocumentByCategory('listB').file_name }}
                </p>
                <p class="text-xs text-gray-500">
                  Uploaded: {{ formatDate(getDocumentByCategory('listB').uploaded_at) }}
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="viewDocument(getDocumentByCategory('listB').id)"
                  class="flex-1 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  View
                </button>
                <button
                  @click="$refs.listBFileInput.click()"
                  :disabled="uploading.listB"
                  class="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >
                  {{ uploading.listB ? 'Uploading...' : 'Replace' }}
                </button>
              </div>
              <p v-if="uploadError.listB" class="text-xs text-red-600">{{ uploadError.listB }}</p>
            </div>
            
            <div v-else>
              <p v-if="hasListA" class="text-sm text-gray-600 mb-3">
                <span class="text-gray-500">ℹ️</span> {{ getListBStatus.message }}. List A document has been provided.
              </p>
              <p v-else-if="hasListC && !hasListB" class="text-sm text-red-800 mb-3 font-medium">
                <span class="text-red-500">⚠️</span> {{ getListBStatus.message }}. Please upload your List B document first.
              </p>
              <p v-else class="text-sm text-yellow-800 mb-3 font-medium">
                <span class="text-yellow-500">⚠️</span> {{ getListBStatus.message }}. Please upload your document.
              </p>
              <input
                ref="listBFileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="handleFileUpload('listB', $event)"
                class="hidden"
              />
              <button
                @click="$refs.listBFileInput.click()"
                :disabled="uploading.listB || hasListA"
                :class="[
                  'w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50',
                  hasListA
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-light'
                ]"
              >
                {{ uploading.listB ? 'Uploading...' : 'Upload Document' }}
              </button>
              <p v-if="uploadError.listB" class="mt-2 text-xs text-red-600">{{ uploadError.listB }}</p>
            </div>
          </div>
          
          <!-- List C Document -->
          <div :class="[
            'p-4 rounded-lg border-2',
            hasListC
              ? 'border-purple-200 bg-purple-50'
              : hasListA
                ? 'border-gray-200 bg-gray-50'
                : (hasListB && !hasListC)
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-yellow-200 bg-yellow-50'
          ]">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mr-2">C</div>
                <h3 class="font-semibold text-gray-900">List C Document</h3>
              </div>
              <span v-if="hasListC" class="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">
                (Uploaded)
              </span>
              <span v-else-if="hasListA" class="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                (Not Required)
              </span>
              <span v-else-if="hasListB && !hasListC" class="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                (Required)
              </span>
              <span v-else class="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                (Required)
              </span>
            </div>
            
            <div v-if="hasListC" class="space-y-3">
              <div>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>File:</strong> {{ getDocumentByCategory('listC').file_name }}
                </p>
                <p class="text-xs text-gray-500">
                  Uploaded: {{ formatDate(getDocumentByCategory('listC').uploaded_at) }}
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="viewDocument(getDocumentByCategory('listC').id)"
                  class="flex-1 px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  View
                </button>
                <button
                  @click="$refs.listCFileInput.click()"
                  :disabled="uploading.listC"
                  class="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                >
                  {{ uploading.listC ? 'Uploading...' : 'Replace' }}
                </button>
              </div>
              <p v-if="uploadError.listC" class="text-xs text-red-600">{{ uploadError.listC }}</p>
            </div>
            
            <div v-else>
              <p v-if="hasListA" class="text-sm text-gray-600 mb-3">
                <span class="text-gray-500">ℹ️</span> {{ getListCStatus.message }}. List A document has been provided.
              </p>
              <p v-else-if="hasListB && !hasListC" class="text-sm text-yellow-800 mb-3 font-medium">
                <span class="text-yellow-500">⚠️</span> {{ getListCStatus.message }}. Please upload your List C document.
              </p>
              <p v-else class="text-sm text-yellow-800 mb-3 font-medium">
                <span class="text-yellow-500">⚠️</span> {{ getListCStatus.message }}. Please upload your document.
              </p>
              <input
                ref="listCFileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                @change="handleFileUpload('listC', $event)"
                class="hidden"
              />
              <button
                @click="$refs.listCFileInput.click()"
                :disabled="uploading.listC || hasListA || !hasListB"
                :class="[
                  'w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50',
                  (hasListA || !hasListB)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-light'
                ]"
              >
                {{ uploading.listC ? 'Uploading...' : 'Upload Document' }}
              </button>
              <p v-if="!hasListB && !hasListA" class="mt-2 text-xs text-gray-600">
                Note: List C requires List B. Please upload List B first.
              </p>
              <p v-if="uploadError.listC" class="mt-2 text-xs text-red-600">{{ uploadError.listC }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import api from '../services/api.js'

const router = useRouter()
const authStore = useAuthStore()

const progress = ref(0)
const submissions = ref([])
const i9Documents = ref([])
const completedSteps = ref(new Set())
const currentStep = ref(null)
const uploadedDocuments = ref({
  listA: null,
  listB: null,
  listC: null
})
const uploading = ref({
  listA: false,
  listB: false,
  listC: false
})
const uploadError = ref({
  listA: '',
  listB: '',
  listC: ''
})

const stepNames = {
  1: 'W-4',
  2: 'I-9',
  3: 'Background',
  4: 'Direct Deposit',
  5: 'Acknowledgements',
  6: 'Form 8850'
}

const isStepCompleted = (step) => {
  return completedSteps.value.has(step)
}

const getStepStatus = (step) => {
  const isCompleted = completedSteps.value.has(step)
  const isCurrent = currentStep.value === step
  
  if (isCompleted) {
    return { status: 'completed' }
  } else if (isCurrent) {
    return { status: 'current' }
  } else {
    return { status: 'pending' }
  }
}

const getStepName = (step) => {
  return stepNames[step] || `Step ${step}`
}

// Step dependencies - same logic as FormWizardView
const stepDependencies = {
  2: { // I-9 requires basic info from Step 1
    requiresStep: 1
  },
  3: { // Background check requires I-9
    requiresStep: 2
  },
  4: { // Direct deposit requires background check
    requiresStep: 3
  },
  5: { // Acknowledgements requires direct deposit
    requiresStep: 4
  },
  6: { // 8850 requires acknowledgements
    requiresStep: 5
  }
}

// Check if a step can be accessed based on dependencies
const canAccessStep = (step) => {
  // Step 1 is always accessible
  if (step === 1) return true
  
  const dependency = stepDependencies[step]
  if (!dependency) return true
  
  // Check if required step is completed
  if (dependency.requiresStep) {
    return isStepCompleted(dependency.requiresStep)
  }
  
  return true
}

// Get link for a submission - use web_view_link (Google Drive) if available, otherwise API endpoint
const getSubmissionLink = (submission) => {
  if (submission.web_view_link) {
    return submission.web_view_link
  }
  return `/api/forms/submissions/${submission.id}/view`
}

// Get link for a step (PDF for completed, form for accessible incomplete, null for locked)
const getStepLink = (step) => {
  if (isStepCompleted(step)) {
    // Find the submission for this step
    const submission = submissions.value.find(s => s.step_number === step)
    if (submission) {
      return getSubmissionLink(submission)
    }
  } else if (canAccessStep(step)) {
    // Link to form with step parameter
    return `/forms?step=${step}`
  }
  // Locked step - no link
  return null
}

// Get component type for step tile (router-link for forms, a for PDFs, div for locked)
const getStepComponent = (step) => {
  if (isStepCompleted(step)) {
    return 'a' // PDF link - use anchor tag
  } else if (canAccessStep(step)) {
    return 'router-link' // Form link - use router-link
  }
  return 'div' // Locked - no link
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    const progressResponse = await api.get('/applicants/me/progress')
    progress.value = progressResponse.data.progress
    
    const submissionsResponse = await api.get('/forms/submissions')
    submissions.value = submissionsResponse.data
    
    // Track completed steps
    submissions.value.forEach(sub => {
      completedSteps.value.add(sub.step_number)
    })
    
    // Determine current step (first incomplete step)
    if (completedSteps.value.size < 6) {
      for (let i = 1; i <= 6; i++) {
        if (!completedSteps.value.has(i) && canAccessStep(i)) {
          currentStep.value = i
          break
        }
      }
    }
    
    await loadUploadedDocuments()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
})

const loadUploadedDocuments = async () => {
  try {
    const documentsResponse = await api.get('/forms/i9/documents')
    i9Documents.value = documentsResponse.data
    
    // Map documents by category
    documentsResponse.data.forEach(doc => {
      if (doc.document_category === 'listA') {
        uploadedDocuments.value.listA = doc
      } else if (doc.document_category === 'listB') {
        uploadedDocuments.value.listB = doc
      } else if (doc.document_category === 'listC') {
        uploadedDocuments.value.listC = doc
      }
    })
  } catch (error) {
    console.error('Error loading uploaded documents:', error)
  }
}

const getDocumentByCategory = (category) => {
  return uploadedDocuments.value[category] || null
}

// Computed properties for summary
const completedStepsCount = computed(() => completedSteps.value.size)

const i9DocumentsCount = computed(() => {
  let count = 0
  if (hasListA.value) count++
  if (hasListB.value) count++
  if (hasListC.value) count++
  return count
})

const i9DocumentsComplete = computed(() => {
  // Complete if List A exists, OR both List B and List C exist
  return hasListA.value || (hasListB.value && hasListC.value)
})

const i9DocumentsStatus = computed(() => {
  if (i9DocumentsComplete.value) {
    if (hasListA.value) {
      return 'List A provided'
    } else {
      return 'List B+C provided'
    }
  }
  if (!hasListA.value && !(hasListB.value && hasListC.value)) {
    if (!hasListA.value && !hasListB.value && !hasListC.value) {
      return 'Not started'
    }
    if (hasListB.value && !hasListC.value) {
      return 'List C needed'
    }
    if (hasListC.value && !hasListB.value) {
      return 'List B needed'
    }
    return 'Incomplete'
  }
  return 'Complete'
})

const currentStepName = computed(() => {
  if (completedSteps.value.size === 6) {
    return 'Complete!'
  }
  if (currentStep.value) {
    return getStepName(currentStep.value)
  }
  return 'Not Started'
})

const currentStepStatus = computed(() => {
  if (completedSteps.value.size === 6) {
    return 'All steps completed'
  }
  if (currentStep.value) {
    return `Step ${currentStep.value} of 6`
  }
  return 'Ready to begin'
})

// Scroll to documents section
const scrollToDocuments = () => {
  const element = document.getElementById('i9-documents')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Computed properties for I-9 requirement dependencies
const hasListA = computed(() => !!getDocumentByCategory('listA'))
const hasListB = computed(() => !!getDocumentByCategory('listB'))
const hasListC = computed(() => !!getDocumentByCategory('listC'))

// Get status message for List B
const getListBStatus = computed(() => {
  if (hasListA.value) {
    return { message: 'Not required (List A provided)', type: 'info' }
  }
  if (hasListB.value) {
    return { message: 'Uploaded', type: 'success' }
  }
  if (hasListC.value && !hasListB.value) {
    return { message: 'Required (List C requires List B)', type: 'error' }
  }
  return { message: 'Required (must pair with List C)', type: 'warning' }
})

// Get status message for List C
const getListCStatus = computed(() => {
  if (hasListA.value) {
    return { message: 'Not required (List A provided)', type: 'info' }
  }
  if (hasListC.value) {
    return { message: 'Uploaded', type: 'success' }
  }
  if (hasListB.value && !hasListC.value) {
    return { message: 'Required (List B requires List C)', type: 'warning' }
  }
  return { message: 'Required (must pair with List B)', type: 'warning' }
})

// Get status message for List A
const getListAStatus = computed(() => {
  if (hasListA.value) {
    return { message: 'Uploaded', type: 'success' }
  }
  if (hasListB.value && hasListC.value) {
    return { message: 'Not required (List B+C provided)', type: 'info' }
  }
  return { message: 'Required (or provide List B+C)', type: 'warning' }
})

const handleFileUpload = async (documentCategory, event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value[documentCategory] = 'File size must be less than 10MB'
    return
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    uploadError.value[documentCategory] = 'File must be PDF, JPG, or PNG'
    return
  }

  uploadError.value[documentCategory] = ''
  uploading.value[documentCategory] = true

  try {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', 'I9')
    formData.append('documentCategory', documentCategory)
    formData.append('documentName', file.name)

    await api.post('/forms/i9/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // Reload documents to get updated list
    await loadUploadedDocuments()
    uploadError.value[documentCategory] = ''
  } catch (error) {
    console.error('Upload error:', error)
    uploadError.value[documentCategory] = error.response?.data?.error || 'Failed to upload document'
  } finally {
    uploading.value[documentCategory] = false
  }
}

const viewDocument = (documentId) => {
  // Find the document to check for web_view_link
  const doc = i9Documents.value.find(d => d.id === documentId)
  if (doc && doc.web_view_link) {
    window.open(doc.web_view_link, '_blank')
  } else {
    window.open(`/api/forms/i9/documents/${documentId}/view`, '_blank')
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

