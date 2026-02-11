<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div class="flex flex-wrap justify-between items-center gap-3 min-h-16 py-3 sm:py-0 sm:h-16">
          <div class="flex items-center space-x-3 min-w-0">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-10 w-auto flex-shrink-0"
            />
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">Settings</h1>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:gap-4">
            <router-link to="/admin" class="text-gray-600 hover:text-gray-900 py-2 px-1 min-h-[44px] flex items-center">Admin</router-link>
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900 py-2 px-1 min-h-[44px] flex items-center">Dashboard</router-link>
            <NotificationBell />
          </div>
        </div>
      </div>
    </nav>

    <div v-if="loadingSettings" class="sticky top-0 z-40 bg-yellow-50 border-b border-yellow-200 shadow-sm">
      <div class="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-3">
        <div class="flex items-center">
          <svg class="animate-spin h-5 w-5 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-sm text-yellow-800">
            <strong>Loading:</strong> We're retrieving saved settings and credentials. Some fields may appear blank until this finishes.
          </p>
        </div>
      </div>
    </div>
    
    <div class="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">
      <!-- Configuration Status Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Google Drive Status -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center',
                googleDriveConfigured ? 'bg-green-100' : 'bg-yellow-100'
              ]">
                <svg v-if="googleDriveConfigured" class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Google Drive</h3>
                <p :class="[
                  'text-sm',
                  googleDriveConfigured ? 'text-green-600' : 'text-yellow-600'
                ]">
                  {{ googleDriveConfigured ? 'Configured' : 'Not Configured' }}
                </p>
              </div>
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-500">
            {{ googleDriveConfigured 
              ? 'Documents will be stored in Google Drive.' 
              : 'Documents will be stored locally. Configure credentials below to enable cloud storage.' 
            }}
          </p>
        </div>

        <!-- Google Address Validation Status -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center',
                googleAddressValidationConfigured ? 'bg-green-100' : 'bg-yellow-100'
              ]">
                <svg v-if="googleAddressValidationConfigured" class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Address Validation</h3>
                <p :class="[
                  'text-sm',
                  googleAddressValidationConfigured ? 'text-green-600' : 'text-yellow-600'
                ]">
                  {{ googleAddressValidationConfigured ? 'Configured' : 'Not Configured' }}
                </p>
              </div>
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-500">
            {{ googleAddressValidationConfigured 
              ? 'Address validation and auto-population is enabled for forms.' 
              : 'Address fields will use manual entry. Add an API key below to enable validation.' 
            }}
          </p>
        </div>

        <!-- Mailgun Status -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center',
                mailgunConfigured ? 'bg-green-100' : 'bg-yellow-100'
              ]">
                <svg v-if="mailgunConfigured" class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Password Reset Emails</h3>
                <p :class="[
                  'text-sm',
                  mailgunConfigured ? 'text-green-600' : 'text-yellow-600'
                ]">
                  {{ mailgunConfigured ? 'Configured' : 'Not Configured' }}
                </p>
              </div>
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-500">
            {{ mailgunConfigured 
              ? 'Password reset emails are enabled via Mailgun.' 
              : 'Configure Mailgun below to enable password reset emails.' 
            }}
          </p>
        </div>
      </div>

      <!-- Google Drive Configuration -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Google Drive API Configuration</h2>
          <div class="flex items-center space-x-3">
            <button
              @click="testGoogleDrive"
              :disabled="testingDrive || !googleDriveConfigured"
              class="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="testingDrive" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </span>
              <span v-else>Test Connection</span>
            </button>
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              class="text-primary hover:underline text-sm flex items-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Google Cloud Console
            </a>
          </div>
        </div>

        <!-- Test Result -->
        <div v-if="driveTestResult" :class="[
          'rounded-md p-4 mb-6',
          driveTestResult.success ? 'bg-green-50' : 'bg-red-50'
        ]">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg v-if="driveTestResult.success" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p :class="['text-sm font-medium', driveTestResult.success ? 'text-green-800' : 'text-red-800']">
                {{ driveTestResult.message || driveTestResult.error }}
              </p>
              
              <!-- Instructions for fixing the error -->
              <div v-if="!driveTestResult.success && driveTestResult.instructions" class="mt-3">
                <p class="text-sm font-medium text-red-800 mb-2">How to fix:</p>
                <ul class="list-none text-sm text-red-700 space-y-1">
                  <li v-for="(instruction, index) in driveTestResult.instructions" :key="index" class="flex items-start">
                    <span class="text-red-500 mr-2">•</span>
                    <span>{{ instruction }}</span>
                  </li>
                </ul>
                
                <!-- Help Link -->
                <a 
                  v-if="driveTestResult.helpUrl" 
                  :href="driveTestResult.helpUrl" 
                  target="_blank"
                  class="inline-flex items-center mt-3 text-sm text-red-700 hover:text-red-900 underline"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Google Cloud Console
                </a>
              </div>
              
              <!-- Technical Details (collapsible) -->
              <details v-if="!driveTestResult.success && driveTestResult.technicalDetails" class="mt-3">
                <summary class="text-xs text-red-600 cursor-pointer hover:text-red-800">Show technical details</summary>
                <pre class="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto">{{ driveTestResult.technicalDetails }}</pre>
              </details>
            </div>
          </div>
        </div>
        
        <!-- Setup Instructions -->
        <div class="bg-blue-50 border-l-4 border-blue-400 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Setup Instructions</h3>
              <div class="mt-2 text-sm text-blue-700">
                <ol class="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" class="underline">Google Cloud Console</a></li>
                  <li>Create or select a project</li>
                  <li>Enable the Google Drive API</li>
                  <li>Create OAuth 2.0 credentials (Web application type)</li>
                  <li>Add <code class="bg-blue-100 px-1 rounded">http://localhost:3000/oauth2callback</code> as an authorized redirect URI</li>
                  <li>Use the OAuth Playground to generate a refresh token</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSave" class="space-y-6">
          <!-- Drive Type Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Storage Location
            </label>
            <div class="flex space-x-4">
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  :checked="driveType === 'myDrive'"
                  @change="handleDriveTypeChange('myDrive')"
                  :disabled="!googleDriveConfigured"
                  class="w-4 h-4 text-primary border-gray-300 focus:ring-primary disabled:opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700">My Drive</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="radio"
                  :checked="driveType === 'sharedDrive'"
                  @change="handleDriveTypeChange('sharedDrive')"
                  :disabled="!googleDriveConfigured"
                  class="w-4 h-4 text-primary border-gray-300 focus:ring-primary disabled:opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700">Shared Drive</span>
              </label>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Choose whether to store documents in your personal Google Drive or a Shared Drive (Team Drive).
            </p>
          </div>

          <!-- Shared Drive Selection (only shown when sharedDrive is selected) -->
          <div v-if="driveType === 'sharedDrive'" class="border-l-4 border-blue-400 pl-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Select Shared Drive <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <select
                v-model="selectedSharedDriveId"
                @change="handleSharedDriveSelect(selectedSharedDriveId)"
                :disabled="loadingSharedDrives || !googleDriveConfigured"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Select a Shared Drive --</option>
                <option v-for="drive in sharedDrives" :key="drive.id" :value="drive.id">
                  {{ drive.name }}
                </option>
              </select>
              <button
                type="button"
                @click="loadSharedDrives"
                :disabled="!googleDriveConfigured || loadingSharedDrives"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh shared drives list"
              >
                <svg v-if="loadingSharedDrives" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p v-if="sharedDrives.length === 0 && !loadingSharedDrives" class="mt-1 text-xs text-yellow-600">
              No Shared Drives found. Make sure you have access to at least one Shared Drive.
            </p>
            <p v-else class="mt-1 text-xs text-gray-500">
              {{ selectedSharedDriveName ? `Selected: ${selectedSharedDriveName}` : 'Select a Shared Drive to store documents in.' }}
            </p>
          </div>

          <!-- Folder Browser -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ driveType === 'sharedDrive' ? 'Folder within Shared Drive' : 'Google Drive Base Folder' }}
            </label>
            <div class="flex gap-2">
              <input
                v-model="settings.google_drive_base_folder_id"
                type="text"
                placeholder="Folder ID (leave empty for root)"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                readonly
              />
              <button
                type="button"
                @click="openFolderBrowser"
                :disabled="!googleDriveConfigured || (driveType === 'sharedDrive' && !settings.google_shared_drive_id)"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Browse...
              </button>
              <button
                v-if="settings.google_drive_base_folder_id"
                type="button"
                @click="settings.google_drive_base_folder_id = ''; selectedFolderName = ''"
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                title="Clear selection (use root)"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              {{ selectedFolderName 
                ? `Selected: ${selectedFolderName}` 
                : driveType === 'sharedDrive' 
                  ? 'Click Browse to select a folder within the Shared Drive, or leave empty to use the root of the Shared Drive.' 
                  : 'Click Browse to select a folder from your Google Drive, or leave empty to use root.' 
              }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth Client ID <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.google_client_id"
              type="text"
              placeholder="Enter your OAuth Client ID"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth Client Secret <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.google_client_secret"
              type="password"
              placeholder="Enter your OAuth Client Secret"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google OAuth Refresh Token <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.google_refresh_token"
              type="password"
              placeholder="Enter your OAuth Refresh Token"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Generate this using the <a href="https://developers.google.com/oauthplayground/" target="_blank" class="text-primary hover:underline">OAuth Playground</a>. 
              All credentials are encrypted before storage.
            </p>
          </div>
        </form>
      </div>
      
      <!-- Google Address Validation Configuration -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Google Address Validation API Configuration</h2>
          <div class="flex items-center space-x-3">
            <button
              @click="testAddressValidation"
              :disabled="testingAddress || !googleAddressValidationConfigured"
              class="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="testingAddress" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </span>
              <span v-else>Test Connection</span>
            </button>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/api-list" 
              target="_blank" 
              class="text-primary hover:underline text-sm flex items-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Google Cloud Console
            </a>
          </div>
        </div>

        <!-- Test Result -->
        <div v-if="addressTestResult" :class="[
          'rounded-md p-4 mb-6',
          addressTestResult.success ? 'bg-green-50' : 'bg-red-50'
        ]">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg v-if="addressTestResult.success" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p :class="['text-sm', addressTestResult.success ? 'text-green-800' : 'text-red-800']">
                {{ addressTestResult.message || addressTestResult.error }}
              </p>
            </div>
          </div>
        </div>

        <!-- Setup Instructions -->
        <div class="bg-blue-50 border-l-4 border-blue-400 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Setup Instructions</h3>
              <div class="mt-2 text-sm text-blue-700">
                <ol class="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/google/maps-apis/api-list" target="_blank" class="underline">Google Maps Platform</a></li>
                  <li>Enable the <strong>Address Validation API</strong></li>
                  <li>Create an API key under Credentials</li>
                  <li>Restrict the key to your domain for security (optional but recommended)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Google Address Validation API Key
          </label>
          <input
            v-model="settings.google_address_validation_api_key"
            type="text"
            placeholder="Enter your Google Address Validation API key"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <p class="mt-1 text-xs text-gray-500">
            Used for address validation and auto-population in forms. The key is encrypted before storage.
          </p>
        </div>
      </div>

      <!-- Mailgun Configuration (Password Reset Emails) -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Mailgun Configuration</h2>
          <div class="flex items-center space-x-3">
            <button
              @click="testMailgun"
              :disabled="testingMailgun || !mailgunConfigured"
              class="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="testingMailgun" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Test...
              </span>
              <span v-else>Send Test Email</span>
            </button>
            <a 
              href="https://app.mailgun.com/mg/dashboard" 
              target="_blank" 
              class="text-primary hover:underline text-sm flex items-center"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Mailgun Dashboard
            </a>
          </div>
        </div>

        <!-- Configuration Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="flex items-center p-4 rounded-lg" :class="mailgunConfigured ? 'bg-green-50' : 'bg-yellow-50'">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center',
              mailgunConfigured ? 'bg-green-100' : 'bg-yellow-100'
            ]">
              <svg v-if="mailgunConfigured" class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium" :class="mailgunConfigured ? 'text-green-800' : 'text-yellow-800'">
                {{ mailgunConfigured ? 'Mailgun Configured' : 'Not Configured' }}
              </p>
              <p class="text-xs" :class="mailgunConfigured ? 'text-green-600' : 'text-yellow-600'">
                {{ mailgunConfigured ? 'Password reset emails are enabled' : 'Enter API key and domain to enable password reset emails' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Test Result -->
        <div v-if="mailgunTestResult" :class="[
          'rounded-md p-4 mb-6',
          mailgunTestResult.success ? 'bg-green-50' : 'bg-red-50'
        ]">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg v-if="mailgunTestResult.success" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p :class="['text-sm', mailgunTestResult.success ? 'text-green-800' : 'text-red-800']">
                {{ mailgunTestResult.message || mailgunTestResult.error }}
              </p>
            </div>
          </div>
        </div>

        <!-- Setup Instructions -->
        <div class="bg-blue-50 border-l-4 border-blue-400 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">What is Mailgun?</h3>
              <div class="mt-2 text-sm text-blue-700">
                <p class="mb-2">Mailgun is used to send password reset emails to applicants and admins who forget their passwords.</p>
                <ol class="list-decimal list-inside space-y-1">
                  <li>Sign up at <a href="https://www.mailgun.com" target="_blank" class="underline">mailgun.com</a></li>
                  <li>Add and verify your domain</li>
                  <li>Get your API key from Settings → API Keys</li>
                  <li>Enter your credentials below</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <form class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Mailgun API Key <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.mailgun_api_key"
              type="password"
              placeholder="Enter your Mailgun API key"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Found in your Mailgun dashboard under Settings → API Keys. The key is encrypted before storage.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Mailgun Domain <span class="text-red-500">*</span>
            </label>
            <input
              v-model="settings.mailgun_domain"
              type="text"
              placeholder="e.g., mg.yourdomain.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Your verified sending domain in Mailgun (e.g., mg.yourdomain.com or sandbox domain for testing).
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              From Email Address
            </label>
            <input
              v-model="settings.mailgun_from_email"
              type="text"
              placeholder="e.g., OPCS Onboarding <noreply@yourdomain.com>"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              The sender address for password reset emails. Format: "Name &lt;email@domain.com&gt;" or just the email address.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Test Email Address
            </label>
            <input
              v-model="mailgunTestEmail"
              type="email"
              placeholder="Enter your email to receive test"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">
              Enter an email address and click "Send Test Email" to verify your configuration.
            </p>
          </div>
        </form>
      </div>

      <!-- Notification & Email Recipients -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Notification & Email Recipients</h2>
        <p class="text-sm text-gray-600 mb-6">
          Optional email addresses to receive specific notifications. Leave blank to use default (admins/managers). Mailgun must be configured for these emails to be sent.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">No Bank Account (Direct Deposit)</label>
            <input
              v-model="settings.no_bank_account_email"
              type="email"
              placeholder="e.g. hr@company.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">When an applicant selects "I DO NOT HAVE A BANK ACCOUNT", send an email to this address in addition to in-app notifications.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Judy (W-4 completion / Banking info)</label>
            <input
              v-model="settings.judy_email"
              type="email"
              placeholder="e.g. judy@company.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">Receives completed W-4 and direct deposit/banking info notifications.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Daphne (Acknowledgements / Emergency contact)</label>
            <input
              v-model="settings.daphne_email"
              type="email"
              placeholder="e.g. daphne@company.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">Receives Step 5 data: name, address, email, phone, emergency contact name and phone.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Completion notification override</label>
            <input
              v-model="settings.completion_notification_email"
              type="email"
              placeholder="e.g. onboarding@company.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">Optional: also send onboarding-complete emails to this address.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Thanks.io card list (DOB)</label>
            <input
              v-model="settings.thanks_io_recipient_email"
              type="email"
              placeholder="e.g. thanksio@company.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">When onboarding completes, send applicant name and date of birth to this address for the Thanks.io card list.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Non-Gmail alert recipient</label>
            <input
              v-model="settings.non_gmail_alert_email"
              type="email"
              placeholder="e.g. admin@company.com"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">When an applicant signs up with a non-Gmail address, send an alert here so you can manually update if needed.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Background check – email to State</label>
            <input
              v-model="settings.background_check_state_email"
              type="email"
              placeholder="e.g. state-background@state.sd.gov"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">When an applicant submits the Background Check form (Step 3), send a summary to this address (on behalf of the applicant, with authorization verbiage).</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Background check state email – custom verbiage</label>
            <textarea
              v-model="settings.background_check_state_verbiage"
              rows="3"
              placeholder="Optional: custom text included in the email to the state (e.g. signature/authorization statement)."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      <!-- W-4 and I-9 form options -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Form Options</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">W-4 Educational link (URL)</label>
            <input
              v-model="settings.w4_educational_link_url"
              type="url"
              placeholder="https://..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">Optional. Shown on Step 1 (W-4) as "For Educational Purposes only" — opens in new window.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">W-4 Educational link label</label>
            <input
              v-model="settings.w4_educational_link_label"
              type="text"
              placeholder="e.g. Example of how the new tax form works"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">I-9 / 8850 Employer authorized rep name <span class="text-red-600">(Required)</span></label>
            <input
              v-model="settings.i9_employer_authorized_rep_name"
              type="text"
              placeholder="e.g. Jason"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p class="mt-1 text-xs text-gray-500">Name used for employer/authorized representative on I-9 and Form 8850. Must be set before applicants can access onboarding forms.</p>
          </div>
          <div class="border-t pt-4 mt-4">
            <h4 class="text-sm font-semibold text-gray-800 mb-2">Form 8850 employer (Page 2) <span class="text-red-600">– required</span></h4>
            <p class="text-xs text-gray-500 mb-3">Used to auto-fill employer section on Form 8850. All fields below must be completed before applicants can access onboarding forms; otherwise employer information will be missing from documents.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer EIN</label>
                <input v-model="settings['8850_employer_ein']" type="text" placeholder="XX-XXXXXXX" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer phone</label>
                <input v-model="settings['8850_employer_phone']" type="text" placeholder="(XXX) XXX-XXXX" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer address</label>
                <input v-model="settings['8850_employer_address']" type="text" placeholder="Street address" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer city</label>
                <input v-model="settings['8850_employer_city']" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer state</label>
                <input v-model="settings['8850_employer_state']" type="text" maxlength="2" placeholder="SD" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">8850 Employer ZIP</label>
                <input v-model="settings['8850_employer_zip']" type="text" placeholder="57104" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Save Button and Status Messages -->
      <div class="bg-white shadow rounded-lg p-6">
        <div v-if="error" class="rounded-md bg-red-50 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{{ error }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="success" class="rounded-md bg-green-50 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            @click="handleSave"
            :disabled="loading"
            class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <span v-if="loading">Saving...</span>
            <span v-else>Save All Settings</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Folder Browser Modal -->
    <div v-if="showFolderBrowser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4 sm:m-6">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">Select Google Drive Folder</h3>
            <button @click="closeFolderBrowser" class="text-gray-400 hover:text-gray-500">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Search -->
          <div class="mt-4">
            <div class="relative">
              <input
                v-model="folderSearch"
                type="text"
                placeholder="Search folders..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                @input="debouncedSearch"
              />
              <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Breadcrumb Navigation -->
        <div class="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center space-x-2 text-sm">
            <button
              @click="navigateToFolder('root')"
              class="text-primary hover:underline flex items-center"
            >
              <svg v-if="driveType === 'sharedDrive'" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {{ driveType === 'sharedDrive' ? (selectedSharedDriveName || 'Shared Drive') : 'My Drive' }}
            </button>
            <template v-for="(crumb, index) in folderBreadcrumbs" :key="crumb.id">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <button
                @click="navigateToFolder(crumb.id)"
                :class="[
                  index === folderBreadcrumbs.length - 1 
                    ? 'text-gray-600 font-medium' 
                    : 'text-primary hover:underline'
                ]"
              >
                {{ crumb.name }}
              </button>
            </template>
          </div>
        </div>
        
        <!-- Folder List -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="loadingFolders" class="flex items-center justify-center py-8">
            <svg class="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          
          <div v-else-if="folderError" class="text-center py-8 text-red-600">
            <p>{{ folderError }}</p>
            <button @click="loadFolders(currentFolderId)" class="mt-2 text-primary hover:underline">
              Try again
            </button>
          </div>
          
          <div v-else-if="folders.length === 0" class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p class="mt-2">No folders found</p>
          </div>
          
          <div v-else class="space-y-1">
            <div
              v-for="folder in folders"
              :key="folder.id"
              @click="selectFolder(folder)"
              @dblclick="navigateToFolder(folder.id)"
              :class="[
                'flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors',
                selectedBrowserFolder?.id === folder.id 
                  ? 'bg-primary bg-opacity-10 border border-primary' 
                  : 'hover:bg-gray-100'
              ]"
            >
              <div class="flex items-center">
                <svg class="w-6 h-6 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span class="text-gray-900">{{ folder.name }}</span>
              </div>
              <button
                @click.stop="navigateToFolder(folder.id)"
                class="p-1 text-gray-400 hover:text-gray-600"
                title="Open folder"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              <span v-if="selectedBrowserFolder">
                Selected: <strong>{{ selectedBrowserFolder.name }}</strong>
              </span>
              <span v-else>
                Click to select, double-click to open folder
              </span>
            </div>
            <div class="flex space-x-3">
              <button
                @click="selectCurrentFolder"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Use Current Folder
              </button>
              <button
                @click="confirmFolderSelection"
                :disabled="!selectedBrowserFolder"
                class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api.js'
