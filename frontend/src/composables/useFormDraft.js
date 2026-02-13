import { ref, watch, onMounted, onUnmounted } from 'vue'
import api from '../services/api.js'

export function useFormDraft(stepNumber, formData, options = {}) {
  const { autoSave = true, saveDelay = 2000 } = options
  const isSaving = ref(false)
  const lastSaved = ref(null)
  const saveTimeout = ref(null)
  const isMounted = ref(true)

  onUnmounted(() => {
    isMounted.value = false
  })

  // Load draft on mount; ignore response if user already navigated away (component unmounted)
  onMounted(async () => {
    try {
      const response = await api.get(`/forms/draft/${stepNumber}`)
      if (!isMounted.value) return
      if (response.data.success && response.data.formData) {
        // Merge draft data into form
        Object.assign(formData.value, response.data.formData)
        lastSaved.value = response.data.updatedAt
        console.log(`Loaded draft for step ${stepNumber}`)
      }
    } catch (error) {
      if (isMounted.value) {
        console.error('Error loading draft:', error)
      }
    }
  })

  // Auto-save function
  const saveDraft = async () => {
    if (isSaving.value) return
    
    isSaving.value = true
    try {
      await api.post(`/forms/draft/${stepNumber}`, {
        formData: formData.value
      })
      lastSaved.value = new Date().toISOString()
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      isSaving.value = false
    }
  }

  // Debounced auto-save
  const debouncedSave = () => {
    if (saveTimeout.value) {
      clearTimeout(saveTimeout.value)
    }
    saveTimeout.value = setTimeout(() => {
      saveDraft()
    }, saveDelay)
  }

  // Watch form data for auto-save
  if (autoSave) {
    watch(
      formData,
      () => {
        debouncedSave()
      },
      { deep: true }
    )
  }

  // Manual save function
  const manualSave = async () => {
    clearTimeout(saveTimeout.value)
    await saveDraft()
  }

  return {
    isSaving,
    lastSaved,
    saveDraft: manualSave
  }
}

