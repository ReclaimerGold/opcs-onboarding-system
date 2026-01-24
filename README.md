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
- **Field Descriptions**: Clear descriptions indicating which fields are pre-filled and cannot be changed
- **Tooltips**: Helpful tooltips explaining each field and how to fill it correctly

### Form Features
- **6-step form workflow**: W-4, I-9, Background Check, Direct Deposit, Acknowledgements, Form 8850
- **US Phone Number Validation**: Auto-formats to (XXX) XXX-XXXX with validation
- **Email Validation**: Real-time email format validation
- **Google Maps Address Search**: Autocomplete address search with auto-fill of city, state, and zip
- **Comprehensive Disclaimers**: All disclaimers from original JotForms included
- **SSN Privacy Protection**: SSNs only included in PDFs, never stored in database

### Technical Features
- **Official PDF Template Auto-Fill**: Downloads and caches official IRS/USCIS fillable PDF forms (W-4, I-9, Form 8850), automatically fills them with applicant data
- **Automatic Template Updates**: Checks for new form versions daily, downloads and caches updates
- **Template Version History**: Archives previous template versions when updates are detected, allowing admin preview of historical forms
- Google Drive integration for document storage (with local fallback)
- **Local Storage Fallback**: When Google Drive credentials are not configured, encrypted PDFs are stored locally
- SQLite database (SSN-free design)
- Full audit logging for compliance
- Automated document retention management
- AES-256-GCM encryption for sensitive documents and settings
- Session-based authentication
- **Liability Compliance Checker**: Comprehensive compliance verification for Federal and South Dakota state requirements

## Tech Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **PDF**: pdf-lib
- **Storage**: Google Drive API
- **Maps**: Google Maps Places API (for address autocomplete)
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
│   │   │   ├── ui/               # Reusable UI components
│   │   │   └── PrivacyNotice.vue
│   │   ├── composables/         # Vue composables
│   │   │   ├── useApplicantData.js
│   │   │   └── useFormDraft.js
│   │   ├── services/
│   │   │   └── api.js           # Axios API client
│   │   ├── stores/
│   │   │   └── auth.js          # Pinia auth store
│   │   ├── utils/
│   │   │   └── validation.js    # Phone/email validation
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── FormWizardView.vue
│   │   │   ├── DashboardView.vue
│   │   │   └── SettingsView.vue
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
   - Create OAuth 2.0 credentials
   - Generate refresh token using OAuth2 flow
   - Add credentials in Settings page (Settings → Google Drive API Configuration)

2. **Google Maps API (Optional but recommended):**
   - In same Google Cloud project, enable Places API
   - Create API key
   - Add API key in Settings page (Settings → Google Maps API Configuration)

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
   - Google Maps API key (optional, for address autocomplete)
4. **View Dashboard**: Monitor applicant progress and document submissions
5. **Document Access**: View all form submissions and I-9 documents for all applicants
6. **Admin Tools**: Use admin utilities to normalize data, fix admin assignments, and diagnose login issues
7. **Compliance Checker**: Run comprehensive compliance checks to verify Federal and SD state requirements

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
- `GET /api/auth/me` - Get current user info

### Forms
- `POST /api/forms/submit/:step` - Submit form step (1-6)
- `GET /api/forms/submissions` - Get all form submissions
- `POST /api/forms/draft/:step` - Save draft for step
- `GET /api/forms/draft/:step` - Load draft for step
- `GET /api/forms/drafts` - Get all drafts

### Applicants
- `GET /api/applicants/me` - Get current applicant data
- `PUT /api/applicants/me` - Update applicant data
- `GET /api/applicants/me/progress` - Get completion progress

### Settings
- `GET /api/settings` - Get all settings (authenticated)
- `GET /api/settings/google-maps-key` - Get Google Maps API key (authenticated)
- `POST /api/settings` - Update settings (admin only)

### Admin (Admin Only)
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/login-attempts` - Get login attempts with filtering
- `GET /api/admin/onboarding-status` - Get onboarding status for all applicants
- `GET /api/admin/audit-logs` - Get filtered audit logs
- `GET /api/admin/submissions` - Get all form submissions for all applicants
- `GET /api/admin/i9-documents` - Get all I-9 documents for all applicants
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

### Address Autocomplete Not Working
- Verify Google Maps API key is set in Settings
- Ensure Places API is enabled in Google Cloud Console
- Check browser console for API errors

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
