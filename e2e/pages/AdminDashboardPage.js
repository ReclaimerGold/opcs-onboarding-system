// @ts-check
/**
 * Page Object Model: Admin Dashboard
 */
export class AdminDashboardPage {
  constructor(page) {
    this.page = page

    // Nav tabs — match actual button text in AdminDashboardView.vue
    this.tabs = {
      overview:         page.locator('nav button').filter({ hasText: /overview/i }).first(),
      activeOnboarding: page.locator('nav button').filter({ hasText: /active.onboarding/i }).first(),
      completed:        page.locator('nav button').filter({ hasText: /completed/i }).first(),
      users:            page.locator('nav button').filter({ hasText: /users/i }).first(),
      documents:        page.locator('nav button').filter({ hasText: /documents/i }).first(),
      activity:         page.locator('nav button').filter({ hasText: /activity/i }).first(),
      compliance:       page.locator('nav button').filter({ hasText: /compliance/i }).first()
    }

    // Activity sub-tabs (visible after clicking Activity tab)
    this.activitySubTabs = {
      logins: page.locator('button').filter({ hasText: /login attempts/i }).first(),
      audit:  page.locator('button').filter({ hasText: /audit logs/i }).first()
    }

    // Quick stats cards
    this.statTotalApplicants   = page.locator('p').filter({ hasText: /total applicants/i }).locator('..').locator('p.text-2xl, .text-2xl')
    this.statCompletedOnboard  = page.locator('p').filter({ hasText: /completed onboarding/i }).locator('..').locator('p.text-2xl, .text-2xl')

    // Logout
    this.logoutBtn = page.locator('button').filter({ hasText: /logout/i })
  }

  async goto() {
    await this.page.goto('/admin')
    await this.page.waitForLoadState('domcontentloaded')
    // Wait for the page heading to confirm the dashboard has rendered
    await this.page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 })
  }

  /** Returns { totalApplicants, completedOnboarding } from the quick-stats cards */
  async getQuickStats() {
    const totalText = await this.statTotalApplicants.first().textContent().catch(() => '0')
    const completedText = await this.statCompletedOnboard.first().textContent().catch(() => '0')
    return {
      totalApplicants: parseInt(totalText?.trim() ?? '0', 10),
      completedOnboarding: parseInt(completedText?.trim() ?? '0', 10)
    }
  }

  /** Click a named main tab. name must be a key of this.tabs */
  async navigateToTab(name) {
    const tab = this.tabs[name]
    if (!tab) throw new Error(`Unknown tab: ${name}`)
    await tab.click()
    // Wait for the tab content to settle — avoid networkidle which can hang on long-polling
    await this.page.waitForTimeout(500)
  }

  /** Navigate to Activity tab then click the Login Attempts sub-tab */
  async navigateToLoginAttempts() {
    await this.navigateToTab('activity')
    await this.activitySubTabs.logins.click()
    await this.page.waitForTimeout(500)
  }

  /** Navigate to Activity tab then click the Audit Logs sub-tab */
  async navigateToAuditLog() {
    await this.navigateToTab('activity')
    await this.activitySubTabs.audit.click()
    await this.page.waitForTimeout(500)
  }

  /** Navigate to Documents tab */
  async navigateToDocumentSubTab() {
    await this.navigateToTab('documents')
  }

  /** Navigate to Activity sub-tab (audit) */
  async navigateToActivitySubTab() {
    await this.navigateToAuditLog()
  }

  /**
   * Change a user's role in the Users tab.
   * @param {string} email - partial email to identify the row
   * @param {string} role - new role value
   */
  async changeUserRole(email, role) {
    const row = this.page.locator('tr').filter({ hasText: email })
    const roleSelect = row.locator('select')
    await roleSelect.selectOption(role)
    // Confirm dialog if present
    this.page.on('dialog', d => d.accept())
  }

  async logout() {
    await this.logoutBtn.click()
    await this.page.waitForURL('/login', { timeout: 10_000 })
  }
}
