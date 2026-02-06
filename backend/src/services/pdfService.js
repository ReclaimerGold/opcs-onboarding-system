import { PDFDocument } from 'pdf-lib'
import { encryptBuffer } from './encryptionService.js'
import { uploadToGoogleDrive, isGoogleDriveConfigured, deleteFromGoogleDrive } from './googleDriveService.js'
import { getDatabase } from '../database/init.js'
import { getTemplate, hasTemplate } from './pdfTemplateService.js'
import {
  W4_FIELD_MAPPING,
  I9_FIELD_MAPPING,
  F8850_FIELD_MAPPING,
  F9061_FIELD_MAPPING,
  trySetTextField,
  trySetCheckbox,
  trySetRadioGroup,
  mapW4FormData,
  mapI9FormData,
  map8850FormData,
  map9061FormData,
  getFormFieldInfo,
  formatDateForPDF
} from './pdfFieldMapping.js'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { redactFormDataForStorage } from '../utils/redactFormData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Local storage directory for encrypted PDFs when Google Drive is not configured
const LOCAL_STORAGE_DIR = path.join(__dirname, '../../storage/encrypted-pdfs')

/** Form types that support signature placement */
const SIGNATURE_PLACEMENT_FORM_TYPES = ['W4', 'I9', '8850', '9061']

/**
 * Normalize stored placement value to array of placements.
 * Supports legacy single object or new { placements: [] } format.
 * @param {string} formType - W4, I9, or 8850
 * @returns {{ pageIndex: number, x: number, y: number, width: number, height: number }[]}
 */
export function getSignaturePlacements(formType) {
  if (!SIGNATURE_PLACEMENT_FORM_TYPES.includes(formType)) return []
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(`signature_placement_${formType}`)
  if (!row || !row.value) return []
  try {
    const parsed = JSON.parse(row.value)
    if (parsed.placements && Array.isArray(parsed.placements)) {
      return parsed.placements.filter(
        p => typeof p.pageIndex === 'number' && typeof p.x === 'number' && typeof p.y === 'number' && typeof p.width === 'number' && typeof p.height === 'number'
      )
    }
    if (parsed.mode === 'free_place' && typeof parsed.pageIndex === 'number') {
      return [{
        pageIndex: parsed.pageIndex,
        x: parsed.x ?? 72,
        y: parsed.y ?? 120,
        width: parsed.width ?? 180,
        height: parsed.height ?? 40
      }]
    }
    return []
  } catch {
    return []
  }
}

/**
 * Get first signature placement for a form type (backward compat / "has any").
 * @param {string} formType - W4, I9, or 8850
 * @returns {{ pageIndex: number, x: number, y: number, width: number, height: number } | null}
 */
export function getSignaturePlacement(formType) {
  const placements = getSignaturePlacements(formType)
  return placements.length > 0 ? placements[0] : null
}

/**
 * Single source of truth for whether signature placement is configured per form type.
 * Used by both GET /api/forms/template-status and GET /api/admin/setup-status so behavior is identical for all users.
 * @returns {{ w4: boolean, i9: boolean, 8850: boolean }}
 */
export function getSignaturePlacementStatus() {
  return {
    w4: !!getSignaturePlacement('W4'),
    i9: !!getSignaturePlacement('I9'),
    8850: !!getSignaturePlacement('8850'),
    9061: !!getSignaturePlacement('9061')
  }
}

/** Default content width for generated PDFs (page width minus margins). */
const DEFAULT_PDF_CONTENT_WIDTH = 512

/**
 * Wrap text to fit within maxWidth at given font size. Returns array of lines.
 * Breaks on spaces when possible; breaks by character for long words (e.g. URLs).
 * @param {string} text - Text to wrap
 * @param {PDFFont} font - pdf-lib font instance
 * @param {number} fontSize - Font size in points
 * @param {number} maxWidth - Maximum line width in points
 * @returns {string[]} Lines that fit within maxWidth
 */
