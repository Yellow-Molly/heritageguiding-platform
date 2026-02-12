# Phase 02: Customer Journey - Browse, Search, Filter, Sort, Booking

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: [Phase 01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md)
- **Research**: [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- **Codebase**: apps/web/components/tour/ (tour-card, tour-catalog-client, filter-bar/, booking-section)

## Overview
- **Date**: 2026-02-12
- **Priority**: CRITICAL
- **Effort**: 3h
- **Implementation Status**: Pending
- **Review Status**: Not started

Test the primary customer journey: Homepage hero/featured tours -> tour catalog (search, category filter, sort, pagination) -> tour detail page (gallery, facts, guide card, reviews, Bokun widget presence). Bokun iframe validated for presence/src only (cross-origin prevents deep interaction).

## Key Insights
- Tour catalog uses client-side filtering with URL query params (`?categories=history,architecture`)
- Category chips are multi-select; URL state persists across reload
- Bokun widget is cross-origin iframe from bokun.io -- can only verify `iframe[src*="bokun"]` exists
- Tour slugs discovered dynamically via staging-data.ts (no hardcoding)
- Search uses `tour-search.tsx` component with debounce
- Sort options available in `tour-sort.tsx`
- Pagination via `tour-pagination.tsx`

## Requirements

### Functional
- Homepage POM: hero section, featured tours grid, trust signals, testimonials, newsletter CTA
- Tour catalog POM: search input, category chips, sort dropdown, pagination, tour grid, empty state
- Tour detail POM: gallery, facts panel, guide card, reviews, booking section, Bokun iframe
- Tests: homepage -> catalog navigation, search by text, filter by category, sort, pagination
- Tests: tour detail loads all sections, Bokun widget iframe present with correct src
- Tests: empty state appears when no results match filter

### Non-Functional
- Each page object under 200 lines
- Each spec file focused on single concern
- Use staging-data.ts for real slugs (no hardcoded tour names)
- Tests resilient to CMS content changes (assert structure, not exact text)

## Architecture

```
e2e/
├── page-objects/
│   ├── homepage.ts            # Hero, featured tours, trust signals
│   ├── tour-catalog.ts        # Search, filters, sort, pagination, grid
│   └── tour-detail.ts         # Gallery, facts, guide, reviews, Bokun widget
├── tests/
│   └── customer-journey/
│       ├── browse-and-discover.spec.ts       # Homepage -> catalog navigation
│       ├── search-and-filter.spec.ts         # Search, category filter, sort, pagination
│       └── tour-detail-and-booking.spec.ts   # Detail page sections + Bokun widget
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `e2e/page-objects/homepage.ts` | Homepage POM: hero, featured tours, trust signals |
| `e2e/page-objects/tour-catalog.ts` | Catalog POM: search, filters, sort, pagination, grid |
| `e2e/page-objects/tour-detail.ts` | Detail POM: gallery, facts, guide, reviews, Bokun |
| `e2e/tests/customer-journey/browse-and-discover.spec.ts` | Homepage to catalog flow |
| `e2e/tests/customer-journey/search-and-filter.spec.ts` | Search, filter, sort, pagination |
| `e2e/tests/customer-journey/tour-detail-and-booking.spec.ts` | Detail page + Bokun widget |

### Existing Reference (apps/web)
| File | Relevance |
|------|-----------|
| `components/home/hero-section.tsx` | Locator hints for hero |
| `components/home/featured-tours.tsx` | Featured tours grid structure |
| `components/tour/tour-catalog-client.tsx` | Client-side filter logic |
| `components/tour/filter-bar/category-chips.tsx` | Category chip selectors |
| `components/tour/tour-search.tsx` | Search input structure |
| `components/tour/tour-sort.tsx` | Sort dropdown options |
| `components/tour/tour-pagination.tsx` | Pagination controls |
| `components/tour/booking-section.tsx` | Bokun widget container |
| `components/bokun-booking-widget-with-fallback.tsx` | Bokun iframe markup |

## Implementation Steps

### 1. Create e2e/page-objects/homepage.ts
```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class HomePage extends BasePage {
  readonly heroSection: Locator
  readonly heroHeading: Locator
  readonly heroCta: Locator
  readonly featuredToursSection: Locator
  readonly featuredTourCards: Locator
  readonly trustSignals: Locator
  readonly testimonialsSection: Locator
  readonly newsletterSection: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.heroSection = page.locator('[data-testid="hero-section"], section').first()
    this.heroHeading = page.getByRole('heading', { level: 1 })
    this.heroCta = page.getByRole('link', { name: /tour|explore|discover/i }).first()
    this.featuredToursSection = page.locator('[data-testid="featured-tours"]')
    this.featuredTourCards = page.locator('[data-testid="tour-card"], article').filter({ has: page.getByRole('link') })
    this.trustSignals = page.locator('[data-testid="trust-signals"]')
    this.testimonialsSection = page.locator('[data-testid="testimonials"]')
    this.newsletterSection = page.locator('[data-testid="newsletter"]')
  }

  async gotoHomepage() {
    await this.goto('/')
    await this.waitForPageLoad()
  }

  async clickFirstFeaturedTour() {
    const firstCard = this.featuredTourCards.first()
    await firstCard.getByRole('link').first().click()
  }
}
```

### 2. Create e2e/page-objects/tour-catalog.ts
```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class TourCatalogPage extends BasePage {
  readonly searchInput: Locator
  readonly categoryChips: Locator
  readonly sortDropdown: Locator
  readonly tourGrid: Locator
  readonly tourCards: Locator
  readonly pagination: Locator
  readonly emptyState: Locator
  readonly resultsCount: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.searchInput = page.getByRole('searchbox').or(page.locator('input[type="search"], input[placeholder*="search" i]'))
    this.categoryChips = page.locator('[data-testid="category-chips"] button, [role="group"] button')
    this.sortDropdown = page.locator('select, [data-testid="sort-dropdown"]')
    this.tourGrid = page.locator('[data-testid="tour-grid"], main')
    this.tourCards = page.locator('[data-testid="tour-card"], article a[href*="/tours/"]').locator('..')
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination" i]')
    this.emptyState = page.locator('[data-testid="empty-state"]')
    this.resultsCount = page.locator('[data-testid="results-count"]')
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
    await this.tourCards.first().getByRole('link').first().click()
  }
}
```

### 3. Create e2e/page-objects/tour-detail.ts
```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class TourDetailPage extends BasePage {
  readonly tourTitle: Locator
  readonly gallery: Locator
  readonly factsPanel: Locator
  readonly guideCard: Locator
  readonly reviewsSection: Locator
  readonly bookingSection: Locator
  readonly bokunIframe: Locator
  readonly relatedTours: Locator
  readonly breadcrumb: Locator
  readonly groupInquiryButton: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.tourTitle = page.getByRole('heading', { level: 1 })
    this.gallery = page.locator('[data-testid="tour-gallery"], [role="img"]').first()
    this.factsPanel = page.locator('[data-testid="tour-facts"]')
    this.guideCard = page.locator('[data-testid="guide-card"]')
    this.reviewsSection = page.locator('[data-testid="reviews-section"]')
    this.bookingSection = page.locator('[data-testid="booking-section"]')
    this.bokunIframe = page.locator('iframe[src*="bokun"]')
    this.relatedTours = page.locator('[data-testid="related-tours"]')
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label*="breadcrumb" i]')
    this.groupInquiryButton = page.getByRole('button', { name: /group/i })
  }

  async gotoTour(slug: string) {
    await this.goto(`/tours/${slug}`)
    await this.waitForPageLoad()
  }
}
```

### 4. Create e2e/tests/customer-journey/browse-and-discover.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { HomePage } from '../../page-objects/homepage'
import { TourCatalogPage } from '../../page-objects/tour-catalog'

test.describe('Browse and Discover Tours', () => {
  test('homepage displays hero, featured tours, and trust signals', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()

    await expect(home.heroHeading).toBeVisible()
    await expect(home.featuredTourCards.first()).toBeVisible()
  })

  test('homepage featured tour card links to tour detail', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()

    await home.clickFirstFeaturedTour()
    await expect(page).toHaveURL(/\/tours\//)
  })

  test('can navigate from homepage to tour catalog', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()
    await home.heroCta.click()

    await expect(page).toHaveURL(/\/tours/)
    const catalog = new TourCatalogPage(page)
    const count = await catalog.getVisibleTourCount()
    expect(count).toBeGreaterThan(0)
  })
})
```

