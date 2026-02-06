/**
 * Redact SSN (and I-9 List C SSN when applicable) from form data before persisting to database.
 * COMPLIANCE: SSN must never be stored in the database; only in PDFs and temporary cookie.
 * @param {Object} formData - Raw form payload
 * @param {number} stepNumber - Form step (1-7)
 * @returns {Object} Shallow copy with SSN fields removed/redacted
 */
export function redactFormDataForStorage(formData, stepNumber) {
  if (!formData || typeof formData !== 'object') return formData
  const copy = { ...formData }

  // Step 1 (W-4), Step 2 (I-9), Step 6 (8850), and Step 7 (9061) may contain SSN — never store in DB
  if (stepNumber === 1 || stepNumber === 2 || stepNumber === 6 || stepNumber === 7) {
    delete copy.ssn
  }

  // Step 2 (I-9): List C document number is SSN when user selected Social Security Card
  if (stepNumber === 2 && copy.listCDocument === 'ssn-card') {
    delete copy.listCDocumentNumber
  }

  return copy
}
