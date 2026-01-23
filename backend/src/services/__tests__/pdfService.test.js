import { describe, it, expect } from '@jest/globals'
import { calculateRetentionDate, generateFilename } from '../pdfService.js'

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
})

