import { PDFDocument } from 'pdf-lib'
import { getTemplate } from '../src/services/pdfTemplateService.js'

async function testI9Fields() {
  const templateBuffer = await getTemplate('I9')
  const pdfDoc = await PDFDocument.load(templateBuffer)
  const form = pdfDoc.getForm()
  
  // Test SSN field
  console.log('\n=== Testing SSN Field ===')
  try {
    const ssnField = form.getTextField('US Social Security Number')
    console.log('SSN field found:', ssnField.getName())
    console.log('Current value:', ssnField.getText())
    ssnField.setText('111-22-3333')
    console.log('Set value to: 111-22-3333')
    console.log('New value:', ssnField.getText())
  } catch (e) {
    console.log('Error with SSN field:', e.message)
  }
  
  // Test State dropdown
  console.log('\n=== Testing State Dropdown ===')
  try {
    const stateField = form.getDropdown('State')
    console.log('State field found:', stateField.getName())
    console.log('Current value:', stateField.getSelected())
    console.log('Available options:', stateField.getOptions().slice(0, 10))
    
    // Try to select SD
    try {
      stateField.select('SD')
      console.log('Selected SD, new value:', stateField.getSelected())
    } catch (e) {
      console.log('Error selecting SD:', e.message)
      // Try full name
      try {
        stateField.select('South Dakota')
        console.log('Selected South Dakota, new value:', stateField.getSelected())
      } catch (e2) {
        console.log('Error selecting South Dakota:', e2.message)
      }
    }
  } catch (e) {
    console.log('Error with State field:', e.message)
  }
  
  const pdfBytes = await pdfDoc.save()
  console.log('\nPDF saved successfully')
}

testI9Fields().catch(console.error)

