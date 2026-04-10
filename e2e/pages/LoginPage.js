// @ts-check
/**
 * Page Object Model: Login page
 * Handles both the single-phase (regular user) and two-phase (admin) login flows.
 */
export class LoginPage {
  constructor(page) {
    this.page = page
    this.firstNameInput = page.locator('#firstName')
    this.lastNameInput = page.locator('#lastName')
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitBtn = page.locator('button[type="submit"]')
    this.errorMsg = page.locator('.text-red-600, .text-red-700, [role="alert"]')
  }

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')
  }

  async fillNameAndEmail(firstName, lastName, email) {
    await this.firstNameInput.fill(firstName)
    await this.lastNameInput.fill(lastName)
    await this.emailInput.fill(email)
  }

  async clickContinue() {
    await this.submitBtn.click()
  }

  async fillPassword(password) {
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10_000 })
    await this.passwordInput.fill(password)
  }

  /** Full admin login: two phases */
  async loginAsAdmin(firstName = 'E2E', lastName = 'Admin', email = 'e2e-admin@example.com', password = 'AdminPass123') {
    await this.goto()
    await this.fillNameAndEmail(firstName, lastName, email)
    await this.clickContinue()
    await this.fillPassword(password)
    await this.clickContinue()
    await this.page.waitForURL(/\/(admin|password-setup)/, { timeout: 15_000 })
  }

  /** Regular user login: single phase */
  async loginAsUser(firstName = 'E2E', lastName = 'User', email = 'e2e-user@example.com') {
    await this.goto()
    await this.fillNameAndEmail(firstName, lastName, email)
    await this.clickContinue()
    await this.page.waitForURL(/\/(dashboard|forms)/, { timeout: 15_000 })
  }

  /** Sign up a new user (creates account) */
  async signupNewUser(firstName, lastName, email) {
    await this.goto()
    await this.fillNameAndEmail(firstName, lastName, email)
    await this.clickContinue()
  }

  async getErrorText() {
    return this.errorMsg.first().textContent()
  }

  /** Returns true once the password field is visible (phase 2 activated) */
  async isPasswordPhase() {
    return this.passwordInput.isVisible()
  }
}
