// @ts-check
/**
 * Page Object Model: Admin Setup Wizard (/admin/setup)
 */
export class AdminSetupPage {
  constructor(page) {
    this.page = page

    this.stepIndicator     = page.locator('[class*="step"], .step-indicator, ol li, [aria-current="step"]')
    this.continueBtn       = page.locator('button').filter({ hasText: /continue|next/i })
    this.backBtn           = page.locator('button').filter({ hasText: /back|previous/i })
    this.pdfTemplatesPanel = page.locator('[class*="template"], .template-panel, section').filter({ hasText: /pdf template/i })
    this.signaturePlacementHeading = page.locator('h1, h2, h3').filter({ hasText: /signature placement/i })
  }

  async goto() {
    await this.page.goto('/admin/setup')
    await this.page.waitForLoadState('domcontentloaded')
    await this.page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 })
  }

  /** Returns the text content of the current step indicator */
  async getSetupStep() {
    const active = this.page.locator('[aria-current="step"], .active-step, [class*="active"]').first()
    return active.textContent().catch(() => null)
  }

  async getPdfTemplatesPanel() {
    return this.pdfTemplatesPanel
  }

  /** Wait for the PDF-signature placement section to be visible */
  async continueToSignaturePlacement() {
    await this.continueBtn.click()
    await this.signaturePlacementHeading.waitFor({ state: 'visible', timeout: 15_000 })
  }

  async continueToNextStep() {
    await this.continueBtn.click()
    await this.page.waitForLoadState('networkidle')
  }

  async goBack() {
    await this.backBtn.click()
    await this.page.waitForLoadState('networkidle')
  }
}
