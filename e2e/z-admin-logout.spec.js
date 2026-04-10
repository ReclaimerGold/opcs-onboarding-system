// @ts-check
/**
 * Admin logout test — must run last in the admin project so it doesn't
 * destroy the server-side session before other admin tests run.
 */
import { test, expect } from '@playwright/test'
import { AdminDashboardPage } from './pages/AdminDashboardPage.js'

test('admin logout returns to login page', async ({ page }) => {
  const dashboard = new AdminDashboardPage(page)
  await dashboard.goto()
  await dashboard.logout()
  await expect(page).toHaveURL('/login')
})
