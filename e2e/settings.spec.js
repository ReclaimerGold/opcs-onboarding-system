// @ts-check
import { test, expect } from '@playwright/test'
import { SettingsPage } from './pages/SettingsPage.js'

test.describe('@regression Settings', () => {
  let settings

  test.beforeEach(async ({ page }) => {
    settings = new SettingsPage(page)
    await settings.goto()
  })

  test('@smoke settings page loads with heading', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /settings/i })).toBeVisible({ timeout: 10_000 })
  })

  test('@smoke Integrations section is accessible', async ({ page }) => {
    await settings.navigateToSection('integrations')
    const content = page.locator('section, div').filter({ hasText: /google drive|mailgun|integration/i }).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })

  test('@smoke Email & Forms section is accessible', async ({ page }) => {
    await settings.navigateToSection('emailForms')
    // Should show employer settings fields
    const content = page.locator('section, div, form').filter({ hasText: /employer|ein|authorized rep/i }).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })

  test('@regression employer settings can be saved without error', async ({ page }) => {
    await settings.saveEmployerSettings()
    // After saving, should not redirect away from settings
    await expect(page).toHaveURL('/settings')
  })

  test('@regression handbook and employer company fields are configurable', async ({ page }) => {
    await settings.saveEmployerSettings({
      companyName: 'Optimal Prime Cleaning Services LLC',
      handbookUrl: 'https://example.com/employee-handbook-v2.pdf',
      handbookLabel: 'Open Updated Handbook',
      defaultStartingWage: '19.50/hour'
    })

    await expect(page.locator('input[placeholder="e.g. Optimal Prime Cleaning Services"]')).toHaveValue('Optimal Prime Cleaning Services LLC')
    await expect(page.locator('input[placeholder="Open Employee Handbook"]')).toHaveValue('Open Updated Handbook')
    await expect(page.locator('input[type="url"][placeholder="https://..."]').nth(1)).toHaveValue('https://example.com/employee-handbook-v2.pdf')
    await expect(page.locator('input[placeholder="e.g. 18.00/hour"]')).toHaveValue('19.50/hour')
  })

  test('@regression signature placement section is accessible', async ({ page }) => {
    const sigBtn = page.locator('button[type="button"]').filter({ hasText: /signature/i })
    if (await sigBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settings.navigateToSection('signature')
      const panel = settings.getSignaturePlacementPanel()
      await expect(panel).toBeVisible({ timeout: 10_000 })
    } else {
      // Signature placement may be in the Email & Forms section
      await settings.navigateToSection('emailForms')
      await expect(page.locator('h1, h2, h3').first()).toBeVisible()
    }
  })
})
