# Testing Guide
## OPCS Onboarding System

This project uses a layered testing strategy:

- `Vitest` for backend unit/integration tests
- `Vitest` + Vue Test Utils for frontend component tests
- `Playwright` for browser smoke and regression coverage
- `GitHub Actions` for lint, unit tests, Playwright smoke, Docker build validation, and nightly full regression

## Quick Commands

```bash
# Lint everything
npm run lint

# Run backend + frontend unit tests
npm test

# Run all Playwright coverage
npm run test:e2e

# Fast browser confidence check
npm run test:e2e:smoke

# Full browser regression run
npm run test:e2e:regression

# Open Playwright UI
npm run test:e2e:ui
```

## Test Layers

### Backend (`backend`)

- Runner: `Vitest`
- Command: `npm run test:backend`
- Coverage command: `npm run test:coverage -w opcs-onboarding-backend`
- Focus: auth routes, forms routes, PDF field mapping, service-level logic, database-safe regression checks

Current critical regression examples include:

- password-reset support hooks for E2E
- W-4 zero placeholders and employer block mapping
- I-9 employer/date mapping
- Form 8850 date, contact, and title mapping
- Form 9061 wage/start-date/job-title mapping

### Frontend (`frontend`)

- Runner: `Vitest` with `jsdom`
- Command: `npm run test:frontend`
- Coverage command: `npm run test:coverage -w opcs-onboarding-frontend`
- Focus: reusable UI components, critical form behavior, and settings-driven UI

Current critical regression examples include:

- validation utilities
- shared form field rendering
- Step 5 handbook settings override behavior

### Browser / E2E (`e2e`)

- Runner: `Playwright`
- Base URL: `http://localhost:9999`
- Backend test server: `http://localhost:3001`
- Browser: Chromium

Playwright projects:

- `setup`: seeds auth state for admin and seeded user
- `unauthenticated`: login, onboarding, navigation, password-reset coverage
- `admin`: dashboard, settings, approvals, PDF/admin flows
- `user`: signed-in user dashboard coverage

Tag strategy:

- `@smoke`: fastest high-signal checks for CI
- `@regression`: broader end-to-end coverage, including smoke-tagged specs

### E2E prerequisites

Install the browser once:

```bash
npx playwright install chromium
```

On Linux, install Playwright system dependencies if Chromium fails to launch:

```bash
npx playwright install-deps
```

### E2E notes

- `playwright.config.js` starts the backend and frontend automatically unless matching dev servers are already running.
- `e2e/global-setup.js` seeds the database before tests run.
- `backend/scripts/seed-e2e-data.js` provides the baseline admin user, applicant user, signature placement, and employer/settings data used by the suite.
- The reset-password suite uses the test-only endpoint `/api/auth/test/reset-token` when `E2E_TEST=1` so the browser flow can be tested without real Mailgun delivery.

### Key browser coverage

- login and onboarding flow
- password reset page states plus full reset completion
- admin dashboard visibility
- approval queue access
- settings persistence for employer/company and handbook configuration

## Writing Tests

Prefer targeted regression tests over broad, brittle ones.

- Add backend tests for pure mapping/business logic when a bug is about data semantics.
- Add frontend component tests when the bug is UI-state driven but does not require a real browser.
- Add Playwright coverage when the bug depends on routing, auth, file upload, persistence, or multiple screens.

## CI Expectations

The main CI workflow runs:

- `npm run lint`
- `npm test`
- `npm run test:e2e:smoke`
- Docker image build validation

A scheduled nightly workflow run executes the full Playwright regression suite and uploads artifacts.

## Troubleshooting

### Playwright browser launch issues

- Run `npx playwright install chromium`
- On Linux, run `npx playwright install-deps`

### Test data looks stale

- Re-run `npm run test:e2e`; global setup reseeds the E2E database state before the suite starts

### Password reset E2E does not return a token

- Confirm the backend is running with `E2E_TEST=1`
- Confirm the forgot-password request was submitted for a seeded email such as `e2e-admin@example.com`