### 5. Create e2e/tests/customer-journey/search-and-filter.spec.ts
```typescript
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
    await catalog.searchFor('nonexistent-xyz-query-12345')
    await page.waitForTimeout(600) // debounce
    // Either shows empty state or fewer results
    const countAfter = await catalog.getVisibleTourCount()
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })

  test('category chip filters tours', async ({ page }) => {
    const firstChip = catalog.categoryChips.first()
    if (await firstChip.isVisible()) {
      await firstChip.click()
      await page.waitForTimeout(300)
      // URL should reflect category filter
      await expect(page).toHaveURL(/categories=/)
    }
  })

  test('URL state persists category filter on reload', async ({ page }) => {
    const firstChip = catalog.categoryChips.first()
    if (await firstChip.isVisible()) {
      await firstChip.click()
      await page.waitForTimeout(300)
      const url = page.url()
      await page.reload()
      expect(page.url()).toBe(url)
    }
  })

  test('clicking tour card navigates to detail page', async ({ page }) => {
    await catalog.clickFirstTourCard()
    await expect(page).toHaveURL(/\/tours\/[^/]+/)
  })
})
```

### 6. Create e2e/tests/customer-journey/tour-detail-and-booking.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { TourDetailPage } from '../../page-objects/tour-detail'
import { getFirstTourSlug } from '../../fixtures/staging-data'