import NotificationBell from '../components/NotificationBell.vue'

const settings = ref({
  google_drive_base_folder_id: '',
  google_shared_drive_id: '',
  google_client_id: '',
  google_client_secret: '',
  google_refresh_token: '',
  google_address_validation_api_key: '',
  mailgun_api_key: '',
  mailgun_domain: '',
  mailgun_from_email: '',
  no_bank_account_email: '',
  judy_email: '',
  daphne_email: '',
  completion_notification_email: '',
  thanks_io_recipient_email: '',
  non_gmail_alert_email: '',
  background_check_state_email: '',
  background_check_state_verbiage: '',
  w4_educational_link_url: '',
  w4_educational_link_label: '',
  i9_employer_authorized_rep_name: '',
  '8850_employer_ein': '',
  '8850_employer_address': '',
  '8850_employer_city': '',
  '8850_employer_state': '',
  '8850_employer_zip': '',
  '8850_employer_phone': ''
})

const loading = ref(false)
const loadingSettings = ref(true)
const error = ref('')
const success = ref(false)

// Test states
const testingDrive = ref(false)
const testingAddress = ref(false)
const testingMailgun = ref(false)
const driveTestResult = ref(null)
const addressTestResult = ref(null)
const mailgunTestResult = ref(null)
const mailgunTestEmail = ref('')

