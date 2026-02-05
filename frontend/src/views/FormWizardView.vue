<template>
  <div class="min-h-screen bg-gray-50">
    <!-- User onboarding locked until: SSN consent, password (if admin), and signature set -->
    <SSNConsentModal
      v-if="showOnboardingModal"
      :open="showOnboardingModal"
      :startAtSignature="showStartAtSignatureOnly"
      v-model:consented="dashboardConsented"
      @signature="onDashboardOnboardingComplete"
    />
    <nav class="bg-white shadow">
      <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-3">
            <img 
              src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" 
              alt="Optimal Prime Services Logo" 
              class="h-10 w-auto"
            />
            <h1 class="text-xl font-semibold text-gray-900">Onboarding Forms</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Checking availability (before template-status has loaded) -->
    <div v-if="!templateStatusLoaded" class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-16 flex items-center justify-center">
      <div class="text-center">
        <svg class="animate-spin h-10 w-10 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600">Checking availability...</p>
      </div>
    </div>

    <!-- Forms not yet available: admin must set signature placement for all documents -->
    <div v-else-if="!allSignaturePlacementsReady" class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-16">
      <div class="max-w-xl mx-auto bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg shadow-sm">
        <h2 class="text-lg font-semibold text-amber-800 mb-2">Forms are not yet available</h2>
        <p class="text-sm text-amber-700 mb-4">
          Your administrator must configure signature placement for W-4, I-9, and Form 8850 before you can complete onboarding. Please contact your administrator or try again later.
        </p>
        <router-link
          to="/dashboard"
          class="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light"
        >
          Go to Dashboard
        </router-link>
      </div>
    </div>

    <template v-else>
    <div v-if="showLoadingBanner" class="sticky top-0 z-40 bg-yellow-50 border-b border-yellow-200 shadow-sm">
      <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-3">
        <div class="flex items-center">
          <svg class="animate-spin h-5 w-5 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-sm text-yellow-800">
            <strong>Loading:</strong> We're retrieving your saved progress and pre-fill details. Some fields may appear blank until this finishes.
          </p>
        </div>
      </div>
    </div>

    <div v-if="signaturePlacementBlockedSteps.length > 0" class="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 shadow-sm">
      <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-3">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm text-amber-800">
            <strong>Forms not yet available:</strong> The following steps cannot be submitted until an administrator configures signature placement: {{ signaturePlacementBlockedStepsLabel }}. Please contact your administrator or try again later.
          </p>
        </div>
      </div>
    </div>
    
    <div class="max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8">
      <!-- Auto-Fill Disclaimer -->
      <div class="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-sm text-blue-800">
              <strong>Automatic Document Filling:</strong> This system automatically fills official IRS and USCIS forms with the information you provide. 
              The forms are generated using official government templates and your data is securely processed. 
              Please review all information before submitting.
            </p>
          </div>
        </div>
      </div>

      <!-- Progress Steps - Clickable Breadcrumbs -->
      <div class="mb-8">
        <div class="relative">
          <!-- Progress Line Background -->
          <div class="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0"></div>
          <div 
            class="absolute top-5 left-0 h-1 bg-primary z-0 transition-all duration-300"
            :style="{ width: `${((currentStep - 1) / 5) * 100}%` }"
          ></div>
          
          <!-- Step Circles Container -->
          <div class="relative z-10 flex items-start w-full">
            <!-- Step 1 - Fixed at start -->
            <div 
              :class="['flex flex-col items-center group relative flex-shrink-0', isStepBlockedBySignaturePlacement(1) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer']"
              @click="!isStepBlockedBySignaturePlacement(1) && navigateToStep(1)"
            >
              <div class="relative w-10 flex justify-center">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                    getStepStatus(1).status === 'completed' 
                      ? 'bg-primary text-white shadow-md' 
                      : getStepStatus(1).status === 'current'
                      ? 'bg-primary text-white ring-4 ring-primary ring-opacity-30'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
                    getStepStatus(1).hasWarning ? 'ring-2 ring-yellow-400' : '',
                    isStepBlockedBySignaturePlacement(1) ? 'opacity-70' : ''
                  ]"
                  :title="isStepBlockedBySignaturePlacement(1) ? 'This form is unavailable until the administrator configures signature placement.' : (getStepStatus(1).hasWarning ? getStepStatus(1).warningMessage : undefined)"
                >
                  <svg 
                    v-if="getStepStatus(1).status === 'completed'" 
                    class="w-6 h-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg 
                    v-else-if="getStepStatus(1).status === 'pending' && getStepStatus(1).hasWarning" 
                    class="w-5 h-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span v-else>1</span>
                </div>
              </div>
              <div class="mt-2 text-center">
                <div 
                  :class="[
                    'text-xs font-medium transition-colors whitespace-nowrap',
                    getStepStatus(1).status === 'completed' || getStepStatus(1).status === 'current'
                      ? 'text-primary' 
                      : 'text-gray-600 group-hover:text-gray-900'
                  ]"
                >
                  {{ getStepLabel(1) }}
                </div>
                <div 
                  v-if="getStepStatus(1).hasWarning" 
                  class="text-xs text-yellow-600 mt-1 whitespace-nowrap"
                >
                  {{ getStepStatus(1).warningMessage }}
                </div>
              </div>
            </div>
            
            <!-- Steps 2-5 - Evenly spaced with space-between -->
            <div class="flex-1 flex items-start justify-between mx-4">
              <div 
                v-for="step in [2, 3, 4, 5]" 
                :key="step" 
                :class="['flex flex-col items-center group relative flex-1', isStepBlockedBySignaturePlacement(step) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer']"
                @click="!isStepBlockedBySignaturePlacement(step) && navigateToStep(step)"
              >
                <div class="flex justify-center w-full">
                  <div class="relative w-10 flex justify-center">
                    <div
                      :class="[
                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                        getStepStatus(step).status === 'completed' 
                          ? 'bg-primary text-white shadow-md' 
                          : getStepStatus(step).status === 'current'
                          ? 'bg-primary text-white ring-4 ring-primary ring-opacity-30'
                          : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
                        getStepStatus(step).hasWarning ? 'ring-2 ring-yellow-400' : '',
                        isStepBlockedBySignaturePlacement(step) ? 'opacity-70' : ''
                      ]"
                      :title="isStepBlockedBySignaturePlacement(step) ? 'This form is unavailable until the administrator configures signature placement.' : (getStepStatus(step).hasWarning ? getStepStatus(step).warningMessage : undefined)"
                    >
                      <svg 
                        v-if="getStepStatus(step).status === 'completed'" 
                        class="w-6 h-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg 
                        v-else-if="getStepStatus(step).status === 'pending' && getStepStatus(step).hasWarning" 
                        class="w-5 h-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span v-else>{{ step }}</span>
                    </div>
                  </div>
                </div>
                <div class="mt-2 text-center w-full">
                  <div 
                    :class="[
                      'text-xs font-medium transition-colors whitespace-nowrap',
                      getStepStatus(step).status === 'completed' || getStepStatus(step).status === 'current'
                        ? 'text-primary' 
                        : 'text-gray-600 group-hover:text-gray-900'
                    ]"
                  >
                    {{ getStepLabel(step) }}
                  </div>
                  <div 
                    v-if="getStepStatus(step).hasWarning" 
                    class="text-xs text-yellow-600 mt-1 whitespace-nowrap"
                  >
                    {{ getStepStatus(step).warningMessage }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Step 6 - Fixed at end -->
            <div 
              :class="['flex flex-col items-center group relative flex-shrink-0 ml-auto', isStepBlockedBySignaturePlacement(6) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer']"
              @click="!isStepBlockedBySignaturePlacement(6) && navigateToStep(6)"
            >
              <div class="relative w-10 flex justify-center">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                    getStepStatus(6).status === 'completed' 
                      ? 'bg-primary text-white shadow-md' 
                      : getStepStatus(6).status === 'current'
                      ? 'bg-primary text-white ring-4 ring-primary ring-opacity-30'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
                    getStepStatus(6).hasWarning ? 'ring-2 ring-yellow-400' : '',
                    isStepBlockedBySignaturePlacement(6) ? 'opacity-70' : ''
                  ]"
                  :title="isStepBlockedBySignaturePlacement(6) ? 'This form is unavailable until the administrator configures signature placement.' : (getStepStatus(6).hasWarning ? getStepStatus(6).warningMessage : undefined)"
                >
                  <svg 
                    v-if="getStepStatus(6).status === 'completed'" 
                    class="w-6 h-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg 
                    v-else-if="getStepStatus(6).status === 'pending' && getStepStatus(6).hasWarning" 
                    class="w-5 h-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span v-else>6</span>
                </div>
              </div>
              <div class="mt-2 text-center">
                <div 
                  :class="[
                    'text-xs font-medium transition-colors whitespace-nowrap',
                    getStepStatus(6).status === 'completed' || getStepStatus(6).status === 'current'
                      ? 'text-primary' 
                      : 'text-gray-600 group-hover:text-gray-900'
                  ]"
                >
                  {{ getStepLabel(6) }}
                </div>
                <div 
                  v-if="getStepStatus(6).hasWarning" 
                  class="text-xs text-yellow-600 mt-1 whitespace-nowrap"
                >
                  {{ getStepStatus(6).warningMessage }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Signature placement not configured - form cannot be submitted -->
      <div v-if="isStepBlockedBySignaturePlacement(currentStep)" class="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="text-sm font-semibold text-amber-800">Form temporarily unavailable</h3>
            <p class="text-sm text-amber-700 mt-1">This form cannot be submitted until an administrator configures signature placement in Admin → System → PDF Templates.</p>
          </div>
        </div>
      </div>

      <!-- Warning Banner for Missing Prerequisites -->
      <div v-else-if="stepWarnings[currentStep]" class="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <div class="flex items-start">
          <svg class="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-yellow-800">Missing Required Information</h3>
            <p class="text-sm text-yellow-700 mt-1">{{ stepWarnings[currentStep] }}</p>
            <button
              @click="navigateToRequiredStep()"
              class="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              Go to required step →
            </button>
          </div>
        </div>
      </div>
      
      <!-- Draft Status Banner -->
      <div v-if="hasDrafts && !stepWarnings[currentStep]" class="mb-4 bg-blue-50 border-l-4 border-primary p-4 rounded">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-gray-700">
            Your saved progress has been loaded. You can continue where you left off.
          </p>
        </div>
      </div>

      <!-- Form Content - Full Width Layout with PDF Preview -->
      <div :class="hasPDFPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'flex justify-center'">
        <!-- Form Section (50% on large screens when PDF preview exists, centered when no preview) -->
        <div :class="hasPDFPreview ? 'lg:col-span-1' : 'w-full max-w-3xl'">
          <Step1W4Form 
            v-if="currentStep === 1" 
            :session-signature="sessionSignature"
            :consent-already-given="!!dashboardOnboarding.ssnConsentGiven?.value"
            @submitted="handleStepComplete"
            @form-data-change="handleFormDataChange"
          />
          <Step2I9Form 
            v-if="currentStep === 2" 
            :session-signature="sessionSignature"
            @submitted="handleStepComplete"
            @form-data-change="handleFormDataChange"
          />
          <Step3BackgroundForm 
            v-if="currentStep === 3" 
            @submitted="handleStepComplete"
            @form-data-change="handleFormDataChange"
          />
          <Step4DirectDepositForm 
            v-if="currentStep === 4" 
            @submitted="handleStepComplete"
            @form-data-change="handleFormDataChange"
          />
          <Step5AcknowledgementsForm 
            v-if="currentStep === 5" 
            :session-signature="sessionSignature"
            @submitted="handleStepComplete"
            @form-data-change="handleFormDataChange"
          />
          <Step68850Form 
            v-if="currentStep === 6" 
            :session-signature="sessionSignature"
            :consent-already-given="!!dashboardOnboarding.ssnConsentGiven?.value"
            @submitted="handleStepComplete"
            @form-data-change="handleFormDataChange"
          />
        </div>

        <!-- PDF Preview Section (50% on large screens, hidden on smaller screens for non-PDF forms) -->
        <div 
          v-if="hasPDFPreview" 
          class="lg:col-span-1 hidden lg:block"
        >
          <div class="bg-white rounded-lg shadow-lg p-4 sticky top-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg class="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ pdfPreviewTitle }}
            </h3>
            <div class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50" style="height: 600px;">
              <!-- PDF iframe when URL is available -->
              <iframe
                v-if="pdfPreviewUrl && !generatingPreview && !previewError"
                :src="pdfPreviewUrl"
                class="w-full h-full"
                frameborder="0"
                title="PDF Preview"
                @error="handlePreviewError"
              ></iframe>
              
              <!-- Loading state -->
              <div v-else-if="generatingPreview" class="w-full h-full flex items-center justify-center bg-gray-100">
                <div class="text-center p-6">
                  <svg class="animate-spin mx-auto h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p class="text-sm text-gray-600">Generating preview...</p>
                </div>
              </div>
              
              <!-- Error state -->
              <div v-else-if="previewError" class="w-full h-full flex items-center justify-center bg-red-50">
                <div class="text-center p-6">
                  <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p class="text-sm text-red-600 font-medium mb-2">Preview Error</p>
                  <p class="text-xs text-red-500 mb-4">{{ previewError }}</p>
                  <button 
                    @click="retryPreview"
                    class="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                  >
                    Retry Preview
                  </button>
                </div>
              </div>
              
              <!-- Default placeholder state (shown until all required fields are filled) -->
              <div v-else class="w-full h-full flex items-center justify-center bg-gray-100">
                <div class="text-center p-6">
                  <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-sm text-gray-500">PDF preview will appear here</p>
                  <p class="text-xs text-gray-400 mt-1">after you complete all required fields</p>
                </div>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-500 text-center">
              <p v-if="pdfPreviewUrl && !previewError">This is a <strong>live preview</strong> of your {{ getStepLabel(currentStep) }} form.</p>
              <p v-else-if="generatingPreview" class="text-gray-400 italic">Generating preview...</p>
              <p v-else-if="previewError" class="text-red-500 italic">Preview generation failed</p>
              <p v-else class="text-gray-400 italic">Complete all required fields to see a live preview.</p>
              <a 
                v-if="pdfPreviewUrl && !previewError"
                :href="pdfPreviewUrl" 
                target="_blank"
                class="text-primary hover:text-primary-light hover:underline mt-1 inline-block"
              >
                Open in new tab →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import SSNConsentModal from '../components/SSNConsentModal.vue'
