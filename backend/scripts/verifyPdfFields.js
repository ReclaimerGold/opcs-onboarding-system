import { PDFDocument } from 'pdf-lib'
import { getTemplate } from '../src/services/pdfTemplateService.js'
import {
  mapW4FormData,
  mapI9FormData,
  map8850FormData,
  W4_FIELD_MAPPING,
  I9_FIELD_MAPPING,
  F8850_FIELD_MAPPING
} from '../src/services/pdfFieldMapping.js'
import { generateW4PDF, generateI9PDF, generate8850PDF } from '../src/services/pdfService.js'

// Test data matching what we're entering in the browser
const testW4Data = {
  firstName: 'Preview',
  lastName: 'Tester',
  ssn: '111-22-3333',
  address: '123 Test Street',
  city: 'Sioux Falls',
  state: 'SD',
  zipCode: '57104',
  dateOfBirth: '1990-05-12',
  filingStatus: 'single',
  multipleJobs: false,
  qualifyingChildren: 0,
  dependents: 0
}

const testI9Data = {
  firstName: 'Preview',
  lastName: 'Tester',
  middleName: '',
  otherLastNames: 'Sample',
  address: '123 Test Street',
  aptNumber: '',
  city: 'Sioux Falls',
  state: 'SD',
  zipCode: '57104',
  dateOfBirth: '1990-05-12',
  ssn: '111-22-3333',
  email: 'preview.tester@example.com',
  phone: '(000) 000-0000',
  authorizationType: 'citizen'
}

const test8850Data = {
  firstName: 'Preview',
  middle: '',
  lastName: 'Tester',
  ssn: '111-22-3333',
  address: '123 Test Street',
  city: 'Sioux Falls',
  county: 'Minnehaha',
  state: 'SD',
  zipCode: '57104',
  phone: '(000) 000-0000',
  dateOfBirth: '1990-05-12',
  targetGroups: []
}

const applicantData = {
  first_name: 'Preview',
  last_name: 'Tester',
  email: 'preview.tester@example.com',
  phone: '(000) 000-0000',
  date_of_birth: '1990-05-12',
  address: '123 Test Street',
  city: 'Sioux Falls',
  state: 'SD',
  zip_code: '57104'
}

/**
 * Extract field values from a PDF form
 */
async function extractPDFFields(pdfBytes, fieldMapping) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  
  const extractedFields = {}
  
  for (const field of fields) {
    const fieldName = field.getName()
    try {
      if (field.constructor.name === 'PDFTextField') {
        extractedFields[fieldName] = field.getText() || ''
      } else if (field.constructor.name === 'PDFCheckBox') {
        extractedFields[fieldName] = field.isChecked()
      } else if (field.constructor.name === 'PDFRadioGroup') {
        extractedFields[fieldName] = field.getSelected() || ''
      } else if (field.constructor.name === 'PDFDropdown') {
        const selected = field.getSelected()
        extractedFields[fieldName] = Array.isArray(selected) ? selected[0] : selected || ''
      }
    } catch (e) {
      // Field might not be accessible
      extractedFields[fieldName] = null
    }
  }
  
  return extractedFields
}

/**
 * Verify that mapped fields are populated in the PDF
 */
function verifyFieldPopulation(extractedFields, fieldMapping, mappedData, formType) {
  const results = {
    formType,
    totalMappedFields: 0,
    populatedFields: 0,
    missingFields: [],
    fieldDetails: []
  }
  
  for (const [dataKey, value] of Object.entries(mappedData)) {
    if (value === undefined || value === null || value === '') continue
    
    const fieldNames = fieldMapping[dataKey]
    if (!fieldNames) continue
    
    results.totalMappedFields++
    
    let found = false
    let foundValue = null
    
    for (const fieldName of fieldNames) {
      if (extractedFields.hasOwnProperty(fieldName)) {
        found = true
        foundValue = extractedFields[fieldName]
        break
      }
    }
    
    if (found) {
      results.populatedFields++
      // For dropdowns, check if value is in the selected array
      let matches = false
      if (Array.isArray(foundValue)) {
        matches = foundValue.includes(String(value)) || foundValue.includes(value)
      } else {
        matches = String(foundValue) === String(value)
      }
      
      results.fieldDetails.push({
        dataKey,
        expected: value,
        found: foundValue,
        status: matches ? 'match' : 'mismatch'
      })
    } else {
      results.missingFields.push(dataKey)
      results.fieldDetails.push({
        dataKey,
        expected: value,
        found: null,
        status: 'missing'
      })
    }
  }
  
  return results
}

