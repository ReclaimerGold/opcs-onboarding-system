# Compliance Documentation
## OPCS Onboarding System

This document outlines all compliance requirements for the OPCS Onboarding System, including federal regulations and South Dakota state-specific requirements.

---

## Table of Contents

1. [Federal Compliance Requirements](#federal-compliance-requirements)
2. [South Dakota State Requirements](#south-dakota-state-requirements)
3. [Document Retention Requirements](#document-retention-requirements)
4. [Privacy & Data Protection](#privacy--data-protection)
5. [Audit Logging Requirements](#audit-logging-requirements)
6. [Compliance Checklists](#compliance-checklists)
7. [System Implementation](#system-implementation)

---

## Federal Compliance Requirements

### 1. Immigration Reform and Control Act (IRCA) / 8 CFR 274a.2
**Form I-9 Employment Eligibility Verification**

- **Requirement**: Employers must verify identity and employment authorization
- **Retention**: 
  - 3 years after date of hire, OR
  - 1 year after date of termination (whichever is later)
- **Implementation**: 
  - I-9 forms stored with calculated retention dates
  - Automatic deletion after retention period expires
  - See `backend/src/services/pdfService.js` for retention calculation
- **Document versioning**: During initial onboarding, replacing an I-9 identity document (List A, B, or C) overwrites the existing record. After onboarding is complete, replacing saves a **new version** (duplicate row) so history is preserved; the UI shows one "current" document per category (latest by upload date). All versions are retained per the same IRCA schedule.
- **Re-capture of document details**: When an employee replaces an I-9 identity document (e.g. updated driver's license) from the dashboard, the system re-captures **document number**, **issuing authority**, and **expiration date** (same fields as the initial I-9 submission) so the stored record matches the new document.

**Compliance Checklist:**
- [ ] I-9 completed no later than first day of employment
- [ ] Documents verified within 3 business days of hire
- [ ] I-9 stored securely with encryption
- [ ] Retention date calculated correctly (3 years after hire OR 1 year after termination)
- [ ] Documents deleted after retention period expires

### 2. Internal Revenue Service (IRS) / 26 CFR 31.6001-1
**Form W-4 Employee's Withholding Certificate**

- **Requirement**: Employers must maintain W-4 forms for tax withholding
- **Retention**: 4 years after last payment or tax return filing
- **Implementation**: 
  - W-4 forms stored with 4-year retention from submission date
  - Automatic deletion after retention period

**Compliance Checklist:**
- [ ] W-4 collected before first payroll
- [ ] W-4 stored securely with encryption
- [ ] Retention period: 4 years from submission
- [ ] Documents deleted after retention period expires

### 3. Form 8850 - Work Opportunity Tax Credit (WOTC)
**Pre-Screening Notice and Certification Request**

- **Requirement**: Employers may claim tax credit for hiring certain individuals
- **Retention**: 4 years (same as W-4)
- **Implementation**: 
  - Form 8850 stored with 4-year retention from submission date

**Compliance Checklist:**
- [ ] Form 8850 completed during onboarding
- [ ] Form stored securely with encryption
- [ ] Retention period: 4 years from submission
- [ ] Documents deleted after retention period expires

### 4. Fair Credit Reporting Act (FCRA) / 15 U.S.C. § 1681
**Background Check Compliance**

- **Requirement**: Employers must comply with FCRA when using background checks
- **Key Requirements**:
  - Disclosure and authorization before background check
  - Pre-adverse action notice if information may be used
  - Adverse action notice if decision is made
  - Disposal of background check information
- **Retention**: 5 years (recommended for compliance documentation)
- **Implementation**: 
  - Background check forms stored with 5-year retention
  - Criminal conviction disclosure form included in Step 3

**Compliance Checklist:**
- [ ] Disclosure provided before background check
- [ ] Authorization obtained in writing
- [ ] Pre-adverse action notice sent if applicable
- [ ] Adverse action notice sent if applicable
- [ ] Background check information stored securely
- [ ] Retention period: 5 years from submission
- [ ] Documents deleted after retention period expires

### 5. Fair Labor Standards Act (FLSA) / 29 CFR Part 516
**Payroll Record Requirements**

- **Requirement**: Employers must maintain payroll records
- **Retention**: 3 years for payroll records, 2 years for supplementary records
- **Implementation**: 
  - Direct deposit forms stored with 3-year retention
  - Employment acknowledgements stored with 1-year retention

**Compliance Checklist:**
- [ ] Direct deposit authorization collected
- [ ] Payroll records maintained for 3 years
- [ ] Documents stored securely with encryption
- [ ] Documents deleted after retention period expires

### 6. Equal Employment Opportunity Commission (EEOC) / 29 CFR 1602
**Employment Record Retention**

- **Requirement**: Employers must maintain employment records
- **Retention**: 
  - 1 year from date of record creation or personnel action
  - 3 years if employee files discrimination charge
- **Implementation**: 
  - All employment records tracked with appropriate retention periods

**Compliance Checklist:**
- [ ] Employment records maintained
- [ ] Retention periods calculated correctly
- [ ] Records stored securely
- [ ] Records deleted after retention period expires

### 7. Social Security Number (SSN) Protection
**Federal Privacy Requirements**

- **Requirement**: Minimize SSN collection and storage
- **Implementation**: 
  - SSNs NEVER stored in database
  - SSNs only included in PDF documents
  - SSNs temporarily stored in browser cookie (1 hour expiration) for user convenience
  - Cookie cleared on logout
  - See `frontend/src/utils/cookies.js` for implementation

**Compliance Checklist:**
- [ ] SSN not stored in database
- [ ] SSN only in PDF documents (encrypted)
- [ ] SSN cookie expires after 1 hour
- [ ] SSN cookie cleared on logout
- [ ] Privacy notice displayed before SSN collection
- [ ] Explicit consent obtained for SSN collection

### 8. E-Signatures
**Electronic Signatures on PDF Forms**

- **Requirement**: E-signatures (drawn or typed) are captured during onboarding and imprinted on W-4, I-9, and Form 8850 PDFs.
- **Implementation**:
  - Signature image is captured once per session and reused across PDF-generating steps.
  - Signature data is part of the submitted form payload and is stored in `form_submissions.form_data` JSON (same as other form fields).
  - No separate retention rule: the signature is embedded in the PDF and retained with the same schedule as the form (W-4: 4 years; I-9: per IRCA; 8850: 4 years).
  - Admin configures placement per form type (free-place coordinates) in Admin → System → PDF Templates (Signature Placement panel).

**Compliance Checklist:**
- [ ] Signature is required before submitting steps that generate PDFs (W-4, I-9, 8850)
- [ ] Signature image is not stored separately from the form; it is part of form data and the generated PDF
- [ ] Retention of signed PDFs follows the same schedule as the underlying form type

---

## South Dakota State Requirements

### 1. South Dakota Codified Laws (SDCL) - Employment Records
**State Employment Record Requirements**

- **Requirement**: South Dakota follows federal requirements for employment records
- **Additional Considerations**:
  - No state-specific retention requirements beyond federal
  - State law defers to federal regulations for most employment records

**Compliance Checklist:**
- [ ] Federal requirements met (see above)
- [ ] No additional state-specific requirements

### 2. South Dakota Data Breach Notification Law (SDCL 22-40-20)
**Data Security and Breach Notification**

- **Requirement**: Notification required if personal information is breached
- **Personal Information Includes**:
  - Social Security Numbers
  - Driver's license numbers
  - Financial account numbers
- **Notification**: Must notify affected individuals within 60 days
- **Implementation**: 
  - All sensitive data encrypted (AES-256-GCM)
  - Audit logging for all data access
  - Secure storage in Google Drive (encrypted)

**Compliance Checklist:**
- [ ] All sensitive data encrypted at rest
- [ ] Encryption keys secured
- [ ] Audit logs maintained for data access
- [ ] Breach notification plan documented
- [ ] Incident response procedures in place

### 3. South Dakota Right to Work Law
**Employment Authorization**

- **Requirement**: South Dakota is a right-to-work state
- **Note**: I-9 compliance (federal) still required
- **Implementation**: 
  - I-9 forms collected and stored per federal requirements

**Compliance Checklist:**
- [ ] I-9 forms collected (federal requirement)
- [ ] No additional state-specific authorization forms required

### 4. South Dakota Wage and Hour Laws
**Payroll Compliance**

- **Requirement**: Follow federal FLSA requirements
- **Minimum Wage**: Federal minimum wage applies
- **Implementation**: 
  - Direct deposit forms stored per FLSA requirements

**Compliance Checklist:**
- [ ] Federal FLSA requirements met
- [ ] Direct deposit forms stored securely
- [ ] Retention periods followed

### 5. South Dakota Background Check Laws
**Criminal History Checks**

- **Requirement**: Employers may conduct background checks
- **Ban the Box**: No state-wide ban-the-box law (check local ordinances)
- **Implementation**: 
  - Criminal conviction disclosure form in Step 3
  - FCRA compliance maintained

**Compliance Checklist:**
- [ ] FCRA requirements met (federal)
- [ ] Criminal conviction disclosure form collected
- [ ] Background check information stored securely
- [ ] Retention period: 5 years

---

## Document Retention Requirements

### Retention Periods Summary

| Document Type | Retention Period | Legal Basis | Implementation |
|--------------|------------------|-------------|----------------|
| Form I-9 | 3 years after hire OR 1 year after termination (whichever is later) | IRCA / 8 CFR 274a.2 | `calculateRetentionDate()` in `pdfService.js` |
| Form W-4 | 4 years after submission | IRS 26 CFR 31.6001-1 | 4 years from submission |
| Form 8850 | 4 years after submission | IRS requirements | 4 years from submission |
| Background Check | 5 years after submission | FCRA best practice | 5 years from submission |
| Direct Deposit | 3 years after submission | FLSA / 29 CFR 516 | 3 years from submission |
| Acknowledgements | 1 year after submission | General employment records | 1 year from submission |

### Automatic Deletion

- **Service**: `backend/src/services/retentionService.js`
- **Schedule**: Daily at midnight
- **Process**: 
  1. Identifies documents past retention date
  2. Deletes from Google Drive
  3. Updates database records
  4. Logs deletion in audit log

**Compliance Checklist:**
- [ ] Retention service running daily
- [ ] Documents deleted after retention period
- [ ] Deletions logged in audit log
- [ ] No manual intervention required

---

## Privacy & Data Protection

### Data Minimization

- **SSN**: Never stored in database, only in PDFs and temporary cookies
- **Personal Information**: Only collected what is necessary
- **Implementation**: 
  - Database schema excludes SSN fields
  - See `backend/src/database/init.js`

### Encryption

- **Standard**: AES-256-GCM for application-level encryption
- **Encrypted Data**:
  - API keys and credentials (in database)
  - I-9 identity documents (encrypted before upload to Google Drive or local storage)
  - Form submission PDFs when stored locally (encrypted before write)
- **Implementation**: 
  - `backend/src/services/encryptionService.js`
  - **Google Drive**: Documents uploaded to Google Drive are protected by the provider’s encryption at rest. Generated form PDFs (W-4, I-9, 8850) are uploaded as-is; I-9 identity document uploads are application-encrypted before upload.
  - **Local storage**: When Google Drive is not configured, all stored PDFs (form submissions and I-9 docs) are encrypted with AES-256-GCM before being written to disk.

### Secure Storage

- **Primary Storage**: Google Drive (provider encryption at rest; I-9 uploads are also application-encrypted before upload)
- **Fallback Storage**: Local encrypted storage (when Google Drive not configured); all files application-encrypted
- **Database**: SQLite (no sensitive data stored unencrypted; SSN redacted from form_data)

### Cookie Security

- **SSN Cookie**: 
  - Name: `temp_ssn`
  - Expiration: 1 hour
  - Secure: `SameSite=Strict`, `Secure` in production
  - Cleared on logout

### Password Reset Security

- **Reset Tokens**:
  - Generated using cryptographically secure random bytes
  - Stored as bcrypt hash in database (never plaintext)
  - Expiration: 1 hour
  - Single use: Deleted after successful reset
  - All tokens for user invalidated on successful reset
- **Email Delivery**:
  - Sent via Mailgun API (configurable in Settings)
  - Reset link includes one-time token
  - Generic success message prevents email enumeration

**Compliance Checklist:**
- [ ] All sensitive documents encrypted
- [ ] Encryption keys secured
- [ ] SSN not in database
- [ ] Cookies use secure settings
- [ ] Cookies cleared on logout
- [ ] Password reset tokens hashed
- [ ] Password reset tokens expire

---

## Audit Logging Requirements

### Required Audit Events

All of the following events must be logged:

1. **Form Submissions**
   - User ID
   - Form type and step
   - Submission timestamp
   - IP address
   - User agent

2. **Document Access**
   - User ID
   - Document type
   - Access timestamp
   - IP address
   - User agent

3. **Document Deletions**
   - User ID (system)
   - Document type
   - Deletion reason (retention expired)
   - Timestamp

4. **Privacy Consents**
   - User ID
   - Consent type (SSN collection)
   - Consent timestamp
   - IP address

5. **Login Attempts**
   - User ID (if successful)
   - Email/name attempted
   - Success/failure
   - IP address
   - User agent
   - Timestamp

6. **Document Approvals**
   - Manager/Admin User ID
   - Approval ID
   - Submission ID
   - Applicant ID
   - Form type
   - Action (APPROVE_DOCUMENT / REJECT_DOCUMENT)
   - Rejection reason (if rejected)
   - Timestamp
   - IP address
   - User agent

7. **Manager Assignment**
   - Admin User ID
   - Applicant ID
   - Assigned Manager ID
   - Action (ASSIGN_MANAGER)
   - Timestamp
   - IP address

8. **Pending approval storage (temporary blob)**
   - **DOCUMENT_PENDING_APPROVAL_STORED**: When a form that requires manager signoff is submitted, the PDF is stored encrypted in `storage/pending-approval/` instead of being uploaded to Google Drive. This event logs submission ID, form type, and a note that the blob will be erased after upload following signoff.
   - **PENDING_APPROVAL_BLOB_ERASED**: When a manager approves and signs the document, the signed PDF is uploaded to Google Drive (or saved to local encrypted storage), then the temporary pending file is deleted. This event logs that the blob was erased per compliance (no retention of pre-signoff copies).

### Temporary document storage (pending manager signoff)

For form types that require manager approval (e.g. W-4, I-9, Form 8850), the system does **not** upload the generated PDF to Google Drive at submission time. Instead:

1. The PDF is encrypted and stored in **pending-approval** storage (`backend/storage/pending-approval/`).
2. Audit event **DOCUMENT_PENDING_APPROVAL_STORED** is recorded.
3. When a manager approves and signs the document, the signed PDF is uploaded to Google Drive (or local encrypted storage), the pending file is **erased**, and **PENDING_APPROVAL_BLOB_ERASED** is recorded.

This ensures the only retained copy is the final, signed document. Pending blobs are encrypted at rest and must not be retained after successful upload.

### Audit Log Storage

- **Table**: `audit_log` in database
- **Fields**: user_id, action, resource_type, resource_id, ip_address, user_agent, details, created_at
- **Retention**: Indefinite (for compliance purposes)

**Compliance Checklist:**
- [ ] All form submissions logged
- [ ] All document access logged
- [ ] All document deletions logged
- [ ] All privacy consents logged
- [ ] All login attempts logged
- [ ] All document approvals/rejections logged
- [ ] All manager assignments logged
- [ ] Audit logs retained indefinitely

---

## Compliance Checklists

### Pre-Deployment Checklist

- [ ] All federal compliance requirements met
- [ ] All South Dakota state requirements met
- [ ] Document retention periods configured correctly
- [ ] Encryption enabled for all sensitive data
- [ ] Audit logging enabled and tested
- [ ] SSN not stored in database
- [ ] Privacy notices displayed
- [ ] Consent mechanisms in place
- [ ] Retention service scheduled and running
- [ ] Backup and recovery procedures documented

### Monthly Compliance Review

- [ ] Review audit logs for anomalies
- [ ] Verify retention service is running
- [ ] Check for expired documents pending deletion
- [ ] Review privacy consent records
- [ ] Verify encryption is working
- [ ] Check for any compliance-related errors
- [ ] Review document access patterns
- [ ] Verify no SSNs in database (spot check)

### Quarterly Compliance Review

- [ ] Review all retention periods
- [ ] Verify compliance with current regulations
- [ ] Review and update privacy notices if needed
- [ ] Check for regulatory updates
- [ ] Review security practices
- [ ] Test backup and recovery procedures
- [ ] Review access controls
- [ ] Update compliance documentation if needed

### Annual Compliance Review

- [ ] Full compliance audit
- [ ] Review all retention policies
- [ ] Update compliance documentation
- [ ] Review and update privacy policies
- [ ] Security assessment
- [ ] Review audit log retention policies
- [ ] Update training materials
- [ ] Review incident response procedures

### South Dakota-Specific Checklist

- [ ] Federal requirements met (covers most SD requirements)
- [ ] Data breach notification procedures documented
- [ ] Encryption enabled for all sensitive data
- [ ] No additional state-specific forms required
- [ ] Right-to-work compliance (I-9 sufficient)
- [ ] Background check compliance (FCRA sufficient)

---

## System Implementation

### Compliance Features

1. **Document Retention Service**
   - Location: `backend/src/services/retentionService.js`
   - Runs daily to delete expired documents
   - Logs all deletions

2. **Audit Logging Service**
   - Location: `backend/src/services/auditService.js`
   - Logs all compliance-relevant events
   - Stored in `audit_log` table

3. **Encryption Service**
   - Location: `backend/src/services/encryptionService.js`
   - AES-256-GCM encryption
   - Used for all sensitive documents

4. **Privacy Notice Component**
   - Location: `frontend/src/components/PrivacyNotice.vue`
   - Displays before SSN collection
   - Requires explicit consent

5. **Retention Date Calculation**
   - Location: `backend/src/services/pdfService.js`
   - Function: `calculateRetentionDate()`
   - Calculates retention based on form type and employment dates

6. **Liability Compliance Checker**
   - Location: `backend/src/services/complianceService.js`
   - Frontend: `frontend/src/components/admin/ComplianceChecker.vue`
   - API Endpoint: `GET /api/admin/compliance-check`
   - Comprehensive verification of all compliance requirements
   - See [Compliance Checker](#compliance-checker) section below

### Database Schema Compliance

- **No SSN Fields**: Database schema excludes SSN fields
- **Retention Tracking**: `retention_until` field in `form_submissions` table
- **Audit Logging**: `audit_log` table for all compliance events
- **Privacy Consents**: `privacy_consents` table for consent tracking

### Testing Compliance

- **Unit Tests**: Test retention date calculations
- **Integration Tests**: Test document deletion after retention
- **Security Tests**: Verify encryption and SSN protection
- **Audit Tests**: Verify all events are logged

---

## Compliance Checker

The system includes a comprehensive **Liability Compliance Checker** that verifies all Federal and South Dakota state requirements for information storage. This tool is available in the Admin Dashboard under the "Compliance" tab.

### How to Use

1. Navigate to **Admin Dashboard** → **Compliance** tab
2. Click **"Run Compliance Check"** button
3. Review the results grouped by category
4. Address any critical or warning issues identified

### Checks Performed

The compliance checker verifies the following categories:

#### SSN Protection
- **SSN Schema Protection**: Verifies no SSN-related columns exist in database tables
- **SSN Data Protection**: Scans form_data JSON for potential SSN values stored in database

#### Privacy & Data Protection
- **Privacy Consent Records**: Verifies consent records exist for SSN collection
- **Data Minimization**: Confirms only necessary PII is stored

#### Document Retention
- **Document Retention Dates**: Validates retention dates are calculated correctly per federal requirements
- **Expired Document Cleanup**: Checks for expired documents that should have been deleted

#### Encryption
- **Encryption Key Configuration**: Verifies encryption key is configured
- **Settings Encryption**: Checks that sensitive settings are encrypted
- **I-9 Document Encryption**: Verifies I-9 identity documents are encrypted

#### Audit Logging
- **Audit Log Completeness**: Verifies all required audit events are logged
- **Audit Log Structure**: Confirms audit log table has all required columns

#### Database Schema
- **Required Database Tables**: Verifies all required tables exist
- **Foreign Key Constraints**: Checks that foreign keys are enabled
- **Database Indexes**: Verifies recommended indexes exist

#### South Dakota State
- **SD Data Breach Notification Readiness**: Verifies compliance with SDCL 22-40-20
- **SD Employment Record Compliance**: Confirms federal requirements (which SD follows) are met

### Compliance Status

The checker provides three status levels:

| Status | Description |
|--------|-------------|
| **COMPLIANT** | All checks passed, no issues found |
| **WARNING** | Some non-critical issues found, should be addressed |
| **CRITICAL** | Critical compliance issues found, must be addressed immediately |

### Compliance Score

The compliance score is calculated as:
```
Score = (Passed Checks / Total Checks) × 100%
```

- **90-100%**: Excellent compliance (green)
- **70-89%**: Acceptable with warnings (yellow)
- **Below 70%**: Critical issues requiring attention (red)

### Export Report

Click the **"Export Report (JSON)"** button to download a complete compliance report for documentation and audit purposes.

### Regulations Verified

**Federal:**
- IRCA / 8 CFR 274a.2 (I-9)
- IRS 26 CFR 31.6001-1 (W-4)
- FCRA 15 U.S.C. § 1681 (Background)
- FLSA 29 CFR Part 516 (Payroll)
- EEOC 29 CFR 1602 (Employment Records)

**South Dakota State:**
- SDCL 22-40-20 (Data Breach Notification)
- South Dakota Right to Work Law

### Recommended Schedule

| Check Type | Frequency |
|------------|-----------|
| Quick Check | Weekly |
| Full Compliance Review | Monthly |
| Detailed Audit | Quarterly |
| Export for Records | After any significant changes |

---

## Regulatory Updates

### Monitoring Requirements

- Monitor federal regulatory changes (DHS, IRS, EEOC, DOL)
- Monitor South Dakota state regulatory changes
- Review updates quarterly
- Update system as needed

### Change Management

- Document all compliance-related changes
- Update this document when regulations change
- Notify stakeholders of significant changes
- Test changes before deployment

---

## Contact & Resources

### Federal Resources

- **DHS I-9**: https://www.uscis.gov/i-9
- **IRS W-4**: https://www.irs.gov/forms-pubs/about-form-w-4
- **EEOC**: https://www.eeoc.gov/
- **DOL FLSA**: https://www.dol.gov/agencies/whd/flsa

### South Dakota Resources

- **SD Department of Labor**: https://dlr.sd.gov/
- **SD Codified Laws**: https://sdlegislature.gov/Statutes/

### Internal Resources

- **Compliance Officer**: [To be assigned]
- **Legal Counsel**: [To be assigned]
- **IT Security**: [To be assigned]

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-01-XX | Initial compliance documentation | System Development |

---

**Last Updated**: [Current Date]  
**Next Review**: [Quarterly Review Date]  
**Document Owner**: Compliance Officer

