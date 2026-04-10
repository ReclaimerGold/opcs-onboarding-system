// @ts-check
import { test, expect } from '@playwright/test'
import { AdminDashboardPage } from './pages/AdminDashboardPage.js'

test.describe('@regression Admin Dashboard', () => {
  let dashboard

  test.beforeEach(async ({ page }) => {
    dashboard = new AdminDashboardPage(page)
    await dashboard.goto()
  })

  test('@smoke loads admin dashboard and shows heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/admin dashboard/i)
  })

  test('quick stats cards are visible with numeric values', async ({ page }) => {
    // Wait for at least one stat card to show a non-zero value (data loads async)
    await expect(page.locator('p.text-2xl').first()).toBeVisible({ timeout: 10_000 })
    // The Total Applicants card should show at least 1 (seeded admin + user)
    await expect(async () => {
      const stats = await dashboard.getQuickStats()
      expect(stats.totalApplicants).toBeGreaterThanOrEqual(1)
    }).toPass({ timeout: 10_000 })
  })

  test('Overview tab is active by default', async ({ page }) => {
    // Stats grid should be visible on overview
    await expect(page.locator('.grid').first()).toBeVisible()
  })

  test('navigates to Users tab', async ({ page }) => {
    await dashboard.navigateToTab('users')
    // Users DataTable should appear
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to Onboarding tab', async ({ page }) => {
    await dashboard.navigateToTab('activeOnboarding')
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to Documents sub-tab', async ({ page }) => {
    await dashboard.navigateToDocumentSubTab()
    await expect(page.locator('table, [class*="document"], [class*="submiss"]').first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to Login Attempts tab', async ({ page }) => {
    await dashboard.navigateToLoginAttempts()
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigates to Audit Log tab', async ({ page }) => {
    await dashboard.navigateToAuditLog()
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10_000 })
  })
})
