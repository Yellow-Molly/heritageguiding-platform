import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class HomePage extends BasePage {
  readonly heroSection: Locator
  readonly heroCta: Locator
  readonly featuredToursSection: Locator
  readonly featuredTourCards: Locator
  readonly guidesPreviewSection: Locator
  readonly trustSignals: Locator
  readonly testimonialsSection: Locator
  readonly seasonalCtaSection: Locator
  readonly videoHighlightSection: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.heroSection = page.locator('section[aria-label="Hero section"]')
    this.heroCta = this.heroSection.locator('a[href*="/tours"]').first()
    this.featuredToursSection = page.locator('section[aria-label="Featured tours"]')
    this.featuredTourCards = this.featuredToursSection.locator('a[href*="/tours/"]')
    this.guidesPreviewSection = page.locator('section[aria-label="Meet our guides"]')
    this.trustSignals = page.locator('section[aria-label="Trust statistics"]')
    this.testimonialsSection = page.locator('section[aria-label="Customer testimonials"]')
    this.seasonalCtaSection = page.locator('section[aria-label="Seasonal tours"]')
    this.videoHighlightSection = page.locator('section[aria-label="Video highlight"]')
  }

  async gotoHomepage() {
    await this.goto('/')
    await this.waitForPageLoad()
  }

  async clickFirstFeaturedTour() {
    await this.featuredTourCards.first().click()
  }
}
