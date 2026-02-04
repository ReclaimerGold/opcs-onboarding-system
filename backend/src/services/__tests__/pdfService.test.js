import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { calculateRetentionDate, generateFilename, generateW4PDF, generateI9PDF, generate8850PDF } from '../pdfService.js'

describe('PDF Service', () => {
  describe('calculateRetentionDate', () => {
    it('should calculate 4 years for W-4 forms', () => {
      const retentionDate = calculateRetentionDate('W4')
      const now = new Date()
      const expectedYear = now.getFullYear() + 4

      expect(new Date(retentionDate).getFullYear()).toBe(expectedYear)
    })

    it('should calculate 4 years for 8850 forms', () => {
      const retentionDate = calculateRetentionDate('8850')
      const now = new Date()
      const expectedYear = now.getFullYear() + 4

      expect(new Date(retentionDate).getFullYear()).toBe(expectedYear)
    })

    it('should calculate 3 years after hire for I-9 when no termination', () => {
      const hireDate = '2024-01-01'
      const retentionDate = calculateRetentionDate('I9', hireDate, null)

      expect(new Date(retentionDate).toISOString().split('T')[0]).toBe('2027-01-01')
    })

    it('should calculate 1 year after termination for I-9 if later than 3 years after hire', () => {
      const hireDate = '2020-01-01'
      const terminationDate = '2024-12-31'
      const retentionDate = calculateRetentionDate('I9', hireDate, terminationDate)

      expect(new Date(retentionDate).toISOString().split('T')[0]).toBe('2025-12-31')
    })

    it('should calculate 5 years for BACKGROUND forms', () => {
      const retentionDate = calculateRetentionDate('BACKGROUND')
      const now = new Date()
      const expectedYear = now.getFullYear() + 5

      expect(new Date(retentionDate).getFullYear()).toBe(expectedYear)
    })
  })

  describe('generateFilename', () => {
    it('should generate correct filename format', () => {
      const filename = generateFilename('John', 'Doe', 'W4')

      expect(filename).toMatch(/^JohnDoe-W4-.*\.pdf$/)
      expect(filename).toContain('JohnDoe')
      expect(filename).toContain('W4')
      expect(filename.endsWith('.pdf')).toBe(true)
    })

    it('should handle names with spaces', () => {
      const filename = generateFilename('Mary Jane', 'Smith', 'I9')

      expect(filename).toMatch(/^MaryJaneSmith-I9-.*\.pdf$/)
      expect(filename).not.toContain(' ')
    })
  })

  describe('PDF flattening', () => {
    const minimalApplicantData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '(555) 123-4567'
    }

    const minimalW4Data = {
      firstName: 'Test',
      lastName: 'User',
      ssn: '123-45-6789',
      address: '123 Main St',
      city: 'City',
      state: 'SD',
      zipCode: '57001',
      filingStatus: 'single',
      signatureData: null,
      ...minimalApplicantData
    }

    const minimalI9Data = {
      firstName: 'Test',
      lastName: 'User',
      middleName: '',
      otherLastNames: '',
      authorizationType: 'citizen',
      signatureData: null,
      ...minimalApplicantData
    }

    const minimal8850Data = {
      firstName: 'Test',
      lastName: 'User',
      ssn: '123-45-6789',
      address: '123 Main St',
      city: 'City',
      state: 'SD',
      zip: '57001',
      county: 'Minnehaha',
      signatureData: null,
      ...minimalApplicantData
    }

    async function assertPdfHasNoFormFields(pdfBytes) {
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      expect(fields.length).toBe(0)
    }

    it('should produce flattened W-4 PDF with no fillable form fields', async () => {
      const pdfBytes = await generateW4PDF(minimalW4Data, minimalApplicantData)
      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      await assertPdfHasNoFormFields(pdfBytes)
    })

    it('should produce flattened I-9 PDF with no fillable form fields', async () => {
      const pdfBytes = await generateI9PDF(minimalI9Data, minimalApplicantData)
      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      await assertPdfHasNoFormFields(pdfBytes)
    })

    it('should produce flattened 8850 PDF with no fillable form fields', async () => {
      const pdfBytes = await generate8850PDF(minimal8850Data, minimalApplicantData)
      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      await assertPdfHasNoFormFields(pdfBytes)
    })
  })
})

