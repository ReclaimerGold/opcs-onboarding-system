// @ts-check
/**
 * Page Object Model: Approval Queue (/approvals)
 */
export class ApprovalQueuePage {
  constructor(page) {
    this.page = page

    // Stats cards — each card has a label div + a value div inside a container
    // Total card: .bg-white with a child text "Total" (not yellow/green/red)
    this.statTotal    = page.locator('.grid .bg-white').filter({ has: page.locator('.text-gray-500', { hasText: /^Total$/ }) }).locator('.text-2xl')
    this.statPending  = page.locator('.bg-yellow-50').locator('.text-2xl')
    this.statApproved = page.locator('.bg-green-50').locator('.text-2xl')
    this.statRejected = page.locator('.bg-red-50').locator('.text-2xl')

    // Filters
    this.statusFilter   = page.locator('select').filter({ hasText: /all|pending|approved|rejected/i }).first()
    this.formTypeFilter = page.locator('select').filter({ hasText: /all forms|w-4|i-9/i }).first()
    this.refreshBtn     = page.locator('button').filter({ hasText: /refresh/i })

    // Table rows
    this.tableRows = page.locator('tbody tr')
  }

  async goto() {
    await this.page.goto('/approvals')
    await this.page.waitForLoadState('domcontentloaded')
    await this.page.waitForTimeout(500)
  }

  /** Returns { total, pending, approved, rejected } from the stats cards */
  async getStats() {
    const parse = async (loc) => parseInt((await loc.textContent().catch(() => '0'))?.trim() ?? '0', 10)
    return {
      total:    await parse(this.statTotal),
      pending:  await parse(this.statPending),
      approved: await parse(this.statApproved),
      rejected: await parse(this.statRejected)
    }
  }

  async filterByStatus(status) {
    await this.statusFilter.selectOption(status)
    await this.page.waitForTimeout(500)
  }

  async filterByFormType(formType) {
    await this.formTypeFilter.selectOption(formType)
    await this.page.waitForTimeout(500)
  }

  /**
   * Click Approve on the first matching row.
   * @param {string} [applicantEmail] optional email to find the row
   */
  async approveItem(applicantEmail) {
    const row = applicantEmail
      ? this.tableRows.filter({ hasText: applicantEmail })
      : this.tableRows.first()
    const approveBtn = row.locator('button').filter({ hasText: /approve/i })
    await approveBtn.click()
    await this.page.waitForTimeout(500)
  }

  /**
   * Click Reject on the first matching row.
   * @param {string} [applicantEmail]
   */
  async rejectItem(applicantEmail) {
    const row = applicantEmail
      ? this.tableRows.filter({ hasText: applicantEmail })
      : this.tableRows.first()
    const rejectBtn = row.locator('button').filter({ hasText: /reject/i })
    await rejectBtn.click()
    await this.page.waitForTimeout(500)
  }

  async refreshQueue() {
    await this.refreshBtn.click()
    await this.page.waitForTimeout(500)
  }

  async getRowCount() {
    return this.tableRows.count()
  }
}