import Step1W4Form from '../components/forms/Step1W4Form.vue'
import Step2I9Form from '../components/forms/Step2I9Form.vue'
import Step3BackgroundForm from '../components/forms/Step3BackgroundForm.vue'
import Step4DirectDepositForm from '../components/forms/Step4DirectDepositForm.vue'
import Step5AcknowledgementsForm from '../components/forms/Step5AcknowledgementsForm.vue'
import Step68850Form from '../components/forms/Step68850Form.vue'
import api from '../services/api.js'
import { getSessionSignature } from '../utils/sessionSignature.js'
import { useDashboardOnboarding } from '../composables/useDashboardOnboarding.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const dashboardOnboarding = useDashboardOnboarding()
const dashboardConsented = ref(false)

// Unwrap composable refs so template gets booleans (SSNConsentModal expects open: Boolean)
const showOnboardingModal = computed(() => !!dashboardOnboarding.needsOnboardingModal?.value)
const showStartAtSignatureOnly = computed(() => !!dashboardOnboarding.startAtSignatureOnly?.value)

const CONSENT_STORAGE_KEY = 'opcsSsnConsentAcknowledged'

async function onDashboardOnboardingComplete(signatureData) {
  if (!signatureData || !String(signatureData).trim()) return // cannot continue until filled
  const wasSignatureOnly = !!dashboardOnboarding.startAtSignatureOnly?.value
  try {
    await dashboardOnboarding.saveSignature(signatureData)
  } catch (err) {
    console.error('Failed to save signature', err)
    return
  }
  sessionSignature.value = signatureData
  dashboardConsented.value = true
  if (!wasSignatureOnly) {
    dashboardOnboarding.ssnConsentGiven.value = true
    try {
      await dashboardOnboarding.recordConsent()
      sessionStorage.setItem(CONSENT_STORAGE_KEY, 'true')
    } catch (err) {
      console.error('Failed to record SSN consent', err)
      dashboardOnboarding.ssnConsentGiven.value = false
      dashboardConsented.value = false
    }
  }
}

