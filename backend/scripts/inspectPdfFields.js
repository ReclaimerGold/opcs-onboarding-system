import { PDFDocument } from 'pdf-lib'
import { getTemplate } from '../src/services/pdfTemplateService.js'

async function inspectFields(formType) {
  const templateBuffer = await getTemplate(formType)
  if (!templateBuffer) {
    console.log(`${formType}: Template not found`)
    return
  }
  
  const pdfDoc = await PDFDocument.load(templateBuffer)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  
  console.log(`\n=== ${formType} Form Fields ===`)
  console.log(`Total fields: ${fields.length}\n`)
  
  // Group by type
  const byType = {}
  fields.forEach(field => {
    const type = field.constructor.name
    if (!byType[type]) byType[type] = []
    byType[type].push({
      name: field.getName(),
      type: type
    })
  })
  
  // Print by type
  Object.entries(byType).forEach(([type, fieldList]) => {
    console.log(`${type} (${fieldList.length}):`)
    fieldList.slice(0, 20).forEach(f => {
      console.log(`  - ${f.name}`)
    })
    if (fieldList.length > 20) {
      console.log(`  ... and ${fieldList.length - 20} more`)
    }
    console.log()
  })
  
  // Find fields that might match our expected fields
  const searchTerms = {
    'W4': ['first', 'last', 'ssn', 'address', 'city', 'state', 'zip', 'filing', 'single', 'married', 'multiple', 'children', 'dependents', 'signature', 'date'],
    'I9': ['first', 'last', 'name', 'address', 'city', 'state', 'zip', 'ssn', 'birth', 'email', 'phone', 'citizen', 'national', 'alien', 'signature', 'date'],
    '8850': ['first', 'last', 'ssn', 'address', 'city', 'state', 'zip', 'county', 'telephone', 'birth', 'target', 'group', 'signature', 'date']
  }
  
  const terms = searchTerms[formType] || []
  console.log('\nRelevant fields (matching search terms):')
  terms.forEach(term => {
    const matches = fields.filter(f => 
      f.getName().toLowerCase().includes(term.toLowerCase())
    )
    if (matches.length > 0) {
      console.log(`  ${term}:`)
      matches.forEach(f => {
        console.log(`    - ${f.getName()} (${f.constructor.name})`)
      })
    }
  })
}

async function run() {
  for (const formType of ['W4', 'I9', '8850']) {
    await inspectFields(formType)
  }
}

run().catch(console.error)

