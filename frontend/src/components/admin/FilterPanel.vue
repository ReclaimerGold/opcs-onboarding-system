<template>
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-700 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Advanced Filters
      </h3>
      <div class="flex items-center space-x-2">
        <button
          v-if="hasActiveFilters"
          @click="clearAllFilters"
          class="text-xs text-gray-500 hover:text-gray-700 flex items-center"
        >
          <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear All
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Dynamic filter fields based on columns -->
      <div v-for="filter in filterableColumns" :key="filter.key" class="space-y-1">
        <label :for="`filter-${filter.key}`" class="block text-xs font-medium text-gray-600">
          {{ filter.label }}
        </label>
        
        <!-- Select filter -->
        <select
          v-if="filter.type === 'select'"
          :id="`filter-${filter.key}`"
          :value="filters[filter.key]"
          @change="updateFilter(filter.key, $event.target.value)"
          class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All</option>
          <option v-for="option in filter.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <!-- Date range filter -->
        <div v-else-if="filter.type === 'dateRange'" class="flex space-x-2">
          <input
            type="date"
            :value="filters[`${filter.key}Start`]"
            @change="updateFilter(`${filter.key}Start`, $event.target.value)"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="From"
          />
          <input
            type="date"
            :value="filters[`${filter.key}End`]"
            @change="updateFilter(`${filter.key}End`, $event.target.value)"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="To"
          />
        </div>

        <!-- Text filter -->
        <input
          v-else
          type="text"
          :id="`filter-${filter.key}`"
          :value="filters[filter.key]"
          @input="updateFilter(filter.key, $event.target.value)"
          :placeholder="`Filter by ${filter.label.toLowerCase()}...`"
          class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>

    <!-- Active filters display -->
    <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex flex-wrap gap-2">
        <span class="text-xs text-gray-500 mr-2 py-1">Active filters:</span>
        <span
          v-for="(value, key) in activeFilters"
          :key="key"
          class="inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
        >
          {{ getFilterLabel(key) }}: {{ getFilterDisplayValue(key, value) }}
          <button @click="updateFilter(key, '')" class="ml-1 hover:text-primary-light">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
    </div>

    <!-- Quick filters -->
    <div v-if="quickFilters && quickFilters.length > 0" class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex flex-wrap gap-2">
        <span class="text-xs text-gray-500 mr-2 py-1">Quick filters:</span>
        <button
          v-for="qf in quickFilters"
          :key="qf.label"
          @click="applyQuickFilter(qf)"
          :class="[
            'px-3 py-1 text-xs rounded-full transition-colors',
            isQuickFilterActive(qf)
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ qf.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  quickFilters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:filters', 'filter-change'])

// Get filterable columns (those with filter config)
const filterableColumns = computed(() => {
  return props.columns.filter(col => col.filterable !== false && col.filterType)
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return Object.values(props.filters).some(v => v !== '' && v !== null && v !== undefined)
})

// Get only active filters
const activeFilters = computed(() => {
  const active = {}
  for (const [key, value] of Object.entries(props.filters)) {
    if (value !== '' && value !== null && value !== undefined) {
      active[key] = value
    }
  }
  return active
})

// Update a single filter
const updateFilter = (key, value) => {
  const newFilters = { ...props.filters, [key]: value }
  emit('update:filters', newFilters)
  emit('filter-change', newFilters)
}

// Clear all filters
const clearAllFilters = () => {
  const clearedFilters = {}
  for (const key of Object.keys(props.filters)) {
    clearedFilters[key] = ''
  }
  emit('update:filters', clearedFilters)
  emit('filter-change', clearedFilters)
}

// Apply a quick filter preset
const applyQuickFilter = (quickFilter) => {
  const newFilters = { ...props.filters, ...quickFilter.filters }
  emit('update:filters', newFilters)
  emit('filter-change', newFilters)
}

// Check if a quick filter is currently active
const isQuickFilterActive = (quickFilter) => {
  return Object.entries(quickFilter.filters).every(
    ([key, value]) => props.filters[key] === value
  )
}

// Get display label for a filter key
const getFilterLabel = (key) => {
  const col = props.columns.find(c => c.key === key || `${c.key}Start` === key || `${c.key}End` === key)
  if (col) {
    if (key.endsWith('Start')) return `${col.label} from`
    if (key.endsWith('End')) return `${col.label} to`
    return col.label
  }
  return key
}

// Get display value for a filter
const getFilterDisplayValue = (key, value) => {
  const col = props.columns.find(c => c.key === key)
  if (col && col.filterType === 'select' && col.options) {
    const option = col.options.find(o => o.value === value)
    return option ? option.label : value
  }
  return value
}
</script>

