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

  test('tour detail page displays title', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    await expect(detail.tourTitle).toBeVisible()
    const title = await detail.tourTitle.textContent()
    expect(title?.length).toBeGreaterThan(0)
  })

  test('tour detail has main content area', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    await expect(detail.tourContent).toBeVisible()
  })

  test('Bokun booking widget is present when configured', async ({ page }) => {
    const detail = new TourDetailPage(page)
    await detail.gotoTour(tourSlug)

    const widgetCount = await detail.bokunWidget.count()
    test.skip(widgetCount === 0, 'No Bokun widget on this tour')
    const src = await detail.bokunWidget.getAttribute('data-src')
    expect(src).toContain('bokun')
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
