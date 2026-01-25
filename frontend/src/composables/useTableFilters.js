import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Composable for managing table filter state with URL sync and persistence
 */
export function useTableFilters(options = {}) {
  const {
    defaultFilters = {},
    storageKey = null,
    syncToUrl = true
  } = options

  const route = useRoute()
  const router = useRouter()

  // Filter state
  const filters = ref({ ...defaultFilters })
  const search = ref('')
  
  // Pagination state
  const pagination = ref({
    page: 1,
    limit: 25,
    total: 0
  })

  // Sort state
  const sort = ref({
    key: null,
    direction: 'asc'
  })

  // Initialize from URL query params or localStorage
  onMounted(() => {
    if (syncToUrl && route.query) {
      // Load filters from URL
      for (const key of Object.keys(defaultFilters)) {
        if (route.query[key]) {
          filters.value[key] = route.query[key]
        }
      }
      
      // Load search from URL
      if (route.query.search) {
        search.value = route.query.search
      }
      
      // Load pagination from URL
      if (route.query.page) {
        pagination.value.page = parseInt(route.query.page) || 1
      }
      if (route.query.limit) {
        pagination.value.limit = parseInt(route.query.limit) || 25
      }
      
      // Load sort from URL
      if (route.query.sortKey) {
        sort.value.key = route.query.sortKey
        sort.value.direction = route.query.sortDir || 'asc'
      }
    } else if (storageKey) {
      // Load from localStorage
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          filters.value = { ...defaultFilters, ...parsed.filters }
          search.value = parsed.search || ''
          pagination.value = { ...pagination.value, ...parsed.pagination }
          sort.value = { ...sort.value, ...parsed.sort }
        } catch (e) {
          console.warn('Failed to parse stored filters:', e)
        }
      }
    }
  })

  // Sync to URL when filters change
  const syncFiltersToUrl = () => {
    if (!syncToUrl) return

    const query = {}
    
    // Add non-empty filters to query
    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== '' && value !== null && value !== undefined) {
        query[key] = value
      }
    }
    
    // Add search if present
    if (search.value) {
      query.search = search.value
    }
    
    // Add pagination if not default
    if (pagination.value.page !== 1) {
      query.page = pagination.value.page
    }
    if (pagination.value.limit !== 25) {
      query.limit = pagination.value.limit
    }
    
    // Add sort if present
    if (sort.value.key) {
      query.sortKey = sort.value.key
      query.sortDir = sort.value.direction
    }

    router.replace({ query })
  }

  // Save to localStorage
  const saveToStorage = () => {
    if (!storageKey) return
    
    localStorage.setItem(storageKey, JSON.stringify({
      filters: filters.value,
      search: search.value,
      pagination: { page: pagination.value.page, limit: pagination.value.limit },
      sort: sort.value
    }))
  }

  // Watch for changes and sync
  watch([filters, search, pagination, sort], () => {
    syncFiltersToUrl()
    saveToStorage()
  }, { deep: true })

  // Build query params for API request
  const queryParams = computed(() => {
    const params = {}
    
    // Add filters
    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    }
    
    // Add search
    if (search.value) {
      params.search = search.value
    }
    
    // Add pagination
    params.page = pagination.value.page
    params.limit = pagination.value.limit
    
    // Add sort
    if (sort.value.key) {
      params.sortKey = sort.value.key
      params.sortDir = sort.value.direction
    }
    
    return params
  })

  // Methods
  const setFilter = (key, value) => {
    filters.value[key] = value
    pagination.value.page = 1 // Reset to first page when filter changes
  }

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  const setSearch = (value) => {
    search.value = value
    pagination.value.page = 1
  }

  const setPage = (page) => {
    pagination.value.page = page
  }

  const setLimit = (limit) => {
    pagination.value.limit = limit
    pagination.value.page = 1
  }

  const setTotal = (total) => {
    pagination.value.total = total
  }

  const setSort = (key, direction = null) => {
    if (sort.value.key === key && !direction) {
      // Toggle direction if clicking same column
      sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value.key = key
      sort.value.direction = direction || 'asc'
    }
  }

  const clearFilters = () => {
    filters.value = { ...defaultFilters }
    search.value = ''
    pagination.value.page = 1
  }

  const clearAll = () => {
    clearFilters()
    sort.value = { key: null, direction: 'asc' }
  }

  // Computed helpers
  const hasActiveFilters = computed(() => {
    const hasFilterValues = Object.values(filters.value).some(
      v => v !== '' && v !== null && v !== undefined
    )
    return hasFilterValues || search.value !== ''
  })

  const totalPages = computed(() => {
    return Math.ceil(pagination.value.total / pagination.value.limit) || 1
  })

  const pageRange = computed(() => {
    const current = pagination.value.page
    const total = totalPages.value
    const range = []
    
    // Always show first page
    range.push(1)
    
    // Calculate range around current page
    const start = Math.max(2, current - 2)
    const end = Math.min(total - 1, current + 2)
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      range.push('...')
    }
    
    // Add pages in range
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    
    // Add ellipsis before last page if needed
    if (end < total - 1) {
      range.push('...')
    }
    
    // Always show last page if more than 1 page
    if (total > 1) {
      range.push(total)
    }
    
    return range
  })

  return {
    // State
    filters,
    search,
    pagination,
    sort,
    
    // Computed
    queryParams,
    hasActiveFilters,
    totalPages,
    pageRange,
    
    // Methods
    setFilter,
    setFilters,
    setSearch,
    setPage,
    setLimit,
    setTotal,
    setSort,
    clearFilters,
    clearAll
  }
}