const currentStep = ref(1)
const hasDrafts = ref(false)
const completedSteps = ref(new Set())
const applicantData = ref(null)
const stepWarnings = ref({})
const submissions = ref([])
const currentFormData = ref(null)
const pdfPreviewUrl = ref(null)
const generatingPreview = ref(false)
const previewError = ref(null)
const loadingProgress = ref(false)
const loadingApplicant = ref(false)
const sessionSignature = ref(null)
const templateStatus = ref({ w4: false, i9: false, 8850: false })
const templateStatusLoaded = ref(false)
let previewDebounceTimer = null

const allSignaturePlacementsReady = computed(() =>
  templateStatus.value.w4 && templateStatus.value.i9 && !!templateStatus.value['8850']
)

const stepLabels = {
  1: 'W-4',
  2: 'I-9',
  3: 'Background',
  4: 'Direct Deposit',
  5: 'Acknowledgements',
  6: '8850'
}

// Step dependencies - what data is required from previous steps
const stepDependencies = {
  2: { // I-9 requires basic info from Step 1
    requiredFields: ['firstName', 'lastName', 'email'],
    message: 'Please complete Step 1 (W-4) first to provide your name and email.'
  },
  3: { // Background check requires I-9
    requiresStep: 2,
    message: 'Please complete Step 2 (I-9) first.'
  },
  4: { // Direct deposit requires background check
    requiresStep: 3,
    message: 'Please complete Step 3 (Background Check) first.'
  },
  5: { // Acknowledgements requires direct deposit
    requiresStep: 4,
    message: 'Please complete Step 4 (Direct Deposit) first.'
  },
  6: { // 8850 requires acknowledgements
    requiresStep: 5,
    message: 'Please complete Step 5 (Acknowledgements) first.'
  }
}