// Folder browser states
const showFolderBrowser = ref(false)
const loadingFolders = ref(false)
const folderError = ref('')
const folders = ref([])
const currentFolderId = ref('root')
const folderBreadcrumbs = ref([])
const selectedBrowserFolder = ref(null)
const selectedFolderName = ref('')
const folderSearch = ref('')
let searchTimeout = null

// Shared Drives states
const driveType = ref('myDrive') // 'myDrive' or 'sharedDrive'
const sharedDrives = ref([])
const loadingSharedDrives = ref(false)
const selectedSharedDriveId = ref('')
const selectedSharedDriveName = ref('')

// Computed properties for configuration status
const googleDriveConfigured = computed(() => {
  return !!(
    settings.value.google_client_id && 
    settings.value.google_client_secret && 
    settings.value.google_refresh_token
  )
})

const googleAddressValidationConfigured = computed(() => {
  return !!settings.value.google_address_validation_api_key
})

const mailgunConfigured = computed(() => {
  return !!(settings.value.mailgun_api_key && settings.value.mailgun_domain)
})

onMounted(async () => {
  loadingSettings.value = true
  try {
    const response = await api.get('/settings')
    settings.value = { ...settings.value, ...response.data }
    
    // Set drive type based on saved settings
    if (settings.value.google_shared_drive_id) {
      driveType.value = 'sharedDrive'
      selectedSharedDriveId.value = settings.value.google_shared_drive_id
      // Load shared drive name
      await loadSharedDriveName(settings.value.google_shared_drive_id)
    }
    
    // Load folder name if folder ID is set
    if (settings.value.google_drive_base_folder_id) {
      await loadFolderName(settings.value.google_drive_base_folder_id)
    }
  } catch (err) {
    console.error('Error loading settings:', err)
  } finally {
    loadingSettings.value = false
  }
})