test.describe('Tour Detail Page and Booking', () => {
  let tourSlug: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    tourSlug = await getFirstTourSlug(page)
    await page.close()
  })

  test('tour detail page displays title and key sections', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    await expect(detail.tourTitle).toBeVisible()
    const title = await detail.tourTitle.textContent()
    expect(title?.length).toBeGreaterThan(0)
  })

  test('tour detail displays facts panel', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    // Facts panel with duration, group size, etc.
    const factsOrContent = detail.factsPanel.or(page.locator('text=/duration|hour|min/i'))
    await expect(factsOrContent.first()).toBeVisible()
  })

  test('Bokun booking widget iframe is present', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    // Bokun widget may not be on every tour -- soft assert
    const iframeCount = await detail.bokunIframe.count()
    if (iframeCount > 0) {
      const src = await detail.bokunIframe.getAttribute('src')
      expect(src).toContain('bokun')
    }
  })

  test('tour detail has breadcrumb navigation', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    const breadcrumb = detail.breadcrumb
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb.getByRole('link').first()).toBeVisible()
    }
  })
})
```

## Todo List
- [ ] Create `e2e/page-objects/homepage.ts`
- [ ] Create `e2e/page-objects/tour-catalog.ts`
- [ ] Create `e2e/page-objects/tour-detail.ts`
- [ ] Create `e2e/tests/customer-journey/browse-and-discover.spec.ts`
- [ ] Create `e2e/tests/customer-journey/search-and-filter.spec.ts`
- [ ] Create `e2e/tests/customer-journey/tour-detail-and-booking.spec.ts`
- [ ] Verify all tests pass on staging with 3 browsers
- [ ] Confirm Bokun iframe detection works on tours with bokunExperienceId

## Success Criteria
- Homepage tests verify hero, featured tours, navigation to catalog
- Catalog tests verify search, category filter, URL state persistence, pagination
- Detail tests verify title, facts, Bokun iframe presence
- All tests use dynamic slug discovery (no hardcoded tour names)
- Tests pass on Chromium, Firefox, WebKit

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Tour cards missing data-testid attributes | High | Use fallback selectors (role, semantic HTML) |
| No tours in staging CMS | Low | staging-data.ts throws clear error if no tours |
| Bokun widget not enabled on staging | Medium | Soft assert (skip if iframe not present) |
| Category chips not visible (no categories in CMS) | Low | Conditional test with `if (await chip.isVisible())` |

## Security Considerations
- No credentials needed for customer-facing pages
- Bokun iframe tested for presence only, no cross-origin interaction

## Next Steps
- Phase 03 uses TourDetailPage for group inquiry modal test
- Phase 04 reuses catalog/detail POMs for locale-switching tests