function wrapText(text, font, fontSize, maxWidth) {
  if (text === undefined || text === null) return []
  const s = String(text).trim()
  if (!s) return []
  const words = s.split(/\s+/)
  const lines = []
  let currentLine = ''
  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    const w = font.widthOfTextAtSize(candidate, fontSize)
    if (w <= maxWidth) {
      currentLine = candidate
    } else {
      if (currentLine) lines.push(currentLine)
      const wordWidth = font.widthOfTextAtSize(word, fontSize)
      if (wordWidth <= maxWidth) {
        currentLine = word
      } else {
        currentLine = ''
        let chunk = ''
        for (const char of word) {
          const trial = chunk + char
          if (font.widthOfTextAtSize(trial, fontSize) <= maxWidth) {
            chunk = trial
          } else {
            if (chunk) lines.push(chunk)
            chunk = char
          }
        }
        if (chunk) lines.push(chunk)
      }
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

/**
 * Draw signature image on PDF at all configured positions (one per page optional).
 * @param {PDFDocument} pdfDoc - Loaded PDF document
 * @param {string} formType - W4, I9, or 8850
 * @param {string} signatureBase64 - Base64 PNG (with or without data URL prefix)
 */
async function drawSignatureOnPdf(pdfDoc, formType, signatureBase64) {
  const placements = getSignaturePlacements(formType)
  if (placements.length === 0 || !signatureBase64) return

  let base64 = signatureBase64.trim()
  if (base64.startsWith('data:image/png;base64,')) {
    base64 = base64.slice('data:image/png;base64,'.length)
  } else if (base64.startsWith('data:image/')) {
    const comma = base64.indexOf(',')
    if (comma !== -1) base64 = base64.slice(comma + 1)
  }
  if (!base64) return

  const pages = pdfDoc.getPages()
  const buf = Buffer.from(base64, 'base64')
  const image = await pdfDoc.embedPng(buf)
  const { width: imgW, height: imgH } = image.scale(1)

  for (const placement of placements) {
    const pageIndex = Math.max(0, Math.min(placement.pageIndex, pages.length - 1))
    const page = pages[pageIndex]
    const placeW = placement.width || 180
    const placeH = placement.height || 40
    const scale = Math.min(placeW / imgW, placeH / imgH, 1)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const x = placement.x ?? 72
    const y = placement.y ?? 120
    page.drawImage(image, { x, y, width: drawW, height: drawH })
  }
}

/**
 * Generate standardized filename
 * Format: FirstnameLastname-FormType-MMDDYYYY-HHMM.pdf
 */
export function generateFilename(firstName, lastName, formType) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '')
  const name = `${firstName}${lastName}`.replace(/\s/g, '')
  return `${name}-${formType}-${dateStr}-${timeStr}.pdf`
}

/**
 * Flatten a PDF buffer so form fields and annotations become non-editable content.
 * Used for uploaded PDFs (e.g. I-9 identity documents) before storage.
 * On failure (e.g. XFA or corrupted PDF), returns the original buffer and logs a warning.
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Buffer>} Flattened PDF buffer, or original buffer on failure
 */
export async function flattenPdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) return buffer
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const form = pdfDoc.getForm()
    form.flatten()
    const bytes = await pdfDoc.save()
    return Buffer.from(bytes)
  } catch (err) {
    console.warn('PDF flatten failed, storing original:', err.message)
    return buffer
  }
}

/**
 * Calculate retention date based on form type
 */
export function calculateRetentionDate(formType, hireDate, terminationDate) {
  const now = new Date()
  let retentionDate = new Date()

  switch (formType) {
    case 'W4':
    case '8850':
    case '9061':
      // 4 years from submission
      retentionDate.setFullYear(now.getFullYear() + 4)
      break
    case 'I9':
      // 3 years after hire OR 1 year after termination, whichever is later
      if (hireDate) {
        const hire = new Date(hireDate)
        const threeYearsAfterHire = new Date(hire)
        threeYearsAfterHire.setFullYear(hire.getFullYear() + 3)

        if (terminationDate) {
          const term = new Date(terminationDate)
          const oneYearAfterTerm = new Date(term)
          oneYearAfterTerm.setFullYear(term.getFullYear() + 1)
          retentionDate = threeYearsAfterHire > oneYearAfterTerm ? threeYearsAfterHire : oneYearAfterTerm
        } else {
          retentionDate = threeYearsAfterHire
        }
      } else {
        // Default to 3 years if no hire date
        retentionDate.setFullYear(now.getFullYear() + 3)
      }
      break
    case 'BACKGROUND':
      // 5 years
      retentionDate.setFullYear(now.getFullYear() + 5)
      break
    case 'DIRECT_DEPOSIT':
    case 'ACKNOWLEDGEMENTS':
      // 3 years for payroll-related, 1 year for general
      if (formType === 'ACKNOWLEDGEMENTS') {
        retentionDate.setFullYear(now.getFullYear() + 1)
      } else {
        retentionDate.setFullYear(now.getFullYear() + 3)
      }
      break
    default:
      retentionDate.setFullYear(now.getFullYear() + 3)
  }

  return retentionDate.toISOString().split('T')[0]
}

/**
 * Fill a PDF template with form data
 * @param {PDFDocument} pdfDoc - Loaded PDF document
 * @param {Object} fieldMapping - Field name mapping object
 * @param {Object} mappedData - Mapped form data
 * @returns {Object} Result with filled fields count
 */
async function fillPDFTemplate(pdfDoc, fieldMapping, mappedData) {
  const form = pdfDoc.getForm()
  let filledCount = 0
  let failedFields = []

  // Log all available fields for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    const fieldInfo = getFormFieldInfo(form)
    console.log(`PDF has ${fieldInfo.length} form fields`)
  }

  // Import dropdown function
  const { trySetDropdown } = await import('./pdfFieldMapping.js')

  for (const [dataKey, value] of Object.entries(mappedData)) {
    if (value === undefined || value === null || value === '') continue

    const fieldNames = fieldMapping[dataKey]
    if (!fieldNames) continue

    // Handle boolean values (checkboxes)
    if (typeof value === 'boolean') {
      if (value && trySetCheckbox(form, fieldNames, true)) {
        filledCount++
      } else if (!value) {
        // Don't count unchecked boxes as failures
        continue
      } else {
        failedFields.push(dataKey)
      }
    } else {
      // Try text field first
      let success = trySetTextField(form, fieldNames, String(value))

      // If text field fails and this is a known dropdown field (like State), try dropdown
      if (!success && (dataKey === 'state' || fieldNames.length === 1 && fieldNames[0] === 'State')) {
        success = trySetDropdown(form, fieldNames, String(value))
      }

      if (success) {
        filledCount++
      } else {
        failedFields.push(dataKey)
      }
    }
  }

  // Flatten the form so the document is not editable after submission or export
  form.flatten()

  return { filledCount, failedFields }
}

