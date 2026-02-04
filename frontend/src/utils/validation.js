/**
 * Format SSN as XXX-XX-XXXX (max 9 digits)
 * @param {string} value - Raw input
 * @returns {string} Formatted SSN or partial (e.g. "123-45")
 */
export function formatSSN(value) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

/**
 * Validate SSN format (XXX-XX-XXXX, 9 digits)
 */
export function validateSSN(ssn) {
  if (!ssn) return { valid: false, message: 'Social Security Number is required' }
  const digits = ssn.replace(/\D/g, '')
  if (digits.length < 9) return { valid: false, message: 'Social Security Number must be 9 digits' }
  if (digits.length > 9) return { valid: false, message: 'Social Security Number must be exactly 9 digits' }
  return { valid: true, message: '' }
}

/**
 * Format US phone number to (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value) {
  if (!value) return ''
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')

  // Limit to 10 digits
  const limited = digits.slice(0, 10)

  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Validate US phone number
 */
export function validatePhoneNumber(phone) {
  if (!phone) return { valid: false, message: 'Phone number is required' }

  const digits = phone.replace(/\D/g, '')

  if (digits.length === 0) return { valid: false, message: 'Phone number is required' }
  if (digits.length < 10) return { valid: false, message: 'Phone number must be 10 digits' }
  if (digits.length > 10) return { valid: false, message: 'Phone number must be exactly 10 digits' }

  // Check area code (first digit cannot be 0 or 1)
  if (digits[0] === '0' || digits[0] === '1') {
    return { valid: false, message: 'Area code cannot start with 0 or 1' }
  }

  // Check exchange code (4th digit cannot be 0 or 1)
  if (digits[3] === '0' || digits[3] === '1') {
    return { valid: false, message: 'Exchange code cannot start with 0 or 1' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate email address
 */
export function validateEmail(email) {
  if (!email) return { valid: false, message: 'Email is required' }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' }
  }

  // Additional checks
  if (email.length > 254) {
    return { valid: false, message: 'Email address is too long' }
  }

  return { valid: true, message: '' }
}

/**
 * Format email (trim and lowercase)
 */
export function formatEmail(email) {
  if (!email) return ''
  return email.trim().toLowerCase()
}

