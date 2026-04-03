import { test, expect } from '../../fixtures/test-fixtures'
import type { Result } from 'axe-core'

const PUBLIC_ROUTES = [
  { path: '/', name: 'Homepage' },
  { path: '/tours', name: 'Tours listing' },
  { path: '/guides', name: 'Guides listing' },
  { path: '/find-tour', name: 'Find Tour wizard' },
  { path: '/about-us', name: 'About page' },
  { path: '/contact', name: 'Contact page' },
  { path: '/faq', name: 'FAQ page' },
  { path: '/terms', name: 'Terms page' },
  { path: '/privacy', name: 'Privacy page' },
  { path: '/group-booking', name: 'Group booking' },
]

const LOCALE = 'en'

/** Filter violations to only critical and serious impact levels */
function filterBlockingViolations(violations: Result[]): Result[] {
  return violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )
}

/** Log violations summary for debugging */
function logViolations(routeName: string, violations: Result[]) {
  if (violations.length === 0) return
  console.log(
    `\n${routeName} violations:`,
    violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }))
  )
}

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) has no critical/serious WCAG violations`, async ({
      page,
      makeAxeBuilder,
    }) => {
      await page.goto(`/${LOCALE}${route.path}`)
      await page.waitForLoadState('domcontentloaded')
      // Wait for React hydration to complete (ensures lang attr is set)
      await page.waitForFunction(() => document.documentElement.lang !== '')

      const results = await makeAxeBuilder().analyze()
      const blocking = filterBlockingViolations(results.violations)

      logViolations(route.name, results.violations)

      expect(blocking).toEqual([])
    })
  }
})

test.describe('Dynamic Route Accessibility', () => {
  test('Tour detail page has no critical/serious WCAG violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto(`/${LOCALE}/tours`)
    const firstTour = page.locator('a[href*="/tours/"]').first()
    const visible = await firstTour.isVisible()
    test.skip(!visible, 'No tour links — CMS may be empty')
    await firstTour.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => document.documentElement.lang !== '')

    const results = await makeAxeBuilder().analyze()
    const blocking = filterBlockingViolations(results.violations)

    logViolations('Tour detail', results.violations)

    expect(blocking).toEqual([])
  })

  test('Guide detail page has no critical/serious WCAG violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto(`/${LOCALE}/guides`)
    const firstGuide = page.locator('a[href*="/guides/"]').first()
    const visible = await firstGuide.isVisible()
    test.skip(!visible, 'No guide links — CMS may be empty')
    await firstGuide.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => document.documentElement.lang !== '')

    const results = await makeAxeBuilder().analyze()
    const blocking = filterBlockingViolations(results.violations)

    logViolations('Guide detail', results.violations)

    expect(blocking).toEqual([])
  })
})

test.describe('404 Page Accessibility', () => {
  test('404 page has no critical/serious WCAG violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto(`/${LOCALE}/nonexistent-page-for-testing`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForFunction(() => document.documentElement.lang !== '', null, { timeout: 5000 }).catch(() => {})

    const results = await makeAxeBuilder().analyze()
    const blocking = filterBlockingViolations(results.violations)

    logViolations('404 page', results.violations)

    expect(blocking).toEqual([])
  })
})

test.describe('Find Tour Wizard Steps', () => {
  test('Wizard multi-step navigation has no critical/serious WCAG violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto(`/${LOCALE}/find-tour`)
    await page.waitForLoadState('domcontentloaded')

    // Step 1 — initial state
    const step1 = await makeAxeBuilder().analyze()
    const blocking1 = filterBlockingViolations(step1.violations)
    logViolations('Find Tour - Step 1', step1.violations)
    expect(blocking1).toEqual([])

    // Try advancing to step 2 by clicking an audience option
    const audienceOption = page.getByRole('button').filter({ hasText: /family|couples|solo/i }).first()
    if (await audienceOption.isVisible()) {
      await audienceOption.click()
      await page.waitForLoadState('domcontentloaded')

      const step2 = await makeAxeBuilder().analyze()
      const blocking2 = filterBlockingViolations(step2.violations)
      logViolations('Find Tour - Step 2', step2.violations)
      expect(blocking2).toEqual([])
    }
  })
})
