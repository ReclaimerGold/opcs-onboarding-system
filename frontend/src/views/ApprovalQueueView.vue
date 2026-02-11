<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation bar -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap justify-between items-center gap-3 min-h-16 py-3 sm:py-0 sm:h-16">
          <div class="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <img src="https://optimalprimeservices.com/wp-content/uploads/2024/11/opcs-logo.png" alt="Optimal Prime Services Logo" class="h-8 w-auto" />
            <h1 class="text-xl font-bold text-primary">Document Approvals</h1>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:gap-4">
            <router-link v-if="authStore.isAdmin" to="/admin" class="text-gray-600 hover:text-primary text-sm font-medium py-2 px-1 min-h-[44px] flex items-center">Admin</router-link>
            <router-link to="/dashboard" class="text-gray-600 hover:text-primary text-sm font-medium py-2 px-1 min-h-[44px] flex items-center">Dashboard</router-link>
            <router-link to="/forms" class="text-gray-600 hover:text-primary text-sm font-medium py-2 px-1 min-h-[44px] flex items-center">Forms</router-link>
            <NotificationBell />
            <button @click="logout" class="text-gray-600 hover:text-red-600 text-sm font-medium py-2 px-3 min-h-[44px] flex items-center">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Total</div>
          <div class="text-2xl font-bold text-gray-900">{{ stats.total }}</div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-4">
          <div class="text-sm text-yellow-700">Pending</div>
          <div class="text-2xl font-bold text-yellow-800">{{ stats.pending }}</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg shadow p-4">
          <div class="text-sm text-green-700">Approved</div>
          <div class="text-2xl font-bold text-green-800">{{ stats.approved }}</div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg shadow p-4">
          <div class="text-sm text-red-700">Rejected</div>
          <div class="text-2xl font-bold text-red-800">{{ stats.rejected }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow mb-6 p-4">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Status</label>
            <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Form Type</label>
            <select v-model="filterFormType" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="">All Forms</option>
              <option value="W4">W-4</option>
              <option value="I9">I-9</option>
              <option value="BACKGROUND">Background</option>
              <option value="DIRECT_DEPOSIT">Direct Deposit</option>
              <option value="ACKNOWLEDGEMENTS">Acknowledgements</option>
              <option value="8850">Form 8850</option>
              <option value="9061">ETA Form 9061</option>
            </select>
          </div>
          <div class="ml-auto">
            <button @click="fetchQueue" class="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-blue-700 transition">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-500">Loading approvals...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-700">{{ error }}</p>
        <button @click="fetchQueue" class="mt-2 text-sm text-red-600 underline">Try again</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="approvals.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 class="mt-2 text-lg font-medium text-gray-900">No documents to review</h3>
        <p class="mt-1 text-sm text-gray-500">{{ filterStatus || filterFormType ? 'Try changing your filters.' : 'All documents have been processed.' }}</p>
      </div>

      <!-- Approvals table -->
      <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="approval in approvals" :key="approval.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ approval.applicant_first_name }} {{ approval.applicant_last_name }}</div>
                <div class="text-xs text-gray-500">{{ approval.applicant_email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">{{ formTypeLabel(approval.form_type) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(approval.submitted_at || approval.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="statusBadgeClass(approval.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ approval.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button @click="viewPdf(approval)" class="text-blue-600 hover:text-blue-800 font-medium">View PDF</button>
                <button v-if="approval.status === 'pending'" @click="openApproveModal(approval)" class="text-green-600 hover:text-green-800 font-medium">Approve</button>
                <button v-if="approval.status === 'pending'" @click="openRejectModal(approval)" class="text-red-600 hover:text-red-800 font-medium">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="total > limit" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div class="text-sm text-gray-700">
            Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }}
          </div>
          <div class="flex space-x-2">
            <button @click="page--; fetchQueue()" :disabled="page <= 1" class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Previous</button>
            <button @click="page++; fetchQueue()" :disabled="page * limit >= total" class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="showApproveModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showApproveModal = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 z-10">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Approve Document</h3>
          <p class="text-sm text-gray-600 mb-4">
            You are approving <strong>{{ formTypeLabel(selectedApproval?.form_type) }}</strong>
            for <strong>{{ selectedApproval?.applicant_first_name }} {{ selectedApproval?.applicant_last_name }}</strong>.
            Your signature will be placed on the document.
          </p>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Signature</label>
            <div v-if="managerSignature" class="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-2">
              <img :src="managerSignature" alt="Your signature" class="max-h-20 mx-auto" />
              <p class="text-xs text-green-600 text-center mt-1">Using your saved signature</p>
            </div>
            <div v-else>
              <SignaturePad v-model="approveSignatureData" label="Sign to approve" :required="true" />
            </div>
          </div>

          <div v-if="approveError" class="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
            {{ approveError }}
          </div>

          <div class="flex justify-end space-x-3">
            <button @click="showApproveModal = false" class="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button @click="submitApproval" :disabled="approving" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition">
              {{ approving ? 'Signing...' : 'Approve & Sign' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showRejectModal = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 z-10">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Reject Document</h3>
          <p class="text-sm text-gray-600 mb-4">
            Rejecting <strong>{{ formTypeLabel(selectedApproval?.form_type) }}</strong>
            for <strong>{{ selectedApproval?.applicant_first_name }} {{ selectedApproval?.applicant_last_name }}</strong>.
            The applicant will be notified and can resubmit.
          </p>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary text-sm"
              placeholder="Please explain why this document is being rejected..."
            ></textarea>
          </div>

          <div v-if="rejectError" class="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
            {{ rejectError }}
          </div>

          <div class="flex justify-end space-x-3">
            <button @click="showRejectModal = false" class="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button @click="submitRejection" :disabled="rejecting || !rejectReason.trim()" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 transition">
              {{ rejecting ? 'Rejecting...' : 'Reject Document' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF Viewer Modal -->
    <div v-if="showPdfViewer" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showPdfViewer = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 z-10" style="max-height: 90vh;">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ selectedApproval?.pdf_filename || 'Document Preview' }}
            </h3>
            <button @click="showPdfViewer = false" class="text-gray-400 hover:text-gray-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="overflow-auto" style="max-height: calc(90vh - 120px);">
            <iframe v-if="pdfBlobUrl" :src="pdfBlobUrl" class="w-full border border-gray-200 rounded" style="height: 70vh;"></iframe>
            <div v-else class="text-center py-12 text-gray-500">Loading document...</div>
          </div>
          <div v-if="selectedApproval?.status === 'pending'" class="flex justify-end space-x-3 mt-4 pt-4 border-t">
            <button @click="showPdfViewer = false; openApproveModal(selectedApproval)" class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition">Approve & Sign</button>
            <button @click="showPdfViewer = false; openRejectModal(selectedApproval)" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition">Reject</button>
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
import SignaturePad from '../components/ui/SignaturePad.vue'
import NotificationBell from '../components/NotificationBell.vue'

const router = useRouter()
const authStore = useAuthStore()

// Queue state
const approvals = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(50)
const loading = ref(false)
const error = ref('')
const filterStatus = ref('pending')
const filterFormType = ref('')

// Stats
const stats = ref({ total: 0, pending: 0, approved: 0, rejected: 0 })

// Approve modal
const showApproveModal = ref(false)
const selectedApproval = ref(null)
const approveSignatureData = ref(null)
const managerSignature = ref(null)
const approving = ref(false)
const approveError = ref('')

// Reject modal
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejecting = ref(false)
const rejectError = ref('')

// PDF viewer
const showPdfViewer = ref(false)
const pdfBlobUrl = ref(null)

const FORM_TYPE_LABELS = {
  W4: 'W-4',
  I9: 'I-9',
  BACKGROUND: 'Background Check',
  DIRECT_DEPOSIT: 'Direct Deposit',
  ACKNOWLEDGEMENTS: 'Acknowledgements',
  '8850': 'Form 8850',
  '9061': 'ETA Form 9061'
}

function formTypeLabel(type) {
  return FORM_TYPE_LABELS[type] || type
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function statusBadgeClass(status) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

async function fetchQueue() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value, limit: limit.value }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterFormType.value) params.formType = filterFormType.value

    const [queueRes, statsRes] = await Promise.all([
      api.get('/approvals/queue', { params }),
      api.get('/approvals/stats')
    ])

    approvals.value = queueRes.data.approvals || []
    total.value = queueRes.data.total || 0
    stats.value = statsRes.data || { total: 0, pending: 0, approved: 0, rejected: 0 }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load approval queue'
  } finally {
    loading.value = false
  }
}

async function fetchManagerSignature() {
  try {
    const res = await api.get('/auth/signature')
    if (res.data?.signatureData) {
      managerSignature.value = res.data.signatureData
    }
  } catch {
    // Manager hasn't set up signature yet
    managerSignature.value = null
  }
}

async function viewPdf(approval) {
  selectedApproval.value = approval
  showPdfViewer.value = true
  pdfBlobUrl.value = null

  try {
    const res = await api.get(`/approvals/${approval.id}/pdf`, { responseType: 'blob' })
    pdfBlobUrl.value = URL.createObjectURL(res.data)
  } catch (err) {
    console.error('Failed to load PDF:', err)
    pdfBlobUrl.value = null
  }
}

function openApproveModal(approval) {
  selectedApproval.value = approval
  approveSignatureData.value = null
  approveError.value = ''
  showApproveModal.value = true
}

function openRejectModal(approval) {
  selectedApproval.value = approval
  rejectReason.value = ''
  rejectError.value = ''
  showRejectModal.value = true
}

async function submitApproval() {
  const signature = managerSignature.value || approveSignatureData.value
  if (!signature) {
    approveError.value = 'Please provide your signature before approving.'
    return
  }

  approving.value = true
  approveError.value = ''
  try {
    await api.post(`/approvals/${selectedApproval.value.id}/approve`, {
      signatureData: signature
    })
    showApproveModal.value = false
    await fetchQueue()
  } catch (err) {
    approveError.value = err.response?.data?.error || 'Failed to approve document'
  } finally {
    approving.value = false
  }
}

async function submitRejection() {
  if (!rejectReason.value.trim()) {
    rejectError.value = 'Please provide a reason for rejection.'
    return
  }

  rejecting.value = true
  rejectError.value = ''
  try {
    await api.post(`/approvals/${selectedApproval.value.id}/reject`, {
      reason: rejectReason.value.trim()
    })
    showRejectModal.value = false
    await fetchQueue()
  } catch (err) {
    rejectError.value = err.response?.data?.error || 'Failed to reject document'
  } finally {
    rejecting.value = false
  }
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}

// Re-fetch when filters change
watch([filterStatus, filterFormType], () => {
  page.value = 1
  fetchQueue()
})

onMounted(async () => {
  await Promise.all([fetchQueue(), fetchManagerSignature()])
})
</script>
