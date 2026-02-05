/**
 * PDF Template Service
 * Downloads, caches, and manages official IRS/USCIS fillable PDF templates
 * Supports version history - archives previous versions when updates are detected
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { PDFDocument } from 'pdf-lib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Template storage directory
const TEMPLATE_DIR = path.join(__dirname, '../../storage/pdf-templates')

// Official PDF download URLs
const TEMPLATE_SOURCES = {
  W4: {
    url: 'https://www.irs.gov/pub/irs-pdf/fw4.pdf',
    filename: 'fw4-latest.pdf',
    name: 'Form W-4',
    agency: 'IRS'
  },
  I9: {
    url: 'https://www.uscis.gov/sites/default/files/document/forms/i-9-paper-version.pdf',
    filename: 'i9-latest.pdf',
    name: 'Form I-9',
    agency: 'USCIS'
  },
  '8850': {
    url: 'https://www.irs.gov/pub/irs-pdf/f8850.pdf',
    filename: 'f8850-latest.pdf',
    name: 'Form 8850',
    agency: 'IRS'
  }
}

// Update check interval (24 hours in milliseconds)
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000

// In-memory cache for loaded templates
const templateCache = new Map()

/**
 * Calculate SHA256 checksum of a buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} Hex checksum
 */
function calculateChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Get the directory path for a specific form type
 * @param {string} formType - Form type (W4, I9, 8850)
 * @returns {string} Directory path
 */
function getFormDir(formType) {
  const dirMap = {
    W4: 'w4',
    I9: 'i9',
    '8850': '8850'
  }
  return path.join(TEMPLATE_DIR, dirMap[formType] || formType.toLowerCase())
}

/**
 * Get the archive directory path for a form type
 * @param {string} formType - Form type
 * @returns {string} Archive directory path
 */
function getArchiveDir(formType) {
  return path.join(getFormDir(formType), 'archive')
}

/**
 * Get metadata file path for a form type
 * @param {string} formType - Form type
 * @returns {string} Metadata file path
 */
function getMetadataPath(formType) {
  return path.join(getFormDir(formType), 'metadata.json')
}

/**
 * Get template file path for a form type
 * @param {string} formType - Form type
 * @returns {string} Template file path
 */
function getTemplatePath(formType) {
  const source = TEMPLATE_SOURCES[formType]
  if (!source) {
    throw new Error(`Unknown form type: ${formType}`)
  }
  return path.join(getFormDir(formType), source.filename)
}

/**
 * Extract revision info from PDF metadata
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<Object>} Revision info
 */
async function extractPDFInfo(pdfBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })

    // Get document info
    const title = pdfDoc.getTitle() || ''
    const author = pdfDoc.getAuthor() || ''
    const subject = pdfDoc.getSubject() || ''
    const creator = pdfDoc.getCreator() || ''
    const producer = pdfDoc.getProducer() || ''
    const creationDate = pdfDoc.getCreationDate()
    const modificationDate = pdfDoc.getModificationDate()
    const pageCount = pdfDoc.getPageCount()

    // Try to extract revision from title or subject
    // IRS forms often have format like "Form W-4 (Rev. December 2024)"
    let revision = null
    const revisionMatch = (title + ' ' + subject).match(/\(Rev\.?\s*([^)]+)\)/i)
    if (revisionMatch) {
      revision = revisionMatch[1].trim()
    }

    // Get form fields info
    let formFieldCount = 0
    let formFieldNames = []
    try {
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      formFieldCount = fields.length
      formFieldNames = fields.slice(0, 20).map(f => f.getName()) // First 20 field names
    } catch (e) {
      // Form might not have fillable fields
    }

    return {
      title,
      author,
      subject,
      creator,
      producer,
      revision,
      pageCount,
      formFieldCount,
      formFieldNames,
      creationDate: creationDate?.toISOString() || null,
      modificationDate: modificationDate?.toISOString() || null
    }
  } catch (error) {
    console.warn('Could not extract PDF info:', error.message)
    return {
      title: '',
      revision: null,
      pageCount: 0,
      formFieldCount: 0,
      formFieldNames: []
    }
  }
}

