# OPCS Onboarding System

HR Onboarding application for Optimal Prime Cleaning Services with full US federal compliance.

## Features

### User Experience
- **Sign Up / Sign In**: Start new onboarding or continue existing process
- **Clickable Breadcrumb Navigation**: Navigate between steps with visual progress indicators
- **Smart Step Validation**: Warnings when navigating to steps with missing prerequisites
- **Auto-save drafts**: Progress is automatically saved as you fill out forms (2-second debounce)
- **Manual save**: Save draft button available on each form
- **Resume anytime**: Pick up where you left off with saved drafts
- **Field Auto-population**: Name, email, and phone auto-populate from signup and are locked after first entry
- **Loading Banners**: Clear indicators show when pre-fill data or settings are still loading
- **Field Descriptions**: Clear descriptions indicating which fields are pre-filled and cannot be changed
- **Tooltips**: Helpful tooltips explaining each field and how to fill it correctly
- **Session Timeout Countdown**: Footer shows 15-minute inactivity timer with a 3-minute warning before logout
- **SSN Consent Modal**: Non-dismissable SSN consent modal required before W-4 and 8850 forms (employment cannot continue without consent)

### Form Features
- **6-step form workflow**: W-4, I-9, Background Check, Direct Deposit, Acknowledgements, Form 8850
- **US Phone Number Validation**: Auto-formats to (XXX) XXX-XXXX with validation
- **Email Validation**: Real-time email format validation
- **Google Address Validation**: Address validation with auto-fill of city, state, and zip code (optional API - falls back to manual parsing when not configured)
- **Comprehensive Disclaimers**: All disclaimers from original JotForms included
- **SSN Privacy Protection**: SSNs only included in PDFs, never stored in database

### Technical Features
- **Official PDF Template Auto-Fill**: Downloads and caches official IRS/USCIS fillable PDF forms (W-4, I-9, Form 8850), automatically fills them with applicant data
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
- **Liability Compliance Checker**: Comprehensive compliance verification for Federal and South Dakota state requirements

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **PDF**: pdf-lib
- **Storage**: Google Drive API
- **Address Validation**: Google Address Validation API (optional - for address verification and auto-fill with fallback to manual entry)
- **Encryption**: AES-256-GCM

## Project Structure

```
opcs-onboarding-system/
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
│   │   │   ├── pdfService.js        # PDF generation
│   │   │   ├── pdfTemplateService.js # IRS/USCIS PDF template download & caching
│   │   │   ├── pdfFieldMapping.js   # PDF form field mappings
│   │   │   └── retentionService.js  # Document retention management
│   │   └── index.js             # Express server entry point
│   ├── storage/                 # Local storage (used when Google Drive not configured)
│   │   ├── encrypted-pdfs/      # Form submission PDFs
│   │   ├── encrypted-i9-docs/   # I-9 identity documents
│   │   └── pdf-templates/       # Cached IRS/USCIS fillable PDF templates
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
│   │   │   ├── FormWizardView.vue
│   │   │   ├── DashboardView.vue
│   │   │   ├── AdminDashboardView.vue
│   │   │   └── SettingsView.vue    # Admin-only settings page
│   │   └── router/
│   │       └── index.js
│   └── package.json
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

2. **Create `.env` file in `backend/` directory:**
```env
PORT=3000
SESSION_SECRET=your-secret-key-here-change-in-production
FRONTEND_URL=http://localhost:9999
NODE_ENV=development
```

3. **Run development servers:**
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Frontend dev server on `http://localhost:9999`

### Google APIs Setup

