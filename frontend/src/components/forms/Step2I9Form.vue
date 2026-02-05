<template>
  <div>
    <!-- I-9 Disclaimer -->
    <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r">
      <h3 class="text-sm font-semibold text-gray-900 mb-2">Federal Form I-9 - Employment Eligibility Verification</h3>
      <p class="text-xs text-gray-700 mb-2">
        <strong>START HERE:</strong> Read instructions carefully before completing this form. The instructions must be 
        available, either in paper or electronically, during the completion of this form. 
        <strong>Employers are liable for errors in the completion of this form.</strong>
      </p>
      <p class="text-xs text-gray-700 mb-2">
        <strong>ANTI-DISCRIMINATION NOTICE:</strong> It is illegal to discriminate against work-authorized individuals. 
        Employers CANNOT specify which document(s) an employee may present to establish employment authorization and identity. 
        The refusal to hire or continue to employ an individual because the documentation presented has a future expiration 
        date may also constitute illegal discrimination.
      </p>
      <p class="text-xs text-gray-700">
        <strong>Section 1. Employee Information and Attestation:</strong> Employees must complete and sign Section 1 
        of Form I-9 no later than the first day of employment, but not before accepting a job offer. 
        Please note this is auto-completed based upon your answers above.
      </p>
    </div>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Step 2: Form I-9 Employment Eligibility</h2>
        
        <div class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
          <p class="text-sm text-blue-800">
            <strong>Auto-population:</strong> Your name was entered during signup and will be automatically filled in. 
            These fields are locked to ensure consistency across all forms.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              First Name <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.firstName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.firstName"
              type="text"
              required
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Your middle name or middle initial (if applicable). This is optional.
                </span>
              </span>
            </label>
            <input
              v-model="formData.middleName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span class="text-red-500">*</span>
              <span class="ml-1 text-xs text-red-600">(Required)</span>
              <span v-if="formData.lastName" class="ml-1 text-xs text-green-600">(Auto-filled)</span>
            </label>
            <input
              v-model="formData.lastName"
              type="text"
              required
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">Pre-filled from signup - cannot be changed</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Other Last Names Used
              <span class="ml-1 relative group">
                <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Enter any other last names you have used (maiden name, previous married name, etc.). Leave blank if not applicable.
                </span>
              </span>
            </label>
            <input
              v-model="formData.otherLastNames"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Employment Authorization</h3>
          <p class="text-sm text-gray-600 mb-4">
            I attest, under penalty of perjury, that I am (check one):
          </p>
          <p class="text-xs text-red-600 mb-4">
            <strong>I am aware that federal law provides for imprisonment and/or fines for false statements or use of 
            false documents in connection with the completion of this form.</strong>
          </p>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                v-model="formData.authorizationType"
                type="radio"
                value="citizen"
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>1. A citizen of the United States</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.authorizationType"
                type="radio"
                value="national"
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>2. A noncitizen national of the United States (See instructions)</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.authorizationType"
                type="radio"
                value="permanent"
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>3. A lawful permanent resident (Alien Registration Number/USCIS Number):</span>
            </label>
            <div v-if="formData.authorizationType === 'permanent'" class="ml-6 mt-2">
              <input
                v-model="formData.alienNumber"
                type="text"
                placeholder="Alien Registration Number"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <label class="flex items-center">
              <input
                v-model="formData.authorizationType"
                type="radio"
                value="alien"
                class="mr-2 text-primary focus:ring-primary"
              />
              <span>4. An Alien Authorized to work until expiration date listed below (if applicable)</span>
            </label>
            <div v-if="formData.authorizationType === 'alien'" class="ml-6 mt-2 space-y-2">
              <input
                v-model="formData.expirationDate"
                type="date"
                placeholder="Expiration Date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <p class="text-xs text-gray-600 mb-2">
                Aliens authorized to work must provide only one of the following document numbers to complete Form I-9: 
                An Alien Registration Number/USCIS Number OR Form I-94 Admission Number OR Foreign Passport Number.
              </p>
              <select
                v-model="formData.alienDocumentType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary mb-2"
              >
                <option value="">Select document type</option>
                <option value="alien-registration">Alien Registration Number/USCIS Number</option>
                <option value="i94">Form I-94 Admission Number</option>
                <option value="foreign-passport">Foreign Passport Number</option>
              </select>
              <input
                v-if="formData.alienDocumentType"
                v-model="formData.alienNumber"
                type="text"
                :placeholder="getAlienPlaceholder()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <input
                v-if="formData.alienDocumentType === 'foreign-passport'"
                v-model="formData.countryOfIssuance"
                type="text"
                placeholder="Country of Issuance"
                class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Identity Documents
            <span class="ml-1 relative group">
              <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="absolute left-0 bottom-full mb-2 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                Federal law requires you to prove your identity and work authorization. You can do this with either one document (like a passport) or two documents (like a driver's license plus a Social Security card).
              </span>
            </span>
          </h3>
          
          <!-- Error Message (only show on substep 2) -->
          <div v-if="documentValidationError && identitySubstep === 2" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-800">{{ documentValidationError }}</p>
          </div>
          
          <!-- ========== SUBSTEP 2a: CHOOSE YOUR DOCUMENTS ========== -->
          <div v-if="identitySubstep === 1" class="space-y-6">
            <p class="text-sm text-gray-700 font-medium">
              Choose how you'll verify your identity and work authorization:
            </p>
            
            <!-- Option Tiles - Click to proceed directly -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Option 1: One Document -->
              <button
                type="button"
                @click="selectAndProceed('listA')"
                class="p-5 border-2 border-gray-200 rounded-xl text-left transition-all hover:border-green-400 hover:bg-green-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 group"
              >
                <div class="flex items-start">
                  <div class="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center text-lg font-bold mr-4 flex-shrink-0 group-hover:bg-green-600 transition-colors">
                    1
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center mb-1">
                      <h4 class="font-semibold text-gray-900 text-lg">One Document</h4>
                      <span class="ml-2 relative group/tip">
                        <svg class="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none">
                          Official name: "List A" documents. These prove both your identity and work authorization in one document.
                        </span>
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">
                      Proves both identity AND work authorization
                    </p>
                    <p class="text-xs text-gray-500">
                      US Passport, Passport Card, Employment Authorization Card
                    </p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-green-500 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <!-- Option 2: Two Documents -->
              <button
                type="button"
                @click="selectAndProceed('listBC')"
                class="p-5 border-2 border-gray-200 rounded-xl text-left transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
              >
                <div class="flex items-start">
                  <div class="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center text-lg font-bold mr-4 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                    2
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center mb-1">
                      <h4 class="font-semibold text-gray-900 text-lg">Two Documents</h4>
                      <span class="ml-2 relative group/tip">
                        <svg class="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none">
                          Official names: "List B" (identity) + "List C" (work authorization). Most common for first-time employees.
                        </span>
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">
                      One for identity + one for work authorization
                    </p>
                    <p class="text-xs text-gray-500">
                      Driver's License + Social Security Card
                    </p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
            
            <!-- "Not sure?" Helper Section -->
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                @click="helperExpanded = !helperExpanded"
                class="w-full px-4 py-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center">
                  <svg class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium text-gray-700">Not sure which option to choose?</span>
                </div>
                <svg :class="['h-5 w-5 text-gray-500 transition-transform', helperExpanded ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div v-if="helperExpanded" class="p-4 bg-white border-t border-gray-200">
                <p class="text-sm text-gray-600 mb-4">Answer these quick questions to find the right option for you:</p>
                
                <!-- Question 1 -->
                <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p class="text-sm font-medium text-gray-700 mb-2">Do you have a US Passport or US Passport Card?</p>
                  <div class="flex space-x-3">
                    <button
                      type="button"
                      @click="helperQ1 = true"
                      :class="[
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        helperQ1 === true 
                          ? 'bg-green-500 text-white' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      ]"
                    >Yes</button>
                    <button
                      type="button"
                      @click="helperQ1 = false"
                      :class="[
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        helperQ1 === false 
                          ? 'bg-gray-500 text-white' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      ]"
                    >No</button>
                  </div>
                </div>
                
                <!-- Suggestion for Q1 = Yes -->
                <div v-if="helperQ1 === true" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-green-800">Great! You can use "One Document"</p>
                      <p class="text-xs text-green-700 mt-1">Your passport proves both your identity and work authorization.</p>
                      <button
                        type="button"
                        @click="selectAndProceed('listA'); helperExpanded = false"
                        class="mt-2 px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                      >Select "One Document"</button>
                    </div>
                  </div>
                </div>
                
                <!-- Question 2 (only if Q1 = No) -->
                <div v-if="helperQ1 === false" class="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p class="text-sm font-medium text-gray-700 mb-2">Do you have a Driver's License (or State ID) AND a Social Security Card?</p>
                  <div class="flex space-x-3">
                    <button
                      type="button"
                      @click="helperQ2 = true"
                      :class="[
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        helperQ2 === true 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      ]"
                    >Yes, I have both</button>
                    <button
                      type="button"
                      @click="helperQ2 = false"
                      :class="[
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        helperQ2 === false 
                          ? 'bg-gray-500 text-white' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      ]"
                    >No</button>
                  </div>
                </div>
                
                <!-- Suggestion for Q2 = Yes -->
                <div v-if="helperQ1 === false && helperQ2 === true" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-blue-800">Perfect! You should use "Two Documents"</p>
                      <p class="text-xs text-blue-700 mt-1">This is the most common option for first-time employees.</p>
                      <button
                        type="button"
                        @click="selectAndProceed('listBC'); helperExpanded = false"
                        class="mt-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >Select "Two Documents"</button>
                    </div>
                  </div>
                </div>
                
                <!-- Neither option works -->
                <div v-if="helperQ1 === false && helperQ2 === false" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-start">
                    <svg class="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-yellow-800">You'll need to gather your documents</p>
                      <p class="text-xs text-yellow-700 mt-1">
                        You need either: (1) A US Passport or similar document, OR (2) An ID document (like a driver's license, state ID, or school ID) plus a work authorization document (like a Social Security card or birth certificate).
                      </p>
                      <p class="text-xs text-yellow-700 mt-2">
                        <span class="font-medium">Tip:</span> If you're a first-time employee, a school ID with photo can work as your identity document.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- ========== SUBSTEP 2b: DOCUMENT DETAILS & UPLOAD ========== -->
          <div v-if="identitySubstep === 2" class="space-y-4">
            <!-- Switch Option Link -->
            <div class="flex items-center justify-between mb-4">
              <button
                type="button"
                @click="identitySubstep = 1"
                class="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to document selection
              </button>
              <button
                type="button"
                @click="switchDocumentOption"
                class="text-sm text-primary hover:text-primary-light underline"
              >
                {{ documentOption === 'listA' ? 'Using two documents instead? Click here' : 'Using one document instead? Click here' }}
              </button>
            </div>
            
            <!-- ===== LIST A: ONE DOCUMENT FORM ===== -->
            <div v-if="documentOption === 'listA'" class="border rounded-lg p-4 bg-green-50 border-green-300">
              <h4 class="font-semibold text-gray-900 flex items-center mb-4">
                <div class="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold mr-2">1</div>
                Select Your Document
                <span class="ml-1 relative group">
                  <svg class="inline h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Official name: "List A" documents. Hover over each option for more info.
                  </span>
                </span>
              </h4>
              
              <select
                v-model="formData.listADocument"
                @change="handleListAChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Choose your document...</option>
                <option value="passport" title="A valid, unexpired US Passport book or card. This is the most common List A document.">US Passport or US Passport Card</option>
                <option value="foreign-passport" title="A foreign passport with a temporary I-551 stamp or I-551 printed notation.">Foreign Passport with temporary I-551 stamp</option>
                <option value="i766" title="Form I-766, the Employment Authorization Document card issued by USCIS with a photo.">Employment Authorization Document (Form I-766)</option>
                <option value="micronesia" title="A passport from the Federated States of Micronesia or the Republic of the Marshall Islands with Form I-94.">Passport from Federated States of Micronesia</option>
                <option value="nonimmigrant" title="Foreign passport with Form I-94/I-94A containing an endorsement for work authorization.">Non-immigrant alien work authorization</option>
              </select>
              
              <!-- List A document details (dynamic entry on top of upload) -->
              <div v-if="formData.listADocument" class="mt-4 space-y-3">
                <div class="bg-white p-4 rounded border border-green-200">
                  <p class="text-sm font-medium text-gray-700 mb-3">Document details</p>
                  <div class="space-y-2">
                    <input
                      v-model="formData.listADocumentNumber"
                      type="text"
                      :placeholder="getListADocumentNumberPlaceholder()"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <input
                      v-model="formData.listAIssuingAuthority"
                      type="text"
                      placeholder="Issuing authority (e.g., U.S. Department of State)"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <input
                      v-model="formData.listAExpiration"
                      type="date"
                      placeholder="Expiration date (if any)"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
              
              <!-- File Upload for List A -->
              <div v-if="formData.listADocument" class="mt-4 bg-white p-4 rounded border border-green-300">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Document <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center space-x-4">
                  <input
                    ref="listAFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    @change="handleFileUpload('listA', $event)"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="$refs.listAFileInput.click()"
                    :disabled="uploading.listA"
                    class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {{ uploading.listA ? 'Uploading...' : (uploadedDocuments.listA ? 'Change File' : 'Choose File') }}
                  </button>
                  <span v-if="uploadedDocuments.listA" class="text-sm text-gray-600">
                    ✓ {{ uploadedDocuments.listA }}
                  </span>
                  <span v-else class="text-sm text-gray-500">
                    PDF, JPG, or PNG (max 10MB)
                  </span>
                </div>
                <p v-if="uploadError.listA" class="mt-2 text-xs text-red-600">{{ uploadError.listA }}</p>
              </div>
            </div>
            
            <!-- ===== LIST B + C: TWO DOCUMENTS FORM ===== -->
            <div v-if="documentOption === 'listBC'" class="space-y-4">
              
              <!-- Quick Pick: Most Common Combination -->
              <div v-if="!formData.listBDocument && !formData.listCDocument" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start">
                  <svg class="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-blue-900 mb-2">Quick pick: Most people use these documents</p>
                    <button
                      type="button"
                      @click="quickPickCommon"
                      class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Driver's License + Social Security Card
                    </button>
                    <p class="text-xs text-blue-700 mt-2">Or choose your documents below</p>
                  </div>
                </div>
              </div>
              
              <!-- Two Document Selection Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- Document 1: Identity -->
                <div :class="[
                  'border-2 rounded-xl p-4 transition-all',
                  formData.listBDocument ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                ]">
                  <div class="flex items-center mb-3">
                    <div :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mr-3',
                      formData.listBDocument ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    ]">1</div>
                    <div>
                      <h4 class="font-semibold text-gray-900">Identity Document</h4>
                      <p class="text-xs text-gray-500">Proves who you are</p>
                    </div>
                    <svg v-if="formData.listBDocument" class="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  
                  <!-- Quick Pick Buttons for List B -->
                  <div v-if="!formData.listBDocument" class="space-y-2 mb-3">
                    <button
                      type="button"
                      @click="formData.listBDocument = 'drivers-license'"
                      class="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                    >
                      <span class="font-medium text-gray-900 group-hover:text-blue-700">Driver's License</span>
                      <span class="text-xs text-gray-500 block">Most common choice</span>
                    </button>
                    <button
                      type="button"
                      @click="formData.listBDocument = 'state-id'"
                      class="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                    >
                      <span class="font-medium text-gray-900 group-hover:text-blue-700">State ID Card</span>
                      <span class="text-xs text-gray-500 block">If you don't have a driver's license</span>
                    </button>
                    <button
                      type="button"
                      @click="formData.listBDocument = 'school-id'"
                      class="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                    >
                      <span class="font-medium text-gray-900 group-hover:text-blue-700">School ID Card</span>
                      <span class="text-xs text-gray-500 block">Great for first-time employees</span>
                    </button>
                    
                    <!-- More options dropdown -->
                    <details class="group">
                      <summary class="text-sm text-blue-600 cursor-pointer hover:text-blue-800 py-2">
                        More options...
                      </summary>
                      <div class="mt-2 space-y-2">
                        <button type="button" @click="formData.listBDocument = 'voter'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">Voter's Registration Card</button>
                        <button type="button" @click="formData.listBDocument = 'military'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">US Military Card</button>
                        <button type="button" @click="formData.listBDocument = 'tribal'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">Native American Tribal Document</button>
                        <button type="button" @click="formData.listBDocument = 'canadian'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">Canadian Driver's License</button>
                      </div>
                    </details>
                  </div>
                  
                  <!-- Selected Document Display -->
                  <div v-if="formData.listBDocument" class="space-y-3">
                    <div class="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                      <span class="text-sm font-medium text-gray-900">{{ getListBDisplayName(formData.listBDocument) }}</span>
                      <button type="button" @click="clearListB" class="text-xs text-blue-600 hover:text-blue-800">Change</button>
                    </div>
                    
                    <!-- List B Details -->
                    <div class="space-y-2">
                      <input
                        v-model="formData.listBDocumentNumber"
                        type="text"
                        placeholder="Document number"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        v-model="formData.listBIssuingAuthority"
                        type="text"
                        placeholder="Issuing authority (e.g., California)"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        v-model="formData.listBExpiration"
                        type="date"
                        placeholder="Expiration date (if any)"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <!-- File Upload -->
                    <div class="flex items-center space-x-2">
                      <input ref="listBFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" @change="handleFileUpload('listB', $event)" class="hidden" />
                      <button
                        type="button"
                        @click="$refs.listBFileInput.click()"
                        :disabled="uploading.listB"
                        class="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                      >
                        {{ uploading.listB ? 'Uploading...' : (uploadedDocuments.listB ? '✓ Uploaded' : 'Upload Document') }}
                      </button>
                      <span v-if="uploadedDocuments.listB" class="text-xs text-gray-500 truncate max-w-[100px]">{{ uploadedDocuments.listB }}</span>
                    </div>
                    <p v-if="uploadError.listB" class="text-xs text-red-600">{{ uploadError.listB }}</p>
                  </div>
                </div>
                
                <!-- Document 2: Work Authorization -->
                <div :class="[
                  'border-2 rounded-xl p-4 transition-all',
                  formData.listCDocument ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'
                ]">
                  <div class="flex items-center mb-3">
                    <div :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mr-3',
                      formData.listCDocument ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                    ]">2</div>
                    <div>
                      <h4 class="font-semibold text-gray-900">Work Authorization</h4>
                      <p class="text-xs text-gray-500">Proves you can work in the US</p>
                    </div>
                    <svg v-if="formData.listCDocument" class="w-5 h-5 text-purple-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  
                  <!-- Quick Pick Buttons for List C -->
                  <div v-if="!formData.listCDocument" class="space-y-2 mb-3">
                    <button
                      type="button"
                      @click="formData.listCDocument = 'ssn-card'"
                      class="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                    >
                      <span class="font-medium text-gray-900 group-hover:text-purple-700">Social Security Card</span>
                      <span class="text-xs text-gray-500 block">Most common choice</span>
                    </button>
                    <button
                      type="button"
                      @click="formData.listCDocument = 'birth-certificate'"
                      class="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                    >
                      <span class="font-medium text-gray-900 group-hover:text-purple-700">Birth Certificate</span>
                      <span class="text-xs text-gray-500 block">US state-certified copy</span>
                    </button>
                    
                    <!-- More options dropdown -->
                    <details class="group">
                      <summary class="text-sm text-purple-600 cursor-pointer hover:text-purple-800 py-2">
                        More options...
                      </summary>
                      <div class="mt-2 space-y-2">
                        <button type="button" @click="formData.listCDocument = 'tribal'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">Native American Tribal Document</button>
                        <button type="button" @click="formData.listCDocument = 'citizen-id'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">US Citizen ID Card (Form I-197)</button>
                        <button type="button" @click="formData.listCDocument = 'ead'" class="w-full p-2 text-left text-sm border border-gray-200 rounded hover:bg-gray-50">Employment Authorization Document (DHS)</button>
                      </div>
                    </details>
                  </div>
                  
                  <!-- Selected Document Display -->
                  <div v-if="formData.listCDocument" class="space-y-3">
                    <div class="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                      <span class="text-sm font-medium text-gray-900">{{ getListCDisplayName(formData.listCDocument) }}</span>
                      <button type="button" @click="clearListC" class="text-xs text-purple-600 hover:text-purple-800">Change</button>
                    </div>
                    
                    <!-- List C Details -->
                    <div class="space-y-2">
                      <input
                        :value="formData.listCDocumentNumber"
                        type="text"
                        :placeholder="formData.listCDocument === 'ssn-card' ? 'Social Security Number (XXX-XX-XXXX)' : 'Document number'"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        @input="onListCDocumentNumberInput"
                      />
                      <p v-if="formData.listCDocument === 'ssn-card'" class="text-xs text-gray-500">Issuing Authority: Social Security Administration</p>
                    </div>
                    
                    <!-- File Upload -->
                    <div class="flex items-center space-x-2">
                      <input ref="listCFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" @change="handleFileUpload('listC', $event)" class="hidden" />
                      <button
                        type="button"
                        @click="$refs.listCFileInput.click()"
                        :disabled="uploading.listC"
                        class="flex-1 px-3 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
                      >
                        {{ uploading.listC ? 'Uploading...' : (uploadedDocuments.listC ? '✓ Uploaded' : 'Upload Document') }}
                      </button>
                      <span v-if="uploadedDocuments.listC" class="text-xs text-gray-500 truncate max-w-[100px]">{{ uploadedDocuments.listC }}</span>
                    </div>
                    <p v-if="uploadError.listC" class="text-xs text-red-600">{{ uploadError.listC }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Help Section -->
              <div v-if="!formData.listBDocument || !formData.listCDocument" class="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  @click="twoDocHelperExpanded = !twoDocHelperExpanded"
                  class="w-full px-4 py-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div class="flex items-center">
                    <svg class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="font-medium text-gray-700">Not sure what to pick?</span>
                  </div>
                  <svg :class="['h-5 w-5 text-gray-500 transition-transform', twoDocHelperExpanded ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div v-if="twoDocHelperExpanded" class="p-4 bg-white border-t border-gray-200 text-sm text-gray-600 space-y-3">
                  <div class="flex items-start">
                    <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">1</span>
                    <div>
                      <p class="font-medium text-gray-900">Identity Document</p>
                      <p class="text-xs">Any government-issued photo ID works. Most people use their <strong>driver's license</strong>. Don't have one? A <strong>state ID</strong> or <strong>school ID with photo</strong> works too!</p>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">2</span>
                    <div>
                      <p class="font-medium text-gray-900">Work Authorization</p>
                      <p class="text-xs">This proves you can legally work in the US. Most people use their <strong>Social Security card</strong>. A <strong>birth certificate</strong> also works if you were born in the US.</p>
                    </div>
                  </div>
                  <div class="p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p class="text-xs text-yellow-800"><strong>Tip:</strong> If this is your first job and you don't have a driver's license, use your school ID + Social Security card!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Collapsible Legal Requirements Box -->
            <div class="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                @click="legalExpanded = !legalExpanded"
                class="w-full px-4 py-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center">
                  <svg class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="font-medium text-gray-700">View legal requirements</span>
                </div>
                <svg :class="['h-5 w-5 text-gray-500 transition-transform', legalExpanded ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div v-if="legalExpanded" class="p-4 bg-white border-t border-gray-200">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">I-9 Document Requirements (Legal Information)</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
                  <div>
                    <div class="flex items-center mb-1">
                      <div class="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mr-2">A</div>
                      <strong>List A</strong>
                    </div>
                    <p class="text-gray-600">Establishes both identity AND employment authorization</p>
                    <ul class="mt-1 space-y-0.5 text-gray-600">
                      <li>• US Passport</li>
                      <li>• Employment Auth (I-766)</li>
                      <li>• Foreign Passport + I-551</li>
                    </ul>
                  </div>
                  <div>
                    <div class="flex items-center mb-1">
                      <div class="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-2">B</div>
                      <strong>List B</strong>
                    </div>
                    <p class="text-gray-600">Establishes identity ONLY (must pair with List C)</p>
                    <ul class="mt-1 space-y-0.5 text-gray-600">
                      <li>• Driver's License</li>
                      <li>• State ID Card</li>
                      <li>• School ID Card</li>
                    </ul>
                  </div>
                  <div>
                    <div class="flex items-center mb-1">
                      <div class="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mr-2">C</div>
                      <strong>List C</strong>
                    </div>
                    <p class="text-gray-600">Establishes employment authorization ONLY (must pair with List B)</p>
                    <ul class="mt-1 space-y-0.5 text-gray-600">
                      <li>• Social Security Card</li>
                      <li>• Birth Certificate</li>
                      <li>• Employment Auth (DHS)</li>
                    </ul>
                  </div>
                </div>
                <p class="mt-3 text-xs text-gray-600 border-t border-gray-300 pt-3">
                  <strong>Federal Requirement:</strong> You must provide either (1) one List A document, OR (2) one List B document AND one List C document. 
                  Employers cannot specify which documents you present, and all documents must be original and unexpired (unless the document has no expiration date).
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-6 p-4 bg-gray-50 rounded-md">
          <p class="text-xs text-gray-700">
            <strong>Preparer and/or Translator Certification:</strong> Check one:
          </p>
          <div class="mt-2 space-y-2">
            <label class="flex items-center">
              <input
                v-model="formData.usingPreparer"
                type="radio"
                :value="false"
                class="mr-2 text-primary focus:ring-primary"
              />
              <span class="text-sm">I am NOT using a preparer or a translator to help me fill out this document</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="formData.usingPreparer"
                type="radio"
                :value="true"
                class="mr-2 text-primary focus:ring-primary"
              />
              <span class="text-sm">A preparer(s) and/or translator(s) is assisting the employee in completing this document.</span>
            </label>
          </div>
          
          <div v-if="formData.usingPreparer" class="mt-4 space-y-3">
            <p class="text-xs text-gray-700">
              <strong>Fields below must be completed and signed when preparers and/or translators assist an employee in completing Section 1</strong>
            </p>
            <p class="text-xs text-gray-700 italic">
              I attest, under penalty of perjury, that I have assisted in the completion of Section 1 of this form and that 
              to the best of my knowledge the information is true and correct.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                v-model="formData.preparerFirstName"
                type="text"
                placeholder="Preparer First Name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <input
                v-model="formData.preparerLastName"
                type="text"
                placeholder="Preparer Last Name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <input
                v-model="formData.preparerAddress"
                type="text"
                placeholder="Preparer Address"
                class="w-full md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <input
                v-model="formData.preparerCity"
                type="text"
                placeholder="City"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <input
                v-model="formData.preparerState"
                type="text"
                placeholder="State"
                maxlength="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary uppercase"
              />
              <input
                v-model="formData.preparerZip"
                type="text"
                placeholder="ZIP Code"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
              <input
                v-model="formData.preparerDate"
                type="date"
                placeholder="Today's Date (mm/dd/yyyy)"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <SignaturePad
          :model-value="formData.signatureData"
          @update:model-value="formData.signatureData = $event"
          label="Signature"
          description="Sign above or type your full legal name. This signature will be placed on your I-9 and other forms."
          :required="true"
          :initial-image="formData.signatureData || (sessionSignature || null)"
        />
      </div>
      
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Continue to Step 3</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import api from '../../services/api.js'
import { useFormDraft } from '../../composables/useFormDraft.js'
import { useApplicantData } from '../../composables/useApplicantData.js'
import { formatSSN as formatSSNUtil, validateSSN } from '../../utils/validation.js'
import { getSSNCookie } from '../../utils/cookies.js'
import SignaturePad from '../ui/SignaturePad.vue'

const props = defineProps({
  sessionSignature: { type: String, default: null }
})
const emit = defineEmits(['submitted', 'form-data-change'])
const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  otherLastNames: '',
  ssn: '', // Required for I-9 Section 1; loaded from cookie (collected in Step 1)
  authorizationType: 'citizen',
  alienNumber: '',
  alienDocumentType: '',
  countryOfIssuance: '',
  expirationDate: '',
  listADocument: '',
  listADocumentNumber: '',
  listAIssuingAuthority: '',
  listAExpiration: '',
  listBDocument: '',
  listBDocumentNumber: '',
  listBIssuingAuthority: '',
  listBExpiration: '',
  listCDocument: '',
  listCDocumentNumber: '',
  usingPreparer: false,
  preparerFirstName: '',
  preparerLastName: '',
  preparerAddress: '',
  preparerCity: '',
  preparerState: '',
  preparerZip: '',
  preparerDate: '',
  signatureData: ''
})

