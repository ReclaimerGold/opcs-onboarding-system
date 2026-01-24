import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { encryptText, decryptText } from '../services/encryptionService.js'
import { listFolders, getFolderInfo } from '../services/googleDriveService.js'

const router = express.Router()

// GET settings can be accessed by authenticated users (for Google Address Validation API key)
// POST settings requires admin

/**
 * GET /api/settings/google-address-validation-key
 * Get Google Address Validation API key (public endpoint for authenticated users)
 */
router.get('/google-address-validation-key', requireAuth, (req, res) => {
  try {
    const db = getDatabase()
    const setting = db.prepare('SELECT value, is_encrypted FROM settings WHERE key = ?').get('google_address_validation_api_key')
    
    if (setting && setting.value) {
      const apiKey = setting.is_encrypted ? decryptText(setting.value) : setting.value
      res.json({ apiKey })
    } else {
      res.json({ apiKey: '' })
    }
  } catch (error) {
    console.error('Get Google Address Validation key error:', error)
    res.json({ apiKey: '' })
  }
})

/**
 * GET /api/settings
 * Get all settings (decrypt sensitive values)
 * Note: Requires authentication, but only admin can see all settings
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDatabase()
    const settings = db.prepare('SELECT key, value, is_encrypted FROM settings').all()
    
    const decryptedSettings = {}
    for (const setting of settings) {
      // Only return Google Address Validation API key for non-admin users
      if (setting.key === 'google_address_validation_api_key') {
        if (setting.is_encrypted) {
          try {
            decryptedSettings[setting.key] = decryptText(setting.value)
          } catch (error) {
            decryptedSettings[setting.key] = ''
          }
        } else {
          decryptedSettings[setting.key] = setting.value
        }
      } else {
        // Other settings only for admin (check if user is admin)
        // For now, return all settings - can be enhanced with proper role checking
        if (setting.is_encrypted) {
          try {
            decryptedSettings[setting.key] = decryptText(setting.value)
          } catch (error) {
            decryptedSettings[setting.key] = ''
          }
        } else {
          decryptedSettings[setting.key] = setting.value
        }
      }
    }
    
    res.json(decryptedSettings)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to retrieve settings' })
  }
})

/**
 * POST /api/settings
 * Update settings (encrypt sensitive values)
 * Requires admin access
 */
