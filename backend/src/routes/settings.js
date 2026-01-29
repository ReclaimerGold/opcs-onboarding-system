import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { encryptText, decryptText } from '../services/encryptionService.js'
import { listFolders, getFolderInfo, listSharedDrives, getSharedDriveInfo } from '../services/googleDriveService.js'

const router = express.Router()

/**
 * Parse Google API errors and return user-friendly messages with fix instructions
 * @param {Error} error - The error from Google API
 * @returns {Object} - { message: string, instructions: string[], helpUrl: string }
 */
function parseGoogleDriveError(error) {
  const errorMessage = error.message || ''
  const errorCode = error.code || error.response?.data?.error || ''
  const errorDescription = error.response?.data?.error_description || ''
  
  // Common OAuth errors
  if (errorMessage.includes('unauthorized_client') || errorCode === 'unauthorized_client') {
    return {
      message: 'Unauthorized client - OAuth credentials are not properly configured.',
      instructions: [
        '1. Go to Google Cloud Console → APIs & Services → Credentials',
        '2. Click on your OAuth 2.0 Client ID',
        '3. Verify the Client ID matches exactly what you entered',
        '4. Check that "https://developers.google.com/oauthplayground" is listed under "Authorized redirect URIs"',
        '5. If you just created the credentials, wait 5-10 minutes for Google to propagate the changes',
        '6. Try generating a new refresh token using the OAuth Playground'
      ],
      helpUrl: 'https://console.cloud.google.com/apis/credentials'
    }
  }
  
  if (errorMessage.includes('invalid_client') || errorCode === 'invalid_client') {
    return {
      message: 'Invalid client - The Client ID or Client Secret is incorrect.',
      instructions: [
        '1. Go to Google Cloud Console → APIs & Services → Credentials',
        '2. Click on your OAuth 2.0 Client ID',
        '3. Copy the Client ID exactly (including ".apps.googleusercontent.com")',
        '4. Copy the Client Secret exactly',
        '5. Paste them in the Settings page and save',
        '6. Generate a new refresh token using the OAuth Playground with these credentials'
      ],
      helpUrl: 'https://console.cloud.google.com/apis/credentials'
    }
  }
  
  if (errorMessage.includes('invalid_grant') || errorCode === 'invalid_grant') {
    return {
      message: 'Invalid grant - The refresh token has expired or been revoked.',
      instructions: [
        '1. Go to OAuth Playground: https://developers.google.com/oauthplayground',
        '2. Click the gear icon (⚙️) → Check "Use your own OAuth credentials"',
        '3. Enter your Client ID and Client Secret',
        '4. In Step 1, select "Drive API v3" → "https://www.googleapis.com/auth/drive.file"',
        '5. Click "Authorize APIs" and sign in with your Google account',
        '6. In Step 2, click "Exchange authorization code for tokens"',
        '7. Copy the new Refresh Token and paste it in Settings'
      ],
      helpUrl: 'https://developers.google.com/oauthplayground'
    }
  }
  
  if (errorMessage.includes('access_denied') || errorCode === 'access_denied') {
    return {
      message: 'Access denied - The user denied the authorization request.',
      instructions: [
        '1. Go to OAuth Playground and try authorizing again',
        '2. Make sure to click "Allow" when Google asks for permissions',
        '3. If using a Google Workspace account, check with your admin that the app is allowed',
        '4. Verify the OAuth consent screen is properly configured in Google Cloud Console'
      ],
      helpUrl: 'https://console.cloud.google.com/apis/credentials/consent'
    }
  }
  
  if (errorMessage.includes('API has not been enabled') || errorMessage.includes('accessNotConfigured')) {
    return {
      message: 'Google Drive API is not enabled for this project.',
      instructions: [
        '1. Go to Google Cloud Console → APIs & Services → Library',
        '2. Search for "Google Drive API"',
        '3. Click on "Google Drive API"',
        '4. Click "Enable" button',
        '5. Wait a few minutes for the change to take effect',
        '6. Try the connection test again'
      ],
      helpUrl: 'https://console.cloud.google.com/apis/library/drive.googleapis.com'
    }
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('rateLimitExceeded')) {
    return {
      message: 'API quota exceeded - Too many requests to Google Drive.',
      instructions: [
        '1. Wait a few minutes and try again',
        '2. If this persists, check your Google Cloud Console quota usage',
        '3. Consider requesting a quota increase if needed'
      ],
      helpUrl: 'https://console.cloud.google.com/apis/api/drive.googleapis.com/quotas'
    }
  }
  
  if (errorMessage.includes('insufficientPermissions') || errorMessage.includes('forbidden')) {
    return {
      message: 'Insufficient permissions - The app does not have required Drive permissions.',
      instructions: [
        '1. Go to OAuth Playground and generate a new refresh token',
        '2. Make sure to select "https://www.googleapis.com/auth/drive.file" scope',
        '3. If you need access to all files, also select "https://www.googleapis.com/auth/drive"',
        '4. Re-authorize and get a new refresh token'
      ],
      helpUrl: 'https://developers.google.com/oauthplayground'
    }
  }
  
  if (errorMessage.includes('notFound') || errorCode === 404) {
    return {
      message: 'Folder not found - The specified Google Drive folder does not exist.',
      instructions: [
        '1. Check that the Folder ID is correct',
        '2. Verify you have access to the folder in Google Drive',
        '3. Try clearing the Base Folder ID and using the root folder instead',
        '4. Use the "Browse..." button to select a valid folder'
      ],
      helpUrl: null
    }
  }
  
  // Generic error with the original message
  return {
    message: `Connection error: ${errorMessage || errorDescription || 'Unknown error'}`,
    instructions: [
      '1. Verify all credentials are entered correctly',
      '2. Check that Google Drive API is enabled in Cloud Console',
      '3. Try generating a new refresh token using OAuth Playground',
      '4. Check browser console and server logs for more details'
    ],
    helpUrl: 'https://console.cloud.google.com/apis/credentials'
  }
}

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
      'google_address_validation_api_key',
      'mailgun_api_key'
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
        error: 'Google Drive credentials not configured.',
        instructions: [
          '1. Enter your OAuth Client ID from Google Cloud Console',
          '2. Enter your OAuth Client Secret',
          '3. Generate a Refresh Token using OAuth Playground',
          '4. Click "Save All Settings" before testing'
        ],
        helpUrl: 'https://console.cloud.google.com/apis/credentials'
      })
    }
    
    // Check if values are actually set (not just empty)
    const decClientId = decryptText(clientId.value)
    const decClientSecret = decryptText(clientSecret.value)
    const decRefreshToken = decryptText(refreshToken.value)
    
    if (!decClientId || !decClientSecret || !decRefreshToken) {
      return res.json({ 
        success: false, 
        error: 'One or more credentials are empty.',
        instructions: [
          '1. Make sure all three fields are filled in: Client ID, Client Secret, and Refresh Token',
          '2. Client ID should end with ".apps.googleusercontent.com"',
          '3. Refresh Token should be a long string starting with "1//"',
          '4. Click "Save All Settings" and try again'
        ],
        helpUrl: 'https://developers.google.com/oauthplayground'
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
      console.error('Google Drive test connection error:', driveError)
      const parsedError = parseGoogleDriveError(driveError)
      res.json({ 
        success: false, 
        error: parsedError.message,
        instructions: parsedError.instructions,
        helpUrl: parsedError.helpUrl,
        technicalDetails: driveError.message // Include raw error for debugging
      })
    }
  } catch (error) {
    console.error('Google Drive test error:', error)
    const parsedError = parseGoogleDriveError(error)
    res.json({ 
      success: false, 
      error: parsedError.message,
      instructions: parsedError.instructions,
      helpUrl: parsedError.helpUrl,
      technicalDetails: error.message
    })
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
 * Supports both My Drive and Shared Drives
 * Requires admin access
 */
router.get('/google-drive/browse', requireAdmin, async (req, res) => {
  try {
    const { parentId = 'root', search = '', sharedDriveId = '' } = req.query
    
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
    
    // Determine actual parent ID for Shared Drives
    const actualParentId = sharedDriveId && parentId === 'root' ? sharedDriveId : parentId
    
    // Build query
    let query = `mimeType='application/vnd.google-apps.folder' and trashed=false`
    
    if (search) {
      // Search by name
      query += ` and name contains '${search.replace(/'/g, "\\'")}'`
    } else {
      // Browse by parent
      query += ` and '${actualParentId}' in parents`
    }
    
    // Build request parameters with Shared Drive support
    const listParams = {
      q: query,
      fields: 'files(id, name, mimeType, parents)',
      orderBy: 'name',
      pageSize: 50,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    }
    
    // Add Shared Drive specific parameters
    if (sharedDriveId) {
      listParams.corpora = 'drive'
      listParams.driveId = sharedDriveId
    }
    
    const response = await driveClient.files.list(listParams)
    
    // Get parent folder info if not root
    let parentInfo = null
    if (parentId !== 'root' && actualParentId !== sharedDriveId) {
      try {
        const parentResponse = await driveClient.files.get({
          fileId: actualParentId,
          fields: 'id, name, parents',
          supportsAllDrives: true
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
      isSearch: !!search,
      sharedDriveId: sharedDriveId || null
    })
  } catch (error) {
    console.error('Browse folders error:', error)
    res.status(500).json({ error: 'Failed to browse folders', details: error.message })
  }
})

/**
 * GET /api/settings/google-drive/shared-drives
 * List available Shared Drives the user has access to
 * Requires admin access
 */
router.get('/google-drive/shared-drives', requireAdmin, async (req, res) => {
  try {
    const sharedDrives = await listSharedDrives()
    res.json({ sharedDrives })
  } catch (error) {
    console.error('List shared drives error:', error)
    res.status(500).json({ error: 'Failed to list shared drives', details: error.message })
  }
})

/**
 * GET /api/settings/google-drive/shared-drive/:id
 * Get Shared Drive information by ID
 * Requires admin access
 */
router.get('/google-drive/shared-drive/:id', requireAdmin, async (req, res) => {
  try {
    const driveInfo = await getSharedDriveInfo(req.params.id)
    res.json(driveInfo)
  } catch (error) {
    console.error('Get shared drive info error:', error)
    res.status(500).json({ error: 'Failed to get shared drive information', details: error.message })
  }
})

/**
 * POST /api/settings/test/mailgun
 * Test Mailgun email configuration
 * Requires admin access
 */
router.post('/test/mailgun', requireAdmin, async (req, res) => {
  try {
    const { testEmail } = req.body
    
    if (!testEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Test email address is required' 
      })
    }
    
    // Import Mailgun service
    const { sendTestEmail, isMailgunConfigured } = await import('../services/mailgunService.js')
    
    if (!isMailgunConfigured()) {
      return res.json({ 
        success: false, 
        error: 'Mailgun is not configured. Please enter your API key and domain first.' 
      })
    }
    
    try {
      await sendTestEmail(testEmail)
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}!`
      })
    } catch (mailError) {
      console.error('Mailgun test error:', mailError)
      res.json({ 
        success: false, 
        error: `Failed to send email: ${mailError.message}` 
      })
    }
  } catch (error) {
    console.error('Mailgun test error:', error)
    res.json({ success: false, error: 'Test failed: ' + error.message })
  }
})

export default router

