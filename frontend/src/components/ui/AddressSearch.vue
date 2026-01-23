<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <p v-if="description" class="text-xs text-gray-500 mb-1">{{ description }}</p>
    
    <!-- Google Places Autocomplete Input -->
    <div class="relative">
      <input
        ref="addressInput"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
        @input="handleInput"
      />
      <div v-if="suggestions.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="selectAddress(suggestion)"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {{ suggestion.description }}
        </div>
      </div>
    </div>
    
    <!-- Parsed Address Fields -->
    <div v-if="parsedAddress" class="mt-2 space-y-2">
      <input
        v-model="parsedAddress.street"
        type="text"
        placeholder="Street Address"
        class="w-full px-3 py-2 border border-gray-300 rounded-md"
        @input="updateAddress"
      />
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model="parsedAddress.city"
          type="text"
          placeholder="City"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          @input="updateAddress"
        />
        <input
          v-model="parsedAddress.state"
          type="text"
          placeholder="State"
          maxlength="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md uppercase"
          @input="updateAddress"
        />
      </div>
      <input
        v-model="parsedAddress.zip"
        type="text"
        placeholder="Zip Code"
        class="w-full px-3 py-2 border border-gray-300 rounded-md"
        @input="updateAddress"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  label: String,
  modelValue: String,
  required: Boolean,
  description: String,
  placeholder: String,
  apiKey: String
})

const emit = defineEmits(['update:modelValue', 'address-selected'])

const addressInput = ref(null)
const suggestions = ref([])
const parsedAddress = ref(null)
let autocompleteService = null
let placesService = null

onMounted(() => {
  if (props.apiKey && window.google) {
    initGooglePlaces()
  } else if (props.apiKey) {
    loadGoogleMapsScript()
  }
})

const loadGoogleMapsScript = () => {
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    initGooglePlaces()
    return
  }
  
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=places`
  script.async = true
  script.defer = true
  script.onload = () => initGooglePlaces()
  document.head.appendChild(script)
}

const initGooglePlaces = () => {
  if (!window.google || !window.google.maps) return
  
  autocompleteService = new window.google.maps.places.AutocompleteService()
  placesService = new window.google.maps.places.PlacesService(document.createElement('div'))
}

const handleInput = (e) => {
  const value = e.target.value
  emit('update:modelValue', value)
  
  if (!autocompleteService || value.length < 3) {
    suggestions.value = []
    return
  }
  
  autocompleteService.getPlacePredictions(
    {
      input: value,
      componentRestrictions: { country: 'us' }
    },
    (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        suggestions.value = predictions || []
      } else {
        suggestions.value = []
      }
    }
  )
}

const selectAddress = (place) => {
  suggestions.value = []
  emit('update:modelValue', place.description)
  
  // Get place details
  placesService.getDetails(
    { placeId: place.place_id },
    (placeDetails, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        parseAddressComponents(placeDetails)
        emit('address-selected', parsedAddress.value)
      }
    }
  )
}

const parseAddressComponents = (place) => {
  const address = {
    street: '',
    city: '',
    state: '',
    zip: ''
  }
  
  place.address_components.forEach(component => {
    const types = component.types
    
    if (types.includes('street_number') || types.includes('route')) {
      address.street = (address.street + ' ' + component.long_name).trim()
    }
    if (types.includes('locality')) {
      address.city = component.long_name
    }
    if (types.includes('administrative_area_level_1')) {
      address.state = component.short_name
    }
    if (types.includes('postal_code')) {
      address.zip = component.long_name
    }
  })
  
  parsedAddress.value = address
}

const updateAddress = () => {
  if (parsedAddress.value) {
    emit('address-selected', parsedAddress.value)
  }
}
</script>