router.post('/', requireAdmin, (req, res) => {
  try {
    const db = getDatabase()
    const { settings } = req.body
    
    // Define which settings should be encrypted
    const encryptedKeys = [
      'google_client_id',
      'google_client_secret',
      'google_refresh_token',
      'google_address_validation_api_key'
    ]
    
    for (const [key, value] of Object.entries(settings)) {
      // Skip if value is undefined
      if (value === undefined) continue
      
      const isEncrypted = encryptedKeys.includes(key)
      const finalValue = isEncrypted && value ? encryptText(value) : (value || '')
      
      db.prepare(`
        INSERT INTO settings (key, value, is_encrypted, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = ?,
          is_encrypted = ?,
          updated_at = CURRENT_TIMESTAMP
      `).run(key, finalValue, isEncrypted ? 1 : 0, finalValue, isEncrypted ? 1 : 0)
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

/**
 * GET /api/settings/google-drive/folders
 * List folders in Google Drive (for folder picker)
 * Requires admin access
 */
router.get('/google-drive/folders', requireAdmin, async (req, res) => {
  try {
    const { folderId = 'root' } = req.query
    const folders = await listFolders(folderId)
    res.json({ folders })
  } catch (error) {
    console.error('List folders error:', error)
    res.status(500).json({ error: 'Failed to list folders', details: error.message })
  }
})

/**
 * GET /api/settings/google-drive/folder/:id
 * Get folder information by ID
 * Requires admin access
 */
router.get('/google-drive/folder/:id', requireAdmin, async (req, res) => {
  try {
    const folderInfo = await getFolderInfo(req.params.id)
    res.json(folderInfo)
  } catch (error) {
    console.error('Get folder info error:', error)
    res.status(500).json({ error: 'Failed to get folder information', details: error.message })
  }
})

/**
 * POST /api/settings/test/google-drive
 * Test Google Drive API connection with current credentials
 * Requires admin access
 */
router.post('/test/google-drive', requireAdmin, async (req, res) => {
  try {
    const db = getDatabase()
    
    // Get credentials from database
    const clientId = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_id')
    const clientSecret = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_secret')
    const refreshToken = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_refresh_token')
    
    if (!clientId || !clientSecret || !refreshToken) {
      return res.json({ 
        success: false, 
        error: 'Google Drive credentials not configured. Please enter Client ID, Client Secret, and Refresh Token.' 
      })
    }
    
    // Try to list folders to test connection
    try {
      const folders = await listFolders('root')
      res.json({ 
        success: true, 
        message: `Connection successful! Found ${folders.length} folder(s) in root directory.`,
        folderCount: folders.length
      })
    } catch (driveError) {
      res.json({ 
        success: false, 
        error: `Connection failed: ${driveError.message}` 
      })
    }
  } catch (error) {
    console.error('Google Drive test error:', error)
    res.json({ success: false, error: 'Test failed: ' + error.message })
  }
})

/**
 * POST /api/settings/test/address-validation
 * Test Google Address Validation API connection
 * Requires admin access
 */
router.post('/test/address-validation', requireAdmin, async (req, res) => {
  try {
    const db = getDatabase()
    
    // Get API key from database
    const setting = db.prepare('SELECT value, is_encrypted FROM settings WHERE key = ?').get('google_address_validation_api_key')
    
    if (!setting || !setting.value) {
      return res.json({ 
        success: false, 
        error: 'Google Address Validation API key not configured.' 
      })
    }
    
    const apiKey = setting.is_encrypted ? decryptText(setting.value) : setting.value
    
    // Test with a sample address
    const testAddress = '1600 Amphitheatre Parkway, Mountain View, CA'
    
    try {
      const response = await fetch(
        `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: {
              regionCode: 'US',
              addressLines: [testAddress]
            }
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`
        return res.json({ 
          success: false, 
          error: `API error: ${errorMessage}` 
        })
      }
      
      const data = await response.json()
      
      if (data.result) {
        res.json({ 
          success: true, 
          message: 'Connection successful! Address Validation API is working.',
          testResult: {
            addressComplete: data.result.verdict?.addressComplete,
            validationGranularity: data.result.verdict?.validationGranularity
          }
        })
      } else {
        res.json({ 
          success: false, 
          error: 'API returned no result' 
        })
      }
    } catch (fetchError) {
      res.json({ 
        success: false, 
        error: `Connection failed: ${fetchError.message}` 
      })
    }
  } catch (error) {
    console.error('Address Validation test error:', error)
    res.json({ success: false, error: 'Test failed: ' + error.message })
  }
})

/**
 * GET /api/settings/google-drive/browse
 * Browse Google Drive folders with search capability
 * Requires admin access
 */
router.get('/google-drive/browse', requireAdmin, async (req, res) => {
  try {
    const { parentId = 'root', search = '' } = req.query
    
    // Import the function to initialize drive client
    const { google } = await import('googleapis')
    const db = getDatabase()
    
    const clientId = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_id')
    const clientSecret = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_secret')
    const refreshToken = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_refresh_token')
    
    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({ error: 'Google Drive credentials not configured' })
    }
    
    const decryptedClientId = decryptText(clientId.value)
    const decryptedClientSecret = decryptText(clientSecret.value)
    const decryptedRefreshToken = decryptText(refreshToken.value)
    
    const oauth2Client = new google.auth.OAuth2(
      decryptedClientId,
      decryptedClientSecret,
      'http://localhost:3000/oauth2callback'
    )
    
    oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken })
    
    const driveClient = google.drive({ version: 'v3', auth: oauth2Client })
    
    // Build query
    let query = `mimeType='application/vnd.google-apps.folder' and trashed=false`
    
    if (search) {
      // Search by name
      query += ` and name contains '${search.replace(/'/g, "\\'")}'`
    } else {
      // Browse by parent
      query += ` and '${parentId}' in parents`
    }
    
    const response = await driveClient.files.list({
      q: query,
      fields: 'files(id, name, mimeType, parents)',
      orderBy: 'name',
      pageSize: 50
    })
    
    // Get parent folder info if not root
    let parentInfo = null
    if (parentId !== 'root') {
      try {
        const parentResponse = await driveClient.files.get({
          fileId: parentId,
          fields: 'id, name, parents'
        })
        parentInfo = parentResponse.data
      } catch (e) {
        // Parent info not critical
      }
    }
    
    res.json({
      folders: response.data.files || [],
      parentId,
      parentInfo,
      isSearch: !!search
    })
  } catch (error) {
    console.error('Browse folders error:', error)
    res.status(500).json({ error: 'Failed to browse folders', details: error.message })
  }
})

export default router

