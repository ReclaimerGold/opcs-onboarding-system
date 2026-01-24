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
            <h1 class="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/admin" class="text-gray-600 hover:text-gray-900">Admin</router-link>
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</router-link>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8">
      <!-- Configuration Status Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            <div class="ml-3">
              <p :class="['text-sm', driveTestResult.success ? 'text-green-800' : 'text-red-800']">
                {{ driveTestResult.message || driveTestResult.error }}
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
          <!-- Folder Browser -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Google Drive Base Folder
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
                :disabled="!googleDriveConfigured"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Browse...
              </button>
              <button
                v-if="settings.google_drive_base_folder_id"
                type="button"
                @click="settings.google_drive_base_folder_id = ''"
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                title="Clear selection (use root)"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              {{ selectedFolderName ? `Selected: ${selectedFolderName}` : 'Click Browse to select a folder from your Google Drive, or leave empty to use root.' }}
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
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
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
              class="text-primary hover:underline"
            >
              My Drive
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

const settings = ref({
  google_drive_base_folder_id: '',
  google_client_id: '',
  google_client_secret: '',
  google_refresh_token: '',
  google_address_validation_api_key: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

// Test states
const testingDrive = ref(false)
const testingAddress = ref(false)
const driveTestResult = ref(null)
const addressTestResult = ref(null)

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

onMounted(async () => {
  try {
    const response = await api.get('/settings')
    settings.value = { ...settings.value, ...response.data }
    
    // Load folder name if folder ID is set
    if (settings.value.google_drive_base_folder_id) {
      loadFolderName(settings.value.google_drive_base_folder_id)
    }
  } catch (err) {
    console.error('Error loading settings:', err)
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