// Scroll to top whenever the step changes (Next, breadcrumb, or dependency redirect)
watch(currentStep, () => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
})

const loadTemplateStatus = async () => {
  try {
    const res = await api.get('/forms/template-status')
    templateStatus.value = { w4: !!res.data.w4, i9: !!res.data.i9, 8850: !!res.data['8850'] }
  } catch {
    templateStatus.value = { w4: false, i9: false, 8850: false }
  } finally {
    templateStatusLoaded.value = true
  }
}

onMounted(async () => {
  await loadTemplateStatus()
  const ready = templateStatus.value.w4 && templateStatus.value.i9 && templateStatus.value['8850']
  if (!ready) return

  await loadProgress()
  await loadApplicantData()

  // Auto-populate signature from onboarding modal (session storage) if not already set from draft
  if (!sessionSignature.value) {
    const stored = getSessionSignature()
    if (stored) sessionSignature.value = stored
  }

  // Check for step query parameter
  if (route.query.step) {
    const step = parseInt(route.query.step)
    if (step >= 1 && step <= 6) {
      navigateToStep(step)
    } else {
      validateCurrentStep()
    }
  } else {
    validateCurrentStep()
  }

  updatePreviewForStep(currentStep.value)
})

onBeforeUnmount(() => {
  // Clean up blob URLs to prevent memory leaks
  if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
  }
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer)
  }
})

