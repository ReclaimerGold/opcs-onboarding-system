import { PDFDocument } from 'pdf-lib'
import { encryptBuffer } from './encryptionService.js'
import { uploadToGoogleDrive, isGoogleDriveConfigured } from './googleDriveService.js'
import { getDatabase } from '../database/init.js'
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
 * Generate W-4 PDF
 * Note: This is a simplified version - in production, you'd use actual IRS W-4 PDF template
 */
export async function generateW4PDF(formData, applicantData) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter size
  
  // In production, you would:
  // 1. Load the actual IRS W-4 PDF template
  // 2. Get form fields using pdfDoc.getForm()
  // 3. Fill in the fields with formData
  
  // For now, create a simple PDF with the data
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
  
  // Employee Information
  let yPos = height - 100
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
  
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate I-9 PDF
 */
export async function generateI9PDF(formData, applicantData) {
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
  
  let yPos = height - 100
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
  
  if (formData.listADocument) {
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
  
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Generate Form 8850 PDF
 */
export async function generate8850PDF(formData, applicantData) {
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
  
  let yPos = height - 100
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
  page.drawText(`Address: ${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`, {
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
  let localPath = null
  
  // Check if Google Drive is configured
  if (isGoogleDriveConfigured()) {
    // Upload encrypted PDF directly to Google Drive
    googleDriveId = await uploadToGoogleDrive(
      encryptedBuffer,
      filename,
      applicant,
      'application/pdf'
    )
    console.log(`PDF uploaded to Google Drive: ${googleDriveId}`)
  } else {
    // Fallback to local storage
    localPath = await saveToLocalStorage(encryptedBuffer, filename, applicant)
    console.log(`PDF saved to local storage: ${localPath} (Google Drive not configured)`)
  }
  
  // Save form submission record
  const submissionId = db.prepare(`
    INSERT INTO form_submissions 
    (applicant_id, step_number, form_type, form_data, pdf_filename, google_drive_id, pdf_encrypted_path, retention_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicantId,
    stepNumber,
    formType,
    JSON.stringify(formData),
    filename,
    googleDriveId || '',
    localPath,
    retentionUntil
  ).lastInsertRowid
  
  return {
    filename,
    googleDriveId,
    localPath,
    submissionId,
    retentionUntil,
    storageType: googleDriveId ? 'google_drive' : 'local'
  }
}