const loading = ref(false)
const documentValidationError = ref('')
const documentOption = ref(null) // 'listA' or 'listBC'
const uploadedDocuments = ref({
  listA: null,
  listB: null,
  listC: null
})
const uploadError = ref({
  listA: '',
  listB: '',
  listC: ''
})
const uploading = ref({
  listA: false,
  listB: false,
  listC: false
})

// Identity Documents substep state (1 = choose, 2 = details/upload)
const identitySubstep = ref(1)
// Collapsible legal requirements box
const legalExpanded = ref(false)
// "Not sure?" helper state
const helperExpanded = ref(false)
const helperQ1 = ref(null) // null = unanswered, true = yes, false = no
const helperQ2 = ref(null)
// Two document helper state
const twoDocHelperExpanded = ref(false)

// Draft functionality
const { isSaving, lastSaved, saveDraft } = useFormDraft(2, formData)

// Emit form data changes for real-time preview (debounced)
let emitDebounceTimer = null
watch(formData, () => {
  if (emitDebounceTimer) {
    clearTimeout(emitDebounceTimer)
  }
  emitDebounceTimer = setTimeout(() => {
    emit('form-data-change', { ...formData.value })
  }, 300) // 300ms debounce for form data changes
}, { deep: true })

// Load applicant data
onMounted(async () => {
  if (loadingApplicant.value) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  if (applicantData.value) {
    formData.value.firstName = applicantData.value.firstName || ''
    formData.value.lastName = applicantData.value.lastName || ''
  } else {
    try {
      const response = await api.get('/applicants/me')
      formData.value.firstName = response.data.firstName || ''
      formData.value.lastName = response.data.lastName || ''
    } catch (error) {
      console.error('Error loading applicant data:', error)
    }
  }

  // Load middle name from Step 1 draft so I-9 name matches W-4
  try {
    const step1Draft = await api.get('/forms/draft/1')
    if (step1Draft.data.success && step1Draft.data.formData?.middleName) {
      formData.value.middleName = step1Draft.data.formData.middleName
    }
  } catch (error) {
    console.error('Error loading Step 1 draft for middle name:', error)
  }

  // Load SSN from cookie for I-9 Section 1 (SSN is collected in Step 1 W-4, not stored in DB)
  const savedSSN = getSSNCookie()
  if (savedSSN && savedSSN.match(/^\d{3}-\d{2}-\d{4}$/)) {
    formData.value.ssn = savedSSN
  }

  // Set document option and substep based on existing data (draft restoration)
  if (formData.value.listADocument) {
    documentOption.value = 'listA'
    // If document is already selected, go to details substep
    identitySubstep.value = 2
  } else if (formData.value.listBDocument || formData.value.listCDocument) {
    documentOption.value = 'listBC'
    // If documents are already selected, go to details substep
    identitySubstep.value = 2
  }
  
  // Validate documents on mount (in case draft is loaded)
  validateDocuments()
  
  // Load existing uploaded documents
  loadUploadedDocuments()

  nextTick(() => {
    if (!formData.value.signatureData && props.sessionSignature) {
      formData.value.signatureData = props.sessionSignature
    }
  })
})

