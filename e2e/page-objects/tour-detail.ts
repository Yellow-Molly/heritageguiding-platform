import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class TourDetailPage extends BasePage {
  readonly tourTitle: Locator
  readonly tourContent: Locator
  readonly guideLink: Locator
  readonly emailFallback: Locator
  readonly bokunWidget: Locator
  readonly breadcrumb: Locator
  readonly gallery: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.tourTitle = page.getByRole('heading', { level: 1 })
    // Main content area below the title
    this.tourContent = page.locator('main')
    this.guideLink = page.locator('a[href*="/guides/"]').first()
    this.emailFallback = page.locator('a[href^="mailto:"]').first()
    this.bokunWidget = page.locator('div[data-src*="bokun"]')
    this.breadcrumb = page.locator('nav[aria-label*="breadcrumb" i]')
    this.gallery = page.locator('button[aria-label*="image" i]').first()
  }

  async gotoTour(slug: string) {
    await this.goto(`/tours/${slug}`)
    await this.waitForPageLoad()
  }
}
