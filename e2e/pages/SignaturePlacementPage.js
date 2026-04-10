// @ts-check
/**
 * Page Object Model: Signature Placement Panel
 * Wraps the drag-and-drop PDF canvas UI inside /admin/setup and /settings.
 */
export class SignaturePlacementPage {
  constructor(page) {
    this.page = page
  }

  /**
   * Returns a locator for the signature placement panel.
   * The panel always contains an <aside> with the draggable signature element.
   */
  getSignaturePlacementPanel() {
    return this.page.locator('aside').filter({ has: this.page.locator('[draggable="true"]') }).first()
  }

  /**
   * Select a form type in the panel via the <select> dropdown.
   * Values: W4 | I9 | 8850 | 9061
   */
  async selectFormType(formType) {
    // The panel uses a <select> element (not tabs/buttons) to pick form type
    const sel = this.page.locator('select').filter({ has: this.page.locator(`option[value="${formType}"]`) }).first()
    await sel.selectOption(formType)
    await this.page.waitForTimeout(800) // allow PDF fetch to begin loading
  }

  /** Select a PDF page by index (0-based displayed as page number) */
  async selectPage(pageIndex) {
    const pageBtn = this.page.locator('button').filter({ hasText: new RegExp(`page\\s*${pageIndex + 1}`, 'i') })
    if (await pageBtn.count() > 0) await pageBtn.first().click()
  }

  /** Returns number of pages shown in the page-selector */
  async getNumPages() {
    const pageButtons = this.page.locator('button').filter({ hasText: /^page\s*\d+$/i })
    return pageButtons.count()
  }

  /** True once the canvas/pdf-viewer is present in DOM */
  async isPdfLoaded() {
    // Wait for "Loading PDF…" to disappear first, then check for canvas
    const loadingText = this.page.locator('text=Loading PDF').first()
    await loadingText.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {})
    const canvas = this.page.locator('canvas').first()
    return canvas.isVisible({ timeout: 15_000 }).catch(() => false)
  }

  /** Locator for the PDF render canvas */
  getCanvasLocator() {
    return this.page.locator('canvas').first()
  }

  /** Locator for the draggable signature handle in the sidebar */
  getDragHandle() {
    return this.page.locator('[draggable="true"]').first()
  }

  /**
   * Drag the signature field handle onto the canvas centre.
   * Uses Playwright dragTo() which fires HTML5 drag events.
   */
  async dragSignatureFieldToCanvas() {
    const handle = this.getDragHandle()
    const canvas = this.getCanvasLocator()

    await handle.waitFor({ state: 'visible', timeout: 20_000 })
    await canvas.waitFor({ state: 'visible', timeout: 20_000 })

    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) throw new Error('Canvas bounding box not available')

    const targetX = canvasBox.x + canvasBox.width * 0.4
    const targetY = canvasBox.y + canvasBox.height * 0.3

    await handle.dragTo(canvas, {
      targetPosition: { x: canvasBox.width * 0.4, y: canvasBox.height * 0.3 }
    })

    await this.page.waitForTimeout(300)
  }

  /** True if the placed-field overlay is visible on the canvas */
  async isOverlayVisible() {
    const overlay = this.page.locator('[class*="signature-field"], [class*="placement"], [style*="position: absolute"]')
      .filter({ hasText: /signature|sign/i })
    return overlay.isVisible({ timeout: 3_000 }).catch(() => false)
  }

  /** Click the Save button */
  async savePlacement() {
    const saveBtn = this.page.locator('button').filter({ hasText: /save/i })
    await saveBtn.click()
  }

  /** Wait for the success toast / confirmation */
  async waitForSaveSuccess() {
    const success = this.page.locator('.toast, [role="status"], [class*="success"]')
      .filter({ hasText: /saved|success/i })
    await success.waitFor({ state: 'visible', timeout: 10_000 })
  }

  /** Remove placement for the current page via the Remove button */
  async removePlacementForCurrentPage() {
    const removeBtn = this.page.locator('button').filter({ hasText: /remove|delete|clear/i })
    if (await removeBtn.isVisible()) await removeBtn.click()
  }

  /** True if a placement badge/indicator is visible for the current page */
  async hasPlacementOnPage() {
    const badge = this.page.locator('[class*="placed"], [class*="badge"], .has-placement')
    return badge.isVisible({ timeout: 2_000 }).catch(() => false)
  }

  async zoomIn() {
    // Zoom controls appear only after canvasReady=true (after renderPage() completes).
    // Wait up to 15s for the "+" button, then click it.
    const btn = this.page.locator('button[type="button"]').filter({ hasText: /^\+$/ })
    await btn.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})
    if (await btn.isVisible().catch(() => false)) await btn.click()
  }

  async zoomOut() {
    // Button text is "−" (minus sign, U+2212, appears after PDF loads)
    const btn = this.page.locator('button[type="button"]').filter({ hasText: /^[−\-]$/ })
    await btn.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})
    if (await btn.isVisible().catch(() => false)) await btn.first().click()
  }

  async fitPage() {
    const btn = this.page.locator('button[type="button"]').filter({ hasText: /fit page/i })
    await btn.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})
    if (await btn.isVisible().catch(() => false)) await btn.click()
  }
}