watch(() => props.sessionSignature, (sig) => {
  if (sig && !formData.value.signatureData) {
    formData.value.signatureData = sig
    emit('form-data-change', { ...formData.value })
  }
})

// Load uploaded documents
const loadUploadedDocuments = async () => {
  try {
    const response = await api.get('/forms/i9/documents')
    response.data.forEach(doc => {
      if (doc.document_category === 'listA') {
        uploadedDocuments.value.listA = doc.file_name
      } else if (doc.document_category === 'listB') {
        uploadedDocuments.value.listB = doc.file_name
      } else if (doc.document_category === 'listC') {
        uploadedDocuments.value.listC = doc.file_name
      }
    })
  } catch (error) {
    console.error('Error loading uploaded documents:', error)
  }
}

// Handle file upload
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

    const response = await api.post('/forms/i9/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    uploadedDocuments.value[documentCategory] = response.data.filename
    uploadError.value[documentCategory] = ''
  } catch (error) {
    console.error('Upload error:', error)
    uploadError.value[documentCategory] = error.response?.data?.error || 'Failed to upload document'
    uploadedDocuments.value[documentCategory] = null
  } finally {
    uploading.value[documentCategory] = false
  }
}

const getListADocumentNumberPlaceholder = () => {
  switch (formData.value.listADocument) {
    case 'passport':
      return 'Passport number'
    case 'foreign-passport':
      return 'Passport number'
    case 'i766':
      return 'USCIS number or document number'
    case 'micronesia':
    case 'nonimmigrant':
      return 'Document number'
    default:
      return 'Document number'
  }
}

