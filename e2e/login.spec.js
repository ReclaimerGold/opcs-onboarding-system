// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Login and signup', () => {
  test('login page loads and shows sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /onboarding system/i })).toBeVisible()
    await expect(page.getByPlaceholder('First Name')).toBeVisible()
    await expect(page.getByPlaceholder('Last Name')).toBeVisible()
    await expect(page.getByPlaceholder('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  })

  test('signup creates account and redirects', async ({ page }) => {
    const email = `e2e-signup-${Date.now()}@example.com`
    await page.goto('/login')
    await page.getByPlaceholder('First Name').fill('E2E')
    await page.getByPlaceholder('Last Name').fill('Signup')
    await page.getByPlaceholder('Email address').fill(email)
    await page.getByRole('button', { name: /continue/i }).click()

    // Either /forms (applicant), /admin (admin), or /password-setup (admin without password)
    await expect(page).toHaveURL(/\/(forms|admin|password-setup)/, { timeout: 10000 })
    // Should not be on login anymore
    await expect(page).not.toHaveURL(/\/login$/)
  })

  test('login with existing account redirects after logout and re-login', async ({ page }) => {
    const email = `e2e-login-${Date.now()}@example.com`
    await page.goto('/login')
    await page.getByPlaceholder('First Name').fill('E2E')
    await page.getByPlaceholder('Last Name').fill('Login')
    await page.getByPlaceholder('Email address').fill(email)
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page).toHaveURL(/\/(forms|admin|password-setup)/, { timeout: 10000 })

    // Complete the SSN consent modal (consent -> optional password -> signature) so it closes and Logout is clickable
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { })
    if (await dialog.isVisible()) {
      const consentCheckbox = dialog.getByRole('checkbox', { name: /understand and consent/i })
      if (await consentCheckbox.isVisible()) {
        await consentCheckbox.check()
        await dialog.getByRole('button', { name: /i consent and continue/i }).click()
        await page.waitForTimeout(2000)
      }
      const passwordInput = dialog.getByPlaceholder(/password.*minimum 8/i)
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('TestPass123')
        await dialog.getByPlaceholder(/confirm password/i).fill('TestPass123')
        await dialog.getByRole('button', { name: /set password.*continue/i }).click()
        await page.waitForTimeout(1000)
      }
      const typeNameRadio = dialog.getByRole('radio', { name: /type name instead/i })
      if (await typeNameRadio.isVisible()) {
        await typeNameRadio.check()
        await dialog.getByPlaceholder(/type your full legal name/i).fill('E2E Login')
        await dialog.getByRole('button', { name: 'Continue' }).click()
      }
      await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { })
    }
    if (!page.url().includes('/login')) {
      await page.getByRole('button', { name: 'Logout' }).click()
    }
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

    // Login again with same credentials
    await page.getByPlaceholder('First Name').fill('E2E')
    await page.getByPlaceholder('Last Name').fill('Login')
    await page.getByPlaceholder('Email address').fill(email)
    await page.getByRole('button', { name: /continue/i }).click()
    // Should redirect to app, or stay on login only if e.g. password required (no "account not found")
    await expect(page).toHaveURL(/\/(forms|admin|dashboard|password-setup|login)/, { timeout: 10000 })
    if (page.url().includes('/login')) {
      await expect(page.getByText(/no account found|account not found/i)).not.toBeVisible()
    }
  })
})