const showLoadingBanner = computed(() => {
  return loadingProgress.value || loadingApplicant.value
})

const loadProgress = async () => {
  loadingProgress.value = true
  try {
    const progressResponse = await api.get('/applicants/me/progress')
    const progressSubmissions = progressResponse.data.submissions || []
    
    // Fetch full submissions with IDs for PDF preview
    try {
      const submissionsResponse = await api.get('/forms/submissions')
      submissions.value = submissionsResponse.data.map(sub => ({
        id: sub.id,
        stepNumber: sub.step_number,
        formType: sub.form_type,
        submittedAt: sub.submitted_at,
        pdfFilename: sub.pdf_filename
      }))
    } catch (subError) {
      console.error('Error loading submissions:', subError)
      submissions.value = []
    }
    
    // Track completed steps
    progressSubmissions.forEach(sub => {
      completedSteps.value.add(sub.stepNumber)
    })
    
    // Check for drafts
    try {
      const draftsResponse = await api.get('/forms/drafts')
      hasDrafts.value = draftsResponse.data && draftsResponse.data.length > 0
    } catch (draftError) {
      // Drafts might not exist yet, that's okay
    }
    
    // Set current step to first incomplete step
    if (completedSteps.value.size < 6) {
      // Find first incomplete step
      for (let i = 1; i <= 6; i++) {
        if (!completedSteps.value.has(i)) {
          currentStep.value = i
          break
        }
      }
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Error fetching progress:', error)
  } finally {
    loadingProgress.value = false
  }
}

const loadApplicantData = async () => {
  loadingApplicant.value = true
  try {
    const response = await api.get('/applicants/me')
    applicantData.value = response.data
  } catch (error) {
    console.error('Error loading applicant data:', error)
  } finally {
    loadingApplicant.value = false
  }
}

const validateCurrentStep = () => {
  stepWarnings.value = {}
  
  // Check if current step has unmet dependencies
  const dependency = stepDependencies[currentStep.value]
  if (dependency) {
    // Check if required step is completed
    if (dependency.requiresStep && !completedSteps.value.has(dependency.requiresStep)) {
      stepWarnings.value[currentStep.value] = dependency.message
      return
    }
    
    // Check if required fields exist
    if (dependency.requiredFields && applicantData.value) {
      const missingFields = dependency.requiredFields.filter(field => {
        // Check both camelCase and snake_case
        const camelCase = field
        const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase()
        return !applicantData.value[camelCase] && !applicantData.value[snakeCase]
      })
      
      if (missingFields.length > 0) {
        stepWarnings.value[currentStep.value] = dependency.message
        return
      }
    }
  }
}

const getStepLabel = (step) => {
  return stepLabels[step] || `Step ${step}`
}

// Steps that have PDF previews (W-4, I-9, Form 8850)
const stepsWithPDF = [1, 2, 6]

// Steps blocked when signature placement not configured (admin-only setting)
const signaturePlacementBlockedSteps = computed(() => {
  const s = templateStatus.value
  const steps = []
  if (!s.w4) steps.push(1)
  if (!s.i9) steps.push(2)
  if (!s['8850']) steps.push(6)
  return steps
})
const signaturePlacementBlockedStepsLabel = computed(() => {
  const labels = []
  if (!templateStatus.value.w4) labels.push('W-4')
  if (!templateStatus.value.i9) labels.push('I-9')
  if (!templateStatus.value['8850']) labels.push('Form 8850')
  return labels.join(', ') || ''
})
function isStepBlockedBySignaturePlacement(step) {
  return signaturePlacementBlockedSteps.value.includes(step)
}

// Check if current step has PDF preview
const hasPDFPreview = computed(() => {
  return stepsWithPDF.includes(currentStep.value)
})

// Get PDF preview URL for current step (computed property removed, now using ref)

// Get PDF preview title
const pdfPreviewTitle = computed(() => {
  if (!hasPDFPreview.value) return ''
  
  const stepLabel = getStepLabel(currentStep.value)
  if (completedSteps.value.has(currentStep.value)) {
    return `${stepLabel} Form (Filled)`
  }
  return `${stepLabel} Form Preview`
})

const getStepStatus = (step) => {
  const isCompleted = completedSteps.value.has(step)
  const isCurrent = currentStep.value === step
  const dependency = stepDependencies[step]
  let hasWarning = false
  let warningMessage = ''
  
  // Check for warnings on this step
  if (stepWarnings.value[step]) {
    hasWarning = true
    warningMessage = stepWarnings.value[step]
  } else if (dependency && !isCompleted) {
    // Check if prerequisites are met
    if (dependency.requiresStep && !completedSteps.value.has(dependency.requiresStep)) {
      hasWarning = true
      warningMessage = `Complete Step ${dependency.requiresStep} first`
    } else if (dependency.requiredFields && applicantData.value) {
      const missingFields = dependency.requiredFields.filter(field => {
        // Check both camelCase and snake_case
        const camelCase = field
        const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase()
        return !applicantData.value[camelCase] && !applicantData.value[snakeCase]
      })
      if (missingFields.length > 0) {
        hasWarning = true
        warningMessage = 'Missing required information'
      }
    }
  }
  
  if (isCompleted) {
    return { status: 'completed', hasWarning, warningMessage }
  } else if (isCurrent) {
    return { status: 'current', hasWarning, warningMessage }
  } else {
    return { status: 'pending', hasWarning, warningMessage }
  }
}

const navigateToStep = async (step) => {
  if (isStepBlockedBySignaturePlacement(step)) {
    return
  }
  // Validate prerequisites before navigating
  const dependency = stepDependencies[step]
  
  if (dependency) {
    // Check if required step is completed
    if (dependency.requiresStep && !completedSteps.value.has(dependency.requiresStep)) {
      // Show confirmation dialog
      if (confirm(`Step ${step} requires completing Step ${dependency.requiresStep} first. Would you like to go to Step ${dependency.requiresStep} instead?`)) {
        currentStep.value = dependency.requiresStep
        validateCurrentStep()
        return
      }
      return
    }
    
    // Check if required fields exist
    if (dependency.requiredFields && applicantData.value) {
      const missingFields = dependency.requiredFields.filter(field => {
        // Check both camelCase and snake_case
        const camelCase = field
        const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase()
        return !applicantData.value[camelCase] && !applicantData.value[snakeCase]
      })
      
      if (missingFields.length > 0) {
        if (confirm(dependency.message + ' Would you like to go to Step 1 to complete this information?')) {
          currentStep.value = 1
          validateCurrentStep()
          return
        }
        return
      }
    }
  }
  
  // Navigate to step
  currentStep.value = step
  validateCurrentStep()

  // Update PDF preview for new step
  updatePreviewForStep(step)
}

const updatePreviewForStep = (step) => {
  // Clear previous preview and error state
  if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
  }
  pdfPreviewUrl.value = null
  currentFormData.value = null
  previewError.value = null
  
  // Check if step has a completed submission
  if (hasPDFPreview.value) {
    const submission = submissions.value.find(s => s.stepNumber === step)
    if (submission && submission.id) {
      pdfPreviewUrl.value = `/api/forms/submissions/${submission.id}/view`
    }
    // Don't generate preview on step change - wait for form data changes
  }
}