const loadFolderName = async (folderId) => {
  try {
    const response = await api.get(`/settings/google-drive/folder/${folderId}`)
    selectedFolderName.value = response.data.name || folderId
  } catch (err) {
    selectedFolderName.value = folderId
  }
}

const loadSharedDriveName = async (driveId) => {
  try {
    const response = await api.get(`/settings/google-drive/shared-drive/${driveId}`)
    selectedSharedDriveName.value = response.data.name || driveId
  } catch (err) {
    selectedSharedDriveName.value = driveId
  }
}

const loadSharedDrives = async () => {
  loadingSharedDrives.value = true
  try {
    const response = await api.get('/settings/google-drive/shared-drives')
    sharedDrives.value = response.data.sharedDrives || []
  } catch (err) {
    console.error('Error loading shared drives:', err)
    sharedDrives.value = []
  } finally {
    loadingSharedDrives.value = false
  }
}

const handleDriveTypeChange = async (type) => {
  driveType.value = type
  
  if (type === 'sharedDrive') {
    // Load shared drives list if not already loaded
    if (sharedDrives.value.length === 0) {
      await loadSharedDrives()
    }
    // Clear my drive folder selection when switching to shared drive
    if (!settings.value.google_shared_drive_id) {
      settings.value.google_drive_base_folder_id = ''
      selectedFolderName.value = ''
    }
  } else {
    // Clear shared drive selection when switching to my drive
    settings.value.google_shared_drive_id = ''
    selectedSharedDriveId.value = ''
    selectedSharedDriveName.value = ''
    settings.value.google_drive_base_folder_id = ''
    selectedFolderName.value = ''
  }
}

