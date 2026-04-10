// @ts-check
/**
 * Page Object Model: Settings (/settings)
 */
export class SettingsPage {
  constructor(page) {
    this.page = page

    // Section nav buttons
    this.sections = {
      integrations: page.locator('button[type="button"]').filter({ hasText: /integrations/i }),
      emailForms:   page.locator('button[type="button"]').filter({ hasText: /email.*forms|email & forms/i }),
      signature:    page.locator('button[type="button"]').filter({ hasText: /signature/i })
    }

    // Save button — "Save All Settings" at the bottom of the page
    this.saveBtn = page.locator('button').filter({ hasText: /save all settings/i })

    // Employer info fields (Email & Forms section)
    this.repNameInput = page.locator('input[name*="rep"], input[id*="rep"], input[placeholder*="representative" i]').first()
    this.einInput     = page.locator('input[name*="ein"], input[id*="ein"]').first()
    this.addressInput = page.locator('input[name*="address"]').first()
    this.cityInput    = page.locator('input[name*="city"]').first()
    this.stateInput   = page.locator('input[name*="state"], select[name*="state"]').first()
    this.zipInput     = page.locator('input[name*="zip"]').first()
    this.phoneInput   = page.locator('input[name*="phone"]').first()

    // Integration status indicators
    this.googleDriveStatus = page.locator('[class*="google"], [class*="drive"]')
      .filter({ hasText: /google drive/i })
    this.mailgunStatus = page.locator('[class*="mailgun"], [class*="email"]')
      .filter({ hasText: /mailgun/i })
  }

  async goto() {
    await this.page.goto('/settings')
    await this.page.waitForLoadState('domcontentloaded')
    await this.page.waitForTimeout(300)
  }

  /** Navigate to a settings section: 'integrations' | 'emailForms' | 'signature' */
  async navigateToSection(sectionKey) {
    if (sectionKey === 'signature') {
      // Signature placement is under System > PDF Templates
      await this.page.locator('[aria-label="Settings sections"] button').filter({ hasText: /system/i }).click()
      await this.page.waitForTimeout(300)
      await this.page.locator('button[type="button"]').filter({ hasText: /PDF Templates/i }).click()
      await this.page.waitForTimeout(500)
      return
    }
    const btn = this.sections[sectionKey]
    if (!btn) throw new Error(`Unknown section: ${sectionKey}`)
    await btn.click()
    await this.page.waitForTimeout(300)
  }

  /** Fill and save employer settings in the Email & Forms section */
  async saveEmployerSettings({
    companyName = 'Optimal Prime Cleaning Services',
    repName = 'E2E Test Representative',
    repTitle = 'Owner',
    contactName = 'Jason King',
    ein = '12-3456789',
    address = '123 Test Street',
    handbookUrl = 'https://example.com/handbook.pdf',
    handbookLabel = 'Open Employee Handbook',
    defaultStartingWage = '18.00/hour',
    badgePhotoEmail = 'hr@optimalprimeservices.com',
    city = 'Test City',
    state = 'TX',
    zip = '75001',
    phone = '555-123-4567'
  } = {}) {
    await this.navigateToSection('emailForms')
    // Fill fields by placeholder since these inputs lack name/id attributes
    await this.page.locator('input[placeholder="e.g. Optimal Prime Cleaning Services"]').fill(companyName).catch(() => {})
    await this.page.locator('input[placeholder="e.g. Jason"]').fill(repName).catch(() => {})
    await this.page.locator('input[placeholder="e.g. Owner or Authorized Representative"]').fill(repTitle).catch(() => {})
    await this.page.locator('input[placeholder="e.g. Jason King"]').fill(contactName).catch(() => {})
    await this.page.locator('input[placeholder="XX-XXXXXXX"]').fill(ein).catch(() => {})
    await this.page.locator('input[placeholder="Street address"]').fill(address).catch(() => {})
    await this.page.locator('input[placeholder="Open Employee Handbook"]').fill(handbookLabel).catch(() => {})
    await this.page.locator('input[placeholder="e.g. 18.00/hour"]').fill(defaultStartingWage).catch(() => {})
    await this.page.locator('input[placeholder="e.g. hr@optimalprimeservices.com"]').fill(badgePhotoEmail).catch(() => {})
    await this.page.locator('input[type="url"][placeholder="https://..."]').nth(1).fill(handbookUrl).catch(() => {})
    await this.page.locator('input[placeholder="SD"]').fill(state).catch(() => {})
    await this.page.locator('input[placeholder="57104"]').fill(zip).catch(() => {})
    // Use page.getByRole for the save button — more reliable than filter
    const saveBtn = this.page.getByRole('button', { name: 'Save All Settings', exact: true })
    await saveBtn.scrollIntoViewIfNeeded()
    await saveBtn.click()
    await this.page.waitForTimeout(1000)
  }

  /** Returns the signature placement panel locator */
  getSignaturePlacementPanel() {
    return this.page.locator('aside').filter({ has: this.page.locator('[draggable="true"]') }).first()
  }

  async isGoogleDriveConnected() {
    const connected = this.googleDriveStatus.filter({ hasText: /connected/i })
    return connected.isVisible({ timeout: 3_000 }).catch(() => false)
  }

  async isMailgunConnected() {
    const connected = this.mailgunStatus.filter({ hasText: /connected/i })
    return connected.isVisible({ timeout: 3_000 }).catch(() => false)
  }
}
