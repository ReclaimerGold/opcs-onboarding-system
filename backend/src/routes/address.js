import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { decryptText } from '../services/encryptionService.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

/**
 * Check if Google Address Validation API is configured
 * @returns {string|null} API key or null if not configured
 */
function getAddressValidationApiKey() {
  const db = getDatabase()
  const setting = db.prepare('SELECT value, is_encrypted FROM settings WHERE key = ?').get('google_address_validation_api_key')
  
  if (setting && setting.value) {
    return setting.is_encrypted ? decryptText(setting.value) : setting.value
  }
  return null
}

/**
 * POST /api/address/validate
 * Validate an address using Google Address Validation API
 */
router.post('/validate', async (req, res) => {
  try {
    const { address } = req.body
    
    if (!address || address.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Address is required and must be at least 5 characters' 
      })
    }
    
    const apiKey = getAddressValidationApiKey()
    
    if (!apiKey) {
      return res.status(503).json({ 
        success: false, 
        error: 'Address validation not configured' 
      })
    }
    
    // Call Google Address Validation API
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: {
            regionCode: 'US',
            addressLines: [address]
          },
          enableUspsCass: true // Enable USPS CASS for better US address validation
        })
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google Address Validation API error:', response.status, errorData)
      return res.status(502).json({ 
        success: false, 
        error: 'Address validation service error' 
      })
    }
    
    const data = await response.json()
    
    if (!data.result) {
      return res.json({ 
        success: false, 
        error: 'No validation result returned' 
      })
    }
    
    const {result} = data
    const verdict = result.verdict || {}
    const addressData = result.address || {}
    const postalAddress = addressData.postalAddress || {}
    
    // Extract address components
    const addressComponents = {}
    if (addressData.addressComponents) {
      for (const component of addressData.addressComponents) {
        const type = component.componentType
        const value = component.componentName?.text || ''
        
        switch (type) {
          case 'street_number':
            addressComponents.streetNumber = value
            break
          case 'route':
            addressComponents.route = value
            break
          case 'locality':
            addressComponents.city = value
            break
          case 'administrative_area_level_1':
            addressComponents.state = value
            break
          case 'postal_code':
            addressComponents.zip = value
            break
          case 'postal_code_suffix':
            addressComponents.zipSuffix = value
            break
        }
      }
    }
    
    // Build street address
    let street = ''
    if (addressComponents.streetNumber) {
      street = addressComponents.streetNumber
    }
    if (addressComponents.route) {
      street = street ? `${street} ${addressComponents.route}` : addressComponents.route
    }
    
    // Use formatted address lines if available
    if (!street && postalAddress.addressLines && postalAddress.addressLines.length > 0) {
      street = postalAddress.addressLines[0]
    }
    
    // Determine if address was corrected
    const corrected = verdict.hasReplacedComponents || 
                      verdict.hasInferredComponents || 
                      verdict.addressComplete === false
    
    // Build formatted full address
    const formattedAddress = addressData.formattedAddress || 
      `${street}, ${addressComponents.city || postalAddress.locality || ''}, ${addressComponents.state || postalAddress.administrativeArea || ''} ${addressComponents.zip || postalAddress.postalCode || ''}`.trim()
    
    // Determine overall quality
    const isValid = verdict.addressComplete !== false && 
                    verdict.validationGranularity !== 'OTHER' &&
                    (verdict.validationGranularity === 'PREMISE' || 
                     verdict.validationGranularity === 'SUB_PREMISE' ||
                     verdict.validationGranularity === 'PREMISE_PROXIMITY')
    
    res.json({
      success: true,
      corrected,
      isValid,
      formattedAddress,
      address: {
        street: street || '',
        city: addressComponents.city || postalAddress.locality || '',
        state: addressComponents.state || postalAddress.administrativeArea || '',
        zip: addressComponents.zip || postalAddress.postalCode || ''
      },
      verdict: {
        addressComplete: verdict.addressComplete,
        validationGranularity: verdict.validationGranularity,
        hasInferredComponents: verdict.hasInferredComponents,
        hasReplacedComponents: verdict.hasReplacedComponents
      }
    })
  } catch (error) {
    console.error('Address validation error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Address validation failed' 
    })
  }
})

/**
 * GET /api/address/status
 * Check if address validation is configured
 */
router.get('/status', (req, res) => {
  const apiKey = getAddressValidationApiKey()
  res.json({ 
    configured: !!apiKey 
  })
})

export default router

