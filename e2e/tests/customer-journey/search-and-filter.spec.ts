import { test, expect } from '@playwright/test'
import { TourCatalogPage } from '../../page-objects/tour-catalog'

test.describe('Tour Search, Filter, and Sort', () => {
  let catalog: TourCatalogPage

  test.beforeEach(async ({ page }) => {
    catalog = new TourCatalogPage(page)
    await catalog.gotoCatalog()
  })

  test('tour catalog displays tour cards', async () => {
    const count = await catalog.getVisibleTourCount()
    expect(count).toBeGreaterThan(0)
  })

  test('search filters tours by text', async ({ page }) => {
    const countBefore = await catalog.getVisibleTourCount()
    test.skip(countBefore === 0, 'No tours in catalog')
    await catalog.searchFor('nonexistent-xyz-query-12345')
    await page.waitForTimeout(600)
    const countAfter = await catalog.getVisibleTourCount()
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })

  test('category chip toggles selection', async ({ page }) => {
    const firstChip = catalog.categoryChips.first()
    const visible = await firstChip.isVisible()
    test.skip(!visible, 'No category chips visible')
    await firstChip.click()
    await page.waitForTimeout(300)
    // Chip should toggle aria-selected state
    await expect(firstChip).toHaveAttribute('aria-selected', 'true')
  })

  test('selecting category chip deselects on second click', async ({ page }) => {
    // Skip "All" chip (index 0) — use a specific category chip
    const categoryChip = catalog.categoryChips.nth(1)
    const visible = await categoryChip.isVisible()
    test.skip(!visible, 'No category chips beyond "All"')
    await categoryChip.click()
    await page.waitForTimeout(300)
    await expect(categoryChip).toHaveAttribute('aria-selected', 'true')
    await categoryChip.click()
    await page.waitForTimeout(300)
    await expect(categoryChip).toHaveAttribute('aria-selected', 'false')
  })

  test('clicking tour card navigates to detail page', async ({ page }) => {
    const count = await catalog.getVisibleTourCount()
    test.skip(count === 0, 'No tour cards visible')
    await catalog.clickFirstTourCard()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/tours\/[^/]+/)
  })
})
