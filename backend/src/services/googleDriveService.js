import { google } from 'googleapis'
import { Readable } from 'stream'
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
 * @returns {Object} Object containing driveClient, baseFolderId, and sharedDriveId
 */
async function initializeDriveClient() {
  const db = getDatabase()
  const clientId = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_id')
  const clientSecret = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_client_secret')
  const refreshToken = db.prepare('SELECT value FROM settings WHERE key = ? AND is_encrypted = 1').get('google_refresh_token')
  const baseFolderId = db.prepare('SELECT value FROM settings WHERE key = ?').get('google_drive_base_folder_id')
  const sharedDriveId = db.prepare('SELECT value FROM settings WHERE key = ?').get('google_shared_drive_id')

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

  return {
    driveClient,
    baseFolderId: baseFolderId?.value || null,
    sharedDriveId: sharedDriveId?.value || null
  }
}

/**
 * Find or create employee folder in Google Drive
 * Creates folder structure: BaseFolder/FirstNameLastName/
 * Supports both My Drive and Shared Drives
 */
async function getOrCreateEmployeeFolder(applicant) {
  const { driveClient, baseFolderId, sharedDriveId } = await initializeDriveClient()
  const parentFolderId = baseFolderId || (sharedDriveId || 'root')
  const isSharedDrive = !!sharedDriveId

  const folderName = `${applicant.first_name}${applicant.last_name}`.replace(/\s/g, '')

  // Build search query
  const searchParams = {
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  }

  // Add Shared Drive specific parameters
  if (isSharedDrive) {
    searchParams.corpora = 'drive'
    searchParams.driveId = sharedDriveId
  }

  // Search for existing folder
  const response = await driveClient.files.list(searchParams)

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id
  }

  // Create new folder
  const createParams = {
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : []
    },
    fields: 'id',
    supportsAllDrives: true
  }

  const folderResponse = await driveClient.files.create(createParams)

  return folderResponse.data.id
}

/**
 * Upload file buffer directly to Google Drive (no local storage)
 * Supports both My Drive and Shared Drives
 * Sets permissions to make file viewable by anyone with the link
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

    // Upload file directly from buffer with Shared Drive support
    // Convert Buffer to Readable stream for Google Drive API
    const stream = Readable.from(fileBuffer)

    const response = await driveClient.files.create({
      requestBody: {
        name: filename,
        parents: [employeeFolderId]
      },
      media: {
        mimeType: mimeType,
        body: stream
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true
    })

    const fileId = response.data.id

    // Set permission to make file viewable by anyone with the link
    try {
      await driveClient.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        },
        supportsAllDrives: true
      })
      console.log(`Set public viewer permission for file: ${fileId}`)
    } catch (permError) {
      // Log permission error but don't fail the upload
      // Some Shared Drives may have policies that prevent this
      console.warn(`Could not set public permission for file ${fileId}:`, permError.message)
    }

    // Get updated webViewLink after permission is set
    let webViewLink = response.data.webViewLink
    if (!webViewLink) {
      try {
        const metadata = await driveClient.files.get({
          fileId: fileId,
          fields: 'webViewLink',
          supportsAllDrives: true
        })
        webViewLink = metadata.data.webViewLink
      } catch (metaError) {
        console.warn('Could not retrieve webViewLink:', metaError.message)
      }
    }

    return {
      fileId: fileId,
      webViewLink: webViewLink || null
    }
  } catch (error) {
    console.error('Google Drive upload error:', error)
    throw error
  }
}

/**
 * Download file from Google Drive by file ID
 * Supports both My Drive and Shared Drives
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Buffer>} File content as buffer
 */
export async function downloadFromGoogleDrive(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()

    const response = await driveClient.files.get({
      fileId: fileId,
      alt: 'media',
      supportsAllDrives: true
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
 * Supports both My Drive and Shared Drives
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} File metadata
 */
export async function getFileMetadata(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()

    const response = await driveClient.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
      supportsAllDrives: true
    })

    return response.data
  } catch (error) {
    console.error('Google Drive get metadata error:', error)
    throw error
  }
}

