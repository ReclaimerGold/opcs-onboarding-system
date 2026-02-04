/**
 * PDF Field Mapping Configuration
 * Maps application form data to official IRS/USCIS PDF form field names
 * 
 * Note: Field names are specific to each PDF version. If the IRS/USCIS updates
 * their forms, these mappings may need to be updated.
 */

/**
 * W-4 Form Field Mappings (IRS Form W-4 2024/2025)
 * Field names discovered by inspecting the fillable PDF
 */
export const W4_FIELD_MAPPING = {
  // Step 1: Personal Information
  firstName: ['topmostSubform[0].Page1[0].Step1a[0].f1_01[0]', 'f1_01[0]', 'f1_1'],
  lastName: ['topmostSubform[0].Page1[0].Step1a[0].f1_02[0]', 'f1_02[0]', 'f1_2'],
  ssn: ['topmostSubform[0].Page1[0].f1_05[0]', 'f1_05[0]', 'f1_5'],
  address: ['topmostSubform[0].Page1[0].Step1a[0].f1_03[0]', 'f1_03[0]', 'f1_3'],
  cityStateZip: ['topmostSubform[0].Page1[0].Step1a[0].f1_04[0]', 'f1_04[0]', 'f1_4'],

  // Step 1(c): Filing Status checkboxes
  filingStatusSingle: ['topmostSubform[0].Page1[0].c1_1[0]', 'c1_1[0]', 'c1_1'],
  filingStatusMarriedFilingJointly: ['topmostSubform[0].Page1[0].c1_1[1]', 'c1_1[1]', 'c1_2'],
  filingStatusHeadOfHousehold: ['topmostSubform[0].Page1[0].c1_1[2]', 'c1_1[2]', 'c1_3'],

  // Step 2: Multiple Jobs checkbox
  multipleJobsCheckbox: ['topmostSubform[0].Page1[0].Step2c[0].c1_2[0]', 'c1_2[0]', 'c1_4'],

  // Step 3: Dependents
  qualifyingChildrenAmount: ['topmostSubform[0].Page1[0].Step3_ReadOrder[0].f1_06[0]', 'f1_06[0]', 'f1_6'],
  otherDependentsAmount: ['topmostSubform[0].Page1[0].Step3_ReadOrder[0].f1_07[0]', 'f1_07[0]', 'f1_7'],
  totalCreditsStep3: ['topmostSubform[0].Page1[0].f1_08[0]', 'f1_08[0]', 'f1_8'],  // Note: f1_08 is outside Step3_ReadOrder

  // Step 4: Other Adjustments
  otherIncome: ['topmostSubform[0].Page1[0].Step4a[0].f1_09[0]', 'f1_09[0]', 'f1_9'],
  deductions: ['topmostSubform[0].Page1[0].Step4b[0].f1_10[0]', 'f1_10[0]', 'f1_10'],
  extraWithholding: ['topmostSubform[0].Page1[0].Step4c[0].f1_11[0]', 'f1_11[0]', 'f1_11'],

  // Step 5: Signature
  signature: ['topmostSubform[0].Page1[0].f1_12[0]', 'f1_12[0]', 'f1_12'],
  signatureDate: ['topmostSubform[0].Page1[0].f1_13[0]', 'f1_13[0]', 'f1_13'],

  // Employer section
  employerName: ['topmostSubform[0].Page1[0].f1_14[0]', 'f1_14[0]', 'f1_14'],
  employerEIN: ['topmostSubform[0].Page1[0].f1_15[0]', 'f1_15[0]', 'f1_15'],
  firstDateEmployment: ['topmostSubform[0].Page1[0].f1_16[0]', 'f1_16[0]', 'f1_16']
}

/**
 * I-9 Form Field Mappings (USCIS Form I-9)
 * Employee Section 1 fields
 */