const getAlienPlaceholder = () => {
  switch (formData.value.alienDocumentType) {
    case 'alien-registration':
      return 'Alien Registration Number/USCIS Number'
    case 'i94':
      return 'Form I-94 Admission Number'
    case 'foreign-passport':
      return 'Foreign Passport Number'
    default:
      return 'Document Number'
  }
}

// Document Option Selection
const selectDocumentOption = (option) => {
  documentOption.value = option
  
  if (option === 'listA') {
    // Clear List B and C when selecting List A option
    formData.value.listBDocument = ''
    formData.value.listBDocumentNumber = ''
    formData.value.listBIssuingAuthority = ''
    formData.value.listBExpiration = ''
    formData.value.listCDocument = ''
    formData.value.listCDocumentNumber = ''
  } else if (option === 'listBC') {
    // Clear List A and its details when selecting List B+C option
    formData.value.listADocument = ''
    formData.value.listADocumentNumber = ''
    formData.value.listAIssuingAuthority = ''
    formData.value.listAExpiration = ''
  }
  
  documentValidationError.value = ''
  validateDocuments()
}

// Select option AND proceed to substep 2 in one click
const selectAndProceed = (option) => {
  selectDocumentOption(option)
  identitySubstep.value = 2
}

// Go to substep 2 (details/upload) - kept for backward compatibility
const goToSubstep2 = () => {
  if (documentOption.value) {
    identitySubstep.value = 2
  }
}

