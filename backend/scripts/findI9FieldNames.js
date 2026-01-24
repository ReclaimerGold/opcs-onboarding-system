import { PDFDocument } from 'pdf-lib'
import { getTemplate } from '../src/services/pdfTemplateService.js'

async function findI9Fields() {
  const templateBuffer = await getTemplate('I9')
  if (!templateBuffer) {
    console.log('I-9 template not found')
    return
  }
  
  const pdfDoc = await PDFDocument.load(templateBuffer)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  
  // Fields we're looking for
  const searchFields = {
    lastName: ['last', 'family', 'name'],
    firstName: ['first', 'given', 'name'],
    middleInitial: ['middle', 'initial'],
    otherLastNames: ['other', 'last', 'names'],
    address: ['address', 'street'],
    city: ['city', 'town'],
    state: ['state'],
    zipCode: ['zip', 'code'],
    dateOfBirth: ['date', 'birth', 'mmddyyyy'],
    ssn: ['ssn', 'social', 'security'],
    email: ['email', 'e-mail'],
    phone: ['telephone', 'phone'],
    citizen: ['citizen'],
    signature: ['signature', 'employee'],
    signatureDate: ['date', 'employee', 'today']
  }
  
  console.log('=== I-9 Field Name Search ===\n')
  
  Object.entries(searchFields).forEach(([key, terms]) => {
    console.log(`\n${key} (searching for: ${terms.join(', ')}):`)
    const matches = fields.filter(f => {
      const name = f.getName().toLowerCase()
      return terms.some(term => name.includes(term.toLowerCase()))
    })
    
    if (matches.length > 0) {
      matches.forEach(f => {
        console.log(`  ✓ ${f.getName()} (${f.constructor.name})`)
      })
    } else {
      console.log('  ✗ No matches found')
    }
  })
  
  // Also show all field names for manual inspection
  console.log('\n\n=== All I-9 Field Names (first 50) ===')
  fields.slice(0, 50).forEach(f => {
    console.log(`  ${f.getName()} (${f.constructor.name})`)
  })
}

findI9Fields().catch(console.error)

