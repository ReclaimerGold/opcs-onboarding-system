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
      <!-- Section navigation -->
      <div class="mb-8">
        <nav class="flex flex-wrap gap-1 border-b border-gray-200" aria-label="Settings sections">
          <button
            type="button"
            @click="settingsSection = 'integrations'"
            :class="sectionNavClass('integrations')"
          >
            <svg class="w-4 h-4 mr-2 hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Integrations
          </button>
          <button
            type="button"
            @click="settingsSection = 'email-forms'"
            :class="sectionNavClass('email-forms')"
          >
            <svg class="w-4 h-4 mr-2 hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email &amp; Forms
          </button>
          <button
            type="button"
            @click="settingsSection = 'system'"
            :class="sectionNavClass('system')"
          >
            <svg class="w-4 h-4 mr-2 hidden sm:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 0H3m2 0h2m2 0h2M5 15H3m2 0H3m2 0h2m2 0h2M19 9h2m-2 0h-2m-2 0h-2M19 15h2m-2 0h-2m-2 0h-2" />
            </svg>
            System
          </button>
        </nav>
      </div>

      <!-- Integrations: Configuration Status Overview -->
      <div v-show="settingsSection === 'integrations'" class="space-y-8">
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
      </div>

      <!-- Email & Forms -->
      <div v-show="settingsSection === 'email-forms'" class="space-y-8">
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
      </div>

      <!-- System (Health, Tests, PDF Templates) -->
      <div v-show="settingsSection === 'system'" class="space-y-8">
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex -mb-px">
            <button
              type="button"
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
              type="button"
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
              type="button"
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

        <!-- System Health -->
        <div v-if="systemTab === 'health'" class="space-y-6">
          <div class="bg-white shadow rounded-lg p-6">
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
              <div class="mb-4">
                <p class="text-sm text-gray-600 mb-2">
                  Fix permissions on existing Google Drive files to make them viewable by anyone with the link.
                </p>
                <div class="flex items-center flex-wrap gap-4">
                  <button
                    type="button"
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
              <div class="pt-4 border-t border-gray-200">
                <p class="text-sm text-gray-600 mb-2">
                  Regenerate corrupted PDFs — deletes old files and uploads fresh copies from stored form data.
                </p>
                <div class="flex items-center flex-wrap gap-4">
                  <button
                    type="button"
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
                    <strong>{{ formatDate(error.createdAt) }}:</strong> {{ error.action }} — {{ error.resourceType }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Client IP & Proxy (trusted proxy when behind reverse proxy) -->
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Client IP &amp; Proxy</h3>
            <p class="text-sm text-gray-600 mb-4">
              When the app is behind a reverse proxy (e.g. nginx, load balancer), the server only sees the proxy&apos;s IP.
              Add the proxy&apos;s IP address here so we use the <code class="px-1 py-0.5 bg-gray-100 rounded text-xs">X-Forwarded-For</code> or <code class="px-1 py-0.5 bg-gray-100 rounded text-xs">X-Real-IP</code> header for the real client IP in audit logs, login attempts, and rate limiting.
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trusted proxy IP address(es)</label>
              <input
                v-model="settings.trusted_proxy_ips"
                type="text"
                placeholder="e.g. 10.0.0.1 or 127.0.0.1, 192.168.1.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <p class="mt-1 text-xs text-gray-500">
                Comma-separated list of proxy IPs. When a request comes from one of these IPs, the client IP is taken from the forwarding headers. Leave blank when not behind a proxy.
              </p>
            </div>
          </div>
        </div>

        <!-- Tests -->
        <div v-if="systemTab === 'tests'" class="bg-white shadow rounded-lg p-6">
          <div class="mb-6 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Unit Tests</h3>
            <button
              type="button"
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
            <button type="button" @click="saveManagerRequiredForms" :disabled="savingManagerRequired" class="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {{ savingManagerRequired ? 'Saving...' : 'Save Requirements' }}
            </button>
            <span v-if="managerRequiredSaveMsg" class="ml-3 text-sm" :class="managerRequiredSaveSuccess ? 'text-green-600' : 'text-red-600'">{{ managerRequiredSaveMsg }}</span>
          </div>
          <SignaturePlacementPanel placementType="manager" />
        </div>
      </div>
      
      <!-- Save Button and Status Messages -->
      <div class="mt-8">
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
import { useRoute } from 'vue-router'
import api from '../services/api.js'
import { useAdminDashboard } from '../composables/useAdminDashboard.js'
import NotificationBell from '../components/NotificationBell.vue'
import TestResultsPanel from '../components/admin/TestResultsPanel.vue'
import PdfTemplatesPanel from '../components/admin/PdfTemplatesPanel.vue'
import PdfDownloadPromptDialog from '../components/admin/PdfDownloadPromptDialog.vue'
import PdfTemplateDownloadModal from '../components/admin/PdfTemplateDownloadModal.vue'
import SignaturePlacementPanel from '../components/admin/SignaturePlacementPanel.vue'

const route = useRoute()
const dashboard = useAdminDashboard()

// Section navigation: integrations | email-forms | system
const settingsSection = ref('integrations')
const systemTab = ref('health')

// Section nav button class
function sectionNavClass(section) {
  const active = settingsSection.value === section
  return [
    'px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center',
    active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  ]
}

// System tab state (Health, Tests, PDF Templates)
const fixingPermissions = ref(false)
const permissionFixResult = ref(null)
const regeneratingPdfs = ref(false)
const regeneratePdfsResult = ref(null)
const runningTests = ref(false)
const testResults = ref(null)
const showPdfDownloadPrompt = ref(false)
const showPdfDownloadModal = ref(false)

// Manager signature requirements
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

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
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

async function fixGDrivePermissions() {
  if (!confirm('This will set public viewer permissions on all Google Drive files. Continue?')) return
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

async function regeneratePdfs() {
  if (!confirm('This will delete all existing Google Drive PDFs and regenerate them from stored form data. This may take a while. Continue?')) return
  regeneratingPdfs.value = true
  regeneratePdfsResult.value = null
  try {
    const response = await api.post('/admin/regenerate-pdfs')
    regeneratePdfsResult.value = {
      success: true,
      message: `Regenerated ${response.data.results.success} of ${response.data.results.total} PDFs`
    }
    dashboard.loadAllData?.()
  } catch (error) {
    regeneratePdfsResult.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to regenerate PDFs'
    }
  } finally {
    regeneratingPdfs.value = false
  }
}

async function runTests() {
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

function onStartPdfDownload() {
  showPdfDownloadPrompt.value = false
  showPdfDownloadModal.value = true
}

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
  '8850_employer_phone': '',
  trusted_proxy_ips: ''
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

// Apply route query so alerts can deep-link to Settings → System → PDF Templates
watch(() => route.query, (query) => {
  if (query.section === 'system') {
    settingsSection.value = 'system'
    if (query.tab === 'templates') systemTab.value = 'templates'
    else if (query.tab === 'tests') systemTab.value = 'tests'
    else systemTab.value = 'health'
  }
}, { immediate: true })

watch(settingsSection, (section) => {
  if (section === 'system') {
    dashboard.loadSystemHealth?.()
    loadManagerRequiredForms()
  }
})

onMounted(async () => {
  loadingSettings.value = true
  try {
    const response = await api.get('/settings')
    settings.value = { ...settings.value, ...response.data }
    
    if (settings.value.google_shared_drive_id) {
      driveType.value = 'sharedDrive'
      selectedSharedDriveId.value = settings.value.google_shared_drive_id
      await loadSharedDriveName(settings.value.google_shared_drive_id)
    }
    
    if (settings.value.google_drive_base_folder_id) {
      await loadFolderName(settings.value.google_drive_base_folder_id)
    }
  } catch (err) {
    console.error('Error loading settings:', err)
  } finally {
    loadingSettings.value = false
  }

  // PDF template status: prompt to download if any are missing
  try {
    const statusRes = await api.get('/admin/pdf-templates/status')
    const templates = statusRes.data?.templates || {}
    const anyMissing = Object.values(templates).some((t) => t && t.exists === false)
    if (anyMissing) showPdfDownloadPrompt.value = true
  } catch (err) {
    console.error('Error checking PDF template status:', err)
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