// Switch document option while staying on substep 2
const switchDocumentOption = () => {
  const newOption = documentOption.value === 'listA' ? 'listBC' : 'listA'
  selectDocumentOption(newOption)
  // Stay on substep 2
  identitySubstep.value = 2
}

// Quick pick common combination (Driver's License + SSN)
const quickPickCommon = () => {
  formData.value.listBDocument = 'drivers-license'
  formData.value.listCDocument = 'ssn-card'
}

// Get display name for List B document
const getListBDisplayName = (value) => {
  const names = {
    'drivers-license': "Driver's License",
    'state-id': 'State ID Card',
    'school-id': 'School ID Card',
    'voter': "Voter's Registration Card",
    'military': 'US Military Card',
    'coast-guard': 'Coast Guard Mariner Card',
    'tribal': 'Tribal Document',
    'canadian': 'Canadian License'
  }
  return names[value] || value
}

// Format List C document number (SSN format when Social Security Card is selected)
const onListCDocumentNumberInput = (e) => {
  const raw = e.target.value
  formData.value.listCDocumentNumber = formData.value.listCDocument === 'ssn-card'
    ? formatSSNUtil(raw)
    : raw
}

// Get display name for List C document
const getListCDisplayName = (value) => {
  const names = {
    'ssn-card': 'Social Security Card',
    'birth-certificate': 'Birth Certificate',
    'tribal': 'Tribal Document',
    'citizen-id': 'US Citizen ID (I-197)',
    'resident-id': 'Resident ID (I-179)',
    'ead': 'Employment Authorization (DHS)'
  }
  return names[value] || value
}