/**
 * Load metadata for a form type
 * @param {string} formType - Form type
 * @returns {Promise<Object|null>} Metadata object or null if not found
 */
async function loadMetadata(formType) {
  try {
    const metadataPath = getMetadataPath(formType)
    const data = await fs.readFile(metadataPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * Save metadata for a form type
 * @param {string} formType - Form type
 * @param {Object} metadata - Metadata to save
 */
async function saveMetadata(formType, metadata) {
  const metadataPath = getMetadataPath(formType)
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
}

/**
 * Archive the current template before replacing it
 * @param {string} formType - Form type
 * @param {Object} metadata - Current metadata
 * @returns {Promise<string|null>} Archive filename or null if nothing to archive
 */
async function archiveCurrentTemplate(formType, metadata) {
  if (!metadata) return null

  const templatePath = getTemplatePath(formType)
  const archiveDir = getArchiveDir(formType)

  try {
    // Check if current template exists
    await fs.access(templatePath)

    // Create archive directory
    await fs.mkdir(archiveDir, { recursive: true })

    // Generate archive filename with revision and date
    const date = new Date(metadata.downloadedAt || Date.now())
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const revision = metadata.pdfInfo?.revision?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown'
    const checksumShort = metadata.checksum?.substring(0, 8) || 'unknown'
    const source = TEMPLATE_SOURCES[formType]
    const ext = path.extname(source.filename)
    const baseName = path.basename(source.filename, ext)

    const archiveFilename = `${baseName}-${revision}-${dateStr}-${checksumShort}${ext}`
    const archivePath = path.join(archiveDir, archiveFilename)

    // Copy current template to archive
    await fs.copyFile(templatePath, archivePath)

    // Save archive metadata
    const archiveMetadata = {
      ...metadata,
      archivedAt: new Date().toISOString(),
      archiveFilename
    }
    const archiveMetadataPath = path.join(archiveDir, `${archiveFilename}.json`)
    await fs.writeFile(archiveMetadataPath, JSON.stringify(archiveMetadata, null, 2))

    console.log(`Archived previous ${source.name} template as ${archiveFilename}`)
    return archiveFilename
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    console.warn(`Failed to archive template for ${formType}:`, error.message)
    return null
  }
}

/**
 * Get list of archived versions for a form type
 * @param {string} formType - Form type
 * @returns {Promise<Array>} List of archived versions with metadata
 */
export async function getArchivedVersions(formType) {
  const archiveDir = getArchiveDir(formType)
  const versions = []

  try {
    const files = await fs.readdir(archiveDir)
    const pdfFiles = files.filter(f => f.endsWith('.pdf'))

    for (const pdfFile of pdfFiles) {
      const metadataPath = path.join(archiveDir, `${pdfFile}.json`)
      let metadata = null

      try {
        const data = await fs.readFile(metadataPath, 'utf-8')
        metadata = JSON.parse(data)
      } catch (e) {
        // Metadata file might not exist for old archives
      }

      const stat = await fs.stat(path.join(archiveDir, pdfFile))

      versions.push({
        filename: pdfFile,
        filePath: path.join(archiveDir, pdfFile),
        fileSize: stat.size,
        archivedAt: metadata?.archivedAt || stat.mtime.toISOString(),
        revision: metadata?.pdfInfo?.revision || 'Unknown',
        checksum: metadata?.checksum || null,
        downloadedAt: metadata?.downloadedAt || null
      })
    }

    // Sort by archived date, newest first
    versions.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Error reading archive for ${formType}:`, error.message)
    }
  }

  return versions
}

/**
 * Download a PDF template from the official source
 * @param {string} formType - Form type (W4, I9, 8850)
 * @returns {Promise<Buffer>} Downloaded PDF buffer
 */
async function downloadTemplate(formType) {
  const source = TEMPLATE_SOURCES[formType]
  if (!source) {
    throw new Error(`Unknown form type: ${formType}`)
  }

  console.log(`Downloading ${source.name} from ${source.agency}...`)

  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'OPCS-Onboarding-System/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to download ${source.name}: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Verify it's a valid PDF
  if (!buffer.slice(0, 5).toString().startsWith('%PDF-')) {
    throw new Error(`Downloaded file for ${source.name} is not a valid PDF`)
  }

  console.log(`Successfully downloaded ${source.name} (${buffer.length} bytes)`)
  return buffer
}

/**
 * Save a template to local storage
 * @param {string} formType - Form type
 * @param {Buffer} pdfBuffer - PDF buffer to save
 * @param {Object} previousMetadata - Previous metadata for archiving
 * @returns {Promise<Object>} Updated metadata
 */
async function saveTemplate(formType, pdfBuffer, previousMetadata = null) {
  const formDir = getFormDir(formType)
  const templatePath = getTemplatePath(formType)

  // Ensure directory exists
  await fs.mkdir(formDir, { recursive: true })

  // Archive the previous version if it exists and checksum is different
  let archivedAs = null
  if (previousMetadata) {
    archivedAs = await archiveCurrentTemplate(formType, previousMetadata)
  }

  // Save the PDF
  await fs.writeFile(templatePath, pdfBuffer)

  // Extract PDF info for revision tracking
  const pdfInfo = await extractPDFInfo(pdfBuffer)

  // Calculate and save metadata
  const checksum = calculateChecksum(pdfBuffer)
  const metadata = {
    formType,
    name: TEMPLATE_SOURCES[formType].name,
    agency: TEMPLATE_SOURCES[formType].agency,
    sourceUrl: TEMPLATE_SOURCES[formType].url,
    checksum,
    fileSize: pdfBuffer.length,
    downloadedAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    pdfInfo,
    previousVersion: archivedAs ? {
      filename: archivedAs,
      checksum: previousMetadata?.checksum,
      revision: previousMetadata?.pdfInfo?.revision
    } : null,
    versionHistory: [
      ...(previousMetadata?.versionHistory || []),
      ...(archivedAs ? [{
        filename: archivedAs,
        checksum: previousMetadata?.checksum,
        revision: previousMetadata?.pdfInfo?.revision,
        downloadedAt: previousMetadata?.downloadedAt,
        archivedAt: new Date().toISOString()
      }] : [])
    ].slice(-10) // Keep last 10 versions in history
  }

  await saveMetadata(formType, metadata)

  // Clear from in-memory cache so it gets reloaded
  templateCache.delete(formType)

  console.log(`Saved ${metadata.name} template (revision: ${pdfInfo.revision || 'unknown'}, checksum: ${checksum.substring(0, 8)}...)`)
  return metadata
}

/**
 * Check if a template needs to be updated
 * @param {string} formType - Form type
 * @returns {Promise<boolean>} True if update is needed
 */
async function needsUpdate(formType) {
  const metadata = await loadMetadata(formType)

  // No metadata means no template - definitely needs download
  if (!metadata) {
    return true
  }

  // Check if last check was more than UPDATE_CHECK_INTERVAL ago
  const lastChecked = new Date(metadata.lastCheckedAt)
  const timeSinceCheck = Date.now() - lastChecked.getTime()

  return timeSinceCheck > UPDATE_CHECK_INTERVAL
}

/**
 * Update a template if a newer version is available
 * @param {string} formType - Form type
 * @param {boolean} force - Force update even if not due
 * @returns {Promise<Object>} Result with updated status and metadata
 */
export async function updateTemplate(formType, force = false) {
  const source = TEMPLATE_SOURCES[formType]
  if (!source) {
    throw new Error(`Unknown form type: ${formType}`)
  }

  const currentMetadata = await loadMetadata(formType)

  // Check if update is needed
  if (!force && currentMetadata) {
    const timeSinceCheck = Date.now() - new Date(currentMetadata.lastCheckedAt).getTime()
    if (timeSinceCheck < UPDATE_CHECK_INTERVAL) {
      return {
        updated: false,
        reason: 'Recently checked',
        metadata: currentMetadata
      }
    }
  }

  try {
    // Download the template
    const pdfBuffer = await downloadTemplate(formType)
    const newChecksum = calculateChecksum(pdfBuffer)

    // Check if it's actually different
    if (currentMetadata && currentMetadata.checksum === newChecksum) {
      // Update last checked time but don't save new file
      currentMetadata.lastCheckedAt = new Date().toISOString()
      await saveMetadata(formType, currentMetadata)

      return {
        updated: false,
        reason: 'No changes detected',
        metadata: currentMetadata
      }
    }

    // Save the new template (will archive the old one)
    const metadata = await saveTemplate(formType, pdfBuffer, currentMetadata)

    return {
      updated: true,
      reason: currentMetadata ? 'New version available' : 'Initial download',
      previousChecksum: currentMetadata?.checksum,
      previousRevision: currentMetadata?.pdfInfo?.revision,
      archivedAs: metadata.previousVersion?.filename,
      metadata
    }
  } catch (error) {
    console.error(`Error updating ${source.name} template:`, error.message)

    // Update last checked time even on failure to prevent constant retries
    if (currentMetadata) {
      currentMetadata.lastCheckedAt = new Date().toISOString()
      currentMetadata.lastError = error.message
      currentMetadata.lastErrorAt = new Date().toISOString()
      await saveMetadata(formType, currentMetadata)
    }

    return {
      updated: false,
      error: error.message,
      metadata: currentMetadata
    }
  }
}

/**
 * Update all templates
 * @param {boolean} force - Force update even if not due
 * @returns {Promise<Object>} Results for each form type
 */
export async function updateAllTemplates(force = false) {
  const results = {}

  for (const formType of Object.keys(TEMPLATE_SOURCES)) {
    try {
      results[formType] = await updateTemplate(formType, force)
    } catch (error) {
      results[formType] = {
        updated: false,
        error: error.message
      }
    }
  }

  return results
}

/**
 * Get the template buffer for a form type
 * @param {string} formType - Form type (W4, I9, 8850)
 * @returns {Promise<Buffer|null>} Template buffer or null if not available
 */
export async function getTemplate(formType) {
  // Check in-memory cache first
  if (templateCache.has(formType)) {
    return templateCache.get(formType)
  }

  const templatePath = getTemplatePath(formType)

  try {
    const buffer = await fs.readFile(templatePath)

    // Cache in memory
    templateCache.set(formType, buffer)

    return buffer
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Template doesn't exist - try to download it
      console.log(`Template for ${formType} not found, attempting download...`)
      const result = await updateTemplate(formType, true)

      if (result.updated || result.metadata) {
        // Try to load again
        try {
          const buffer = await fs.readFile(templatePath)
          templateCache.set(formType, buffer)
          return buffer
        } catch (retryError) {
          return null
        }
      }

      return null
    }
    throw error
  }
}

/**
 * Get an archived version template buffer
 * @param {string} formType - Form type
 * @param {string} filename - Archive filename
 * @returns {Promise<Buffer|null>} Template buffer or null if not found
 */
export async function getArchivedTemplate(formType, filename) {
  const archiveDir = getArchiveDir(formType)
  const filePath = path.join(archiveDir, filename)

  try {
    return await fs.readFile(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * Check if a template exists and is valid
 * @param {string} formType - Form type
 * @returns {Promise<boolean>} True if template exists
 */
export async function hasTemplate(formType) {
  try {
    const templatePath = getTemplatePath(formType)
    await fs.access(templatePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get status of all templates including version history
 * @returns {Promise<Object>} Status for each template
 */
export async function getTemplateStatus() {
  const status = {}

  for (const [formType, source] of Object.entries(TEMPLATE_SOURCES)) {
    const metadata = await loadMetadata(formType)
    const exists = await hasTemplate(formType)
    const archivedVersions = await getArchivedVersions(formType)

    status[formType] = {
      name: source.name,
      agency: source.agency,
      sourceUrl: source.url,
      exists,
      metadata: metadata || null,
      needsUpdate: await needsUpdate(formType),
      isStale: metadata ? (Date.now() - new Date(metadata.downloadedAt).getTime() > 30 * 24 * 60 * 60 * 1000) : true,
      archivedVersions,
      versionCount: archivedVersions.length + (exists ? 1 : 0)
    }
  }

  return status
}

/**
 * Initialize templates - download any missing templates
 * Called on server startup
 */
export async function initializeTemplates() {
  console.log('Initializing PDF templates...')

  // Ensure base directory exists
  await fs.mkdir(TEMPLATE_DIR, { recursive: true })

  const results = {
    initialized: [],
    skipped: [],
    errors: []
  }

  for (const formType of Object.keys(TEMPLATE_SOURCES)) {
    const exists = await hasTemplate(formType)

    if (!exists) {
      try {
        const result = await updateTemplate(formType, true)
        if (result.updated || result.metadata) {
          results.initialized.push(formType)
        } else if (result.error) {
          results.errors.push({ formType, error: result.error })
        }
      } catch (error) {
        results.errors.push({ formType, error: error.message })
      }
    } else {
      // Check if update is due
      const needsUpd = await needsUpdate(formType)
      if (needsUpd) {
        try {
          await updateTemplate(formType, false)
        } catch (error) {
          console.warn(`Failed to check for updates for ${formType}:`, error.message)
        }
      }
      results.skipped.push(formType)
    }
  }

  console.log('PDF template initialization complete:', results)
  return results
}

/**
 * Download only missing templates and report progress via callback.
 * Used for first-admin setup UI with progress bar.
 * @param {Function} onProgress - Async callback receiving { formType?, name?, message?, current, total, status? }
 * @returns {Promise<{ initialized: string[], errors: Array<{ formType: string, error: string }> }>}
 */
export async function ensureTemplatesWithProgress(onProgress) {
  await fs.mkdir(TEMPLATE_DIR, { recursive: true })

  const formTypes = Object.keys(TEMPLATE_SOURCES)
  const missing = []
  for (const formType of formTypes) {
    const exists = await hasTemplate(formType)
    if (!exists) missing.push(formType)
  }

  const total = missing.length
  const initialized = []
  const errors = []

  if (total === 0) {
    if (onProgress) await onProgress({ status: 'done', current: 0, total: 0, message: 'All templates already present' })
    return { initialized, errors }
  }

  for (let i = 0; i < missing.length; i++) {
    const formType = missing[i]
    const source = TEMPLATE_SOURCES[formType]
    const name = source.name
    const current = i + 1

    if (onProgress) await onProgress({ formType, name, message: `Downloading ${name}...`, current, total, status: 'started' })

    try {
      const result = await updateTemplate(formType, true)
      if (result.updated || result.metadata) {
        initialized.push(formType)
        if (onProgress) await onProgress({ formType, name, message: `${name} complete`, current, total, status: 'complete' })
      } else if (result.error) {
        errors.push({ formType, error: result.error })
        if (onProgress) await onProgress({ formType, name, message: `${name} failed`, current, total, status: 'error', error: result.error })
      }
    } catch (error) {
      errors.push({ formType, error: error.message })
      if (onProgress) await onProgress({ formType, name, message: `${name} failed`, current, total, status: 'error', error: error.message })
    }
  }

  if (onProgress) await onProgress({ status: 'done', current: total, total, message: total > 0 ? 'Download complete' : null })
  return { initialized, errors }
}

/**
 * Clear template cache (for testing/admin purposes)
 */
export function clearTemplateCache() {
  templateCache.clear()
}

/**
 * Get supported form types
 * @returns {string[]} Array of supported form types
 */
export function getSupportedFormTypes() {
  return Object.keys(TEMPLATE_SOURCES)
}

/**
 * Get the template directory path (for serving files)
 * @returns {string} Template directory path
 */
export function getTemplateDirectory() {
  return TEMPLATE_DIR
}

export default {
  getTemplate,
  getArchivedTemplate,
  getArchivedVersions,
  hasTemplate,
  updateTemplate,
  updateAllTemplates,
  getTemplateStatus,
  initializeTemplates,
  ensureTemplatesWithProgress,
  clearTemplateCache,
  getSupportedFormTypes,
  getTemplateDirectory
}
