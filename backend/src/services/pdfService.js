import { PDFDocument } from 'pdf-lib'
import { encryptBuffer } from './encryptionService.js'
import { uploadToGoogleDrive, isGoogleDriveConfigured } from './googleDriveService.js'
import { getDatabase } from '../database/init.js'
import { getTemplate } from './pdfTemplateService.js'
import {
  W4_FIELD_MAPPING,
  I9_FIELD_MAPPING,
  F8850_FIELD_MAPPING,
  trySetTextField,
  trySetCheckbox,
  mapW4FormData,
  mapI9FormData,
  map8850FormData,
  getFormFieldInfo,
  formatDateForPDF
} from './pdfFieldMapping.js'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Local storage directory for encrypted PDFs when Google Drive is not configured
const LOCAL_STORAGE_DIR = path.join(__dirname, '../../storage/encrypted-pdfs')

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
 * Calculate retention date based on form type
 */
export function calculateRetentionDate(formType, hireDate, terminationDate) {
  const now = new Date()
  let retentionDate = new Date()
  
  switch (formType) {
    case 'W4':
    case '8850':
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
  const failedFields = []
  
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
  
  // Flatten the form to prevent further editing (optional)
  // form.flatten()
  
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
async function generateW4PDFFallback(formData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter size
  
  const { height } = page.getSize()
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
    size: fontSize
  })
  
  yPos -= 20
  page.drawText(`SSN: ${formData.ssn}`, {
    x: 50,
    y: yPos,
    size: fontSize
  })
  
  yPos -= 20
  page.drawText(`Address: ${formData.address}`, {
    x: 50,
    y: yPos,
    size: fontSize
  })
  
  yPos -= 20
  page.drawText(`City, State, ZIP: ${formData.city}, ${formData.state} ${formData.zipCode}`, {
    x: 50,
    y: yPos,
    size: fontSize
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
        return await fillI9Template(retryBuffer, formData)
      }
    }
    
    console.error('I-9 template unavailable after download attempt, using fallback')
    return generateI9PDFFallback(formData, applicantData)
  }
  
  // Use template
  try {
    return await fillI9Template(templateBuffer, formData)
  } catch (error) {
    console.error('Failed to fill I-9 template, using fallback:', error.message)
    return generateI9PDFFallback(formData, applicantData)
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
async function generateI9PDFFallback(formData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  
  const { height } = page.getSize()
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
  }
  
  if (formData.listBDocument) {
    yPos -= 20
    page.drawText(`List B Document: ${formData.listBDocument}`, {
      x: 50,
      y: yPos,
      size: fontSize,
      font: helveticaFont
    })
  }
  
  if (formData.listCDocument) {
    yPos -= 20
    page.drawText(`List C Document: ${formData.listCDocument}`, {
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
async function generate8850PDFFallback(formData) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  
  const { height } = page.getSize()
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
  page.drawText(`Name: ${formData.firstName} ${formData.middle || ''} ${formData.lastName}`.trim(), {
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
 * Generate other form PDFs (Background, Direct Deposit, Acknowledgements)
 */
export async function generateGenericPDF(formData, formType) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  
  const { height } = page.getSize()
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
  
  for (const line of lines) {
    if (yPos < 50) break
    page.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: helveticaFont
    })
    yPos -= 15
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
 * Main function to generate and save PDF
 */
export async function generateAndSavePDF(applicantId, stepNumber, formType, formData, applicantData) {
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
    default:
      pdfBytes = await generateGenericPDF(formData, formType, applicantData)
  }
  
  // Generate filename
  const filename = generateFilename(
    applicantData.first_name,
    applicantData.last_name,
    formType
  )
  
  // Encrypt the PDF in memory
  const encryptedBuffer = encryptBuffer(pdfBytes)
  
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
  
  let googleDriveId = null
  let webViewLink = null
  let localPath = null
  
  // Check if Google Drive is configured
  if (isGoogleDriveConfigured()) {
    // Upload encrypted PDF directly to Google Drive
    const uploadResult = await uploadToGoogleDrive(
      encryptedBuffer,
      filename,
      applicant,
      'application/pdf'
    )
    ;({ fileId: googleDriveId, webViewLink } = uploadResult)
    console.log(`PDF uploaded to Google Drive: ${googleDriveId}`)
  } else {
    // Fallback to local storage
    localPath = await saveToLocalStorage(encryptedBuffer, filename, applicant)
    console.log(`PDF saved to local storage: ${localPath} (Google Drive not configured)`)
  }
  
  // Save form submission record
  const submissionId = db.prepare(`
    INSERT INTO form_submissions 
    (applicant_id, step_number, form_type, form_data, pdf_filename, google_drive_id, pdf_encrypted_path, retention_until, web_view_link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicantId,
    stepNumber,
    formType,
    JSON.stringify(formData),
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