// Clear List B selection
const clearListB = () => {
  formData.value.listBDocument = ''
  formData.value.listBDocumentNumber = ''
  formData.value.listBIssuingAuthority = ''
  formData.value.listBExpiration = ''
}

// Clear List C selection
const clearListC = () => {
  formData.value.listCDocument = ''
  formData.value.listCDocumentNumber = ''
}

// I-9 Document Logic
const handleListAChange = () => {
  if (formData.value.listADocument) {
    documentOption.value = 'listA'
    // Clear List B and List C
    formData.value.listBDocument = ''
    formData.value.listBDocumentNumber = ''
    formData.value.listBIssuingAuthority = ''
    formData.value.listBExpiration = ''
    formData.value.listCDocument = ''
    formData.value.listCDocumentNumber = ''
  } else {
    formData.value.listADocumentNumber = ''
    formData.value.listAIssuingAuthority = ''
    formData.value.listAExpiration = ''
    documentOption.value = null
  }
  documentValidationError.value = ''
  validateDocuments()
}

const handleListBChange = () => {
  if (formData.value.listBDocument) {
    documentOption.value = 'listBC'
  }
  // If List B is cleared, clear List C
  if (!formData.value.listBDocument) {
    formData.value.listCDocument = ''
    formData.value.listCDocumentNumber = ''
  }
  validateDocuments()
}

