// @ts-check
import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './e2e',
  globalSetup: path.join(__dirname, 'e2e', 'global-setup.js'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    baseURL: 'http://localhost:9999',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    // 1. Setup project: saves admin + user auth state to e2e/.auth/
    {
      name: 'setup',
      testMatch: '**/auth.setup.js',
      use: { ...devices['Desktop Chrome'] }
    },

    // 2. Unauthenticated project: login, onboarding, navigation, password flows
    {
      name: 'unauthenticated',
      testMatch: [
        '**/login.spec.js',
        '**/onboarding.spec.js',
        '**/navigation.spec.js',
        '**/password-flows.spec.js'
      ],
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] }
    },

    // 3. Admin project: uses saved admin session
    {
      name: 'admin',
      testMatch: [
        '**/admin-dashboard.spec.js',
        '**/admin-setup.spec.js',
        '**/pdf-signature.spec.js',
        '**/settings.spec.js',
        '**/approval-queue.spec.js',
        '**/z-admin-logout.spec.js'   // must be last — destroys the session
      ],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json'
      }
    },

    // 4. User project: uses saved regular user session
    {
      name: 'user',
      testMatch: ['**/user-dashboard.spec.js'],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json'
      }
    }
  ],
  webServer: [
    {
      command: 'npm run dev:backend',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { PORT: '3001', E2E_TEST: '1' }
    },
    {
      command: 'npm run dev:frontend',
      url: 'http://localhost:9999',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { BACKEND_PORT: '3001' }
    }
  ]
})
