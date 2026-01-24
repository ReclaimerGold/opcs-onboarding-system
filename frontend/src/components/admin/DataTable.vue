<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <!-- Table Header with Search and Actions -->
    <div class="px-4 py-4 border-b border-gray-200">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Title and Count -->
        <div class="flex items-center space-x-3">
          <h3 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <span v-if="pagination.total > 0" class="text-sm text-gray-500">
            ({{ pagination.total }} {{ pagination.total === 1 ? 'record' : 'records' }})
          </span>
        </div>

        <!-- Search and Actions -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-2xl lg:ml-4">
          <!-- Search -->
          <div v-if="searchable" class="flex-1 min-w-0">
            <SearchBar
              v-model="searchQuery"
              :placeholder="searchPlaceholder"
              :loading="loading"
              @search="handleSearch"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-2 flex-shrink-0">
            <!-- Filter Toggle -->
            <button
              v-if="filterable && filterableColumns.length > 0"
              @click="showFilters = !showFilters"
              :class="[
                'px-3 py-2 text-sm rounded-lg flex items-center transition-colors',
                showFilters || hasActiveFilters
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              <span v-if="activeFilterCount > 0" class="ml-1.5 px-1.5 py-0.5 text-xs bg-white text-primary rounded-full">
                {{ activeFilterCount }}
              </span>
            </button>

            <!-- Refresh Button -->
            <button
              v-if="refreshable"
              @click="$emit('refresh')"
              :disabled="loading"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center disabled:opacity-50"
            >
              <svg :class="['w-4 h-4', loading && 'animate-spin']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <!-- Export Button -->
            <button
              v-if="exportable"
              @click="handleExport"
              :disabled="loading || data.length === 0"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center disabled:opacity-50"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Panel -->
      <FilterPanel
        v-if="showFilters && filterable"
        :filters="filters"
        :columns="filterableColumns"
        :quick-filters="quickFilters"
        @update:filters="handleFilterChange"
        @filter-change="handleFilterChange"
        class="mt-4"
      />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                column.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                column.width && `w-${column.width}`
              ]"
              @click="column.sortable && handleSort(column.key)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable" class="ml-1">
                  <svg
                    v-if="sort.key === column.key"
                    :class="['w-4 h-4 text-primary', sort.direction === 'desc' && 'rotate-180']"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </span>
              </div>
            </th>
            <th v-if="$slots.actions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Loading State -->
          <tr v-if="loading && data.length === 0">
            <td :colspan="visibleColumns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center">
                <svg class="animate-spin h-8 w-8 text-primary mb-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-gray-500">Loading data...</span>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="data.length === 0">
            <td :colspan="visibleColumns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center">
                <svg class="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-gray-500">{{ emptyMessage }}</span>
                <button
                  v-if="hasActiveFilters"
                  @click="clearAllFilters"
                  class="mt-2 text-sm text-primary hover:text-primary-light"
                >
                  Clear filters
                </button>
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-else
            v-for="(row, index) in data"
            :key="getRowKey(row, index)"
            :class="[
              'hover:bg-gray-50 transition-colors',
              rowClass && rowClass(row)
            ]"
            @click="$emit('row-click', row)"
          >
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              :class="[
                'px-6 py-4 text-sm',
                column.class || 'text-gray-900',
                column.wrap === false && 'whitespace-nowrap'
              ]"
            >
              <!-- Custom cell slot -->
              <slot :name="`cell-${column.key}`" :row="row" :value="getCellValue(row, column)">
                <!-- Default rendering based on column type -->
                <template v-if="column.type === 'badge'">
                  <span :class="getBadgeClass(getCellValue(row, column), column)">
                    {{ formatCellValue(row, column) }}
                  </span>
                </template>
                <template v-else-if="column.type === 'date'">
                  {{ formatDate(getCellValue(row, column)) }}
                </template>
                <template v-else-if="column.type === 'progress'">
                  <div class="flex items-center space-x-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div
                        class="bg-primary h-2 rounded-full"
                        :style="{ width: `${getCellValue(row, column)}%` }"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-500">{{ getCellValue(row, column) }}%</span>
                  </div>
                </template>
                <template v-else-if="column.type === 'boolean'">
                  <svg v-if="getCellValue(row, column)" class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </template>
                <template v-else>
                  {{ formatCellValue(row, column) }}
                </template>
              </slot>
            </td>
            <td v-if="$slots.actions" class="px-6 py-4 text-sm text-right">
              <slot name="actions" :row="row" :index="index"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Page Size Selector -->
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            :value="pagination.limit"
            @change="handleLimitChange"
            class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
          </select>
          <span>entries</span>
        </div>

        <!-- Page Info -->
        <div class="text-sm text-gray-600">
          Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ pagination.total }} entries
        </div>

        <!-- Page Navigation -->
        <div class="flex items-center space-x-1">
          <!-- First Page -->
          <button
            @click="handlePageChange(1)"
            :disabled="pagination.page === 1"
            class="px-2 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          <!-- Previous Page -->
          <button
            @click="handlePageChange(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="px-2 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Page Numbers -->
          <template v-for="page in pageRange" :key="page">
            <span v-if="page === '...'" class="px-2 py-1 text-sm text-gray-400">...</span>
            <button
              v-else
              @click="handlePageChange(page)"
              :class="[
                'px-3 py-1 text-sm rounded transition-colors',
                page === pagination.page
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-200 text-gray-700'
              ]"
            >
              {{ page }}
            </button>
          </template>

          <!-- Next Page -->
          <button
            @click="handlePageChange(pagination.page + 1)"
            :disabled="pagination.page >= totalPages"
            class="px-2 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Last Page -->
          <button
            @click="handlePageChange(totalPages)"
            :disabled="pagination.page >= totalPages"
            class="px-2 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchBar from './SearchBar.vue'
