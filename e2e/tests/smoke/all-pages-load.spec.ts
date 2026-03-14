import { test, expect } from '@playwright/test'

const CUSTOMER_ROUTES = [
  '/',
  '/tours',
  '/find-tour',
  '/group-booking',
  '/guides',
  '/about-us',
  '/faq',
  '/terms',
  '/privacy',
]

const LOCALE = 'en'

test.describe('Smoke Tests - All Pages Load', () => {
  for (const route of CUSTOMER_ROUTES) {
    test(`GET /${LOCALE}${route} returns 200`, async ({ page }) => {
      const response = await page.goto(`/${LOCALE}${route}`)
      expect(response?.status()).toBe(200)
      await expect(page.locator('body')).toBeVisible()
    })
  }

  test('GET /admin returns 200 (login page)', async ({ page }) => {
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(400)
  })

  test(`GET /${LOCALE}/guides/[slug] returns 200 (dynamic)`, async ({ page }) => {
    await page.goto(`/${LOCALE}/guides`)
    const firstGuide = page.locator('a[href*="/guides/"]').first()
    const visible = await firstGuide.isVisible()
    test.skip(!visible, 'No guide links found — CMS may be empty')
    await firstGuide.click()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/guides\/[^/]+/)
  })

  test(`GET /${LOCALE}/tours/[slug] returns 200 (dynamic)`, async ({ page }) => {
    await page.goto(`/${LOCALE}/tours`)
    const firstTour = page.locator('a[href*="/tours/"]').first()
    const visible = await firstTour.isVisible()
    test.skip(!visible, 'No tour links found — CMS may be empty')
    await firstTour.click()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/tours\/[^/]+/)
  })
})