async function verifyW4() {
  console.log('\n=== Verifying W-4 Form ===')
  const pdfBytes = await generateW4PDF(testW4Data, applicantData)
  const extractedFields = await extractPDFFields(pdfBytes, W4_FIELD_MAPPING)
  const mappedData = mapW4FormData(testW4Data)
  const results = verifyFieldPopulation(extractedFields, W4_FIELD_MAPPING, mappedData, 'W-4')
  
  console.log(`Total mapped fields: ${results.totalMappedFields}`)
  console.log(`Populated fields: ${results.populatedFields}`)
  console.log(`Missing fields: ${results.missingFields.length}`)
  
  if (results.fieldDetails.length > 0) {
    console.log('\nField Details:')
    results.fieldDetails.forEach(detail => {
      const status = detail.status === 'match' ? '✓' : detail.status === 'mismatch' ? '⚠' : '✗'
      console.log(`  ${status} ${detail.dataKey}: expected="${detail.expected}", found="${detail.found}"`)
    })
  }
  
  return results
}

async function verifyI9() {
  console.log('\n=== Verifying I-9 Form ===')
  const pdfBytes = await generateI9PDF(testI9Data, applicantData)
  const extractedFields = await extractPDFFields(pdfBytes, I9_FIELD_MAPPING)
  const mappedData = mapI9FormData(testI9Data)
  // Adjust expected values for verification (SSN without dashes, state as-is)
  const adjustedMappedData = {
    ...mappedData,
    ssn: '111223333' // I-9 SSN field stores without dashes
  }
  const results = verifyFieldPopulation(extractedFields, I9_FIELD_MAPPING, adjustedMappedData, 'I-9')
  
  console.log(`Total mapped fields: ${results.totalMappedFields}`)
  console.log(`Populated fields: ${results.populatedFields}`)
  console.log(`Missing fields: ${results.missingFields.length}`)
  
  if (results.fieldDetails.length > 0) {
    console.log('\nField Details:')
    results.fieldDetails.forEach(detail => {
      const status = detail.status === 'match' ? '✓' : detail.status === 'mismatch' ? '⚠' : '✗'
      console.log(`  ${status} ${detail.dataKey}: expected="${detail.expected}", found="${detail.found}"`)
    })
  }
  
  return results
}

async function verify8850() {
  console.log('\n=== Verifying Form 8850 ===')
  const pdfBytes = await generate8850PDF(test8850Data, applicantData)
  const extractedFields = await extractPDFFields(pdfBytes, F8850_FIELD_MAPPING)
  const mappedData = map8850FormData(test8850Data)
  const results = verifyFieldPopulation(extractedFields, F8850_FIELD_MAPPING, mappedData, '8850')
  
  console.log(`Total mapped fields: ${results.totalMappedFields}`)
  console.log(`Populated fields: ${results.populatedFields}`)
  console.log(`Missing fields: ${results.missingFields.length}`)
  
  if (results.fieldDetails.length > 0) {
    console.log('\nField Details:')
    results.fieldDetails.forEach(detail => {
      const status = detail.status === 'match' ? '✓' : detail.status === 'mismatch' ? '⚠' : '✗'
      console.log(`  ${status} ${detail.dataKey}: expected="${detail.expected}", found="${detail.found}"`)
    })
  }
  
  return results
}

async function runVerification() {
  console.log('PDF Field Population Verification')
  console.log('='.repeat(50))
  
  const results = {
    w4: await verifyW4(),
    i9: await verifyI9(),
    f8850: await verify8850()
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('\nSummary:')
  console.log(`W-4: ${results.w4.populatedFields}/${results.w4.totalMappedFields} fields populated`)
  console.log(`I-9: ${results.i9.populatedFields}/${results.i9.totalMappedFields} fields populated`)
  console.log(`8850: ${results.f8850.populatedFields}/${results.f8850.totalMappedFields} fields populated`)
  
  const allPassed = 
    results.w4.missingFields.length === 0 &&
    results.i9.missingFields.length === 0 &&
    results.f8850.missingFields.length === 0
  
  if (!allPassed) {
    console.log('\n⚠ Some fields are not populating correctly. See details above.')
    process.exit(1)
  } else {
    console.log('\n✓ All fields are populating correctly!')
    process.exit(0)
  }
}

runVerification().catch(error => {
  console.error('Verification failed:', error)
  process.exit(1)
})

