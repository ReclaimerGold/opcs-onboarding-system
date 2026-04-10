// @ts-check
import { test, expect } from '@playwright/test'
import { UserDashboardPage } from './pages/UserDashboardPage.js'

test.describe('User Dashboard', () => {
  let dashboard

  test.beforeEach(async ({ page }) => {
    dashboard = new UserDashboardPage(page)
    await dashboard.goto()
  })

  test('renders dashboard heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('shows onboarding status or progress indicator', async ({ page }) => {
    // Either a status text or a progress bar should be present
    const hasStatus = await dashboard.onboardingStatus.first().isVisible({ timeout: 5_000 }).catch(() => false)
    const hasProgress = await dashboard.progressBar.first().isVisible({ timeout: 5_000 }).catch(() => false)
    const hasStep = await dashboard.stepItems.first().isVisible({ timeout: 5_000 }).catch(() => false)
    expect(hasStatus || hasProgress || hasStep).toBe(true)
  })

  test('Admin link is NOT visible for regular user', async () => {
    const isVisible = await dashboard.isAdminLinkVisible()
    expect(isVisible).toBe(false)
  })

  test('forms/start link navigates to /forms', async ({ page }) => {
    await dashboard.clickForms()
    await expect(page).toHaveURL('/forms')
  })

  test('logout returns to login page', async ({ page }) => {
    await dashboard.logout()
    await expect(page).toHaveURL('/login')
  })
})