export const I9_FIELD_MAPPING = {
  // Section 1: Employee Information
  lastName: ['Last Name (Family Name)', 'Last Name Family Name from Section 1', 'form1[0].#subform[0].LastFamilyName[0]', 'LastFamilyName[0]'],
  firstName: ['First Name Given Name', 'First Name Given Name from Section 1', 'First Name (Given Name)', 'form1[0].#subform[0].FirstGivenName[0]', 'FirstGivenName[0]'],
  middleInitial: ['Employee Middle Initial (if any)', 'Middle initial if any from Section 1', 'Middle Initial', 'form1[0].#subform[0].MiddleInitial[0]', 'MiddleInitial[0]'],
  otherLastNames: ['Employee Other Last Names Used (if any)', 'Other Last Names Used', 'form1[0].#subform[0].OtherNames[0]', 'OtherNames[0]'],

  // Address
  address: ['Address Street Number and Name', 'Address (Street Number and Name)', 'form1[0].#subform[0].Address[0]', 'Address[0]'],
  aptNumber: ['Apt. Number', 'form1[0].#subform[0].AptNumber[0]', 'AptNumber[0]'],
  city: ['City or Town', 'form1[0].#subform[0].City[0]', 'City[0]'],
  state: ['State'], // PDFDropdown - handled separately
  zipCode: ['ZIP Code', 'form1[0].#subform[0].ZipCode[0]', 'ZipCode[0]'],

  // Date of Birth and SSN
  dateOfBirth: ['Date of Birth mmddyyyy', 'Date of Birth', 'form1[0].#subform[0].DateofBirth[0]', 'DateofBirth[0]'],
  ssn: ['US Social Security Number'], // Single field, not split
  ssn1: ['SSN1', 'form1[0].#subform[0].SSN1[0]', 'SSN1[0]'], // Keep for backward compatibility
  ssn2: ['SSN2', 'form1[0].#subform[0].SSN2[0]', 'SSN2[0]'], // Keep for backward compatibility
  ssn3: ['SSN3', 'form1[0].#subform[0].SSN3[0]', 'SSN3[0]'], // Keep for backward compatibility

  // Contact
  email: ['Employees E-mail Address', 'E-mail Address', 'form1[0].#subform[0].Email[0]', 'Email[0]'],
  phone: ['Telephone Number', 'form1[0].#subform[0].TelephoneNumber[0]', 'TelephoneNumber[0]'],

  // Citizenship Status checkboxes (actual field names in PDF)
  citizenCheckbox: ['CB_1', 'Citizen', 'form1[0].#subform[0].Citizen[0]', 'Citizen[0]'],
  nationalCheckbox: ['CB_2', 'National', 'form1[0].#subform[0].National[0]', 'National[0]'],
  permanentResidentCheckbox: ['CB_3', 'Permanent Resident', 'LawfulPermanentResident', 'form1[0].#subform[0].LawfulPermanentResident[0]', 'LawfulPermanentResident[0]'],
  alienAuthorizedCheckbox: ['CB_4', 'Alien Authorized', 'form1[0].#subform[0].AlienAuthorized[0]', 'AlienAuthorized[0]'],

  // Alien/USCIS Number fields
  alienNumber: ['3 A lawful permanent resident Enter USCIS or ANumber', 'A-Number', 'form1[0].#subform[0].AlienNumber[0]', 'AlienNumber[0]'],
  uscisNumber: ['USCIS Number', 'form1[0].#subform[0].USCISNumber[0]', 'USCISNumber[0]'],
  i94AdmissionNumber: ['I-94 Admission Number', 'form1[0].#subform[0].I94[0]', 'I94[0]'],
  foreignPassportNumber: ['Foreign Passport Number', 'form1[0].#subform[0].ForeignPassportNumber[0]', 'ForeignPassportNumber[0]'],
  countryOfIssuance: ['Country of Issuance', 'form1[0].#subform[0].CountryOfIssuance[0]', 'CountryOfIssuance[0]'],
  expirationDate: ['Expiration Date', 'form1[0].#subform[0].ExpirationDate[0]', 'ExpirationDate[0]'],

  // Signature
  signatureEmployee: ['Signature of Employee', 'form1[0].#subform[0].SignatureEmployee[0]', 'SignatureEmployee[0]'],
  signatureDateEmployee: ["Today's Date mmddyyy", 'Date', 'form1[0].#subform[0].DateEmployee[0]', 'DateEmployee[0]'],

  // Preparer/Translator section (if applicable)
  preparerLastName: ['Preparer or Translator Last Name (Family Name) 0', 'Preparer Last Name', 'form1[0].#subform[1].PreparerLastName[0]', 'PreparerLastName[0]'],
  preparerFirstName: ['Preparer or Translator First Name (Given Name) 0', 'Preparer First Name', 'form1[0].#subform[1].PreparerFirstName[0]', 'PreparerFirstName[0]'],
  preparerAddress: ['Preparer or Translator Address (Street Number and Name) 0', 'Preparer Address', 'form1[0].#subform[1].PreparerAddress[0]', 'PreparerAddress[0]'],
  preparerCity: ['Preparer or Translator City or Town 0', 'Preparer City', 'form1[0].#subform[1].PreparerCity[0]', 'PreparerCity[0]'],
  preparerState: ['Preparer State 0', 'Preparer State', 'form1[0].#subform[1].PreparerState[0]', 'PreparerState[0]'],
  preparerZip: ['Zip Code 0', 'Preparer ZIP', 'form1[0].#subform[1].PreparerZip[0]', 'PreparerZip[0]']
}