const handleListCChange = () => {
  if (formData.value.listCDocument) {
    documentOption.value = 'listBC'
  }
  // If List C is selected but List B is not, show error
  if (formData.value.listCDocument && !formData.value.listBDocument) {
    documentValidationError.value = 'List C requires a List B document. Please select a List B document first.'
  } else {
    documentValidationError.value = ''
  }
  validateDocuments()
}

const validateDocuments = () => {
  documentValidationError.value = ''
  
  // If no option is selected yet, that's okay (user is still choosing)
  if (!documentOption.value) {
    return true
  }
  
  // If List A option is selected, must have a List A document selected and uploaded
  if (documentOption.value === 'listA') {
    if (!formData.value.listADocument) {
      documentValidationError.value = 'Please select your List A document.'
      return false
    }
    if (!uploadedDocuments.value.listA) {
      documentValidationError.value = 'Please upload your List A document.'
      return false
    }
    return true
  }

  // If List B+C option is selected, need both documents selected and uploaded
  if (documentOption.value === 'listBC') {
    if (!formData.value.listBDocument && !formData.value.listCDocument) {
      documentValidationError.value = 'Please select both a List B document (identity) and a List C document (work authorization).'
      return false
    }

    if (formData.value.listBDocument && !formData.value.listCDocument) {
      documentValidationError.value = 'List C document is required when List B is provided. Please select your work authorization document (List C).'
      return false
    }

    if (formData.value.listCDocument && !formData.value.listBDocument) {
      documentValidationError.value = 'List B document is required when List C is provided. Select your identity document (List B) first.'
      return false
    }

    if (formData.value.listBDocument && !uploadedDocuments.value.listB) {
      documentValidationError.value = 'Please upload your List B document.'
      return false
    }

    if (formData.value.listCDocument && !uploadedDocuments.value.listC) {
      documentValidationError.value = 'Please upload your List C document.'
      return false
    }

    return true
  }
  
  return true
}

