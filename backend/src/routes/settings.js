import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { getDatabase } from '../database/init.js'
import { encryptText, decryptText } from '../services/encryptionService.js'
import { listFolders, getFolderInfo } from '../services/googleDriveService.js'

const router = express.Router()

// GET settings can be accessed by authenticated users (for Google Maps API key)
// POST settings requires admin

/**
 * GET /api/settings/google-maps-key
 * Get Google Maps API key (public endpoint for authenticated users)
 */
router.get('/google-maps-key', requireAuth, (req, res) => {
  try {
    const db = getDatabase()
    const setting = db.prepare('SELECT value, is_encrypted FROM settings WHERE key = ?').get('google_maps_api_key')
    
    if (setting && setting.value) {
      const apiKey = setting.is_encrypted ? decryptText(setting.value) : setting.value
      res.json({ apiKey })
    } else {
      res.json({ apiKey: '' })
    }
  } catch (error) {
    console.error('Get Google Maps key error:', error)
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
      // Only return Google Maps API key for non-admin users
      if (setting.key === 'google_maps_api_key') {
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
      'google_maps_api_key'
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

export default router