const navigateToRequiredStep = () => {
  const dependency = stepDependencies[currentStep.value]
  if (dependency?.requiresStep) {
    currentStep.value = dependency.requiresStep
  } else {
    currentStep.value = 1
  }
  validateCurrentStep()
}

const handleFormDataChange = (formData) => {
  // Store current form data
  currentFormData.value = formData
  if (formData.signatureData) {
    sessionSignature.value = formData.signatureData
  }

  // Only generate preview for steps with PDFs
  if (!hasPDFPreview.value) {
    return
  }
  
  // Check if step is already completed - if so, use submission PDF
  const submission = submissions.value.find(s => s.stepNumber === currentStep.value)
  if (submission && submission.id) {
    pdfPreviewUrl.value = `/api/forms/submissions/${submission.id}/view`
    return
  }
  
  // Debounce preview generation to avoid too many API calls
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer)
  }
  
  previewDebounceTimer = setTimeout(() => {
    generatePreview(formData)
  }, 500) // 500ms debounce
}

const generatePreview = async (formData) => {
  if (!hasPDFPreview.value || !formData) {
    return
  }
  
  // Clear any previous error
  previewError.value = null
  
  // Check if step already has a submission - use that instead
  const submission = submissions.value.find(s => s.stepNumber === currentStep.value)
  if (submission && submission.id) {
    // Revoke blob URL if it exists
    if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
    }
    pdfPreviewUrl.value = `/api/forms/submissions/${submission.id}/view`
    return
  }
  
  // Don't generate preview until ALL legally required fields are filled
  const allRequiredFilled = validateAllRequiredFieldsForPreview(formData, currentStep.value)
  if (!allRequiredFilled) {
    // Don't generate preview until required fields are complete
    // Clear any existing preview
    if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
    }
    pdfPreviewUrl.value = null
    return
  }
  
  generatingPreview.value = true

  const formDataWithSignature = { ...formData }
  if (stepsWithPDF.includes(currentStep.value) && sessionSignature.value && !formDataWithSignature.signatureData) {
    formDataWithSignature.signatureData = sessionSignature.value
  }
  
  try {
    let response
    try {
      response = await api.post(
        `/forms/preview/${currentStep.value}`,
        { formData: formDataWithSignature },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          },
          // Prevent axios from rejecting on error status codes
          validateStatus: (status) => status < 500
        }
      )
    } catch (axiosError) {
      // Network error or 500+ server error
      if (axiosError.response) {
        // Server responded with 500+ error - try to read error message
        let errorMessage = 'Server error generating preview'
        if (axiosError.response.data instanceof Blob) {
          try {
            const text = await axiosError.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch (e) {
            errorMessage = `Server error (${axiosError.response.status})`
          }
        }
        throw new Error(errorMessage)
      }
      // Network or other error
      throw new Error(axiosError.message || 'Network error - unable to generate preview')
    }
    
    // Check if response is an error (4xx status)
    if (response.status >= 400) {
      let errorMessage = 'Failed to generate preview'
      // Response data is a blob, try to read it as text
      if (response.data instanceof Blob) {
        try {
          const text = await response.data.text()
          const errorData = JSON.parse(text)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          errorMessage = `Error (${response.status})`
        }
      }
      throw new Error(errorMessage)
    }
    
    // Verify we got valid response data
    if (!response.data) {
      throw new Error('Empty response from server')
    }
    
    // Verify we got a blob with content
    if (!(response.data instanceof Blob) || response.data.size === 0) {
      throw new Error('Invalid or empty PDF response')
    }
    
    // Check the content type - if it's JSON, it's likely an error response
    const contentType = response.headers['content-type'] || response.data.type || ''
    
    // If response is JSON (error response disguised as success), parse and throw
    if (contentType.includes('application/json')) {
      const text = await response.data.text()
      const errorData = JSON.parse(text)
      throw new Error(errorData.error || errorData.message || 'Server returned an error')
    }
    
    // Verify it looks like a PDF by checking magic bytes
    const arrayBuffer = await response.data.slice(0, 5).arrayBuffer()
    const header = new Uint8Array(arrayBuffer)
    const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D] // %PDF-
    const isPDF = pdfMagic.every((byte, i) => header[i] === byte)
    
    if (!isPDF) {
      // Not a valid PDF - might be an error response
      const text = await response.data.text()
      if (text.startsWith('{')) {
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || errorData.message || 'Invalid PDF response')
        } catch (e) {
          if (e.message.includes('Invalid PDF')) throw e
          throw new Error('Server did not return a valid PDF')
        }
      }
      throw new Error('Server did not return a valid PDF document')
    }
    
    // Create blob URL for the PDF
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    // Revoke previous URL to prevent memory leaks
    if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
    }
    
    pdfPreviewUrl.value = url
    previewError.value = null
  } catch (error) {
    console.error('Error generating preview:', error)
    console.error('Error details:', error.response?.data || error.message)
    
    // Set error message for user feedback
    previewError.value = error.message || 'Failed to generate preview'
    
    // Clear preview URL on error so user sees placeholder with error
    if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
    }
    pdfPreviewUrl.value = null
  } finally {
    generatingPreview.value = false
  }
}