const handleSubmit = async () => {
  // Validate documents
  if (!validateDocuments()) {
    alert('Please provide the required identity documents:\n\n' + 
          'Option 1: One document from List A\n' +
          'OR\n' +
          'Option 2: One document from List B AND one document from List C')
    return
  }
  
  // Validate List A fields if List A is selected
  if (formData.value.listADocument) {
    if (!formData.value.listADocumentNumber) {
      alert('Please enter the List A document number.')
      return
    }
  }
  
  // Validate List B fields if List B is selected
  if (formData.value.listBDocument) {
    if (!formData.value.listBDocumentNumber) {
      alert('Please enter the List B document number.')
      return
    }
    if (!formData.value.listBIssuingAuthority) {
      alert('Please enter the issuing authority for your List B document.')
      return
    }
  }
  
  // Validate List C field if List C is selected
  if (formData.value.listCDocument && !formData.value.listCDocumentNumber) {
    alert('Please enter the List C document number.')
    return
  }
  if (formData.value.listCDocument === 'ssn-card' && formData.value.listCDocumentNumber) {
    const ssnCheck = validateSSN(formData.value.listCDocumentNumber)
    if (!ssnCheck.valid) {
      alert(ssnCheck.message || 'Please enter a valid Social Security Number (XXX-XX-XXXX).')
      return
    }
  }

  if (!formData.value.signatureData) {
    alert('Signature is required.')
    return
  }
  
  loading.value = true
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('formData', JSON.stringify(formData.value))
    
    await api.post('/forms/submit/2', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    emit('submitted', 2)
  } catch (error) {
    console.error('Submit error:', error)
    alert('Failed to submit form. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>
