# Contributing to OPCS Onboarding System

Thank you for your interest in contributing to the OPCS Onboarding System! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Initial Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd opcs-onboarding-system
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
   - Create `.env` file in the `backend/` directory
   - Add required environment variables (see README.md for details)
   - For Google APIs setup (Drive and Address Validation), see the comprehensive guide in README.md under "Google APIs Setup"

4. Initialize the database:
   - The database will be created automatically on first run
   - Located at `backend/database/onboarding.db`

5. Start development servers:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Frontend dev server on `http://localhost:9999`

### Docker Development Setup

Alternatively, you can use Docker for development:

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# This starts:
# - Frontend on http://localhost:9999 (with hot reload)
# - Backend on http://localhost:3000 (with file watching)
```

For production-like testing:
```bash
# Build and run combined image
docker build -t opcs-test .
docker run -p 8888:80 -e SESSION_SECRET=test-secret opcs-test

# Access at http://localhost:8888

# Optionally pass a version for footer display (e.g. to match a release):
# docker build --build-arg VERSION=1.0.0 -t opcs-test .
```

## Code Style

### General Guidelines
- Follow the existing code style in the project
- Use ES6+ features (async/await, destructuring, arrow functions)
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose

### JavaScript/Vue
- Use camelCase for variables and functions
- Use PascalCase for Vue components
- Use `<script setup>` syntax for Vue components
- Use Composition API with reactive refs

### File Naming
- Components: PascalCase (`Step1W4Form.vue`)
- Utilities: camelCase (`validation.js`)
- Services: camelCase (`pdfService.js`)
- Routes: camelCase (`auth.js`)

### Vue Component Structure
```vue
<template>
  <!-- Template content -->
</template>

<script setup>
// Imports
// Props/Emits
// Reactive state
// Computed properties
// Methods
// Lifecycle hooks
</script>
```

## Security & Compliance

### Critical Rules
1. **NEVER store SSNs in the database** - SSNs only go in PDFs, never persisted
2. Always encrypt sensitive documents using AES-256-GCM
3. Use `requireAuth` middleware for all protected routes
4. Add `auditLog` for all sensitive operations
5. Never hardcode API keys - use settings table

### Data Privacy
- SSNs are collected but never stored in database
- All sensitive data must be encrypted at rest
- Document access must be audit logged
- Follow US federal compliance requirements

## Testing

### Before Submitting
- Test form validation (phone, email)
- Test draft saving/loading
- Test step navigation with dependencies
- Verify PDF generation works correctly
- Test Google Drive upload (if applicable)
- Verify encryption is working
- Check that SSNs are not in database queries

### Manual Testing Checklist
- [ ] All forms submit correctly
- [ ] Auto-population works for locked fields
- [ ] Step dependencies are enforced
- [ ] Draft saving works
- [ ] PDFs generate correctly
- [ ] Document uploads work
- [ ] Authentication works
- [ ] Admin features work (if applicable)
- [ ] User role management works (Admin Dashboard → Users tab: Admin, Manager, Employee, Applicant)

## Git Workflow

### Branch Naming
- Use descriptive branch names: `feature/add-new-form-field`, `fix/validation-bug`
- Prefix with `feature/`, `fix/`, `docs/`, or `refactor/`

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Remove"
- Include context when helpful

### Before Committing
- Don't commit `.env` files
- Don't commit `node_modules/`
- Don't commit database files (`*.db`)
- Don't commit `dist/` or build artifacts
- Do commit all source code changes
- Do commit Docker files (Dockerfile, docker-compose.yml, .dockerignore)
- Ensure README.md is updated if needed
- Ensure CONTRIBUTING.md is updated if needed

### Docker Changes
When modifying Docker-related files:
- Test the build locally: `docker build -t test-image .`
- Test the container runs: `docker run --rm -p 8888:80 test-image`
- Verify health check passes: `curl http://localhost:8888/api/health`
- Update README.md Docker section if configuration changes
- Ensure `.dockerignore` excludes appropriate files

## Adding New Features

### Form Fields
1. Add to form component's `formData` ref
2. Add validation if required
3. Add tooltip if field needs explanation
4. Update PDF generation service if needed
5. **Never add SSN fields to database**
6. **Update README.md** with field description

### API Endpoints
1. Add route in appropriate `routes/` file
2. Use `requireAuth` middleware (or `requireManager` / `requireAdmin` for restricted access)
3. Add `auditLog` for sensitive operations
4. Handle errors with proper status codes
5. **Update API documentation in README.md**
6. **Update CONTRIBUTING.md** if workflow changes

### Manager/Approval Workflow
- Approval-related routes use `requireManager` middleware (allows both managers and admins)
- The `document_approvals` table tracks approval status per submission
- Manager signature placement uses separate settings keys (`manager_signature_placement_{formType}`)
- Which forms require manager signatures is configured via `manager_signature_required_forms` setting
- After approval, `addManagerSignatureToPdf()` in `pdfService.js` embeds the manager's signature on the existing PDF
- Onboarding completion logic checks both step count AND approval statuses

### Notification Types
To add a new notification type:
1. **Register the type** in `backend/src/services/notificationService.js` → `NOTIFICATION_TYPES` object
   - Set `key`, `label`, `description`, `category` ('admin' or 'applicant'), `priority`, default channels, and `targetRoles`
2. **Add a trigger** in the appropriate route or service file
   - For admin/manager notifications: use `notifyAdminsAndManagers({ type, title, message, link, sourceUserId, applicantId })`
   - For applicant notifications: use `createNotification({ recipientId, type, title, message, link, sourceUserId })`
   - Wrap in try/catch so notification failures don't break the main flow
3. **Add scheduled checks** (if applicable) in `notificationService.js` and register in `backend/src/index.js`
4. **Update README.md** with the new type in the Notifications API section

### Dependencies
1. Install in appropriate directory (backend/ or frontend/)
2. Update package.json
3. **Document in README.md** if significant
4. Consider security implications
5. **Update CONTRIBUTING.md** if setup changes

## Documentation

### Required Updates
- **README.md**: Must be updated for new features, API changes, dependencies
- **CONTRIBUTING.md**: Must be updated for workflow changes, setup changes

### Documentation Standards
- Keep documentation current with code
- Include code examples where helpful
- Document breaking changes clearly
- Update API documentation when endpoints change

## Code Review Process

1. Ensure all tests pass
2. Verify code follows style guidelines
3. Check that security rules are followed
4. Confirm documentation is updated
5. Review for potential bugs or edge cases

## Questions?

If you have questions about contributing, please:
- Check the README.md for project overview
- Review existing code for patterns
- Ask for clarification if needed

## License

[Add license information here]

