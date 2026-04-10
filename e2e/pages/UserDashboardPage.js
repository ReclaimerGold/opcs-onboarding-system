// @ts-check
import { expect } from '@playwright/test'

/**
 * Page Object Model: User Dashboard (/dashboard)
 */
export class UserDashboardPage {
  constructor(page) {
    this.page = page
    this.heading        = page.locator('h1').filter({ hasText: /onboarding dashboard/i })
    this.onboardingStatus = page.locator('p, span').filter({ hasText: /completed|in progress|not started|steps completed/i })
    this.adminLink      = page.locator('a[href="/admin"]')
    this.formsLink      = page.locator('a[href="/forms"]')
    this.logoutBtn      = page.locator('button').filter({ hasText: /logout/i })
    this.progressBar    = page.locator('.bg-primary').filter({ hasAttribute: 'style' })
    this.stepItems      = page.locator('[class*="step"], li').filter({ hasText: /step|w-4|i-9|background/i })
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('domcontentloaded')
    // Wait for onboarding loading to settle: modal OR dashboard nav heading
    await this.page.waitForSelector('[role="dialog"], nav h1', { timeout: 10_000 }).catch(() => {})
    await this.page.waitForTimeout(300)
    // The dashboard may show an SSN consent modal — dismiss all slides
    await this._dismissSsnModalIfPresent()
  }

  /**
   * If the SSN consent modal appears (any slide), dismiss it fully.
   * Handles slide 1 (consent), slide 2 (password), and slide 3 (signature).
   * After auth.setup.js runs, this should be a no-op if consent+signature are
   * already in DB. If only slides 1+2 completed in auth.setup, this handles slide 3.
   *
   * NOTE: Use getByRole('button', { name: 'Continue', exact: true }) for the Continue button
   * on slide 3. filter({ hasText: /^continue$/i }) does NOT match it due to Playwright regex
   * anchor behavior on button text.
   */
  async _dismissSsnModalIfPresent() {
    const consentModal = this.page.locator('[role="dialog"]')
    if (!(await consentModal.isVisible({ timeout: 3_000 }).catch(() => false))) return

    // Slide 1: SSN consent
    const ssnHeading = this.page.getByText('Social Security Number Collection Notice')
    if (await ssnHeading.isVisible({ timeout: 1_000 }).catch(() => false)) {
      const checkbox = consentModal.locator('input[type="checkbox"]')
      if (await checkbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await checkbox.check()
      }
      const consentBtn = consentModal.locator('button').filter({ hasText: /consent and continue/i })
      if (await consentBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await expect(consentBtn).toBeEnabled({ timeout: 5_000 })
        await consentBtn.click()
        await this.page.waitForTimeout(1_000)
      }
    }

    // Slide 2: Password setup
    const passwordInput = this.page.getByPlaceholder('Enter password (minimum 8 characters)')
    if (await passwordInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await passwordInput.fill('UserPass123')
      await this.page.getByPlaceholder('Confirm password').fill('UserPass123')
      const setPwBtn = consentModal.locator('button').filter({ hasText: /set password & continue/i })
      if (await setPwBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await expect(setPwBtn).toBeEnabled({ timeout: 5_000 })
        await setPwBtn.click()
        await this.page.waitForTimeout(1_000)
      }
    }

    // Slide 3: Signature — use "Type name instead" for automation.
    // NOTE: getByRole with exact:true is required. filter({ hasText: /^continue$/i }) does NOT
    // match "Continue" due to how Playwright handles regex anchors on button text.
    const addSigHeading = this.page.getByText('Add your signature')
    if (await addSigHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const typeNameRadio = this.page.locator('input[type="radio"][value="type"]')
      if (await typeNameRadio.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await typeNameRadio.check()
        await this.page.getByPlaceholder('Type your full legal name').fill('E2E User')
        await this.page.waitForTimeout(800) // allow renderTypedNameToDataUrl to resolve and Vue to re-render
      }
      const continueBtn = this.page.getByRole('button', { name: 'Continue', exact: true })
      if (await continueBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await expect(continueBtn).toBeEnabled({ timeout: 5_000 })
        await continueBtn.click()
        await consentModal.waitFor({ state: 'hidden', timeout: 10_000 })
      }
    }

    // Wait for the dashboard nav to render after modal closes
    await this.page.waitForSelector('nav h1', { timeout: 10_000 })
    await this.page.waitForTimeout(300)
  }

  /** Returns the onboarding status text (e.g. "3 of 7 steps completed") */
  async getOnboardingStatusText() {
    return this.onboardingStatus.first().textContent().catch(() => '')
  }

  /** Returns true if the Admin Dashboard link is visible */
  async isAdminLinkVisible() {
    return this.adminLink.isVisible({ timeout: 3_000 }).catch(() => false)
  }

  /** Returns count of completed step indicators */
  async getCompletedStepCount() {
    const completed = this.page.locator('[class*="completed"], [class*="done"], [class*="check"]')
    return completed.count()
  }

  async clickForms() {
    await this.formsLink.first().click()
    await this.page.waitForURL('/forms', { timeout: 10_000 })
  }

  async logout() {
    await this.logoutBtn.click()
    await this.page.waitForURL('/login', { timeout: 10_000 })
  }
}
