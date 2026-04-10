// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Route guard / navigation tests (unauthenticated project — no storageState).
 * Verifies that protected routes redirect unauthenticated visitors to /login.
 */

const PROTECTED_ROUTES = [
  { path: '/dashboard',   label: 'dashboard' },
  { path: '/forms',       label: 'forms' },
  { path: '/admin',       label: 'admin dashboard' },
  { path: '/admin/setup', label: 'admin setup' },
  { path: '/settings',    label: 'settings' },
  { path: '/approvals',   label: 'approvals' },
  { path: '/notifications/preferences', label: 'notification preferences' }
]

for (const route of PROTECTED_ROUTES) {
  test(`unauthenticated access to ${route.label} redirects to /login`, async ({ page }) => {
    await page.goto(route.path)
    await expect(page).toHaveURL('/login', { timeout: 10_000 })
  })
}
