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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Identity Documents</h3>
          
          <!-- Error Message -->
          <div v-if="documentValidationError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-800">{{ documentValidationError }}</p>
          </div>
          
          <!-- Document Option Selection -->
          <div class="mb-6">
            <p class="text-sm text-gray-700 mb-4 font-medium">
              Which documents do you have? Select one option:
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <!-- Option 1: List A -->
              <button
                type="button"
                @click="selectDocumentOption('listA')"
                :class="[
                  'p-4 border-2 rounded-lg text-left transition-all cursor-pointer',
                  documentOption === 'listA'
                    ? 'border-primary bg-primary bg-opacity-5 shadow-md'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                ]"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 mt-1">
                    <div :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3',
                      documentOption === 'listA' 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-400'
                    ]">
                      <svg v-if="documentOption === 'listA'" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mr-2">A</div>
                      <h4 class="font-semibold text-gray-900">Option 1: I have a List A document</h4>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">
                      One document that proves both your identity AND work authorization
                    </p>
                    <p class="text-xs text-gray-500">
                      Examples: US Passport, Employment Authorization Card (I-766), etc.
                    </p>
                  </div>
                </div>
              </button>
              
              <!-- Option 2: List B + C -->
              <button
                type="button"
                @click="selectDocumentOption('listBC')"
                :class="[
                  'p-4 border-2 rounded-lg text-left transition-all cursor-pointer',
                  documentOption === 'listBC'
                    ? 'border-primary bg-primary bg-opacity-5 shadow-md'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                ]"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 mt-1">
                    <div :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3',
                      documentOption === 'listBC' 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-400'
                    ]">
                      <svg v-if="documentOption === 'listBC'" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <div class="flex items-center mr-2">
                        <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-1">B</div>
                        <span class="text-gray-400 mx-1">+</span>
                        <div class="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold ml-1">C</div>
                      </div>
                      <h4 class="font-semibold text-gray-900">Option 2: I have List B + List C documents</h4>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">
                      Two documents: one for identity (List B) and one for work authorization (List C)
                    </p>
                    <p class="text-xs text-gray-500">
                      Examples: Driver's License + Social Security Card
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <!-- Document Details - Always Show Both Options -->
          <div class="space-y-4">
            <!-- List A Section -->
            <div :class="[
              'border rounded-lg p-4 transition-all',
              documentOption === 'listA' 
                ? 'bg-green-50 border-green-300 shadow-md' 
                : documentOption === 'listBC'
                  ? 'bg-gray-50 border-gray-300 opacity-75'
                  : 'bg-green-50 border-green-200'
            ]">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900 flex items-center">
                  <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold mr-2">A</div>
                  Select Your List A Document
                </h4>
                <span v-if="documentOption === 'listBC'" class="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                  (Not Required - List B+C Selected)
                </span>
                <span v-else-if="documentOption === 'listA'" class="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  (Required)
                </span>
              </div>
              <select
                v-model="formData.listADocument"
                @change="handleListAChange"
                :disabled="documentOption === 'listBC'"
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary',
                  documentOption === 'listBC' 
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                    : 'bg-white border-gray-300'
                ]"
              >
                <option value="">Choose your document...</option>
                <option value="passport">US Passport or US Passport Card</option>
                <option value="foreign-passport">Foreign Passport with temporary I-551 stamp</option>
                <option value="i766">Employment Authorization Document with photo (Form I-766)</option>
                <option value="micronesia">Passport from Federated States of Micronesia</option>
                <option value="nonimmigrant">Non-immigrant alien work authorization</option>
              </select>
              <p class="mt-2 text-xs" :class="documentOption === 'listBC' ? 'text-gray-500' : 'text-gray-600'">
                <strong>Legal Notice:</strong> List A documents establish both identity and employment authorization. 
                <span v-if="documentOption === 'listBC'">Not required if you're providing List B + C documents.</span>
                <span v-else>If you select a List A document, you do not need to provide List B or List C documents.</span>
              </p>
              
              <!-- File Upload for List A -->
              <div v-if="formData.listADocument && documentOption !== 'listBC'" class="mt-4 bg-white p-4 rounded border border-green-300">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your List A Document <span class="text-red-500">*</span>
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
            
            <!-- List B + C Section -->
            <div :class="[
              'border rounded-lg p-4 transition-all',
              documentOption === 'listBC' 
                ? 'bg-blue-50 border-blue-300 shadow-md' 
                : documentOption === 'listA'
                  ? 'bg-gray-50 border-gray-300 opacity-75'
                  : 'bg-blue-50 border-blue-200'
            ]">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900 flex items-center">
                  <div class="flex items-center mr-2">
                    <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-1">B</div>
                    <span class="text-gray-400 mx-1">+</span>
                    <div class="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold ml-1">C</div>
                  </div>
                  <span class="ml-2">List B + List C Documents</span>
                </h4>
                <span v-if="documentOption === 'listA'" class="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                  (Not Required - List A Selected)
                </span>
                <span v-else-if="documentOption === 'listBC'" class="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                  (Required)
                </span>
              </div>
              
              <!-- List B Section -->
              <div class="mb-4">
                <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                  <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mr-2">B</div>
                  Step 1: Select Your Identity Document (List B)
                </h5>
                <p class="text-xs mb-3" :class="documentOption === 'listA' ? 'text-gray-500' : 'text-gray-600'">
                  This document proves your identity (who you are)
                </p>
                <select
                  v-model="formData.listBDocument"
                  @change="handleListBChange"
                  :disabled="documentOption === 'listA'"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary mb-3',
                    documentOption === 'listA' 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : 'bg-white border-gray-300'
                  ]"
                >
                <option value="">Choose your identity document...</option>
                <option value="drivers-license">State Issued Driver's License</option>
                <option value="state-id">State Issued ID Card</option>
                <option value="school-id">School ID Card</option>
                <option value="voter">Voter's Registration Card</option>
                <option value="military">US Military Card</option>
                <option value="coast-guard">U.S. Coast Guard Merchant Mariner Card</option>
                <option value="tribal">Native American Tribal Document</option>
                <option value="canadian">Driver's License Issued by Canadian Government</option>
              </select>
              
                <div v-if="formData.listBDocument && documentOption !== 'listA'" class="mt-4 space-y-3 bg-white p-3 rounded border border-blue-300">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Document Number <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.listBDocumentNumber"
                    type="text"
                    placeholder="Enter the number from your document"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Issuing Authority <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.listBIssuingAuthority"
                    type="text"
                    placeholder="e.g., California, DMV, State of New York"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <p class="mt-1 text-xs text-gray-500">The state or agency that issued this document</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date (if applicable)
                  </label>
                  <input
                    v-model="formData.listBExpiration"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <p class="mt-1 text-xs text-gray-500">Leave blank if your document doesn't expire</p>
                </div>
                </div>
                
                <!-- File Upload for List B -->
                <div v-if="formData.listBDocument && documentOption !== 'listA'" class="mt-4 bg-white p-4 rounded border border-blue-300">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your List B Document <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center space-x-4">
                  <input
                    ref="listBFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    @change="handleFileUpload('listB', $event)"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="$refs.listBFileInput.click()"
                    :disabled="uploading.listB"
                    class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {{ uploading.listB ? 'Uploading...' : (uploadedDocuments.listB ? 'Change File' : 'Choose File') }}
                  </button>
                  <span v-if="uploadedDocuments.listB" class="text-sm text-gray-600">
                    ✓ {{ uploadedDocuments.listB }}
                  </span>
                  <span v-else class="text-sm text-gray-500">
                    PDF, JPG, or PNG (max 10MB)
                  </span>
                </div>
                  <p v-if="uploadError.listB" class="mt-2 text-xs text-red-600">{{ uploadError.listB }}</p>
                </div>
              </div>
              
              <!-- List C Section -->
              <div>
                <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                  <div class="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mr-2">C</div>
                  Step 2: Select Your Work Authorization Document (List C)
                </h5>
                <p class="text-xs mb-3" :class="documentOption === 'listA' ? 'text-gray-500' : 'text-gray-600'">
                  This document proves you're authorized to work in the US
                </p>
                <select
                  v-model="formData.listCDocument"
                  @change="handleListCChange"
                  :disabled="documentOption === 'listA'"
                  :required="!!formData.listBDocument && documentOption !== 'listA'"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary focus:border-primary mb-3',
                    documentOption === 'listA' 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                      : formData.listBDocument && !formData.listCDocument 
                        ? 'border-yellow-400 bg-yellow-50' 
                        : 'bg-white border-gray-300'
                  ]"
                >
                <option value="">Choose your work authorization document...</option>
                <option value="ssn-card">Social Security Card</option>
                <option value="birth-certificate">Birth Certificate (State Certified)</option>
                <option value="tribal">Native American Tribal Document</option>
                <option value="citizen-id">US Citizen ID Card (Form I-197)</option>
                <option value="resident-id">Resident Citizen ID Card (Form I-179)</option>
                <option value="ead">Employment Authorization Document (DHS)</option>
              </select>
                <p v-if="formData.listBDocument && !formData.listCDocument && documentOption !== 'listA'" class="text-xs text-yellow-600 font-medium">
                  ⚠️ A List C document is required when you provide a List B document
                </p>
                
                <div v-if="formData.listCDocument && documentOption !== 'listA'" class="mt-4 bg-white p-3 rounded border border-purple-300">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Document Number <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.listCDocumentNumber"
                  type="text"
                  placeholder="Enter the number from your document"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
                <p v-if="formData.listCDocument === 'ssn-card'" class="mt-1 text-xs text-gray-500">
                  Issuing Authority: Social Security Administration
                </p>
                </div>
                
                <!-- File Upload for List C -->
                <div v-if="formData.listCDocument && documentOption !== 'listA'" class="mt-4 bg-white p-4 rounded border border-purple-300">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your List C Document <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center space-x-4">
                  <input
                    ref="listCFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    @change="handleFileUpload('listC', $event)"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="$refs.listCFileInput.click()"
                    :disabled="uploading.listC"
                    class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {{ uploading.listC ? 'Uploading...' : (uploadedDocuments.listC ? 'Change File' : 'Choose File') }}
                  </button>
                  <span v-if="uploadedDocuments.listC" class="text-sm text-gray-600">
                    ✓ {{ uploadedDocuments.listC }}
                  </span>
                  <span v-else class="text-sm text-gray-500">
                    PDF, JPG, or PNG (max 10MB)
                  </span>
                </div>
                  <p v-if="uploadError.listC" class="mt-2 text-xs text-red-600">{{ uploadError.listC }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Legal Requirements Info Box -->
          <div class="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-2">I-9 Document Requirements (Legal Information)</h4>
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
import { ref, onMounted, watch } from 'vue'
import api from '../../services/api.js'
import { useFormDraft } from '../../composables/useFormDraft.js'
import { useApplicantData } from '../../composables/useApplicantData.js'

const emit = defineEmits(['submitted', 'form-data-change'])

const { applicantData, loading: loadingApplicant } = useApplicantData()

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  otherLastNames: '',
  authorizationType: 'citizen',
  alienNumber: '',
  alienDocumentType: '',
  countryOfIssuance: '',
  expirationDate: '',
  listADocument: '',
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
  preparerDate: ''
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

// Draft functionality (values available from useFormDraft if needed)
useFormDraft(2, formData)

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
  
  // Set document option based on existing data
  if (formData.value.listADocument) {
    documentOption.value = 'listA'
  } else if (formData.value.listBDocument || formData.value.listCDocument) {
    documentOption.value = 'listBC'
  }
  
  // Validate documents on mount (in case draft is loaded)
  validateDocuments()
  
  // Load existing uploaded documents
  loadUploadedDocuments()
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
    // Clear List A when selecting List B+C option
    formData.value.listADocument = ''
  }
  
  documentValidationError.value = ''
  validateDocuments()
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
  
  // If List A option is selected, must have a List A document and upload
  // (List B/C are not required when List A is selected)
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
  
  // If List B+C option is selected, need both
  // (List A is not required when List B+C is selected)
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
      documentValidationError.value = 'List B document is required when List C is provided. Please select your identity document (List B) first.'
      return false
    }
    
    // Check uploads
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