/**
 * Form 8850 Field Mappings (IRS Form 8850)
 * Pre-Screening Notice and Certification Request for WOTC
 * 
 * Note: The actual IRS 8850 form has 7 text fields on Page 1:
 * f1_1: First name, f1_2: Middle initial, f1_3: Last name, f1_4: SSN
 * f1_5: Street address, f1_6: City/State/ZIP (combined), f1_7: County
 */
export const F8850_FIELD_MAPPING = {
  // Applicant Information
  firstName: ['topmostSubform[0].Page1[0].f1_1[0]', 'f1_1[0]', 'f1_1'],
  middleInitial: ['topmostSubform[0].Page1[0].f1_2[0]', 'f1_2[0]', 'f1_2'],
  lastName: ['topmostSubform[0].Page1[0].f1_3[0]', 'f1_3[0]', 'f1_3'],
  ssn: ['topmostSubform[0].Page1[0].f1_4[0]', 'f1_4[0]', 'f1_4'],

  // Address - Note: IRS form combines city/state/zip in f1_6
  streetAddress: ['topmostSubform[0].Page1[0].f1_5[0]', 'f1_5[0]', 'f1_5'],
  cityStateZip: ['topmostSubform[0].Page1[0].f1_6[0]', 'f1_6[0]', 'f1_6'],
  county: ['topmostSubform[0].Page1[0].f1_7[0]', 'f1_7[0]', 'f1_7'],

  // Target Group checkboxes (lines 1-8)
  targetGroup1: ['topmostSubform[0].Page1[0].c1_1[0]', 'c1_1[0]', 'c1_1'], // TANF recipient
  targetGroup2: ['topmostSubform[0].Page1[0].c1_2[0]', 'c1_2[0]', 'c1_2'], // Veteran
  targetGroup3: ['topmostSubform[0].Page1[0].c1_3[0]', 'c1_3[0]', 'c1_3'], // Ex-felon
  targetGroup4: ['topmostSubform[0].Page1[0].c1_4[0]', 'c1_4[0]', 'c1_4'], // Designated community resident
  targetGroup5: ['topmostSubform[0].Page1[0].c1_5[0]', 'c1_5[0]', 'c1_5'], // Vocational rehabilitation
  targetGroup6: ['topmostSubform[0].Page1[0].c1_6[0]', 'c1_6[0]', 'c1_6'], // Summer youth employee
  targetGroup7: ['topmostSubform[0].Page1[0].c1_7[0]', 'c1_7[0]', 'c1_7'], // SNAP recipient
  targetGroup8: ['topmostSubform[0].Page1[0].c1_8[0]', 'c1_8[0]', 'c1_8'], // SSI recipient
  targetGroup9: ['topmostSubform[0].Page1[0].c1_9[0]', 'c1_9[0]', 'c1_9'], // Long-term unemployment

  // Note: IRS Form 8850 Page 1 only has f1_1 through f1_7 as fillable fields
  // The signature area on Page 1 is for manual signature, not a fillable field
  // dateReceivedTANF and dateReleasedConfinement fields don't exist in current template

  // Employer section (Page 2)
  employerName: ['topmostSubform[0].Page2[0].f2_1[0]', 'f2_1[0]', 'f2_1'],
  employerEIN: ['topmostSubform[0].Page2[0].f2_2[0]', 'f2_2[0]', 'f2_2'],
  employerAddress: ['topmostSubform[0].Page2[0].f2_3[0]', 'f2_3[0]', 'f2_3'],
  employerCity: ['topmostSubform[0].Page2[0].f2_4[0]', 'f2_4[0]', 'f2_4'],
  employerState: ['topmostSubform[0].Page2[0].f2_5[0]', 'f2_5[0]', 'f2_5'],
  employerZip: ['topmostSubform[0].Page2[0].f2_6[0]', 'f2_6[0]', 'f2_6'],
  employerPhone: ['topmostSubform[0].Page2[0].f2_7[0]', 'f2_7[0]', 'f2_7'],
  jobOfferedDate: ['topmostSubform[0].Page2[0].f2_8[0]', 'f2_8[0]', 'f2_8'],
  jobStartDate: ['topmostSubform[0].Page2[0].f2_9[0]', 'f2_9[0]', 'f2_9'],
  startingWage: ['topmostSubform[0].Page2[0].f2_10[0]', 'f2_10[0]', 'f2_10'],
  jobTitle: ['topmostSubform[0].Page2[0].f2_11[0]', 'f2_11[0]', 'f2_11']
}