/**
 * Generate W-4 PDF using official IRS template
 * Falls back to basic generation only if template is completely unavailable
 */
export async function generateW4PDF(formData, applicantData) {
  // Try to use official template
  const templateBuffer = await getTemplate('W4')

  if (!templateBuffer) {
    console.warn('W-4 template not available, attempting to download...')
    // Try to force download
    const { updateTemplate } = await import('./pdfTemplateService.js')
    const updateResult = await updateTemplate('W4', true)

    if (updateResult.updated || updateResult.metadata) {
      const retryBuffer = await getTemplate('W4')
      if (retryBuffer) {
        console.log('W-4 template downloaded successfully, using template')
        return await fillW4Template(retryBuffer, formData)
      }
    }

    console.error('W-4 template unavailable after download attempt, using fallback')
    return generateW4PDFFallback(formData, applicantData)
  }

  // Use template
  try {
    return await fillW4Template(templateBuffer, formData)
  } catch (error) {
    console.error('Failed to fill W-4 template, using fallback:', error.message)
    return generateW4PDFFallback(formData, applicantData)
  }
}

/**
 * Fill W-4 template with form data
 * @param {Buffer} templateBuffer - Template PDF buffer
 * @param {Object} formData - Form data
 * @returns {Promise<Buffer>} Filled PDF buffer
 */
async function fillW4Template(templateBuffer, formData) {
  try {
    console.log('Using official IRS W-4 template')
    const pdfDoc = await PDFDocument.load(templateBuffer)
    const mappedData = mapW4FormData(formData)

    const result = await fillPDFTemplate(pdfDoc, W4_FIELD_MAPPING, mappedData)
    console.log(`W-4: Successfully filled ${result.filledCount} fields`)

    if (result.failedFields.length > 0) {
      console.warn(`W-4: Could not fill ${result.failedFields.length} fields: ${result.failedFields.slice(0, 5).join(', ')}${result.failedFields.length > 5 ? '...' : ''}`)
    }

    if (formData.signatureData) {
      await drawSignatureOnPdf(pdfDoc, 'W4', formData.signatureData)
    }

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('Error filling W-4 template:', error.message)
    throw error // Re-throw to trigger fallback in caller
  }
}

/**
 * Fallback W-4 PDF generation (basic text output)
 */
