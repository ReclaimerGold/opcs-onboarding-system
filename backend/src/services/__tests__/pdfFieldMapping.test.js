import { describe, expect, it } from 'vitest'
import {
  mapW4FormData,
  mapI9FormData,
  map8850FormData,
  map9061FormData
} from '../pdfFieldMapping.js'

describe('pdf field mapping', () => {
  it('renders zero placeholders and employer block for W-4', () => {
    const mapped = mapW4FormData({
      firstName: 'Jane',
      lastName: 'Doe',
      ssn: '123456789',
      address: '123 Main St',
      city: 'Sioux Falls',
      state: 'SD',
      zipCode: '57104',
      filingStatus: 'single',
      employerName: 'Optimal Prime Cleaning Services',
      employerAddress: '500 Market St',
      employerCity: 'Sioux Falls',
      employerState: 'SD',
      employerZip: '57104',
      employerEIN: '12-3456789'
    })

    expect(mapped.qualifyingChildrenAmount).toBe('0')
    expect(mapped.otherDependentsAmount).toBe('0')
    expect(mapped.totalCreditsStep3).toBe('0')
    expect(mapped.otherIncome).toBe('0')
    expect(mapped.deductions).toBe('0')
    expect(mapped.extraWithholding).toBe('0')
    expect(mapped.employerName).toContain('Optimal Prime Cleaning Services')
    expect(mapped.employerName).toContain('EIN: 12-3456789')
  })

  it('maps I-9 employer section fields', () => {
    const mapped = mapI9FormData({
      firstName: 'Jane',
      lastName: 'Doe',
      ssn: '123-45-6789',
      authorizationType: 'citizen',
      employerAuthorizedRep: 'Jason King, Owner',
      employerBusinessName: 'Optimal Prime Cleaning Services',
      employerBusinessAddress: '500 Market St, Sioux Falls SD 57104',
      firstDayEmployed: '2026-04-02',
      employerSectionDate: '2026-04-02'
    })

    expect(mapped.employerAuthorizedRep).toBe('Jason King, Owner')
    expect(mapped.employerBusinessName).toBe('Optimal Prime Cleaning Services')
    expect(mapped.employerBusinessAddress).toContain('500 Market St')
    expect(mapped.firstDayEmployed).toBe('04/02/2026')
    expect(mapped.employerSectionDate).toBe('04/02/2026')
  })

  it('maps 8850 contact, dates, and title fields', () => {
    const mapped = map8850FormData({
      firstName: 'Jane',
      lastName: 'Doe',
      ssn: '123-45-6789',
      address: '123 Main St',
      city: 'Sioux Falls',
      state: 'SD',
      zipCode: '57104',
      county: 'Minnehaha',
      employerName: 'Optimal Prime Cleaning Services',
      employerEIN: '12-3456789',
      employerAddress: '500 Market St',
      employerCity: 'Sioux Falls',
      employerState: 'SD',
      employerZip: '57104',
      employerPhone: '(605) 555-1212',
      personToContact: 'Jason King',
      applicantSignatureDate: '2026-04-02',
      approvalDate: '2026-04-03',
      employerTitle: 'Owner'
    })

    expect(mapped.dateApplicantGaveInformation).toBe('04/02/2026')
    expect(mapped.personToContact).toBe('Jason King')
    expect(mapped.employerSignatureDate).toBe('04/03/2026')
    expect(mapped.employerTitle).toBe('Owner')
  })

  it('maps 9061 employment boxes from settings-driven values', () => {
    const mapped = map9061FormData({
      firstName: 'Jane',
      lastName: 'Doe',
      middleName: 'Q',
      ssn: '123-45-6789',
      employerName: 'Optimal Prime Cleaning Services',
      employerAddress: '500 Market St',
      employerCity: 'Sioux Falls',
      employerState: 'SD',
      employerZip: '57104',
      employerPhone: '(605) 555-1212',
      employerEmail: 'hr@optimalprimeservices.com',
      startingWage: '18.00/hour',
      jobStartDate: '2026-04-02',
      jobTitle: 'Cleaner'
    })

    expect(mapped.box3_EmployerName).toBe('Optimal Prime Cleaning Services')
    expect(mapped.box9_EmploymentStartDate).toBe('04/02/2026')
    expect(mapped.box10_StartingWage).toBe('18.00/hour')
    expect(mapped.box11_JobTitle).toBe('Cleaner')
    expect(mapped.box4_EmployerMailingAddressTelephoneEmail).toContain('hr@optimalprimeservices.com')
  })
})