// Validate that ALL legally required fields are filled before showing document preview
const validateAllRequiredFieldsForPreview = (formData, step) => {
  if (!formData) return false

  switch (step) {
    case 1: { // W-4 - all required fields for PDF
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      const stateValid = formData.state && formData.state.length === 2
      const zipValid = formData.zipCode && /^\d{5}(-\d{4})?$/.test(formData.zipCode)
      return !!(
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        ssnValid &&
        formData.dateOfBirth &&
        formData.address &&
        formData.city &&
        stateValid &&
        zipValid &&
        formData.filingStatus
      )
    }
    case 2: { // I-9 - document choice + all required fields
      if (!formData.firstName || !formData.lastName || !formData.authorizationType) return false
      // List A path
      if (formData.listADocument) {
        return true
      }
      // List B + List C path
      if (formData.listBDocument && formData.listCDocument) {
        const hasListBNumber = !!formData.listBDocumentNumber
        const hasListBAuthority = !!formData.listBIssuingAuthority
        const hasListCNumber = !!formData.listCDocumentNumber
        return hasListBNumber && hasListBAuthority && hasListCNumber
      }
      return false
    }
    case 6: { // 8850 - SSN, email, county
      const ssnValid = formData.ssn && /^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)
      return !!(formData.firstName && formData.lastName && ssnValid && formData.email && formData.county)
    }
    default:
      return false
  }
}

