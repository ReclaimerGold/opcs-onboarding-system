import { ref, onMounted } from 'vue'
import api from '../services/api.js'

export function useApplicantData() {
  const applicantData = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const loadApplicantData = async () => {
    try {
      loading.value = true
      const response = await api.get('/applicants/me')
      applicantData.value = response.data
      error.value = null
    } catch (err) {
      console.error('Error loading applicant data:', err)
      error.value = 'Failed to load your information'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadApplicantData()
  })

  return {
    applicantData,
    loading,
    error,
    reload: loadApplicantData
  }
}