const handleSharedDriveSelect = async (driveId) => {
  selectedSharedDriveId.value = driveId
  settings.value.google_shared_drive_id = driveId
  
  // Find and set the name
  const drive = sharedDrives.value.find(d => d.id === driveId)
  selectedSharedDriveName.value = drive?.name || driveId
  
  // Clear folder selection when changing shared drive
  settings.value.google_drive_base_folder_id = ''
  selectedFolderName.value = ''
}

const handleSave = async () => {
  loading.value = true
  error.value = ''
  success.value = false
  
  try {
    await api.post('/settings', { settings: settings.value })
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save settings'
  } finally {
    loading.value = false
  }
}

// Test Functions
const testGoogleDrive = async () => {
  testingDrive.value = true
  driveTestResult.value = null
  
  try {
    // First save current settings
    await api.post('/settings', { settings: settings.value })
    
    // Then test connection
    const response = await api.post('/settings/test/google-drive')
    driveTestResult.value = response.data
  } catch (err) {
    driveTestResult.value = {
      success: false,
      error: err.response?.data?.error || 'Test failed: ' + err.message
    }
  } finally {
    testingDrive.value = false
  }
}

const testAddressValidation = async () => {
  testingAddress.value = true
  addressTestResult.value = null
  
  try {
    // First save current settings
    await api.post('/settings', { settings: settings.value })
    
    // Then test connection
    const response = await api.post('/settings/test/address-validation')
    addressTestResult.value = response.data
  } catch (err) {
    addressTestResult.value = {
      success: false,
      error: err.response?.data?.error || 'Test failed: ' + err.message
    }
  } finally {
    testingAddress.value = false
  }
}