/**
 * Format date for PDF forms (MM/DD/YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateForPDF(date) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return date // Return as-is if not a valid date

  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()

  return `${month}/${day}/${year}`
}

/**
 * Format SSN for PDF (XXX-XX-XXXX)
 * @param {string} ssn - SSN string (may or may not have dashes)
 * @returns {string} Formatted SSN
 */
export function formatSSNForPDF(ssn) {
  if (!ssn) return ''

  // Remove any non-digits
  const digits = ssn.replace(/\D/g, '')

  if (digits.length !== 9) return ssn // Return as-is if not 9 digits

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
}

/**
 * Split SSN into parts for I-9 form (which has separate fields)
 * @param {string} ssn - SSN string
 * @returns {Object} Object with ssn1, ssn2, ssn3 parts
 */
export function splitSSNForI9(ssn) {
  if (!ssn) return { ssn1: '', ssn2: '', ssn3: '' }

  const digits = ssn.replace(/\D/g, '')

  return {
    ssn1: digits.slice(0, 3),
    ssn2: digits.slice(3, 5),
    ssn3: digits.slice(5, 9)
  }
}

/**
 * Format phone number for PDF (area code) XXX-XXXX
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export function formatPhoneForPDF(phone) {
  if (!phone) return ''

  // Remove any non-digits
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  return phone // Return as-is if not 10 digits
}

/**
 * Format currency amount (no dollar sign, commas for thousands)
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted amount
 */
export function formatCurrencyForPDF(amount) {
  if (amount === null || amount === undefined || amount === '') return ''

  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num)) return ''

  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Try to set a field value by attempting multiple field name variations
 * @param {PDFForm} form - PDF form object
 * @param {string[]} fieldNames - Array of possible field names to try
 * @param {string} value - Value to set
 * @returns {boolean} True if field was found and set
 */
export function trySetTextField(form, fieldNames, value) {
  if (!value && value !== 0) return false

  for (const fieldName of fieldNames) {
    try {
      const field = form.getTextField(fieldName)
      field.setText(String(value))
      return true
    } catch (error) {
      // Field not found with this name, try next
      continue
    }
  }

  return false
}

