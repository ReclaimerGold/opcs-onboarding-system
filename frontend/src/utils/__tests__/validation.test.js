import { describe, it, expect } from 'vitest'
import { formatPhoneNumber, validatePhoneNumber, validateEmail } from '../validation.js'

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