import FilterPanel from './FilterPanel.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({ page: 1, limit: 25, total: 0 })
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  sort: {
    type: Object,
    default: () => ({ key: null, direction: 'asc' })
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  filterable: {
    type: Boolean,
    default: true
  },
  exportable: {
    type: Boolean,
    default: true
  },
  refreshable: {
    type: Boolean,
    default: true
  },
  quickFilters: {
    type: Array,
    default: () => []
  },
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  rowClass: {
    type: Function,
    default: null
  },
  emptyMessage: {
    type: String,
    default: 'No data found'
  },
  pageSizes: {
    type: Array,
    default: () => [10, 25, 50, 100]
  }
})

const emit = defineEmits([
  'update:pagination',
  'update:filters',
  'update:sort',
  'search',
  'filter-change',
  'page-change',
  'limit-change',
  'sort-change',
  'export',
  'refresh',
  'row-click'
])

// Local state
const searchQuery = ref('')
const showFilters = ref(false)

// Computed
const visibleColumns = computed(() => {
  return props.columns.filter(col => col.visible !== false)
})

const filterableColumns = computed(() => {
  return props.columns.filter(col => col.filterable !== false && col.filterType)
})

const totalPages = computed(() => {
  return Math.ceil(props.pagination.total / props.pagination.limit) || 1
})

const pageRange = computed(() => {
  const current = props.pagination.page
  const total = totalPages.value
  const range = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      range.push(i)
    }
  } else {
    range.push(1)
    
    if (current > 3) {
      range.push('...')
    }
    
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    
    if (current < total - 2) {
      range.push('...')
    }
    
    range.push(total)
  }
  
  return range
})

const paginationInfo = computed(() => {
  const start = (props.pagination.page - 1) * props.pagination.limit + 1
  const end = Math.min(props.pagination.page * props.pagination.limit, props.pagination.total)
  return { start, end }
})

const hasActiveFilters = computed(() => {
  return Object.values(props.filters).some(v => v !== '' && v !== null && v !== undefined) ||
         searchQuery.value !== ''
})

const activeFilterCount = computed(() => {
  return Object.values(props.filters).filter(v => v !== '' && v !== null && v !== undefined).length
})

// Methods
const getRowKey = (row, index) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index
}

const getCellValue = (row, column) => {
  if (column.getValue) {
    return column.getValue(row)
  }
  
  // Support nested keys like 'user.name'
  const keys = column.key.split('.')
  let value = row
  for (const key of keys) {
    value = value?.[key]
  }
  return value
}

const formatCellValue = (row, column) => {
  const value = getCellValue(row, column)
  
  if (column.format) {
    return column.format(value, row)
  }
  
  if (value === null || value === undefined) {
    return column.defaultValue ?? '-'
  }
  
  return value
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getBadgeClass = (value, column) => {
  const baseClass = 'px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center'
  
  if (column.badgeClass) {
    const customClass = typeof column.badgeClass === 'function'
      ? column.badgeClass(value)
      : column.badgeClass[value]
    return `${baseClass} ${customClass || 'bg-gray-100 text-gray-800'}`
  }
  
  return `${baseClass} bg-gray-100 text-gray-800`
}

const handleSearch = (query) => {
  emit('search', query)
}

const handleFilterChange = (newFilters) => {
  emit('update:filters', newFilters)
  emit('filter-change', newFilters)
}

const handleSort = (key) => {
  const newSort = {
    key,
    direction: props.sort.key === key && props.sort.direction === 'asc' ? 'desc' : 'asc'
  }
  emit('update:sort', newSort)
  emit('sort-change', newSort)
}

const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  emit('update:pagination', { ...props.pagination, page })
  emit('page-change', page)
}

const handleLimitChange = (event) => {
  const limit = parseInt(event.target.value)
  emit('update:pagination', { ...props.pagination, limit, page: 1 })
  emit('limit-change', limit)
}

const handleExport = () => {
  emit('export', {
    columns: visibleColumns.value,
    filters: props.filters,
    search: searchQuery.value
  })
}

const clearAllFilters = () => {
  searchQuery.value = ''
  const clearedFilters = {}
  for (const key of Object.keys(props.filters)) {
    clearedFilters[key] = ''
  }
  emit('update:filters', clearedFilters)
  emit('filter-change', clearedFilters)
  emit('search', '')
}
</script>