1. **Google Drive API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create OAuth 2.0 credentials (Web application type)
   - Add `http://localhost:3000/oauth2callback` as an authorized redirect URI
   - Use the [OAuth Playground](https://developers.google.com/oauthplayground/) to generate a refresh token
   - Add credentials in Settings page (Admin → Settings):
     - **Google OAuth Client ID**: Your OAuth client ID
     - **Google OAuth Client Secret**: Your OAuth client secret
     - **Google OAuth Refresh Token**: Token from OAuth Playground
     - **Google Drive Base Folder ID** (optional): Click "Browse..." to browse and select a folder from your Google Drive, or leave empty to use root
   - **Test Connection**: Click "Test Connection" to verify your Google Drive credentials are working

2. **Google Address Validation API (Optional but recommended):**
   - In same Google Cloud project, enable Address Validation API
   - Create API key (restrict to your domain for security)
   - Add API key in Settings page (Admin → Settings → Google Address Validation API Key)
   - **Test Connection**: Click "Test Connection" to verify your API key is working (tests with a sample US address)

## Usage

### For Applicants

1. **Sign Up**: Enter first name, last name, and email to start onboarding
2. **Complete Forms**: Fill out each step of the onboarding process
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
- `POST /api/auth/login` - Login to existing account
- `POST /api/auth/logout` - Logout
- `POST /api/auth/keepalive` - Refresh session expiration for active users
- `GET /api/auth/me` - Get current user info

### Forms
- `POST /api/forms/submit/:step` - Submit form step (1-6)
- `GET /api/forms/submissions` - Get all form submissions (includes `web_view_link` for Google Drive direct links)
- `GET /api/forms/submissions/:id/view` - View form submission PDF (or redirects to Google Drive if `web_view_link` available)
- `POST /api/forms/draft/:step` - Save draft for step
- `GET /api/forms/draft/:step` - Load draft for step
- `GET /api/forms/drafts` - Get all drafts
- `POST /api/forms/i9/upload-document` - Upload I-9 identity document
- `GET /api/forms/i9/documents` - Get all I-9 documents (includes `web_view_link` for Google Drive direct links)
- `GET /api/forms/i9/documents/:id/view` - View I-9 document (or redirects to Google Drive if `web_view_link` available)

### Applicants
- `GET /api/applicants/me` - Get current applicant data
- `PUT /api/applicants/me` - Update applicant data
- `GET /api/applicants/me/progress` - Get completion progress

### Settings
- `GET /api/settings` - Get all settings (authenticated)
- `GET /api/settings/google-address-validation-key` - Get Google Address Validation API key (authenticated)
- `POST /api/settings` - Update settings (admin only)
  - Settings keys: `google_drive_base_folder_id`, `google_client_id`, `google_client_secret`, `google_refresh_token`, `google_address_validation_api_key`
- `GET /api/settings/google-drive/folders` - List Google Drive folders (admin only)
- `GET /api/settings/google-drive/folder/:id` - Get folder info (admin only)
- `GET /api/settings/google-drive/browse` - Browse Google Drive folders with search (admin only)
  - Query params: `parentId` (folder to browse, default: 'root'), `search` (search folders by name)
- `POST /api/settings/test/google-drive` - Test Google Drive API connection (admin only)
- `POST /api/settings/test/address-validation` - Test Google Address Validation API connection (admin only)

### Address Validation
- `POST /api/address/validate` - Validate an address using Google Address Validation API (authenticated)
- `GET /api/address/status` - Check if address validation is configured (authenticated)

### Admin (Admin Only)
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
- `PUT /api/admin/users/:id/admin` - Update user admin status
- `POST /api/admin/normalize-applicants` - Normalize existing applicant data (fixes login issues)
- `POST /api/admin/fix-admin-assignments` - Fix incorrect admin assignments (ensures only first user is admin)
- `GET /api/admin/diagnose-login` - Diagnostic endpoint for login issues (query params: firstName, lastName, email)
- `POST /api/admin/tests/run` - Run unit tests and return results
- `GET /api/admin/pdf-templates/status` - Get status of all PDF templates (IRS/USCIS forms)
- `POST /api/admin/pdf-templates/update` - Manually trigger PDF template updates (query params: formType, force)
- `GET /api/admin/pdf-templates/:formType/preview` - Preview/download current PDF template (W4, I9, 8850)
- `GET /api/admin/pdf-templates/:formType/archive` - List archived versions of a template
- `GET /api/admin/pdf-templates/:formType/archive/:filename` - Preview/download an archived template version
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
