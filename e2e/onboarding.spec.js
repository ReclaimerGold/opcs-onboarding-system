// @ts-check
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const minimalPdfPath = path.join(__dirname, 'fixtures', 'minimal.pdf')

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we have signature placements (done in globalSetup) and start from login
    await page.goto('/login')
  })

  test('full onboarding: signup, then complete all 6 form steps', async ({ page }) => {
    const email = `e2e-onboard-${Date.now()}@example.com`
    const firstName = 'E2E'
    const lastName = 'Onboard'

    // --- Login / Signup ---
    await page.getByPlaceholder('First Name').fill(firstName)
    await page.getByPlaceholder('Last Name').fill(lastName)
    await page.getByPlaceholder('Email address').fill(email)
    await page.getByRole('button', { name: /continue/i }).click()

    // If first user is admin, we may land on password-setup
    await page.waitForURL(/\/(forms|admin|password-setup)/, { timeout: 10000 })
    if (page.url().includes('password-setup')) {
      await page.getByPlaceholder(/password \(minimum 8/i).fill('TestPass123')
      await page.getByPlaceholder(/confirm password/i).fill('TestPass123')
      await page.getByRole('button', { name: /set password/i }).click()
      await expect(page).toHaveURL(/\/(admin|forms)/, { timeout: 10000 })
    }
    if (page.url().includes('/admin')) {
      await page.goto('/forms')
    }

    await expect(page).toHaveURL(/\/forms/, { timeout: 5000 })
    // Wait for "Checking availability" to disappear and wizard to show
    await page.getByText('Checking availability...').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { })
    await page.getByRole('heading', { name: /Step 1.*Personal Information.*W-4/ }).waitFor({ state: 'visible', timeout: 10000 })

    // --- Step 1: W-4 ---
    // SSN consent modal: consent -> optional password slide -> signature slide -> close
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { })
    if (await dialog.isVisible()) {
      const consentCheckbox = dialog.getByRole('checkbox', { name: /understand and consent/i })
      if (await consentCheckbox.isVisible()) {
        await consentCheckbox.check()
        await dialog.getByRole('button', { name: /i consent and continue/i }).click()
        await page.waitForTimeout(2000)
      }
      // If password slide (admin without password), set password
      const passwordInput = dialog.getByPlaceholder(/password.*minimum 8/i)
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('TestPass123')
        await dialog.getByPlaceholder(/confirm password/i).fill('TestPass123')
        await dialog.getByRole('button', { name: /set password.*continue/i }).click()
        await page.waitForTimeout(1000)
      }
      // Signature slide: type name and continue
      const typeNameRadio = dialog.getByRole('radio', { name: /type name instead/i })
      if (await typeNameRadio.isVisible()) {
        await typeNameRadio.check()
        await dialog.getByPlaceholder(/type your full legal name/i).fill('E2E Onboard')
        await dialog.getByRole('button', { name: 'Continue' }).click()
      }
      await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { })
    }
    await page.getByPlaceholder('(000) 000-0000').fill('(605) 555-0100')
    await page.getByPlaceholder('XXX-XX-XXXX').first().fill('123-45-6789')
    await page.locator('input[type="date"]').first().fill('1990-01-15')
    await page.getByPlaceholder(/123 main street/i).fill('123 Main St')
    await page.getByPlaceholder(/sioux falls/i).fill('Sioux Falls')
    await page.getByPlaceholder('SD').fill('SD')
    await page.getByPlaceholder('57101').fill('57101')
    await page.getByRole('radio', { name: /single or married filing separately/i }).check()
    await page.getByRole('radio', { name: /type name instead/i }).check()
    await page.getByPlaceholder(/type your full legal name/i).first().fill('E2E Onboard')
    await page.getByRole('button', { name: 'Continue to Step 2' }).click()
    await expect(page.getByRole('heading', { name: 'Step 2: Form I-9 Employment Eligibility' })).toBeVisible({ timeout: 10000 })

    // --- Step 2: I-9 (List B + List C) ---
    await page.getByRole('radio', { name: 'A citizen of the United States' }).check()
    await page.getByRole('button', { name: /driver's license/i }).click()
    await page.getByPlaceholder(/document number/i).first().fill('DL123456')
    await page.getByPlaceholder(/issuing authority/i).first().fill('South Dakota DMV')
    await page.locator('input[type="file"]').nth(1).setInputFiles(minimalPdfPath)
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /social security card/i }).click()
    await page.getByPlaceholder(/social security number|document number/i).last().fill('123-45-6789')
    await page.locator('input[type="file"]').nth(2).setInputFiles(minimalPdfPath)
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Continue to Step 3' }).click()
    await expect(page.getByText(/step 3|background|conviction/i)).toBeVisible({ timeout: 10000 })

    // --- Step 3: Background ---
    await page.getByRole('checkbox', { name: /no, I have not been convicted.*sex offender/i }).check()
    await page.getByRole('checkbox', { name: /no, I have not been convicted.*past 7 years/i }).check()
    await page.getByRole('checkbox', { name: /penalty of perjury/i }).check()
    await page.getByRole('checkbox', { name: /South Dakota.*background check/i }).check()
    await page.getByRole('button', { name: 'Continue to Step 4' }).click()
    await expect(page.getByText(/step 4|direct deposit|bank/i)).toBeVisible({ timeout: 10000 })

    // --- Step 4: Direct Deposit ---
    await page.getByRole('button', { name: 'Continue to Step 5' }).click()
    await expect(page.getByText(/step 5|acknowledgement/i)).toBeVisible({ timeout: 10000 })

    // --- Step 5: Acknowledgements ---
    await page.getByRole('radio', { name: /type name instead/i }).check()
    await page.getByPlaceholder(/type your full legal name/i).first().fill('E2E Onboard')
    await page.getByRole('button', { name: 'Continue to Step 6' }).click()
    await expect(page.getByText(/step 6|form 8850|8850/i)).toBeVisible({ timeout: 10000 })

    // --- Step 6: 8850 ---
    const consent8850 = page.getByRole('checkbox', { name: /understand and consent/i })
    if (await consent8850.isVisible()) {
      await consent8850.check()
      await page.getByRole('button', { name: /i consent and continue/i }).click()
      await page.waitForTimeout(500)
    }
    await page.getByPlaceholder(/county/i).first().fill('Minnehaha')
    await page.getByRole('radio', { name: /type name instead/i }).check()
    await page.getByPlaceholder(/type your full legal name/i).first().fill('E2E Onboard')
    await page.getByRole('button', { name: 'Complete Onboarding' }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })
})