/**
 * Delete file from Google Drive
 * Supports both My Drive and Shared Drives
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromGoogleDrive(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()
    await driveClient.files.delete({
      fileId,
      supportsAllDrives: true
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
 * Supports both My Drive and Shared Drives
 * @param {string} folderId - Parent folder ID (default: 'root')
 * @param {string} sharedDriveId - Optional Shared Drive ID
 * @returns {Promise<Array>} List of folders
 */
export async function listFolders(folderId = 'root', sharedDriveId = null) {
  try {
    const { driveClient } = await initializeDriveClient()

    const params = {
      q: `mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    }

    // Add Shared Drive specific parameters
    if (sharedDriveId) {
      params.corpora = 'drive'
      params.driveId = sharedDriveId
    }

    const response = await driveClient.files.list(params)

    return response.data.files || []
  } catch (error) {
    console.error('Google Drive list folders error:', error)
    throw error
  }
}

/**
 * Get folder information by ID
 * Supports both My Drive and Shared Drives
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Object>} Folder metadata
 */
export async function getFolderInfo(folderId) {
  try {
    const { driveClient } = await initializeDriveClient()

    const response = await driveClient.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
      supportsAllDrives: true
    })

    return response.data
  } catch (error) {
    console.error('Google Drive get folder info error:', error)
    throw error
  }
}

/**
 * List available Shared Drives
 * @returns {Promise<Array>} List of Shared Drives the user has access to
 */
export async function listSharedDrives() {
  try {
    const { driveClient } = await initializeDriveClient()

    const response = await driveClient.drives.list({
      fields: 'drives(id, name)',
      pageSize: 100
    })

    return response.data.drives || []
  } catch (error) {
    console.error('Google Drive list shared drives error:', error)
    throw error
  }
}

/**
 * Get Shared Drive information by ID
 * @param {string} driveId - Shared Drive ID
 * @returns {Promise<Object>} Shared Drive metadata
 */
export async function getSharedDriveInfo(driveId) {
  try {
    const { driveClient } = await initializeDriveClient()

    const response = await driveClient.drives.get({
      driveId: driveId,
      fields: 'id, name'
    })

    return response.data
  } catch (error) {
    console.error('Google Drive get shared drive info error:', error)
    throw error
  }
}

/**
 * Set public viewer permission on a file
 * Makes the file viewable by anyone with the link
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<boolean>} Success status
 */
export async function setPublicViewerPermission(fileId) {
  try {
    const { driveClient } = await initializeDriveClient()

    await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      supportsAllDrives: true
    })

    console.log(`Set public viewer permission for file: ${fileId}`)
    return true
  } catch (error) {
    console.error(`Error setting permission for file ${fileId}:`, error.message)
    return false
  }
}

/**
 * Fix permissions on all existing Google Drive files in the database
 * Sets public viewer permission on each file
 * @returns {Promise<{total: number, success: number, failed: number, errors: Array}>}
 */
export async function fixAllFilePermissions() {
  const db = getDatabase()
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  }

  try {
    // Get all form submissions with Google Drive IDs
    const submissions = db.prepare(`
      SELECT id, google_drive_id, pdf_filename 
      FROM form_submissions 
      WHERE google_drive_id IS NOT NULL AND google_drive_id != ''
    `).all()

    // Get all I-9 documents with Google Drive IDs
    const i9Docs = db.prepare(`
      SELECT id, google_drive_id, file_name 
      FROM i9_documents 
      WHERE google_drive_id IS NOT NULL AND google_drive_id != ''
    `).all()

    const allFiles = [
      ...submissions.map(s => ({ type: 'submission', id: s.id, driveId: s.google_drive_id, name: s.pdf_filename })),
      ...i9Docs.map(d => ({ type: 'i9_document', id: d.id, driveId: d.google_drive_id, name: d.file_name }))
    ]

    results.total = allFiles.length

    for (const file of allFiles) {
      const success = await setPublicViewerPermission(file.driveId)
      if (success) {
        results.success++
      } else {
        results.failed++
        results.errors.push({
          type: file.type,
          id: file.id,
          driveId: file.driveId,
          name: file.name
        })
      }
    }

    return results
  } catch (error) {
    console.error('Error fixing file permissions:', error)
    throw error
  }
}

