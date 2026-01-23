import { describe, it, expect } from '@jest/globals'
import { formatPhoneNumber, validatePhoneNumber, validateEmail } from '../../../../frontend/src/utils/validation.js'

describe('Validation Utilities', () => {
  describe('formatPhoneNumber', () => {
    it('should format 10 digits correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    })

    it('should handle partial input', () => {
      expect(formatPhoneNumber('123')).toBe('(123')
      expect(formatPhoneNumber('1234')).toBe('(123) 4')
      expect(formatPhoneNumber('123456')).toBe('(123) 456')
    })

    it('should handle empty input', () => {
      expect(formatPhoneNumber('')).toBe('')
    })

    it('should limit to 10 digits', () => {
      expect(formatPhoneNumber('12345678901234')).toBe('(123) 456-7890')
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number', () => {
      const result = validatePhoneNumber('(234) 567-8901')
      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    it('should reject phone number with invalid area code', () => {
      const result = validatePhoneNumber('(012) 456-7890')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('Area code')
    })

    it('should reject phone number with invalid exchange code', () => {
      const result = validatePhoneNumber('(234) 012-7890')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('Exchange code')
    })

    it('should reject phone number that is too short', () => {
      const result = validatePhoneNumber('12345')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('10 digits')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('valid email')
    })

    it('should reject empty email', () => {
      const result = validateEmail('')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('required')
    })
  })
})

