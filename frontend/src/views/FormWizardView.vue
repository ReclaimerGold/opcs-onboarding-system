<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">Onboarding Forms</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</router-link>
            <button @click="handleLogout" class="text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              class="flex flex-col items-center cursor-pointer group relative flex-shrink-0"
              @click="navigateToStep(1)"
            >
              <div class="relative flex items-center justify-center">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                    getStepStatus(1).status === 'completed' 
                      ? 'bg-primary text-white shadow-md' 
                      : getStepStatus(1).status === 'current'
                      ? 'bg-primary text-white ring-4 ring-primary ring-opacity-30'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
                    getStepStatus(1).hasWarning ? 'ring-2 ring-yellow-400' : ''
                  ]"
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
                  <span v-else>1</span>
                </div>
                <div 
                  v-if="getStepStatus(1).hasWarning" 
                  class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center z-20 shadow-sm"
                  :title="getStepStatus(1).warningMessage"
                >
                  <svg class="w-3 h-3 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
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
                class="flex flex-col items-center cursor-pointer group relative flex-1"
                @click="navigateToStep(step)"
              >
                <div class="relative flex items-center justify-center w-full">
                  <div
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                      getStepStatus(step).status === 'completed' 
                        ? 'bg-primary text-white shadow-md' 
                        : getStepStatus(step).status === 'current'
                        ? 'bg-primary text-white ring-4 ring-primary ring-opacity-30'
                        : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
                      getStepStatus(step).hasWarning ? 'ring-2 ring-yellow-400' : ''
                    ]"
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
                    <span v-else>{{ step }}</span>
                  </div>
                  <div 
                    v-if="getStepStatus(step).hasWarning" 
                    class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center z-20 shadow-sm"
                    :title="getStepStatus(step).warningMessage"
                  >
                    <svg class="w-3 h-3 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
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
              class="flex flex-col items-center cursor-pointer group relative flex-shrink-0 ml-auto"
              @click="navigateToStep(6)"
            >
              <div class="relative flex items-center justify-center">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 relative z-10',
                    getStepStatus(6).status === 'completed' 
                      ? 'bg-primary text-white shadow-md' 
                      : getStepStatus(6).status === 'current'
                      ? 'bg-primary text-white ring-4 ring-primary ring-opacity-30'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
                    getStepStatus(6).hasWarning ? 'ring-2 ring-yellow-400' : ''
                  ]"
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
                  <span v-else>6</span>
                </div>
                <div 
                  v-if="getStepStatus(6).hasWarning" 
                  class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center z-20 shadow-sm"
                  :title="getStepStatus(6).warningMessage"
                >
                  <svg class="w-3 h-3 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
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
      
      <!-- Warning Banner for Missing Prerequisites -->
      <div v-if="stepWarnings[currentStep]" class="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
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

      <!-- Form Content -->
      <div>
        <Step1W4Form v-if="currentStep === 1" @submitted="handleStepComplete" />
        <Step2I9Form v-if="currentStep === 2" @submitted="handleStepComplete" />
        <Step3BackgroundForm v-if="currentStep === 3" @submitted="handleStepComplete" />
        <Step4DirectDepositForm v-if="currentStep === 4" @submitted="handleStepComplete" />
        <Step5AcknowledgementsForm v-if="currentStep === 5" @submitted="handleStepComplete" />
        <Step68850Form v-if="currentStep === 6" @submitted="handleStepComplete" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import Step1W4Form from '../components/forms/Step1W4Form.vue'
import Step2I9Form from '../components/forms/Step2I9Form.vue'
import Step3BackgroundForm from '../components/forms/Step3BackgroundForm.vue'
import Step4DirectDepositForm from '../components/forms/Step4DirectDepositForm.vue'
import Step5AcknowledgementsForm from '../components/forms/Step5AcknowledgementsForm.vue'
import Step68850Form from '../components/forms/Step68850Form.vue'
import api from '../services/api.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentStep = ref(1)
const hasDrafts = ref(false)
const completedSteps = ref(new Set())
const applicantData = ref(null)
const stepWarnings = ref({})

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

onMounted(async () => {
  await loadProgress()
  await loadApplicantData()
  
  // Check for step query parameter
  if (route.query.step) {
    const step = parseInt(route.query.step)
    if (step >= 1 && step <= 6) {
      // Use navigateToStep to validate and set step
      navigateToStep(step)
    } else {
      validateCurrentStep()
    }
  } else {
    validateCurrentStep()
  }
})

const loadProgress = async () => {
  try {
    const progressResponse = await api.get('/applicants/me/progress')
    const submissions = progressResponse.data.submissions || []
    
    // Track completed steps
    submissions.forEach(sub => {
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
  }
}

const loadApplicantData = async () => {
  try {
    const response = await api.get('/applicants/me')
    applicantData.value = response.data
  } catch (error) {
    console.error('Error loading applicant data:', error)
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
  
  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const navigateToRequiredStep = () => {
  const dependency = stepDependencies[currentStep.value]
  if (dependency?.requiresStep) {
    currentStep.value = dependency.requiresStep
  } else {
    currentStep.value = 1
  }
  validateCurrentStep()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleStepComplete = async (step) => {
  // Mark step as completed
  completedSteps.value.add(step)
  
  // Reload progress to get updated data
  await loadProgress()
  await loadApplicantData()
  
  // Move to next step
  if (step < 6) {
    currentStep.value = step + 1
    validateCurrentStep()
  } else {
    router.push('/dashboard')
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
