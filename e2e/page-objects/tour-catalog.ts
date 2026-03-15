import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class TourCatalogPage extends BasePage {
  readonly searchInput: Locator
  readonly categoryChips: Locator
  readonly sortDropdown: Locator
  readonly tourCards: Locator
  readonly pagination: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.searchInput = page.locator('input[type="search"]').first()
    this.categoryChips = page.locator('button[role="option"]')
    this.sortDropdown = page.locator('select#sort-select')
    this.tourCards = page.locator('a[href*="/tours/"]')
    this.pagination = page.locator('nav[aria-label="Pagination"]')
  }

  async gotoCatalog() {
    await this.goto('/tours')
    await this.waitForPageLoad()
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query)
    // Wait for debounce (tour-search uses useDebounce)
    await this.page.waitForTimeout(500)
  }

  async clickCategoryChip(name: RegExp | string) {
    const chip = this.categoryChips.filter({ hasText: name })
    await chip.first().click()
  }

  async getVisibleTourCount(): Promise<number> {
    return this.tourCards.count()
  }

  async clickFirstTourCard() {
    await this.tourCards.first().click()
  }
}
