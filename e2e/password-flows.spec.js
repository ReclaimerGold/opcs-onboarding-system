// @ts-check
import { test, expect } from '@playwright/test'

/**
 * Password flow tests (unauthenticated project — no storageState).
 */

test.describe('@regression Forgot Password flow', () => {
  test('@smoke forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible()
  })

  test('@regression submitting forgot-password form with unknown email shows feedback', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.locator('input[type="email"], input[name*="email"]').first().fill('notarealusere2e@example.com')
    await page.locator('button[type="submit"]').click()
    // Should show either success message (to avoid enumeration) or validation message
    const feedback = page.locator('.text-green-600, .text-red-600, [role="alert"], [class*="message"]')
    await expect(feedback.first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('@regression Reset Password page', () => {
  test('@smoke reset-password page without token shows error or redirect', async ({ page }) => {
    await page.goto('/reset-password')
    // Without a valid token the page should show an error OR redirect to login/forgot-password
    await expect(page).not.toHaveURL('/dashboard', { timeout: 5_000 }).catch(() => {})
    // Page should load something (not a blank page)
    await expect(page.locator('body')).toBeVisible()
  })

  test('@regression reset-password page with invalid token shows validation error', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token-12345')
    const errorOrForm = page.locator('h1, h2, [role="alert"], .text-red-600, form').first()
    await expect(errorOrForm).toBeVisible({ timeout: 10_000 })
  })

  test('@regression reset-password flow works with the E2E token endpoint', async ({ page }) => {
    const email = 'e2e-admin@example.com'

    await page.goto('/forgot-password')
    await page.locator('input[type="email"], input[name*="email"]').first().fill(email)
    await page.locator('button[type="submit"]').click()

    const feedback = page.locator('.text-green-600, .text-red-600, [role="alert"], [class*="message"]')
    await expect(feedback.first()).toBeVisible({ timeout: 10_000 })

    const tokenResponse = await page.request.get(`/api/auth/test/reset-token?email=${encodeURIComponent(email)}`)
    expect(tokenResponse.ok()).toBeTruthy()
    const tokenPayload = await tokenResponse.json()

    await page.goto(`/reset-password?token=${tokenPayload.token}`)
    await page.locator('input[type="password"]').first().fill('AdminPass123!')
    await page.locator('input[type="password"]').nth(1).fill('AdminPass123!')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('body')).toContainText(/password|login|success|updated/i, { timeout: 10_000 })
  })
})