async function generateW4PDFFallback(formData, applicantData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter size

  const { width, height } = page.getSize()
  const fontSize = 12

  const helveticaFont = await pdfDoc.embedFont('Helvetica')
  const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold')

  // Title
  page.drawText('Form W-4: Employee\'s Withholding Certificate', {
    x: 50,
    y: height - 50,
    size: 16,
    font: helveticaBoldFont
  })

  page.drawText('(Fallback version - official template unavailable)', {
    x: 50,
    y: height - 70,
    size: 10,
    font: helveticaFont
  })

  // Employee Information
  let yPos = height - 110
  page.drawText(`Name: ${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim(), {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`SSN: ${formData.ssn}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`Address: ${formData.address}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`City, State, ZIP: ${formData.city}, ${formData.state} ${formData.zipCode}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 40
  page.drawText('Filing Status:', {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaBoldFont
  })

  yPos -= 20
  page.drawText(`Selected: ${formData.filingStatus}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 40
  page.drawText(`Qualifying Children Under 17: ${formData.qualifyingChildren || 0}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`Dependents: ${formData.dependents || 0}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 40
  page.drawText(`Date: ${formatDateForPDF(new Date())}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate I-9 PDF using official USCIS template
 * Falls back to basic generation only if template is completely unavailable
 */
export async function generateI9PDF(formData, applicantData) {
  // Merge applicant data into form data for I-9 (which needs address, DOB, SSN, etc.)
  const mergedFormData = {
    ...formData,
    // Add applicant data that may not be in the I-9 form submission
    address: formData.address || applicantData?.address || '',
    city: formData.city || applicantData?.city || '',
    state: formData.state || applicantData?.state || '',
    zipCode: formData.zipCode || applicantData?.zip_code || applicantData?.zipCode || '',
    dateOfBirth: formData.dateOfBirth || applicantData?.date_of_birth || applicantData?.dateOfBirth || '',
    ssn: formData.ssn || applicantData?.ssn || '',
    email: formData.email || applicantData?.email || '',
    phone: formData.phone || applicantData?.phone || ''
  }

  // Try to use official template
  const templateBuffer = await getTemplate('I9')

  if (!templateBuffer) {
    console.warn('I-9 template not available, attempting to download...')
    // Try to force download
    const { updateTemplate } = await import('./pdfTemplateService.js')
    const updateResult = await updateTemplate('I9', true)

    if (updateResult.updated || updateResult.metadata) {
      const retryBuffer = await getTemplate('I9')
      if (retryBuffer) {
        console.log('I-9 template downloaded successfully, using template')
        return await fillI9Template(retryBuffer, mergedFormData)
      }
    }

    console.error('I-9 template unavailable after download attempt, using fallback')
    return generateI9PDFFallback(mergedFormData, applicantData)
  }

  // Use template
  try {
    return await fillI9Template(templateBuffer, mergedFormData)
  } catch (error) {
    console.error('Failed to fill I-9 template, using fallback:', error.message)
    return generateI9PDFFallback(mergedFormData, applicantData)
  }
}

/**
 * Fill I-9 template with form data
 * @param {Buffer} templateBuffer - Template PDF buffer
 * @param {Object} formData - Form data
 * @returns {Promise<Buffer>} Filled PDF buffer
 */
async function fillI9Template(templateBuffer, formData) {
  try {
    console.log('Using official USCIS I-9 template')
    const pdfDoc = await PDFDocument.load(templateBuffer)
    const mappedData = mapI9FormData(formData)

    const result = await fillPDFTemplate(pdfDoc, I9_FIELD_MAPPING, mappedData)
    console.log(`I-9: Successfully filled ${result.filledCount} fields`)

    if (result.failedFields.length > 0) {
      console.warn(`I-9: Could not fill ${result.failedFields.length} fields: ${result.failedFields.slice(0, 5).join(', ')}${result.failedFields.length > 5 ? '...' : ''}`)
    }

    if (formData.signatureData) {
      await drawSignatureOnPdf(pdfDoc, 'I9', formData.signatureData)
    }

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('Error filling I-9 template:', error.message)
    throw error // Re-throw to trigger fallback in caller
  }
}

/**
 * Fallback I-9 PDF generation (basic text output)
 */
async function generateI9PDFFallback(formData, applicantData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])

  const { width, height } = page.getSize()
  const fontSize = 12
  const helveticaFont = await pdfDoc.embedFont('Helvetica')
  const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold')

  page.drawText('Form I-9: Employment Eligibility Verification', {
    x: 50,
    y: height - 50,
    size: 16,
    font: helveticaBoldFont
  })

  page.drawText('(Fallback version - official template unavailable)', {
    x: 50,
    y: height - 70,
    size: 10,
    font: helveticaFont
  })

  let yPos = height - 110
  page.drawText(`Name: ${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim(), {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`Authorization Type: ${formData.authorizationType}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  if (formData.address) {
    yPos -= 20
    page.drawText(`Address: ${formData.address}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
  }

  if (formData.city && formData.state && formData.zipCode) {
    yPos -= 20
    page.drawText(`City, State, ZIP: ${formData.city}, ${formData.state} ${formData.zipCode}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
  }

  if (formData.dateOfBirth) {
    yPos -= 20
    page.drawText(`Date of Birth: ${formatDateForPDF(formData.dateOfBirth)}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
  }

  if (formData.listADocument) {
    yPos -= 30
    page.drawText('Documents:', {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaBoldFont
    })
    yPos -= 20
    page.drawText(`List A Document: ${formData.listADocument}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
    if (formData.listADocumentNumber) {
      yPos -= 16
      page.drawText(`List A Document Number: ${formData.listADocumentNumber}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
    if (formData.listAIssuingAuthority) {
      yPos -= 16
      page.drawText(`List A Issuing Authority: ${formData.listAIssuingAuthority}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
    if (formData.listAExpiration) {
      yPos -= 16
      page.drawText(`List A Expiration: ${formatDateForPDF(formData.listAExpiration)}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
  }

  if (formData.listBDocument) {
    yPos -= 20
    page.drawText(`List B Document: ${formData.listBDocument}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
    if (formData.listBDocumentNumber) {
      yPos -= 16
      page.drawText(`List B Document Number: ${formData.listBDocumentNumber}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
    if (formData.listBIssuingAuthority) {
      yPos -= 16
      page.drawText(`List B Issuing Authority: ${formData.listBIssuingAuthority}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
    if (formData.listBExpiration) {
      yPos -= 16
      page.drawText(`List B Expiration: ${formatDateForPDF(formData.listBExpiration)}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
  }

  if (formData.listCDocument) {
    yPos -= 20
    page.drawText(`List C Document: ${formData.listCDocument}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
    if (formData.listCDocumentNumber) {
      yPos -= 16
      page.drawText(`List C Document Number: ${formData.listCDocumentNumber}`, {
        x: 50,
        y: yPos,
        size: fontSize,
        font: helveticaFont
      })
    }
  }

  yPos -= 40
  page.drawText(`Date: ${formatDateForPDF(new Date())}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate Form 8850 PDF using official IRS template
 * Falls back to basic generation only if template is completely unavailable
 */
export async function generate8850PDF(formData, applicantData) {
  // Try to use official template
  const templateBuffer = await getTemplate('8850')

  if (!templateBuffer) {
    console.warn('Form 8850 template not available, attempting to download...')
    // Try to force download
    const { updateTemplate } = await import('./pdfTemplateService.js')
    const updateResult = await updateTemplate('8850', true)

    if (updateResult.updated || updateResult.metadata) {
      const retryBuffer = await getTemplate('8850')
      if (retryBuffer) {
        console.log('Form 8850 template downloaded successfully, using template')
        return await fill8850Template(retryBuffer, formData)
      }
    }

    console.error('Form 8850 template unavailable after download attempt, using fallback')
    return generate8850PDFFallback(formData, applicantData)
  }

  // Use template
  try {
    return await fill8850Template(templateBuffer, formData)
  } catch (error) {
    console.error('Failed to fill Form 8850 template, using fallback:', error.message)
    return generate8850PDFFallback(formData, applicantData)
  }
}

/**
 * Fill Form 8850 template with form data
 * @param {Buffer} templateBuffer - Template PDF buffer
 * @param {Object} formData - Form data
 * @returns {Promise<Buffer>} Filled PDF buffer
 */
async function fill8850Template(templateBuffer, formData) {
  try {
    console.log('Using official IRS Form 8850 template')
    const pdfDoc = await PDFDocument.load(templateBuffer)
    const mappedData = map8850FormData(formData)

    const result = await fillPDFTemplate(pdfDoc, F8850_FIELD_MAPPING, mappedData)
    console.log(`8850: Successfully filled ${result.filledCount} fields`)

    if (result.failedFields.length > 0) {
      console.warn(`8850: Could not fill ${result.failedFields.length} fields: ${result.failedFields.slice(0, 5).join(', ')}${result.failedFields.length > 5 ? '...' : ''}`)
    }

    if (formData.signatureData) {
      await drawSignatureOnPdf(pdfDoc, '8850', formData.signatureData)
    }

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('Error filling Form 8850 template:', error.message)
    throw error // Re-throw to trigger fallback in caller
  }
}

/**
 * Fallback Form 8850 PDF generation (basic text output)
 */
async function generate8850PDFFallback(formData, applicantData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])

  const { width, height } = page.getSize()
  const fontSize = 12
  const helveticaFont = await pdfDoc.embedFont('Helvetica')
  const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold')

  page.drawText('Form 8850: Pre-Screening Notice and Certification Request', {
    x: 50,
    y: height - 50,
    size: 16,
    font: helveticaBoldFont
  })

  page.drawText('(Fallback version - official template unavailable)', {
    x: 50,
    y: height - 70,
    size: 10,
    font: helveticaFont
  })

  let yPos = height - 110
  page.drawText(`Name: ${formData.firstName} ${formData.middleName || formData.middle || ''} ${formData.lastName}`.trim(), {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`SSN: ${formData.ssn}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`Address: ${formData.address}, ${formData.city}, ${formData.state} ${formData.zip || formData.zipCode}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  yPos -= 20
  page.drawText(`County: ${formData.county}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  if (formData.phone) {
    yPos -= 20
    page.drawText(`Phone: ${formData.phone}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
  }

  if (formData.dateOfBirth) {
    yPos -= 20
    page.drawText(`Date of Birth: ${formatDateForPDF(formData.dateOfBirth)}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
  }

  yPos -= 40
  page.drawText(`Date: ${formatDateForPDF(new Date())}`, {
    x: 50,
    y: yPos,
    size: fontSize,
    font: helveticaFont
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate ETA Form 9061 PDF using official template
 * Falls back to basic generation only if template is completely unavailable
 */
export async function generate9061PDF(formData, applicantData) {
  // Try to use official template
  const templateBuffer = await getTemplate('9061')

  if (!templateBuffer) {
    console.warn('ETA Form 9061 template not available, attempting to download...')
    const { updateTemplate } = await import('./pdfTemplateService.js')
    const updateResult = await updateTemplate('9061', true)

    if (updateResult.updated || updateResult.metadata) {
      const retryBuffer = await getTemplate('9061')
      if (retryBuffer) {
        console.log('ETA Form 9061 template downloaded successfully, using template')
        return await fill9061Template(retryBuffer, formData)
      }
    }

    console.error('ETA Form 9061 template unavailable after download attempt, using fallback')
    return generate9061PDFFallback(formData, applicantData)
  }

  // Use template
  try {
    return await fill9061Template(templateBuffer, formData)
  } catch (error) {
    console.error('Failed to fill ETA Form 9061 template, using fallback:', error.message)
    return generate9061PDFFallback(formData, applicantData)
  }
}

/**
 * Fill ETA Form 9061 template with form data
 * @param {Buffer} templateBuffer - Template PDF buffer
 * @param {Object} formData - Form data
 * @returns {Promise<Buffer>} Filled PDF buffer
 */
async function fill9061Template(templateBuffer, formData) {
  try {
    console.log('Using official ETA Form 9061 template')
    const pdfDoc = await PDFDocument.load(templateBuffer)
    const mappedData = map9061FormData(formData)

    // fillPDFTemplate handles text fields and checkboxes but NOT radio groups.
    // We load the form before flattening to set radio groups manually.
    // Note: fillPDFTemplate flattens the form at the end, so radio groups must
    // be set on a separate load, or we handle everything manually here.
    // To keep it simple, we'll load the PDF, set radio groups first, then pass
    // to fillPDFTemplate which will set text/checkbox fields and flatten.

    // Set radio groups BEFORE fillPDFTemplate (which flattens the form)
    const form = pdfDoc.getForm()

    // Box 8: "Have you worked for this employer" — Radio group with options 'Yes' and 'No'
    const workedBefore = formData.workedForEmployerBefore === 'yes'
    trySetRadioGroup(form, '8. Have you worked for this employer', workedBefore ? 'Yes' : 'No')

    // Box 23b: "indicate who signed this form" — Since this is the job applicant filling it out
    // Options: 'Employer', 'Employers Preparer', 'SWA/Participating agency', 'Parent/Guardian (if job applicant is a minor)', 'Job Applicant'
    trySetRadioGroup(form, '23.b. indicate who signed this form', 'Job Applicant')

    // Now fill text fields and checkboxes (this also flattens the form)
    const result = await fillPDFTemplate(pdfDoc, F9061_FIELD_MAPPING, mappedData)
    console.log(`9061: Successfully filled ${result.filledCount} fields + 2 radio groups`)

    if (result.failedFields.length > 0) {
      console.warn(`9061: Could not fill ${result.failedFields.length} fields: ${result.failedFields.slice(0, 5).join(', ')}${result.failedFields.length > 5 ? '...' : ''}`)
    }

    if (formData.signatureData) {
      await drawSignatureOnPdf(pdfDoc, '9061', formData.signatureData)
    }

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('Error filling ETA Form 9061 template:', error.message)
    throw error
  }
}

/**
 * Fallback ETA Form 9061 PDF generation (basic text output)
 */
async function generate9061PDFFallback(formData, applicantData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])

  const { width, height } = page.getSize()
  const fontSize = 11
  const smallFontSize = 9
  const helveticaFont = await pdfDoc.embedFont('Helvetica')
  const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold')

  // Title
  page.drawText('ETA Form 9061: Individual Characteristics Form', {
    x: 50,
    y: height - 50,
    size: 14,
    font: helveticaBoldFont
  })
  page.drawText('Work Opportunity Tax Credit (WOTC)', {
    x: 50,
    y: height - 66,
    size: 10,
    font: helveticaFont
  })
  page.drawText('(Fallback version - official template unavailable)', {
    x: 50,
    y: height - 80,
    size: 9,
    font: helveticaFont
  })

  let yPos = height - 110

  // Applicant Information
  page.drawText('Applicant Information', { x: 50, y: yPos, size: 12, font: helveticaBoldFont })
  yPos -= 20
  page.drawText(`Name: ${formData.lastName || ''}, ${formData.firstName || ''} ${formData.middleName || ''}`.trim(), {
    x: 50, y: yPos, size: fontSize, font: helveticaFont
  })
  yPos -= 18
  page.drawText(`SSN: ${formData.ssn || ''}`, {
    x: 50, y: yPos, size: fontSize, font: helveticaFont
  })
  if (formData.dateOfBirth) {
    yPos -= 18
    page.drawText(`Date of Birth: ${formatDateForPDF(formData.dateOfBirth)}`, {
      x: 50, y: yPos, size: fontSize, font: helveticaFont
    })
  }
  yPos -= 18
  page.drawText(`Worked for employer before: ${formData.workedForEmployerBefore === 'yes' ? 'Yes' : 'No'}`, {
    x: 50, y: yPos, size: fontSize, font: helveticaFont
  })
  if (formData.workedForEmployerBefore === 'yes' && formData.lastEmploymentDate) {
    yPos -= 18
    page.drawText(`  Last date of employment: ${formatDateForPDF(formData.lastEmploymentDate)}`, {
      x: 50, y: yPos, size: fontSize, font: helveticaFont
    })
  }

  // Targeted Group Eligibility
  yPos -= 30
  page.drawText('Targeted Group Eligibility', { x: 50, y: yPos, size: 12, font: helveticaBoldFont })

  const targetGroups = [
    { label: '12. Qualified IV-A Recipient (TANF)', checked: formData.isTANFRecipient },
    { label: '13. Qualified Veteran', checked: formData.isVeteran },
    { label: '14. Qualified Ex-Felon', checked: formData.isExFelon },
    { label: '15. Designated Community Resident', checked: formData.isDesignatedCommunityResident },
    { label: '16. Vocational Rehabilitation Referral', checked: formData.isVocationalRehab },
    { label: '17. Qualified Summer Youth Employee', checked: formData.isSummerYouth },
    { label: '18. Qualified SNAP Recipient', checked: formData.isSNAPRecipient },
    { label: '19. Qualified SSI Recipient', checked: formData.isSSIRecipient },
    { label: '20. Long-Term Family Assistance Recipient', checked: formData.isLongTermTANF },
    { label: '21. Qualified Long-Term Unemployment Recipient', checked: formData.isLongTermUnemployed }
  ]

  for (const group of targetGroups) {
    yPos -= 18
    if (yPos < 80) {
      // Add new page
      const newPage = pdfDoc.addPage([612, 792])
      yPos = newPage.getSize().height - 50
    }
    const checkmark = group.checked ? '[X]' : '[ ]'
    page.drawText(`${checkmark} ${group.label}`, {
      x: 60, y: yPos, size: fontSize, font: group.checked ? helveticaBoldFont : helveticaFont
    })

    // Show sub-fields for checked groups
    if (group.checked) {
      if (formData.isTANFRecipient && group.label.includes('TANF') && !group.label.includes('Long-Term')) {
        if (formData.tanfPrimaryRecipient) {
          yPos -= 14
          page.drawText(`  Primary recipient: ${formData.tanfPrimaryRecipient}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.tanfBenefitsLocation) {
          yPos -= 14
          page.drawText(`  Benefits location: ${formData.tanfBenefitsLocation}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
      }
      if (formData.isVeteran && group.label.includes('Veteran')) {
        if (formData.veteranDisabled) {
          yPos -= 14
          page.drawText('  Service-connected disability: Yes', { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.veteranUnemployed6Months) {
          yPos -= 14
          page.drawText('  Unemployed 6+ months: Yes', { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.veteranReceivesSNAP) {
          yPos -= 14
          page.drawText(`  Veteran SNAP recipient: ${formData.veteranSNAPRecipient || 'Yes'}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
          if (formData.veteranSNAPLocation) {
            yPos -= 14
            page.drawText(`  SNAP benefits location: ${formData.veteranSNAPLocation}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
          }
        }
      }
      if (formData.isExFelon && group.label.includes('Ex-Felon')) {
        if (formData.felonyConvictionDate) {
          yPos -= 14
          page.drawText(`  Conviction date: ${formatDateForPDF(formData.felonyConvictionDate)}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.felonyReleaseDate) {
          yPos -= 14
          page.drawText(`  Release date: ${formatDateForPDF(formData.felonyReleaseDate)}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        const convType = [formData.felonyFederal ? 'Federal' : '', formData.felonyState ? `State (${formData.felonyStateName || ''})` : ''].filter(Boolean).join(', ')
        if (convType) {
          yPos -= 14
          page.drawText(`  Conviction type: ${convType}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.felonyWorkRelease) {
          yPos -= 14
          page.drawText('  In Work Release Program: Yes', { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
      }
      if (formData.isSNAPRecipient && group.label.includes('SNAP') && !group.label.includes('Veteran')) {
        if (formData.snapPrimaryRecipient) {
          yPos -= 14
          page.drawText(`  Primary recipient: ${formData.snapPrimaryRecipient}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.snapBenefitsLocation) {
          yPos -= 14
          page.drawText(`  Benefits location: ${formData.snapBenefitsLocation}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
      }
      if (formData.isLongTermTANF && group.label.includes('Long-Term')) {
        if (formData.longTermTANFRecipient) {
          yPos -= 14
          page.drawText(`  Primary recipient: ${formData.longTermTANFRecipient}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
        if (formData.longTermTANFLocation) {
          yPos -= 14
          page.drawText(`  Benefits location: ${formData.longTermTANFLocation}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
      }
      if (formData.isLongTermUnemployed && group.label.includes('Unemployment')) {
        if (formData.unemploymentClaimsLocation) {
          yPos -= 14
          page.drawText(`  Claims filed in: ${formData.unemploymentClaimsLocation}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
      }
      if (formData.isVocationalRehab && group.label.includes('Vocational')) {
        if (formData.rehabReferralSource) {
          const sourceLabels = {
            state_agency: 'Rehabilitation agency approved by the state',
            employment_network: 'Employment Network under the Ticket to Work Program',
            va: 'Department of Veterans Affairs'
          }
          yPos -= 14
          page.drawText(`  Referral source: ${sourceLabels[formData.rehabReferralSource] || formData.rehabReferralSource}`, { x: 80, y: yPos, size: smallFontSize, font: helveticaFont })
        }
      }
    }
  }

  yPos -= 30
  page.drawText(`Date: ${formatDateForPDF(new Date())}`, {
    x: 50, y: yPos, size: fontSize, font: helveticaFont
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate other form PDFs (Background, Direct Deposit, Acknowledgements)
 */
export async function generateGenericPDF(formData, formType, applicantData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])

  const { width, height } = page.getSize()
  const fontSize = 12
  const helveticaFont = await pdfDoc.embedFont('Helvetica')
  const helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold')

  const titles = {
    'BACKGROUND': 'Background Check Form',
    'DIRECT_DEPOSIT': 'Direct Deposit Authorization',
    'ACKNOWLEDGEMENTS': 'Employment Acknowledgements'
  }

  page.drawText(titles[formType] || 'Form', {
    x: 50,
    y: height - 50,
    size: 16,
    font: helveticaBoldFont
  })

  let yPos = height - 100
  const formDataStr = JSON.stringify(formData, null, 2)
  const lines = formDataStr.split('\n').slice(0, 30) // Limit lines
  const lineHeight = 14
  const maxWidth = width - 100

  for (const line of lines) {
    if (yPos < 50) break
    const wrapped = wrapText(line, helveticaFont, 10, maxWidth)
    for (const wrappedLine of wrapped) {
      if (yPos < 50) break
      page.drawText(wrappedLine, {
        x: 50,
        y: yPos,
        size: 10,
        font: helveticaFont
      })
      yPos -= lineHeight
    }
  }

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Save encrypted PDF to local storage
 * @param {Buffer} encryptedBuffer - Encrypted PDF buffer
 * @param {string} filename - Filename
 * @param {Object} applicant - Applicant data
 * @returns {Promise<string>} Local file path
 */
async function saveToLocalStorage(encryptedBuffer, filename, applicant) {
  // Create applicant-specific folder
  const applicantFolder = `${applicant.first_name}${applicant.last_name}`.replace(/\s/g, '')
  const folderPath = path.join(LOCAL_STORAGE_DIR, applicantFolder)

  // Ensure directory exists
  await fs.mkdir(folderPath, { recursive: true })

  // Save encrypted file
  const filePath = path.join(folderPath, filename)
  await fs.writeFile(filePath, encryptedBuffer)

  // Return relative path from storage root
  return path.join(applicantFolder, filename)
}

/**
 * Main function to generate and save PDF.
 * When existingSubmission is provided (during onboarding overwrite), updates that row and replaces the file.
 * Otherwise inserts a new submission record.
 * @param {number} applicantId
 * @param {number} stepNumber
 * @param {string} formType
 * @param {Object} formData
 * @param {Object} applicantData
 * @param {{ id: number, google_drive_id: string, pdf_encrypted_path: string | null }} [existingSubmission] - When set, overwrite this row and replace file
 */
export async function generateAndSavePDF(applicantId, stepNumber, formType, formData, applicantData, existingSubmission = null) {
  let pdfBytes

  // Generate PDF based on form type
  switch (formType) {
    case 'W4':
      pdfBytes = await generateW4PDF(formData, applicantData)
      break
    case 'I9':
      pdfBytes = await generateI9PDF(formData, applicantData)
      break
    case '8850':
      pdfBytes = await generate8850PDF(formData, applicantData)
      break
    case '9061':
      pdfBytes = await generate9061PDF(formData, applicantData)
      break
    default:
      pdfBytes = await generateGenericPDF(formData, formType, applicantData)
  }

  // Generate filename
  const filename = generateFilename(
    applicantData.first_name,
    applicantData.last_name,
    formType
  )

  // Get applicant data for folder creation
  const db = getDatabase()
  const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(applicantId)
  if (!applicant) {
    throw new Error('Applicant not found')
  }

  // Calculate retention date
  const retentionUntil = calculateRetentionDate(
    formType,
    applicant.hire_date,
    applicant.termination_date
  )

  // If overwriting, delete old file from Drive or local storage first
  if (existingSubmission) {
    if (existingSubmission.google_drive_id) {
      try {
        await deleteFromGoogleDrive(existingSubmission.google_drive_id)
      } catch (error) {
        console.error('Error deleting old PDF from Google Drive:', error)
      }
    }
    if (existingSubmission.pdf_encrypted_path) {
      try {
        const fullPath = path.join(LOCAL_STORAGE_DIR, existingSubmission.pdf_encrypted_path)
        await fs.unlink(fullPath)
      } catch (error) {
        console.error('Error deleting old PDF from local storage:', error)
      }
    }
  }

  let googleDriveId = null
  let webViewLink = null
  let localPath = null

  // Check if Google Drive is configured
  if (isGoogleDriveConfigured()) {
    // Upload raw PDF to Google Drive (Google handles its own encryption)
    const pdfBuffer = Buffer.from(pdfBytes)
    const uploadResult = await uploadToGoogleDrive(
      pdfBuffer,
      filename,
      applicant,
      'application/pdf'
    )
    googleDriveId = uploadResult.fileId
    webViewLink = uploadResult.webViewLink
    console.log(`PDF uploaded to Google Drive: ${googleDriveId}`)
  } else {
    // Encrypt the PDF for local storage only
    const encryptedBuffer = encryptBuffer(pdfBytes)
    localPath = await saveToLocalStorage(encryptedBuffer, filename, applicant)
    console.log(`PDF saved to local storage (encrypted): ${localPath} (Google Drive not configured)`)
  }

  const formDataToStore = redactFormDataForStorage(formData, stepNumber)

  if (existingSubmission) {
    db.prepare(`
      UPDATE form_submissions
      SET form_data = ?, pdf_filename = ?, google_drive_id = ?, pdf_encrypted_path = ?, retention_until = ?, web_view_link = ?, submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(formDataToStore),
      filename,
      googleDriveId || '',
      localPath,
      retentionUntil,
      webViewLink,
      existingSubmission.id
    )
    return {
      filename,
      googleDriveId,
      webViewLink,
      localPath,
      submissionId: existingSubmission.id,
      retentionUntil,
      storageType: googleDriveId ? 'google_drive' : 'local'
    }
  }

  // Insert new form submission record (SSN redacted from form_data for compliance)
  const submissionId = db.prepare(`
    INSERT INTO form_submissions 
    (applicant_id, step_number, form_type, form_data, pdf_filename, google_drive_id, pdf_encrypted_path, retention_until, web_view_link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicantId,
    stepNumber,
    formType,
    JSON.stringify(formDataToStore),
    filename,
    googleDriveId || '',
    localPath,
    retentionUntil,
    webViewLink
  ).lastInsertRowid

  return {
    filename,
    googleDriveId,
    webViewLink,
    localPath,
    submissionId,
    retentionUntil,
    storageType: googleDriveId ? 'google_drive' : 'local'
  }
}
