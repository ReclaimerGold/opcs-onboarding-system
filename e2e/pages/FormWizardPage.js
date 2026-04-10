// @ts-check
/**
 * Page Object Model: Form Wizard (/forms)
 * Covers all 7 onboarding steps.
 */
export class FormWizardPage {
  constructor(page) {
    this.page = page
    this.nextBtn  = page.locator('button').filter({ hasText: /next|continue|submit/i })
    this.backBtn  = page.locator('button').filter({ hasText: /back|previous/i })
    this.saveBtn  = page.locator('button').filter({ hasText: /save/i })
  }

  async goto() {
    await this.page.goto('/forms')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForWizardReady() {
    // Wait for the first visible form input or step heading
    await this.page.locator('form, [class*="step"], h2, h1').first()
      .waitFor({ state: 'visible', timeout: 15_000 })
  }

  /** Dismiss the SSN consent modal if visible */
  async handleSSNConsentModal() {
    const modal = this.page.locator('[data-testid="ssn-consent-modal"], .modal, [role="dialog"]')
      .filter({ hasText: /social security|SSN|consent/i })
    if (await modal.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const btn = modal.locator('button').filter({ hasText: /agree|accept|continue|ok/i })
      if (await btn.isVisible()) await btn.click()
      await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
    }
  }

  // ─── Step helpers ───────────────────────────────────────────────────────────

  async completeStep1W4() {
    // W-4: fill required fields with minimal valid data
    await this.page.locator('input[name*="first"], #firstName, input[placeholder*="first" i]').first().fill('E2E').catch(() => {})
    await this.page.locator('input[name*="last"], #lastName, input[placeholder*="last" i]').first().fill('User').catch(() => {})
    await this.page.locator('input[name*="address"], input[placeholder*="address" i]').first().fill('123 Test St').catch(() => {})
    await this.page.locator('input[name*="city"], input[placeholder*="city" i]').first().fill('Test City').catch(() => {})
    await this.page.locator('select[name*="state"], select[id*="state"]').first().selectOption('TX').catch(() => {})
    await this.page.locator('input[name*="zip"], input[placeholder*="zip" i]').first().fill('75001').catch(() => {})
    // Filing status radio
    await this.page.locator('input[type="radio"]').first().check().catch(() => {})
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStep2I9() {
    // I-9 Section 1: citizenship radio + SSN placeholder
    await this.page.locator('input[type="radio"]').first().check().catch(() => {})
    // Upload a document if upload field is present
    const fileInput = this.page.locator('input[type="file"]').first()
    if (await fileInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await fileInput.setInputFiles(`${process.cwd()}/e2e/fixtures/minimal.pdf`)
    }
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStep3Background() {
    // Background check: check all required checkboxes, fill any required text
    await this.page.locator('input[type="checkbox"]').first().check().catch(() => {})
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStep4DirectDeposit() {
    // Direct deposit: fill bank routing + account
    await this.page.locator('input[name*="routing"], input[placeholder*="routing" i]').first().fill('021000021').catch(() => {})
    await this.page.locator('input[name*="account"], input[placeholder*="account" i]').first().fill('123456789').catch(() => {})
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStep5Acknowledgements() {
    // Check all checkboxes
    const checkboxes = this.page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i++) await checkboxes.nth(i).check().catch(() => {})
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStep6_8850() {
    // Form 8850: fill required fields
    await this.page.locator('input[type="radio"]').first().check().catch(() => {})
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStep7_9061() {
    // ETA Form 9061: fill required fields
    await this.page.locator('input[type="radio"]').first().check().catch(() => {})
    await this.nextBtn.last().click()
    await this.page.waitForLoadState('networkidle')
  }

  /** Complete all 7 steps end-to-end */
  async completeAllSteps() {
    await this.goto()
    await this.waitForWizardReady()
    await this.handleSSNConsentModal()
    await this.completeStep1W4()
    await this.completeStep2I9()
    await this.completeStep3Background()
    await this.completeStep4DirectDeposit()
    await this.completeStep5Acknowledgements()
    await this.completeStep6_8850()
    await this.completeStep7_9061()
  }
}
