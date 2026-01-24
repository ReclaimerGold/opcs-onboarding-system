import { google } from 'googleapis'
import { getDatabase } from '../database/init.js'
import { decryptText } from './encryptionService.js'

let driveClient = null

/**
 * Check if Google Drive credentials are configured
 * @returns {boolean} True if credentials are available
 */
export function isGoogleDriveConfigured() {
  const db = getDatabase()
  const clientId = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_id')
  const clientSecret = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_secret')
  const refreshToken = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_refresh_token')
  
  // Must check both that the row exists AND that the value is not empty
  return !!(clientId?.value && clientSecret?.value && refreshToken?.value)
}

/**
 * Initialize Google Drive client with credentials from database
 */
async function initializeDriveClient() {
  const db = getDatabase()
  const clientId = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_id')
  const clientSecret = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_secret')
  const refreshToken = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_refresh_token')
  const baseFolderId = db.prepare('SELECT value FROM settings WHERE key = ?').get('google_drive_base_folder_id')
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials not configured. Please set them in Settings.')
  }
  
  // Decrypt credentials
  const decryptedClientId = decryptText(clientId.value)
  const decryptedClientSecret = decryptText(clientSecret.value)
  const decryptedRefreshToken = decryptText(refreshToken.value)
  
  const oauth2Client = new google.auth.OAuth2(
    decryptedClientId,
    decryptedClientSecret,
    'http://localhost:3000/oauth2callback' // Redirect URI
  )
  
  oauth2Client.setCredentials({
    refresh_token: decryptedRefreshToken
  })
  
  driveClient = google.drive({
    version: 'v3',
    auth: oauth2Client
  })
  
  return { driveClient, baseFolderId: baseFolderId?.value || null }
}

/**
 * Find or create employee folder in Google Drive
 * Creates folder structure: BaseFolder/FirstNameLastName/
 */
async function getOrCreateEmployeeFolder(applicant) {
  const { driveClient, baseFolderId } = await initializeDriveClient()
  const parentFolderId = baseFolderId || 'root'
  
  const folderName = `${applicant.first_name}${applicant.last_name}`.replace(/\s/g, '')
  
  // Search for existing folder
  const response = await driveClient.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id, name)'
  })
  
  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id
  }
  
  // Create new folder
  const folderResponse = await driveClient.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : []
    },
    fields: 'id'
  })
  
  return folderResponse.data.id
}

/**
 * Upload file buffer directly to Google Drive (no local storage)
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} filename - Name for the file in Drive
 * @param {Object} applicant - Applicant object with first_name and last_name
 * @param {string} mimeType - MIME type (default: 'application/pdf')
 * @returns {Promise<{fileId: string, webViewLink: string}>} Google Drive file ID and web view link
 */
export async function uploadToGoogleDrive(fileBuffer, filename, applicant, mimeType = 'application/pdf') {
  try {
    const { driveClient } = await initializeDriveClient()
    const employeeFolderId = await getOrCreateEmployeeFolder(applicant)
    
    // Upload file directly from buffer
    const response = await driveClient.files.create({
      requestBody: {
        name: filename,
        parents: [employeeFolderId]
      },
      media: {
        mimeType,
        body: fileBuffer
      },
      fields: 'id, name, webViewLink'
    })
    
    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || null
    }
  } catch (error) {
    console.error('Google Drive upload error:', error)
    throw error
  }
}

/**
 * Download file from Google Drive by file ID
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Buffer>} File content as buffer
 */
export async function downloadFromGoogleDrive(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()
    
    const response = await driveClient.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    })
    
    return Buffer.from(response.data)
  } catch (error) {
    console.error('Google Drive download error:', error)
    throw error
  }
}

/**
 * Get file metadata from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} File metadata
 */
export async function getFileMetadata(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()
    
    const response = await driveClient.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink'
    })
    
    return response.data
  } catch (error) {
    console.error('Google Drive get metadata error:', error)
    throw error
  }
}

/**
 * Delete file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromGoogleDrive(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()
    await driveClient.files.delete({
      fileId
    })
    return true
  } catch (error) {
    console.error('Google Drive delete error:', error)
    // Don't throw - file may already be deleted
    return false
  }
}

/**
 * List folders in Google Drive (for folder picker)
 * @param {string} folderId - Parent folder ID (default: 'root')
 * @returns {Promise<Array>} List of folders
 */
export async function listFolders(folderId = 'root') {
  try {
    const { driveClient } = await initializeDriveClient()
    
    const response = await driveClient.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      orderBy: 'name'
    })
    
    return response.data.files || []
  } catch (error) {
    console.error('Google Drive list folders error:', error)
    throw error
  }
}

/**
 * Get folder information by ID
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Object>} Folder metadata
 */
export async function getFolderInfo(folderId) {
  try {
    const { driveClient } = await initializeDriveClient()
    
    const response = await driveClient.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType'
    })
    
    return response.data
  } catch (error) {
    console.error('Google Drive get folder info error:', error)
    throw error
  }
}

