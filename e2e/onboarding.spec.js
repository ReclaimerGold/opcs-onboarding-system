// @ts-check
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const minimalPdfPath = path.join(__dirname, 'fixtures', 'minimal.pdf')
const userAuthPath = path.join(__dirname, '.auth', 'user.json')

test.describe('@regression Onboarding flow', () => {
  test.use({ storageState: userAuthPath })

  test.beforeEach(async ({ page }) => {
    await page.goto('/forms')
  })

  test('full onboarding: signup, then complete all 6 required form steps', async ({ page }) => {
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
    await page.getByText('Checking availability...').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { })
    await expect(page.getByRole('heading', { name: /Step 1: Personal Information & W-4/i })).toBeVisible({ timeout: 10000 })
    const phoneInput = page.getByPlaceholder('(000) 000-0000')
    if (await phoneInput.isEditable().catch(() => false)) {
      await phoneInput.fill('(605) 555-0100')
    }
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
    const ssnReprompt = page.getByRole('dialog', { name: /SSN session expired/i })
    if (await ssnReprompt.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await ssnReprompt.getByPlaceholder('XXX-XX-XXXX').fill('123-45-6789')
      await ssnReprompt.getByRole('button', { name: 'Continue', exact: true }).click()
      await ssnReprompt.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => { })
    }

    // --- Step 2: I-9 (List B + List C) ---
    await page.getByRole('radio', { name: 'A citizen of the United States' }).check()
    await page.getByRole('button', { name: /Two Documents/i }).click()
    await page.getByRole('button', { name: /driver's license/i }).click()
    await expect(page.getByPlaceholder('Document number')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('Document number').fill('DL123456')
    await page.getByPlaceholder(/issuing authority/i).first().fill('South Dakota DMV')
    await page.locator('input[type="file"]').nth(1).setInputFiles(minimalPdfPath)
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /social security card/i }).click()
    await expect(page.getByPlaceholder('Social Security Number (XXX-XX-XXXX)')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('Social Security Number (XXX-XX-XXXX)').fill('123-45-6789')
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
    await page.getByText('Checking account').click()
    await page.getByPlaceholder(/routing number/i).fill('021000021')
    await page.getByPlaceholder(/account number/i).fill('123456789')
    await page.getByRole('button', { name: 'Continue to Step 5' }).click()
    await expect(page.getByText(/step 5|acknowledgement/i)).toBeVisible({ timeout: 10000 })

    // --- Step 5: Acknowledgements ---
    const [handbookPopup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.getByRole('link', { name: /open .*handbook/i }).click()
    ])
    if (handbookPopup) await handbookPopup.close().catch(() => { })
    await page.getByRole('checkbox', { name: /i have received access to the optimal prime cleaning services employee handbook/i }).check()
    await page.getByLabel(/Emergency Contact Name/i).fill('Casey Contact')
    await page.getByPlaceholder('(XXX) XXX-XXXX').fill('(605) 555-0111')
    await page.locator('div.overflow-y-auto').filter({ hasText: /Optimal Prime Cleaning Services Employment Agreement/i }).first()
      .evaluate((el) => { el.scrollTop = el.scrollHeight })
    await page.getByRole('checkbox', { name: /i have read and agree to the employment agreement above/i }).check()
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
    await page.getByRole('button', { name: 'Continue to Step 7' }).click()

    await expect(page.getByRole('heading', { name: /Step 7: ETA Form 9061/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/optional for onboarding completion/i)).toBeVisible()
  })
})
