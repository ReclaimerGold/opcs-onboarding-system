# OPCS Onboarding System

HR Onboarding application for Optimal Prime Cleaning Services with full US federal compliance.

## Features

### User Experience
- **Unified Login System**: Single sign-in flow for both applicants and administrators
  - Sign Up: Create new account to start onboarding
  - Sign In: Continue onboarding or access admin dashboard (password required if set)
  - Two-phase authentication: Users with passwords prompted after credential verification
  - Password Reset: "Forgot password?" link sends reset email via Mailgun
- **User Roles**: Centrally managed roles—Admin, Manager, Employee, Applicant—assignable from the Admin Dashboard **Users** tab
- **Clickable Breadcrumb Navigation**: Navigate between steps with visual progress indicators
- **Smart Step Validation**: Warnings when navigating to steps with missing prerequisites
- **Auto-save drafts**: Progress is automatically saved as you fill out forms (2-second debounce)
- **Manual save**: Save draft button available on each form
- **Resume anytime**: Pick up where you left off with saved drafts
- **Field Auto-population**: Name, email, and phone auto-populate from signup and are locked after first entry
- **Shared fields across forms**: Name, email, phone, address, date of birth, and (where applicable) SSN and signature auto-fill consistently across all six steps. The applicant API (`/applicants/me`) is updated on Step 1 submit (and Step 3 for address); the Step 1 draft is used as fallback for middle name and for address/DOB when the applicant record does not yet have them. SSN is provided via temporary browser cookie (not stored in the database); signature is stored in session and reused on W-4, I-9, Acknowledgements, and Form 8850.
- **Loading Banners**: Clear indicators show when pre-fill data or settings are still loading
- **Field Descriptions**: Clear descriptions indicating which fields are pre-filled and cannot be changed
- **Tooltips**: Helpful tooltips explaining each field and how to fill it correctly
- **Session Timeout Countdown**: Footer shows 15-minute inactivity timer with a 3-minute warning before logout
- **Release version display**: Login footer and session (time clock) footer show the deployed app version when the image is built from a GitHub release; the version comes from the Git tag (e.g. `v1.2.3`) via Docker build-arg
- **User onboarding gate**: Dashboard and forms are **locked** until the user completes: (1) SSN consent (once, documented in DB), (2) password set (admins redirected to password-setup if needed), (3) signature (once, stored in DB). User cannot continue until consent and signature are filled.
- **Applicant onboarding modal** (SSN consent flow): Shown when the gate is not satisfied. Three-step flow:
  - Step 1: SSN collection notice and consent (required once; recorded in `privacy_consents`).
  - Step 2: Password setup (skipped if already set, e.g. for admins).
  - Step 3: Add your signature (required once; stored in `applicants.signature_data`). Continue is disabled until the signature is filled.
  - If consent and password are already done, the modal opens at the signature step only. On later visits, if signature is already in DB, the gate is satisfied and the stored signature is loaded into session for forms.

### Form Features
- **6-step form workflow**: W-4, I-9, Background Check, Direct Deposit, Acknowledgements, Form 8850
- **US Phone Number Validation**: Auto-formats to (XXX) XXX-XXXX with validation
- **Email Validation**: Real-time email format validation
- **Google Address Validation**: Address validation with auto-fill of city, state, and zip code (optional API - falls back to manual parsing when not configured)
- **Comprehensive Disclaimers**: All disclaimers from original JotForms included
- **SSN Privacy Protection**: SSNs only included in PDFs, never stored in database
- **E-Signatures**: Draw or type your signature on W-4, I-9, Acknowledgements, and Form 8850; the same signature is imprinted on each PDF at admin-configured positions (free-place)

