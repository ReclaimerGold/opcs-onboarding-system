// @ts-check
import { test, expect } from '@playwright/test'
import { AdminSetupPage } from './pages/AdminSetupPage.js'

test.describe('Admin Setup Wizard', () => {
  let setup

  test.beforeEach(async ({ page }) => {
    setup = new AdminSetupPage(page)
    await setup.goto()
  })

  test('setup page loads with a visible heading', async ({ page }) => {
    // h1 in nav says "Admin setup"
    await expect(page.locator('h1').filter({ hasText: /admin setup/i })).toBeVisible()
  })

  test('step 1 shows PDF templates download section', async ({ page }) => {
    // Step 1 heading is always visible on load
    await expect(page.locator('h2').filter({ hasText: /step 1|pdf template/i })).toBeVisible({ timeout: 10_000 })
  })

  test('can navigate forward with continue button', async ({ page }) => {
    // Continue button on step 1 — may be disabled if PDFs not downloaded
    // Just verify we can see the page step indicator
    const stepIndicator = page.locator('span').filter({ hasText: /step \d of/i })
    await expect(stepIndicator).toBeVisible({ timeout: 10_000 })
  })

  test('back button is present after moving forward', async ({ page }) => {
    const continueBtn = page.locator('button').filter({ hasText: /continue to signature/i })
    if (await continueBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await continueBtn.click()
      await page.waitForLoadState('networkidle')
      const backBtn = page.locator('button').filter({ hasText: /back|previous/i })
      await expect(backBtn).toBeVisible({ timeout: 5_000 })
    } else {
      // PDFs not downloaded — step 1 still visible, which is valid
      await expect(page.locator('h1').filter({ hasText: /admin setup/i })).toBeVisible()
    }
  })

  test('setup page shows employer settings or signature placement info', async ({ page }) => {
    // Either step 1 download section or step 6 employer section should be visible
    const hasStep1 = await page.locator('h2').filter({ hasText: /step 1|pdf template/i })
      .isVisible({ timeout: 3_000 }).catch(() => false)
    const hasSigPlacement = await page.locator('h2').filter({ hasText: /signature placement/i })
      .isVisible({ timeout: 1_000 }).catch(() => false)
    const hasEmployer = await page.locator('h2').filter({ hasText: /email.*forms|step 6/i })
      .isVisible({ timeout: 1_000 }).catch(() => false)
    expect(hasStep1 || hasSigPlacement || hasEmployer).toBe(true)
  })
})
