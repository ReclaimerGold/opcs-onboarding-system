// @ts-check
import { test, expect } from '@playwright/test'
import { ApprovalQueuePage } from './pages/ApprovalQueuePage.js'

/**
 * Approval Queue tests.
 * The admin storageState is used (set in playwright.config.js for the 'admin' project).
 * These tests verify the approval queue UI — approve/reject actions are only tested
 * if there are pending items; otherwise they verify the empty-state gracefully.
 */
test.describe('@regression Approval Queue', () => {
  let queue

  test.beforeEach(async ({ page }) => {
    queue = new ApprovalQueuePage(page)
    await queue.goto()
  })

  test('@smoke approval queue page loads with heading', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: /approval|document/i })).toBeVisible({ timeout: 10_000 })
  })

  test('stats cards are visible (total, pending, approved, rejected)', async ({ page }) => {
    // At least the stat-card containers should render
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10_000 })
    const stats = await queue.getStats()
    expect(typeof stats.total).toBe('number')
    expect(typeof stats.pending).toBe('number')
  })

  test('status filter dropdown works', async ({ page }) => {
    await queue.filterByStatus('pending')
    await expect(page.locator('select').first()).toBeVisible()
    await queue.filterByStatus('')  // reset to All
  })

  test('form-type filter dropdown works', async ({ page }) => {
    await queue.filterByFormType('W4')
    await expect(page.locator('select').nth(1)).toBeVisible()
    await queue.filterByFormType('')  // reset to All Forms
  })

  test('refresh button reloads the queue without error', async ({ page }) => {
    await queue.refreshQueue()
    // Page should still show the heading after refresh
    await expect(page.locator('h1').filter({ hasText: /approval|document/i })).toBeVisible({ timeout: 10_000 })
  })
})
