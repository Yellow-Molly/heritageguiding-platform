import { test, expect } from '@playwright/test'
import { HomePage } from '../../page-objects/homepage'
import { TourCatalogPage } from '../../page-objects/tour-catalog'

test.describe('Browse and Discover Tours', () => {
  test('homepage displays hero CTA and featured tours', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()

    await expect(home.heroCta).toBeVisible()
    await expect(home.featuredTourCards.first()).toBeVisible()
  })

  test('homepage featured tour card links to tour detail', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()

    await home.clickFirstFeaturedTour()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/tours\//)
  })

  test('hero CTA navigates to tour catalog', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()
    await home.heroCta.click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveURL(/\/tours/)
    const catalog = new TourCatalogPage(page)
    const count = await catalog.getVisibleTourCount()
    expect(count).toBeGreaterThan(0)
  })

  test('homepage sections are present', async ({ page }) => {
    const home = new HomePage(page)
    await home.gotoHomepage()

    await expect(home.heroSection).toBeVisible()
    await expect(home.featuredToursSection).toBeVisible()
    await expect(home.trustSignals).toBeVisible()
  })
})