const handleStepComplete = async (step) => {
  // Reload progress to get updated submissions for PDF preview
  await loadProgress()
  
  // Mark step as completed
  completedSteps.value.add(step)
  
  // Reload progress to get updated data
  await loadProgress()
  await loadApplicantData()
  
  // Update PDF preview to show submitted version
  const submission = submissions.value.find(s => s.stepNumber === step)
  if (submission && submission.id) {
    // Revoke blob URL if it exists
    if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
    }
    pdfPreviewUrl.value = `/api/forms/submissions/${submission.id}/view`
  }
  
  // Move to next step
  if (step < 6) {
    currentStep.value = step + 1
    validateCurrentStep()
    // Clear preview when moving to next step
    if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl.value)
    }
    pdfPreviewUrl.value = null
    currentFormData.value = null
  } else {
    // Step 6 completed - check if admin and password setup required
    if (authStore.isAdmin) {
      try {
        const passwordStatus = await api.get('/auth/password-status')
        if (passwordStatus.data.requiresPassword) {
          router.push('/password-setup')
          return
        }
      } catch (error) {
        // If check fails, continue to dashboard
        console.error('Failed to check password status:', error)
      }
    }
    router.push('/dashboard')
  }
}

const handlePreviewError = (event) => {
  console.error('PDF preview iframe error:', event)
  // Set error message for user feedback
  previewError.value = 'Failed to load PDF document in browser'
  // Clear the preview URL on iframe error
  if (pdfPreviewUrl.value && pdfPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pdfPreviewUrl.value)
  }
  pdfPreviewUrl.value = null
}

const retryPreview = () => {
  // Clear error state
  previewError.value = null
  // Re-generate preview with current form data
  if (currentFormData.value) {
    generatePreview(currentFormData.value)
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