### Technical Features
- **Document submission behavior**: During initial onboarding (before all 6 steps are complete), submitting the same form step again **overwrites** the existing submission (one PDF per step; no duplicates). After onboarding is complete, submitting again **creates a new version** (duplicate) for history. Progress and "onboarding complete" are based on **distinct steps** (0–6), not total submission rows.
- **I-9 identity documents**: During onboarding, replacing an I-9 document (List A, B, or C) **overwrites** the existing file. After onboarding, replacing saves a **new version** on the backend while the UI shows a single "current" document per slot. The dashboard **re-upload flow** re-captures document number, issuing authority, and expiration date (same as initial I-9 submission) so updated documents (e.g. new driver's license) are recorded correctly.
- **Official PDF Template Auto-Fill**: Downloads and caches official IRS/USCIS fillable PDF forms (W-4, I-9, Form 8850), automatically fills them with applicant data; generated PDFs and uploaded PDFs (e.g. I-9 identity documents) are flattened so stored copies are non-editable
- **Automatic Template Updates**: Checks for new form versions daily, downloads and caches updates
- **Template Version History**: Archives previous template versions when updates are detected, allowing admin preview of historical forms
- **Google Drive Integration**: Document storage with direct Google Drive links for viewing files
- **Local Storage Fallback**: When Google Drive credentials are not configured, encrypted PDFs are stored locally
- **Direct Document Links**: When Google Drive is configured, document links go directly to Google Drive for viewing
- SQLite database (SSN-free design)
- Full audit logging for compliance
- Automated document retention management
- AES-256-GCM encryption for sensitive documents and settings
- Session-based authentication with persistent SQLite session store
- **Admin Settings Panel**: Central configuration for Google Drive and Address Validation APIs with status indicators and connection test buttons
- **Google Drive Folder Browser**: Browse and search your Google Drive folders to select a base folder for document storage
- **Signature Placement (Admin, required)**: Per-document, optional per-page configuration for where the e-signature image is drawn on W-4, I-9, and Form 8850 PDFs (Admin → System → PDF Templates). High-resolution PDF preview; sidebar lists pages and a draggable “Signature field” to drop onto any page. Signature box can be moved and resized horizontally. Admins must complete the setup wizard (/admin/setup) before using the dashboard; API keys are optional and can be set later in Settings.
- **Liability Compliance Checker**: Comprehensive compliance verification for Federal and South Dakota state requirements

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **PDF**: pdf-lib
- **Storage**: Google Drive API
- **Address Validation**: Google Address Validation API (optional - for address verification and auto-fill with fallback to manual entry)
- **Email**: Mailgun API (optional - for password reset emails, configurable in Settings)
- **Encryption**: AES-256-GCM

## Project Structure

```
opcs-onboarding-system/
├── .github/
│   └── workflows/
│       ├── ci.yml               # Continuous integration workflow
│       └── release.yml          # Release and Docker publish workflow
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   └── init.js          # Database schema and initialization
│   │   ├── middleware/
│   │   │   ├── auth.js          # Authentication middleware
│   │   │   └── audit.js         # Audit logging middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # Authentication routes
│   │   │   ├── applicants.js    # Applicant data routes
│   │   │   ├── forms.js         # Form submission and draft routes
│   │   │   └── settings.js      # Settings management routes
│   │   ├── services/
│   │   │   ├── auditService.js      # Audit logging service
│   │   │   ├── encryptionService.js # AES-256-GCM encryption
│   │   │   ├── googleDriveService.js # Google Drive integration
│   │   │   ├── mailgunService.js    # Mailgun email service (password reset)
│   │   │   ├── pdfService.js        # PDF generation
│   │   │   ├── pdfTemplateService.js # IRS/USCIS PDF template download & caching
│   │   │   ├── pdfFieldMapping.js   # PDF form field mappings
│   │   │   └── retentionService.js  # Document retention management
│   │   └── index.js             # Express server entry point
│   ├── storage/                 # Local storage (used when Google Drive not configured)
│   │   ├── encrypted-pdfs/      # Form submission PDFs
│   │   ├── encrypted-i9-docs/   # I-9 identity documents
│   │   └── pdf-templates/       # Cached IRS/USCIS fillable PDF templates
│   ├── Dockerfile               # Backend-only Docker image
│   ├── .dockerignore            # Docker build exclusions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── forms/           # Form components for each step
│   │   │   ├── admin/           # Admin dashboard components
│   │   │   │   ├── AlertsPanel.vue
│   │   │   │   ├── DataTable.vue
│   │   │   │   ├── FilterPanel.vue
│   │   │   │   ├── SearchBar.vue
│   │   │   │   ├── TestResultsPanel.vue
│   │   │   │   ├── PdfTemplatesPanel.vue
│   │   │   │   └── ComplianceChecker.vue
│   │   │   ├── ui/               # Reusable UI components
│   │   │   └── PrivacyNotice.vue
│   │   ├── composables/         # Vue composables
│   │   │   ├── useApplicantData.js
│   │   │   ├── useFormDraft.js
│   │   │   ├── useAdminDashboard.js
│   │   │   └── useTableFilters.js
│   │   ├── services/
│   │   │   └── api.js           # Axios API client
│   │   ├── stores/
│   │   │   └── auth.js          # Pinia auth store
│   │   ├── utils/
│   │   │   ├── validation.js    # Phone/email validation
│   │   │   └── exportUtils.js   # CSV/data export utilities
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── ForgotPasswordView.vue  # Password reset request
│   │   │   ├── ResetPasswordView.vue   # Password reset form
│   │   │   ├── FormWizardView.vue
│   │   │   ├── DashboardView.vue
│   │   │   ├── AdminDashboardView.vue
│   │   │   └── SettingsView.vue    # Admin-only settings page
│   │   └── router/
│   │       └── index.js
│   ├── nginx.conf               # Nginx config for production
│   ├── Dockerfile               # Frontend-only Docker image
│   └── package.json
├── Dockerfile                    # Combined full-stack Docker image
├── docker-compose.yml            # Production Compose (GHCR images)
├── docker-compose.local.yml      # Local build and run from source
├── docker-compose.dev.yml        # Development Docker Compose (hot reload)
├── .dockerignore                 # Root Docker build exclusions
└── package.json                  # Root package.json with dev scripts
```

## Setup

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console account (for Google Drive and Maps APIs)

### Installation

1. **Install dependencies:**
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Create `.env` file in project root (or `backend/` for backend-only runs).** Copy from `.env.example`:
```env
PORT=3000
SESSION_SECRET=your-secret-key-here-change-in-production
FRONTEND_URL=http://localhost:9999
NODE_ENV=development
ENCRYPTION_KEY=your-32-byte-encryption-key-here
```
   **User accounts:** There are no admin username/password in env. The first user to sign up becomes admin; they sign in with **email** and set their **password** during the initial onboarding flow (password setup step). All other users are created the same way (sign up with name/email, then set password when required).

3. **Run development servers:**

   From the project root, run:
```bash
npm run dev
```
   This starts both the backend and frontend (Node.js 18+ required for backend `--watch` support).

   You should see:
   - Backend server on `http://localhost:3000`
   - Frontend dev server on `http://localhost:9999`

### Troubleshooting

- **`[vite] http proxy error: /api/...` and `Error: connect ECONNREFUSED 127.0.0.1:3000`**  
  The frontend is running but the backend is not listening on port 3000. Run `npm run dev` **from the project root** so both start. Alternatively, run them in two terminals: from the project root, `npm run dev:backend` in one and `npm run dev:frontend` in the other (or from `backend/` and `frontend/` run each package's `npm run dev`).

### Google APIs Setup

#### Google Drive API (Required for Document Storage)

**Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **New Project**
3. Enter a project name (e.g., "OPCS Onboarding") → **Create**
4. Wait for the project to be created, then select it from the dropdown

**Step 2: Enable Google Drive API**

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Drive API"
3. Click on **Google Drive API** → **Enable**

**Step 3: Configure OAuth Consent Screen**

1. Go to [APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **Internal** (for Google Workspace) or **External** (for personal accounts)
3. Fill in required fields:
   - **App name**: OPCS Onboarding System
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. On Scopes page, click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/drive.file`
   - This allows the app to access only files it creates
6. Click **Save and Continue** through remaining steps

**Step 4: Create OAuth 2.0 Credentials**

1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: OPCS Onboarding
   - **Authorized redirect URIs**: Add `https://developers.google.com/oauthplayground`
5. Click **Create**
6. **Save your Client ID and Client Secret** - you'll need these!

**Step 5: Generate a Refresh Token**

1. Go to [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Click the **gear icon** (⚙️) in the top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret** from Step 4
5. Close settings
6. In the left panel under "Step 1", find **Drive API v3**
7. Select `https://www.googleapis.com/auth/drive.file`
8. Click **Authorize APIs**
9. Sign in with your Google account and grant permissions
10. In "Step 2", click **Exchange authorization code for tokens**
11. **Copy the Refresh Token** - this is what you need!

**Step 6: Add Credentials to OPCS**

1. Log in to OPCS as an admin
2. Go to **Settings** (Admin → Settings)
3. Enter your credentials:
   - **Google OAuth Client ID**: From Step 4
   - **Google OAuth Client Secret**: From Step 4
   - **Google OAuth Refresh Token**: From Step 5
   - **Google Drive Base Folder ID**: (Optional) Click "Browse..." to select a folder, or leave empty to use Drive root
4. Click **Test Connection** to verify everything works

**Troubleshooting Google Drive:**
- **"Invalid grant"**: Your refresh token expired. Repeat Step 5 to generate a new one.
- **"Access denied"**: Ensure you selected the correct scopes in Step 5.
- **Files not appearing**: Check that the folder ID is correct and you have access.

---

#### Google Address Validation API (Optional)

This API provides address verification and auto-fill for city, state, and ZIP code. Without it, users can manually enter addresses.

**Note:** This API requires billing to be enabled in your Google Cloud project.

**Step 1: Enable the API**

1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for "Address Validation API"
3. Click on **Address Validation API** → **Enable**

**Step 2: Create an API Key**

1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ Create Credentials** → **API key**
3. **Copy the API key**
4. (Recommended) Click **Edit API key** to add restrictions:
   - **Application restrictions**: HTTP referrers
   - Add your domain (e.g., `https://yourdomain.com/*`)
   - **API restrictions**: Restrict to "Address Validation API"

**Step 3: Add API Key to OPCS**

1. Go to **Settings** (Admin → Settings)
2. Enter your API key in **Google Address Validation API Key**
3. Click **Test Connection** to verify it works

**Troubleshooting Address Validation:**
- **"API key not valid"**: Ensure the key has access to Address Validation API
- **"Billing not enabled"**: Enable billing in Google Cloud Console
- **API not working**: Falls back to manual address entry automatically

## Usage

### For Applicants

1. **Sign Up**: Click "Sign Up" and enter first name, last name, and email to start onboarding
2. **Sign In**: Click "Sign In" to continue where you left off (no password required for regular applicants)
3. **Complete Forms**: Fill out each step of the onboarding process
   - Fields auto-populate from signup where applicable
   - Progress is auto-saved every 2 seconds
   - Use "Save Draft" button for manual saves
3. **Navigate**: Click breadcrumb steps to navigate (with validation warnings)
4. **Resume**: Log back in anytime to continue where you left off

### For Administrators

1. **First Login**: The first user to sign up automatically becomes an administrator
2. **Password Setup**: Admin users must set a password (minimum 8 characters) on first login
3. **Configure Settings**: Go to Settings page to add:
   - Google Drive API credentials (required for document storage)
   - Google Address Validation API key (optional, for address validation and auto-fill)
4. **View Dashboard**: Monitor applicant progress and document submissions with priority-based alerts
5. **Document Access**: View all form submissions and I-9 documents with advanced filtering
6. **Admin Tools**: Use admin utilities to normalize data, fix admin assignments, and diagnose login issues
7. **Compliance Checker**: Run comprehensive compliance checks to verify Federal and SD state requirements

### Admin Dashboard Features

The admin dashboard is organized into workflow-based sections for management teams:

- **Overview Tab**: Priority alerts, workflow summary, and quick stats
- **Users Tab**: Central user management—list all users, filter by role (Admin, Manager, Employee, Applicant), and change a user’s role. Admins require a password to access admin features.
- **Active Onboarding Tab**: In-progress applicants with filtering and admin management
- **Completed Tab**: Completed onboarding records
- **Documents Tab**: Form submissions and I-9 documents with advanced search/filter
- **Activity Tab**: Login attempts and audit logs with filtering
- **Compliance Tab**: Compliance checker
- **System Tab**: System health, test runner, and PDF template management

#### Filtering and Search
All admin tables support:
- **Full-text search**: Search across all relevant columns
- **Column filters**: Dropdown filters for status, type, category fields
- **Date range filters**: Filter by date ranges
- **Quick filters**: One-click presets (e.g., "Failed Only", "In Progress")
- **Pagination**: Configurable page sizes (10, 25, 50, 100)
- **Sorting**: Click column headers to sort ascending/descending
- **CSV Export**: Export filtered results to CSV files

## Form Steps

1. **W-4 Form**: Personal information and tax withholding preferences
2. **I-9 Form**: Employment eligibility verification
3. **Background Check**: Criminal conviction disclosure
4. **Direct Deposit**: Bank account information
5. **Acknowledgements**: Employment terms and agreements
6. **Form 8850**: Work Opportunity Tax Credit

## Data Privacy & Security

- **SSN Protection**: Social Security Numbers are NEVER stored in the database
- **Encryption**: All sensitive documents encrypted with AES-256-GCM
- **Settings Encryption**: API keys and credentials encrypted at rest
- **Audit Logging**: All document access and form submissions logged
- **Session Security**: HTTP-only cookies, secure in production
- **Login Security**: 
  - All login attempts logged with IP address and user agent
  - Rate limiting (50 auth requests per 15 minutes per IP)
  - Admin users require password authentication (bcrypt hashed)
  - Two-phase login prevents admin enumeration

## Compliance

This system is designed to comply with:

- **IRCA / 8 CFR 274a.2**: I-9 retention requirements
- **IRS 26 CFR 31.6001-1**: W-4 retention requirements
- **EEOC 29 CFR 1602**: Employment record retention
- **FLSA**: Payroll record requirements
- **FCRA**: Background check compliance
- **State SSN Protection Laws**: SSN data minimization

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new applicant account
- `POST /api/auth/login` - Login to existing account (two-phase for users with passwords)
  - Phase 1: Submit credentials (firstName, lastName, email) → returns `requiresPassword: true/false`
  - Phase 2 (if password required): Submit credentials + password → completes authentication
- `POST /api/auth/logout` - Logout
- `POST /api/auth/keepalive` - Refresh session expiration for active users
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/password-status` - Check if password is set for current user
- `GET /api/auth/dashboard-onboarding-status` - Returns `{ ssnConsentGiven, passwordSet, isAdmin, hasSignature }`. Used to lock dashboard/forms until SSN consent (once, in DB), password (if admin), and signature (once, in DB) are complete.
- `POST /api/auth/ssn-consent` - Record SSN collection consent once (documented in DB; does not store SSN).
- `POST /api/auth/save-signature` - Save the user's signature once (body: `{ signatureData }`; stored in DB). Required before dashboard/forms access; user cannot continue until filled.
- `GET /api/auth/signature` - Get the current user's stored signature (for loading into session when opening dashboard/forms).
- `POST /api/auth/set-password` - Set initial password (any authenticated user, first-time only)
- `POST /api/auth/change-password` - Change existing password (admins only)
- `POST /api/auth/forgot-password` - Request password reset email (no auth required)
  - Body: `{ email }` → sends reset link via Mailgun if configured
- `GET /api/auth/verify-reset-token` - Verify if reset token is valid (no auth required)
  - Query: `?token=xxx` → returns `{ valid: true/false }`
- `POST /api/auth/reset-password` - Reset password using token (no auth required)
  - Body: `{ token, password, confirmPassword }` → sets new password

### Forms
- `GET /api/forms/template-status` - Returns whether signature placement is configured for W-4, I-9, and Form 8850 (`{ w4, i9, 8850 }` booleans). Used by the form wizard to block steps until an admin sets placement.
- `POST /api/forms/submit/:step` - Submit form step (1-6). Returns 503 if signature placement is not configured for that form type (W-4, I-9, 8850).
- `GET /api/forms/submissions` - Get all form submissions (includes `web_view_link` for Google Drive direct links)
- `GET /api/forms/submissions/:id/view` - View form submission PDF (or redirects to Google Drive if `web_view_link` available)
- `POST /api/forms/draft/:step` - Save draft for step
- `GET /api/forms/draft/:step` - Load draft for step
- `GET /api/forms/drafts` - Get all drafts
- `POST /api/forms/i9/upload-document` - Upload I-9 identity document. Optional body fields: `documentNumber`, `issuingAuthority`, `expirationDate` (for dashboard re-upload). During onboarding overwrites existing document for that category; after onboarding inserts a new version. Returns current document metadata.
- `GET /api/forms/i9/documents` - Get **current** I-9 documents (latest version per List A/B/C). Includes `document_number`, `issuing_authority`, `expiration_date`, and `web_view_link` for Google Drive.
- `GET /api/forms/i9/documents/:id/view` - View I-9 document (or redirects to Google Drive if `web_view_link` available)

### Applicants
- `GET /api/applicants/me` - Get current applicant data
- `PUT /api/applicants/me` - Update applicant data
- `GET /api/applicants/me/progress` - Get completion progress

### Settings
- `GET /api/settings` - Get all settings (authenticated)
- `GET /api/settings/google-address-validation-key` - Get Google Address Validation API key (authenticated)
- `POST /api/settings` - Update settings (admin only)
  - Settings keys: `google_drive_base_folder_id`, `google_client_id`, `google_client_secret`, `google_refresh_token`, `google_address_validation_api_key`, `mailgun_api_key`, `mailgun_domain`, `mailgun_from_email`
- `GET /api/settings/google-drive/folders` - List Google Drive folders (admin only)
- `GET /api/settings/google-drive/folder/:id` - Get folder info (admin only)
- `GET /api/settings/google-drive/browse` - Browse Google Drive folders with search (admin only)
  - Query params: `parentId` (folder to browse, default: 'root'), `search` (search folders by name)
- `POST /api/settings/test/google-drive` - Test Google Drive API connection (admin only)
- `POST /api/settings/test/address-validation` - Test Google Address Validation API connection (admin only)
- `POST /api/settings/test/mailgun` - Test Mailgun email configuration (admin only)
  - Body: `{ testEmail }` → sends test email to specified address

### Address Validation
- `POST /api/address/validate` - Validate an address using Google Address Validation API (authenticated)
- `GET /api/address/status` - Check if address validation is configured (authenticated)

### Admin (Admin Only)
- `GET /api/admin/setup-status` - Returns whether required admin setup is complete (`{ signaturePlacementComplete: boolean, signaturePlacementReady: { w4, i9, 8850 } }`). Used to enforce the admin onboarding wizard; admins are redirected to `/admin/setup` until at least one signature placement is set per document (W-4, I-9, 8850). Not every page needs a placement.
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/login-attempts` - Get login attempts with filtering, search, and pagination
  - Query params: `search`, `success`, `startDate`, `endDate`, `page`, `limit`, `sortKey`, `sortDir`
- `GET /api/admin/onboarding-status` - Get onboarding status for all applicants with filtering
  - Query params: `search`, `status`, `isAdmin`, `startDate`, `endDate`, `page`, `limit`, `sortKey`, `sortDir`
- `GET /api/admin/audit-logs` - Get filtered audit logs with search and pagination
  - Query params: `search`, `action`, `resourceType`, `userId`, `startDate`, `endDate`, `page`, `limit`, `sortKey`, `sortDir`
- `GET /api/admin/submissions` - Get all form submissions with filtering and pagination
  - Query params: `search`, `formType`, `stepNumber`, `applicantId`, `startDate`, `endDate`, `page`, `limit`, `sortKey`, `sortDir`
- `GET /api/admin/i9-documents` - Get all I-9 documents with filtering and pagination
  - Query params: `search`, `documentType`, `documentCategory`, `applicantId`, `startDate`, `endDate`, `page`, `limit`, `sortKey`, `sortDir`
- `GET /api/admin/users` - List all users (includes current user and admins) with search, role filter, pagination. By default only active users; use `includeInactive=1` to include deactivated. Query: search, role, page, limit, sortKey, sortDir, includeInactive
- `PUT /api/admin/users/:id/role` - Update user role (body: `{ role: "admin"|"manager"|"employee"|"applicant" }`). Cannot modify your own role; cannot demote the last admin.
- `DELETE /api/admin/users/:id` - Deactivate a user (soft delete; records retained for compliance). Cannot deactivate yourself; cannot deactivate the last admin.
- `PUT /api/admin/users/:id/admin` - Update user admin status (legacy; also sets role to admin or applicant). Same restrictions as role update.
- `POST /api/admin/normalize-applicants` - Normalize existing applicant data (fixes login issues)
- `POST /api/admin/fix-admin-assignments` - Fix incorrect admin assignments (ensures only first user is admin)
- `GET /api/admin/diagnose-login` - Diagnostic endpoint for login issues (query params: firstName, lastName, email)
- `POST /api/admin/tests/run` - Run unit tests and return results
- `GET /api/admin/pdf-templates/status` - Get status of all PDF templates (IRS/USCIS forms)
- `GET /api/admin/pdf-templates/download-stream` - Server-Sent Events stream to download missing templates with progress (used by first-admin setup modal)
- `POST /api/admin/pdf-templates/update` - Manually trigger PDF template updates (query params: formType, force)
- `GET /api/admin/pdf-templates/:formType/preview` - Preview/download current PDF template (W4, I9, 8850)
- `GET /api/admin/pdf-templates/:formType/archive` - List archived versions of a template
- `GET /api/admin/pdf-templates/:formType/archive/:filename` - Preview/download an archived template version
- `GET /api/admin/settings/signature-placement` - Get signature placements (query: `formType` optional — W4, I9, 8850). Returns `{ formType, placements: [ { pageIndex, x, y, width, height }, ... ] }` or all form types as arrays.
- `PUT /api/admin/settings/signature-placement` - Set signature placements for a form type (body: `{ formType, placements: [ { pageIndex, x, y, width, height }, ... ] }`). Legacy single placement also accepted: `{ formType, placement: { mode: "free_place", pageIndex, x, y, width, height } }`. PDF coordinates: origin bottom-left, Y up; pageIndex 0-based. Signature is optional per page.
- `GET /api/admin/compliance-check` - Run comprehensive compliance check for Federal and SD state requirements

### Admin Export Endpoints (CSV)
- `GET /api/admin/onboarding-status/export` - Export onboarding status data as CSV
- `GET /api/admin/submissions/export` - Export form submissions as CSV
- `GET /api/admin/i9-documents/export` - Export I-9 documents as CSV
- `GET /api/admin/audit-logs/export` - Export audit logs as CSV
- `GET /api/admin/login-attempts/export` - Export login attempts as CSV

## Development

### Running Tests
```bash
# Backend tests (Jest)
cd backend && npm test
cd backend && npm run test:watch  # Watch mode
cd backend && npm run test:coverage  # With coverage

# Frontend tests (Vitest)
cd frontend && npm test
cd frontend && npm run test:ui  # UI mode
cd frontend && npm run test:coverage  # With coverage
```

See `TESTING.md` for complete testing documentation.

### Building for Production
```bash
# Build frontend
cd frontend && npm run build

# The dist/ folder will contain production-ready files
```

### Database
- Database file: `backend/database/onboarding.db`
- Schema managed in `backend/src/database/init.js`
- No migrations needed (uses CREATE IF NOT EXISTS)

## Docker Deployment

### Quick Start with Docker Compose

**Production (pull from GitHub Container Registry):**

```bash
# Set your GHCR image prefix (e.g. ghcr.io/your-org/opcs-onboarding-system)
export OPCS_IMAGE_PREFIX=ghcr.io/YOUR_ORG/opcs-onboarding-system
# Optional: use a specific tag (default is latest)
# export OPCS_IMAGE_TAG=v1.0.0

docker-compose up -d
```

**Local testing (build from source):**

```bash
docker-compose -f docker-compose.local.yml up -d --build
```

**Development with hot reload:**

```bash
docker-compose -f docker-compose.dev.yml up
```

### Docker Images

Three Docker image options are available:

| Image | Description | Use Case |
|-------|-------------|----------|
| Combined (`Dockerfile`) | Frontend (nginx) + Backend in single container | Simple deployments, testing |
| Backend (`backend/Dockerfile`) | Backend API only | Microservices, scaling |
| Frontend (`frontend/Dockerfile`) | Frontend + nginx proxy | Microservices, CDN |

### Environment Variables

Configure the application using environment variables in `docker-compose.yml` or via `-e` flags:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPCS_IMAGE_PREFIX` | For GHCR | `ghcr.io/your-org/opcs-onboarding-system` | Image prefix for frontend/backend (e.g. `ghcr.io/org/repo`) |
| `OPCS_IMAGE_TAG` | No | `latest` | Image tag when using GHCR |
| `SESSION_SECRET` | **Yes** | `change-me-in-production` | Session encryption key (generate with `openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | No | Auto-generated | AES-256 key for data encryption |
| `SECURE_COOKIES` | No | `false` | Set to `true` when serving over HTTPS |
| `NODE_ENV` | No | `production` | Environment mode |
| `PORT` | No | `3000` | Backend server port |
| `FRONTEND_URL` | No | `http://localhost` | Frontend URL for CORS (set when using non-default port) |
| `FRONTEND_PORT` / `BACKEND_PORT` | No | `80` / `3000` | Host ports (use to avoid conflicts) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | No | - | Google Service Account email |
| `GOOGLE_PRIVATE_KEY` | No | - | Google Service Account private key |
| `GOOGLE_DRIVE_FOLDER_ID` | No | - | Google Drive folder for documents |

User accounts (including admin) are created by signing up with **email**; the first user becomes admin. Passwords are set during the initial onboarding flow (password setup), not via environment variables.

### Production Deployment

1. **Pull the image from GitHub Container Registry:**
```bash
docker pull ghcr.io/YOUR_ORG/opcs-onboarding-system:latest
```

2. **Run with environment variables:**
```bash
docker run -d \
  -p 80:80 \
  -e SESSION_SECRET=$(openssl rand -hex 32) \
  -v opcs-data:/app/database \
  -v opcs-storage:/app/storage \
  ghcr.io/YOUR_ORG/opcs-onboarding-system:latest
```

3. **Or use docker-compose.yml** (pulls frontend and backend images from GHCR):

```bash
export OPCS_IMAGE_PREFIX=ghcr.io/YOUR_ORG/opcs-onboarding-system
docker-compose up -d
```

### Docker Compose Services

**Production** (`docker-compose.yml`): uses images from GHCR. Set `OPCS_IMAGE_PREFIX` to your `ghcr.io/org/repo`.
- `frontend`: nginx serving Vue app on port 80, proxies `/api` to backend
- `backend`: Node.js Express API on port 3000

**Local testing** (`docker-compose.local.yml`): builds from source and runs with local image tags.
- Same services as production; use when testing image builds or changes before publishing.

**Development** (`docker-compose.dev.yml`):
- `frontend`: Vite dev server on port 9999 with hot reload
- `backend`: Bun with file watching on port 3000

### Building Images Locally

For **local run** without pushing to GHCR, use the local compose file:

```bash
docker-compose -f docker-compose.local.yml up -d --build
```

To build images manually:

```bash
# Build combined image
docker build -t opcs-onboarding .

# Build backend only
docker build -t opcs-backend -f backend/Dockerfile backend/

# Build frontend only
docker build -t opcs-frontend -f frontend/Dockerfile frontend/
```

### Health Checks

The backend includes a health check endpoint at `/api/health`. It returns `{ status: 'ok' }` and, when the image was built from a GitHub release tag, `{ status: 'ok', version: '<tag>' }`. Docker will automatically restart unhealthy containers.

### Data Persistence

**Important:** Use Docker volumes to persist data across container restarts:
- `/app/database` - SQLite databases (onboarding.db, sessions.db)
- `/app/storage` - Encrypted PDFs and documents

## Troubleshooting

### Port Conflicts
If ports 3000 or 9999 are in use:
- Backend: Set `PORT` in `backend/.env`
- Frontend: Update `port` in `frontend/vite.config.js`

### Google Drive Upload Issues
- Verify OAuth credentials are correct
- Check refresh token is valid
- Ensure Google Drive API is enabled in Cloud Console
- **Local Storage Fallback**: If Google Drive is not configured, PDFs are automatically stored locally in `backend/storage/encrypted-pdfs/` and `backend/storage/encrypted-i9-docs/`. The system will log when local storage is used.

### Address Validation Not Working
- Verify Google Address Validation API key is set in Settings
- Ensure Address Validation API is enabled in Google Cloud Console
- Check browser console for API errors
- Note: Address Validation API requires billing to be enabled in your Google Cloud project
- **Fallback Behavior**: If the API is not configured or fails, the system automatically falls back to manual address parsing. Users can:
  - Click "Parse Address" to attempt to extract city, state, and zip from a typed address
  - Click "Enter address components manually" to manually fill in all fields
  - Edit any auto-parsed fields as needed
- Address data is saved to documents regardless of whether validation was used

### PDF Template Issues
- **Templates not downloading**: Check network connectivity to IRS (irs.gov) and USCIS (uscis.gov) servers
- **Templates stale**: Use the "PDF Templates" tab in Admin Dashboard or endpoint `POST /api/admin/pdf-templates/update?force=true` to force re-download
- **Form fields not filling**: The system falls back to basic PDF generation if template fields can't be filled
- **Template locations**: Cached templates are stored in `backend/storage/pdf-templates/` with metadata
- **Version history**: Archived template versions are stored in `backend/storage/pdf-templates/{formType}/archive/`
- **Admin UI**: View template status, preview forms, and manage archived versions in Admin Dashboard → PDF Templates tab

## License

Proprietary - Optimal Prime Cleaning Services

## Support

For issues or questions, contact the development team.