const testMailgun = async () => {
  if (!mailgunTestEmail.value) {
    mailgunTestResult.value = {
      success: false,
      error: 'Please enter a test email address'
    }
    return
  }
  
  testingMailgun.value = true
  mailgunTestResult.value = null
  
  try {
    // First save current settings
    await api.post('/settings', { settings: settings.value })
    
    // Then test connection
    const response = await api.post('/settings/test/mailgun', {
      testEmail: mailgunTestEmail.value
    })
    mailgunTestResult.value = response.data
  } catch (err) {
    mailgunTestResult.value = {
      success: false,
      error: err.response?.data?.error || 'Test failed: ' + err.message
    }
  } finally {
    testingMailgun.value = false
  }
}

// Folder Browser Functions
const openFolderBrowser = () => {
  showFolderBrowser.value = true
  currentFolderId.value = 'root'
  folderBreadcrumbs.value = []
  selectedBrowserFolder.value = null
  folderSearch.value = ''
  loadFolders('root')
}

const closeFolderBrowser = () => {
  showFolderBrowser.value = false
}

const loadFolders = async (parentId, isSearch = false) => {
  loadingFolders.value = true
  folderError.value = ''
  
  try {
    const params = new URLSearchParams()
    if (isSearch && folderSearch.value) {
      params.set('search', folderSearch.value)
    } else {
      params.set('parentId', parentId)
    }
    
    // Add shared drive ID if using shared drives
    if (driveType.value === 'sharedDrive' && settings.value.google_shared_drive_id) {
      params.set('sharedDriveId', settings.value.google_shared_drive_id)
    }
    
    const response = await api.get(`/settings/google-drive/browse?${params}`)
    folders.value = response.data.folders || []
    
    if (!isSearch) {
      currentFolderId.value = parentId
    }
  } catch (err) {
    folderError.value = err.response?.data?.error || 'Failed to load folders'
    folders.value = []
  } finally {
    loadingFolders.value = false
  }
}

