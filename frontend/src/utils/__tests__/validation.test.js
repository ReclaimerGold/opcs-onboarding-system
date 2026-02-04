import { describe, it, expect } from 'vitest'
import { formatPhoneNumber, formatSSN, validatePhoneNumber, validateSSN, validateEmail } from '../validation.js'

describe('Validation Utilities', () => {
  describe('formatPhoneNumber', () => {
    it('should format 10 digits correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    })

    it('should handle partial input', () => {
      expect(formatPhoneNumber('123')).toBe('(123')
      expect(formatPhoneNumber('1234')).toBe('(123) 4')
      expect(formatPhoneNumber('1234567')).toBe('(123) 456-7')
    })

    it('should handle empty input', () => {
      expect(formatPhoneNumber('')).toBe('')
    })

    it('should limit to 10 digits', () => {
      expect(formatPhoneNumber('123456789012345')).toBe('(123) 456-7890')
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number', () => {
      expect(validatePhoneNumber('(234) 567-8901').valid).toBe(true)
      expect(validatePhoneNumber('2345678901').valid).toBe(true)
    })

    it('should reject phone number with invalid area code', () => {
      expect(validatePhoneNumber('(011) 456-7890').valid).toBe(false)
      expect(validatePhoneNumber('(000) 456-7890').valid).toBe(false)
    })

    it('should reject phone number with invalid exchange code', () => {
      expect(validatePhoneNumber('(123) 011-7890').valid).toBe(false)
      expect(validatePhoneNumber('(123) 000-7890').valid).toBe(false)
    })

    it('should reject phone number that is too short', () => {
      expect(validatePhoneNumber('(123) 456-789').valid).toBe(false)
      expect(validatePhoneNumber('123456789').valid).toBe(false)
    })
  })

  describe('formatSSN', () => {
    it('should format 9 digits as XXX-XX-XXXX', () => {
      expect(formatSSN('123456789')).toBe('123-45-6789')
    })

    it('should handle partial input', () => {
      expect(formatSSN('123')).toBe('123')
      expect(formatSSN('1234')).toBe('123-4')
      expect(formatSSN('12345')).toBe('123-45')
      expect(formatSSN('123456')).toBe('123-45-6')
    })

    it('should strip non-digits and limit to 9', () => {
      expect(formatSSN('123-45-6789')).toBe('123-45-6789')
      expect(formatSSN('12345678901')).toBe('123-45-6789')
    })

    it('should handle empty input', () => {
      expect(formatSSN('')).toBe('')
    })
  })

  describe('validateSSN', () => {
    it('should accept valid SSN format', () => {
      expect(validateSSN('123-45-6789').valid).toBe(true)
      expect(validateSSN('123456789').valid).toBe(true)
    })

    it('should reject empty or short SSN', () => {
      expect(validateSSN('').valid).toBe(false)
      expect(validateSSN('123-45-678').valid).toBe(false)
      expect(validateSSN('12345678').valid).toBe(false)
    })

    it('should reject more than 9 digits', () => {
      expect(validateSSN('123-45-67890').valid).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com').valid).toBe(true)
      expect(validateEmail('user.name@domain.co.uk').valid).toBe(true)
    })

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid-email').valid).toBe(false)
      expect(validateEmail('@example.com').valid).toBe(false)
      expect(validateEmail('test@').valid).toBe(false)
    })

    it('should reject empty email', () => {
      expect(validateEmail('').valid).toBe(false)
    })
  })
})

