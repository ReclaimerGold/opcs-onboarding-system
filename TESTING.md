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