const navigateToFolder = async (folderId) => {
  selectedBrowserFolder.value = null
  
  if (folderId === 'root') {
    folderBreadcrumbs.value = []
  } else {
    // If clicking on a breadcrumb, trim to that level
    const existingIndex = folderBreadcrumbs.value.findIndex(b => b.id === folderId)
    if (existingIndex >= 0) {
      folderBreadcrumbs.value = folderBreadcrumbs.value.slice(0, existingIndex + 1)
    } else {
      // Find the folder in current list to get its name
      const folder = folders.value.find(f => f.id === folderId)
      if (folder) {
        folderBreadcrumbs.value.push({ id: folder.id, name: folder.name })
      }
    }
  }
  
  folderSearch.value = ''
  await loadFolders(folderId)
}

const selectFolder = (folder) => {
  selectedBrowserFolder.value = folder
}

const selectCurrentFolder = () => {
  // Use current folder (what's being browsed)
  settings.value.google_drive_base_folder_id = currentFolderId.value === 'root' ? '' : currentFolderId.value
  selectedFolderName.value = currentFolderId.value === 'root' 
    ? '' 
    : (folderBreadcrumbs.value[folderBreadcrumbs.value.length - 1]?.name || currentFolderId.value)
  closeFolderBrowser()
}

const confirmFolderSelection = () => {
  if (selectedBrowserFolder.value) {
    settings.value.google_drive_base_folder_id = selectedBrowserFolder.value.id
    selectedFolderName.value = selectedBrowserFolder.value.name
    closeFolderBrowser()
  }
}

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    if (folderSearch.value.length >= 2) {
      loadFolders(currentFolderId.value, true)
    } else if (folderSearch.value.length === 0) {
      loadFolders(currentFolderId.value, false)
    }
  }, 300)
}
</script>