/**
 * Try to check a checkbox by attempting multiple field name variations
 * @param {PDFForm} form - PDF form object
 * @param {string[]} fieldNames - Array of possible field names to try
 * @param {boolean} checked - Whether to check or uncheck
 * @returns {boolean} True if field was found and set
 */
export function trySetCheckbox(form, fieldNames, checked = true) {
  for (const fieldName of fieldNames) {
    try {
      const field = form.getCheckBox(fieldName)
      if (checked) {
        field.check()
      } else {
        field.uncheck()
      }
      return true
    } catch (error) {
      // Field not found with this name, try next
      continue
    }
  }

  return false
}

/**
 * Try to select a radio button option
 * @param {PDFForm} form - PDF form object
 * @param {string} groupName - Radio group name
 * @param {string} optionValue - Option value to select
 * @returns {boolean} True if selection was successful
 */
export function trySetRadioGroup(form, groupName, optionValue) {
  try {
    const radioGroup = form.getRadioGroup(groupName)
    radioGroup.select(optionValue)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Try to set a dropdown field value by attempting multiple field name variations
 * @param {PDFForm} form - PDF form object
 * @param {string[]} fieldNames - Array of possible field names to try
 * @param {string} value - Value to select
 * @returns {boolean} True if field was found and set
 */
export function trySetDropdown(form, fieldNames, value) {
  if (!value && value !== 0) return false

  for (const fieldName of fieldNames) {
    try {
      const field = form.getDropdown(fieldName)
      // Try to select by value (state code like "SD")
      try {
        field.select(value)
        return true
      } catch (e) {
        // If direct selection fails, try to find matching option
        const options = field.getOptions()
        const matchingOption = options.find(opt =>
          opt === value || opt.toUpperCase() === value.toUpperCase()
        )
        if (matchingOption) {
          field.select(matchingOption)
          return true
        }
      }
    } catch (error) {
      // Field not found with this name, try next
      continue
    }
  }

  return false
}

/**
 * Get all field names from a PDF form (for debugging/mapping discovery)
 * @param {PDFForm} form - PDF form object
 * @returns {Object[]} Array of field info objects
 */
export function getFormFieldInfo(form) {
  const fields = form.getFields()

  return fields.map(field => ({
    name: field.getName(),
    type: field.constructor.name,
    isReadOnly: field.isReadOnly?.() ?? false
  }))
}

/**
 * Map W-4 form data to PDF field values
 * @param {Object} formData - Application form data
 * @returns {Object} Mapped field values
 */
export function mapW4FormData(formData) {
  return {
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    ssn: formatSSNForPDF(formData.ssn),
    address: formData.address || '',
    cityStateZip: `${formData.city || ''}, ${formData.state || ''} ${formData.zipCode || ''}`.trim(),

    // Filing status - map to checkbox
    filingStatusSingle: formData.filingStatus === 'single',
    filingStatusMarriedFilingJointly: formData.filingStatus === 'married_filing_jointly' || formData.filingStatus === 'married',
    filingStatusHeadOfHousehold: formData.filingStatus === 'head_of_household',

    // Multiple jobs
    multipleJobsCheckbox: formData.multipleJobs === true,

    // Dependents - calculate amounts (leave blank if no dependents per IRS instructions)
    qualifyingChildrenAmount: formData.qualifyingChildren ? formatCurrencyForPDF(formData.qualifyingChildren * 2000) : '',
    otherDependentsAmount: formData.dependents ? formatCurrencyForPDF(formData.dependents * 500) : '',
    // Step 3 total should be blank if no dependents (value of 0 means leave blank)
    totalCreditsStep3: (formData.qualifyingChildren || formData.dependents)
      ? formatCurrencyForPDF(((formData.qualifyingChildren || 0) * 2000) + ((formData.dependents || 0) * 500))
      : '',

    // Step 4 adjustments
    otherIncome: formatCurrencyForPDF(formData.otherIncome),
    deductions: formatCurrencyForPDF(formData.deductions),
    extraWithholding: formatCurrencyForPDF(formData.extraWithholding),

    // Signature date
    signatureDate: formatDateForPDF(new Date())
  }
}

/**
 * Map I-9 form data to PDF field values
 * @param {Object} formData - Application form data
 * @returns {Object} Mapped field values
 */
export function mapI9FormData(formData) {
  const ssnParts = splitSSNForI9(formData.ssn)

  return {
    lastName: formData.lastName || '',
    firstName: formData.firstName || '',
    middleInitial: formData.middleName ? formData.middleName.charAt(0) : '',
    otherLastNames: formData.otherLastNames || '',

    address: formData.address || '',
    aptNumber: formData.aptNumber || '',
    city: formData.city || '',
    state: formData.state || '',
    zipCode: formData.zipCode || '',

    dateOfBirth: formatDateForPDF(formData.dateOfBirth),
    // I-9 SSN field requires 9 digits without dashes (maxLength=9)
    ssn: formData.ssn ? formData.ssn.replace(/-/g, '') : '',
    ssn1: ssnParts.ssn1,
    ssn2: ssnParts.ssn2,
    ssn3: ssnParts.ssn3,

    email: formData.email || '',
    phone: formatPhoneForPDF(formData.phone),

    // Citizenship status checkboxes
    citizenCheckbox: formData.authorizationType === 'citizen',
    nationalCheckbox: formData.authorizationType === 'national',
    permanentResidentCheckbox: formData.authorizationType === 'permanent',
    alienAuthorizedCheckbox: formData.authorizationType === 'authorized',

    // Additional fields for non-citizens
    alienNumber: formData.alienNumber || '',
    uscisNumber: formData.uscisNumber || '',
    i94AdmissionNumber: formData.i94Number || '',
    foreignPassportNumber: formData.foreignPassportNumber || '',
    countryOfIssuance: formData.countryOfIssuance || '',
    expirationDate: formatDateForPDF(formData.authorizationExpiration),

    // Signature date
    signatureDateEmployee: formatDateForPDF(new Date())
  }
}

/**
 * Map Form 8850 data to PDF field values
 * @param {Object} formData - Application form data
 * @returns {Object} Mapped field values
 */
export function map8850FormData(formData) {
  // Build combined city/state/zip field for the IRS 8850 form format
  const cityStateZip = [
    formData.city || '',
    formData.state || '',
    formData.zip || formData.zipCode || ''
  ].filter(Boolean).join(', ')

  return {
    firstName: formData.firstName || '',
    middleInitial: (formData.middleName || formData.middle) ? (formData.middleName || formData.middle).charAt(0) : '',
    lastName: formData.lastName || '',
    ssn: formatSSNForPDF(formData.ssn),

    // Address fields - IRS 8850 combines city/state/zip
    streetAddress: formData.address || '',
    cityStateZip: cityStateZip,
    county: formData.county || '',

    // Target group checkboxes based on form data
    targetGroup1: formData.targetGroups?.includes('tanf') || false,
    targetGroup2: formData.targetGroups?.includes('veteran') || false,
    targetGroup3: formData.targetGroups?.includes('exFelon') || false,
    targetGroup4: formData.targetGroups?.includes('designatedCommunity') || false,
    targetGroup5: formData.targetGroups?.includes('vocationalRehab') || false,
    targetGroup6: formData.targetGroups?.includes('summerYouth') || false,
    targetGroup7: formData.targetGroups?.includes('snap') || false,
    targetGroup8: formData.targetGroups?.includes('ssi') || false,
    targetGroup9: formData.targetGroups?.includes('longTermUnemployed') || false

    // Note: IRS Form 8850 Page 1 signature is manual (not a fillable field)
    // Employer section (Page 2) fields are filled separately if needed
  }
}

export default {
  W4_FIELD_MAPPING,
  I9_FIELD_MAPPING,
  F8850_FIELD_MAPPING,
  formatDateForPDF,
  formatSSNForPDF,
  splitSSNForI9,
  formatPhoneForPDF,
  formatCurrencyForPDF,
  trySetTextField,
  trySetCheckbox,
  trySetRadioGroup,
  trySetDropdown,
  getFormFieldInfo,
  mapW4FormData,
  mapI9FormData,
  map8850FormData
}

