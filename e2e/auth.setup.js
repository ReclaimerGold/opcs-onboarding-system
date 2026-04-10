// @ts-check
/**
 * Auth setup: logs in as admin and regular user, saves storageState to e2e/.auth/.
 * Runs in the 'setup' project before admin/user test projects.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ADMIN_AUTH_FILE = path.join(__dirname, '.auth', 'admin.json')
const USER_AUTH_FILE = path.join(__dirname, '.auth', 'user.json')

// ─── Admin auth setup ───────────────────────────────────────────────────────

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Phase 1: fill name + email using placeholder selectors (matches Vue v-model binding)
  await page.getByPlaceholder('First Name').fill('E2E')
  await page.getByPlaceholder('Last Name').fill('Admin')
  await page.getByPlaceholder('Email address').fill('e2e-admin@example.com')
  await page.getByRole('button', { name: /continue/i }).click()

  // Wait for password field to appear (phase 2 — backend returns requiresPassword: true)
  await expect(page.getByPlaceholder('Password')).toBeVisible({ timeout: 10_000 })

  // Phase 2: fill password and submit
  await page.getByPlaceholder('Password').fill('AdminPass123')
  await page.getByRole('button', { name: /continue/i }).click()

  // Admin should land on /admin or /password-setup — either means auth succeeded
  await expect(page).toHaveURL(/\/(admin|password-setup)/, { timeout: 15_000 })

  // Persist both cookie session and localStorage authToken
  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})

// ─── Regular user auth setup ─────────────────────────────────────────────────

setup('authenticate as regular user', async ({ page }) => {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Single phase: name + email only (no password for regular users)
  await page.getByPlaceholder('First Name').fill('E2E')
  await page.getByPlaceholder('Last Name').fill('User')
  await page.getByPlaceholder('Email address').fill('e2e-user@example.com')
  await page.getByRole('button', { name: /continue/i }).click()

  // Regular users may be routed through password setup before forms/dashboard.
  await expect(page).toHaveURL(/\/(dashboard|forms|password-setup)/, { timeout: 15_000 })

  if (page.url().includes('/password-setup')) {
    await page.getByPlaceholder('Enter password (minimum 8 characters)').fill('UserPass123')
    await page.getByPlaceholder('Confirm password').fill('UserPass123')
    await page.getByRole('button', { name: 'Set Password', exact: true }).click()
    await expect(page).toHaveURL(/\/(dashboard|forms)/, { timeout: 15_000 })
  }

  // Wait for onboarding loading to settle: either the modal appears or the nav/dashboard renders.
  // The SSNConsentModal only shows after the async /auth/dashboard-onboarding-status call completes.
  // We wait up to 10s for either the modal or the main nav heading to appear.
  await page.waitForSelector('[role="dialog"], nav h1', { timeout: 10_000 }).catch(() => {})
  await page.waitForTimeout(500)

  // Dismiss SSN consent modal fully (consent → password setup → signature)
  const consentModal = page.locator('[role="dialog"]')
  if (await consentModal.isVisible({ timeout: 3_000 }).catch(() => false)) {
    // Slide 1: SSN consent checkbox
    const checkbox = consentModal.locator('input[type="checkbox"]')
    if (await checkbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await checkbox.check()
    }
    const consentBtn = consentModal.locator('button').filter({ hasText: /consent and continue/i })
    if (await consentBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(consentBtn).toBeEnabled({ timeout: 5_000 })
      await consentBtn.click()
      await page.waitForTimeout(1_000)
    }

    // Slide 2: Password setup (regular users need to set a password on first login)
    const passwordInput = page.getByPlaceholder('Enter password (minimum 8 characters)')
    if (await passwordInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await passwordInput.fill('UserPass123')
      await page.getByPlaceholder('Confirm password').fill('UserPass123')
      const setPwBtn = consentModal.locator('button').filter({ hasText: /set password & continue/i })
      await expect(setPwBtn).toBeEnabled({ timeout: 5_000 })
      await setPwBtn.click()
      await page.waitForTimeout(1_000)
    }

    // Slide 3: Signature — use "Type name instead" for reliable automation.
    // NOTE: getByRole with exact:true is required here. filter({ hasText: /^continue$/i }) does NOT
    // match the Continue button due to how Playwright handles regex anchors on button text.
    const typeNameRadio = page.locator('input[type="radio"][value="type"]')
    if (await typeNameRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await typeNameRadio.check()
      await page.getByPlaceholder('Type your full legal name').fill('E2E User')
      await page.waitForTimeout(800) // allow renderTypedNameToDataUrl to resolve and Vue to re-render
    }
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true })
    if (await continueBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(continueBtn).toBeEnabled({ timeout: 5_000 })
      await continueBtn.click()
      await consentModal.waitFor({ state: 'hidden', timeout: 10_000 })
    }
  }

  await page.context().storageState({ path: USER_AUTH_FILE })
})
