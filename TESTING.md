# Testing Guide
## OPCS Onboarding System

This document describes the testing framework and how to run tests for the OPCS Onboarding System.

## Testing Frameworks

### Backend Testing (Jest)
- **Framework**: Jest with ES modules support
- **Location**: `backend/src/__tests__/`
- **Configuration**: `backend/jest.config.js`

### Frontend Testing (Vitest)
- **Framework**: Vitest with Vue Test Utils
- **Location**: `frontend/src/__tests__/` or `frontend/src/**/*.test.js`
- **Configuration**: `frontend/vitest.config.js`

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd backend && npm test

# Run tests in watch mode
cd backend && npm run test:watch

# Run tests with coverage
cd backend && npm run test:coverage
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend && npm test

# Run tests in watch mode
cd frontend && npm test -- --watch

# Run tests with UI
cd frontend && npm run test:ui

# Run tests with coverage
cd frontend && npm run test:coverage
```

## Test Structure

### Backend Test Files

- `backend/src/routes/__tests__/auth.test.js` - Authentication route tests
- `backend/src/routes/__tests__/forms.test.js` - Form submission tests
- `backend/src/services/__tests__/pdfService.test.js` - PDF service tests
- `backend/src/database/__tests__/init.test.js` - Database schema tests

### Frontend Test Files

- `frontend/src/components/__tests__/` - Component tests
- `frontend/src/utils/__tests__/` - Utility function tests

## Writing Tests

### Backend Test Example

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals'
import { functionToTest } from '../module.js'

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should do something', () => {
    const result = functionToTest(input)
    expect(result).toBe(expected)
  })
})
```

### Frontend Test Example

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Component from '../Component.vue'

describe('Component', () => {
  it('should render correctly', () => {
    const wrapper = mount(Component, {
      props: { propName: 'value' }
    })
    expect(wrapper.text()).toContain('expected text')
  })
})
```

## End-to-End (E2E) Tests (Playwright)

Browser-based E2E tests cover the full login and onboarding flow.

### Prerequisites

1. **Start the app** (backend on 3000, frontend on 9999):

   ```bash
   npm run dev
   ```

   Or start backend and frontend separately. Playwright will reuse an existing server when not in CI.

2. **Install Playwright browsers** (once per machine):

   ```bash
   npx playwright install chromium
   ```

   On Linux, if Chromium fails to launch with missing shared library errors (e.g. `libnspr4.so`), install system dependencies:

   ```bash
   npx playwright install-deps
   ```

### Running E2E Tests

```bash
# Run all E2E tests (Chromium)
npm run test:e2e

# Run with Playwright UI
npm run test:e2e:ui
```

### What the E2E Suite Covers

- **Login** (`e2e/login.spec.js`): Login page load, signup and redirect, logout and re-login.
- **Onboarding** (`e2e/onboarding.spec.js`): Full 6-step flow: signup → W-4 (with SSN consent) → I-9 (List B + List C + file uploads) → Background → Direct Deposit → Acknowledgements → Form 8850 → dashboard.

Before E2E runs, `globalSetup` seeds signature placements for W-4, I-9, and 8850 so the form wizard is available without manual admin setup.

### Fixtures

- `e2e/fixtures/minimal.pdf` – minimal PDF used for I-9 List B and List C document uploads in the onboarding test.

## Test Coverage Goals

- **Minimum Coverage**: 80% for critical paths
- **Critical Paths**:
  - Authentication (signup/login)
  - Form submission
  - PDF generation
  - Document retention
  - Data validation

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before deploying to production

## Test Database

Backend tests use a separate test database that is:
- Created fresh for each test suite
- Cleaned up after each test
- Never contains production data

## Mocking

- **External APIs**: Mock Google Drive API calls in tests
- **File System**: Use temporary directories for file operations
- **Database**: Use in-memory SQLite for faster tests

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean Setup**: Use `beforeEach` to set up test data
3. **Clean Teardown**: Clean up after tests
4. **Descriptive Names**: Test names should describe what they test
5. **AAA Pattern**: Arrange, Act, Assert
6. **No SSN in Tests**: Never include real SSNs in test data

## Troubleshooting

### Rate Limiting Errors (429)
- Rate limiting is configured for auth endpoints (20 requests per 15 minutes)
- Tests may hit this limit if run repeatedly
- Solution: Tests use separate rate limiters or bypass rate limiting in test mode

### Database Locked Errors
- Ensure database connections are closed after tests
- Use separate test database files

### Module Import Errors
- Ensure Jest/Vitest config matches project structure
- Check that ES module syntax is correct

### Playwright: Browser won't launch (e.g. libnspr4.so missing)
- Run `npx playwright install-deps` to install system dependencies for Chromium.
- Or use a different channel: `npx playwright install chromium` and ensure your OS has the required libraries (see [Playwright docs](https://playwright.dev/docs/ci)).