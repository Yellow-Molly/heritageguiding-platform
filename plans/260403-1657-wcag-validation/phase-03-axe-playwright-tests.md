# Phase 3: Axe Playwright Accessibility Tests

**Priority:** High
**Status:** completed
**Effort:** Medium (~2-3 hrs)
**Depends on:** Phase 2

## Overview
Write axe-core Playwright tests for all 13 public routes. Activate existing fixture in `e2e/fixtures/test-fixtures.ts`.

## Key Context
- **Fixture exists:** `e2e/fixtures/test-fixtures.ts` — exports `test` with `makeAxeBuilder` (WCAG 2.1 AA tags, excludes Bokun iframes)
- **Smoke test pattern:** `e2e/tests/smoke/all-pages-load.spec.ts` — has route list, good base pattern
- **Base URL:** `http://localhost:3000` (configurable via `STAGING_URL`)

## Implementation Steps

### 1. Create a11y test file
Create `e2e/tests/accessibility/wcag-audit.spec.ts`:

```ts
import { test, expect } from '../../fixtures/test-fixtures'

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

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) has no WCAG violations`, async ({
      page,
      makeAxeBuilder,
    }) => {
      await page.goto(`/${LOCALE}${route.path}`)
      await page.waitForLoadState('networkidle')

      const results = await makeAxeBuilder().analyze()

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(
          `\n${route.name} violations:`,
          results.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          }))
        )
      }

      expect(results.violations).toEqual([])
    })
  }
})
```

### 2. Dynamic route tests
Add tests for slug-based routes (tour detail, guide detail) — navigate via listing pages:

```ts
test.describe('Dynamic Route Accessibility', () => {
  test('Tour detail page has no WCAG violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto(`/${LOCALE}/tours`)
    const firstTour = page.locator('a[href*="/tours/"]').first()
    const visible = await firstTour.isVisible()
    test.skip(!visible, 'No tour links — CMS may be empty')
    await firstTour.click()
    await page.waitForLoadState('networkidle')

    const results = await makeAxeBuilder().analyze()
    expect(results.violations).toEqual([])
  })

  test('Guide detail page has no WCAG violations', async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto(`/${LOCALE}/guides`)
    const firstGuide = page.locator('a[href*="/guides/"]').first()
    const visible = await firstGuide.isVisible()
    test.skip(!visible, 'No guide links — CMS may be empty')
    await firstGuide.click()
    await page.waitForLoadState('networkidle')

    const results = await makeAxeBuilder().analyze()
    expect(results.violations).toEqual([])
  })
})
```

### 3. 404 page test
```ts
test('404 page has no WCAG violations', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto(`/${LOCALE}/nonexistent-page-for-testing`)
  await page.waitForLoadState('networkidle')

  const results = await makeAxeBuilder().analyze()
  expect(results.violations).toEqual([])
})
```

### 4. Find-tour wizard state tests
The wizard has multiple steps — scan after each state change:
```ts
test('Find Tour wizard steps have no WCAG violations', async ({
  page,
  makeAxeBuilder,
}) => {
  await page.goto(`/${LOCALE}/find-tour`)
  await page.waitForLoadState('networkidle')

  // Step 1 - initial state
  const step1 = await makeAxeBuilder().analyze()
  expect(step1.violations).toEqual([])

  // Interact with wizard to advance steps if possible
  // (adjust selectors based on actual wizard UI)
  const nextButton = page.getByRole('button', { name: /next|continue/i })
  if (await nextButton.isVisible()) {
    await nextButton.click()
    await page.waitForLoadState('networkidle')
    const step2 = await makeAxeBuilder().analyze()
    expect(step2.violations).toEqual([])
  }
})
```

## Files to Create
- `e2e/tests/accessibility/wcag-audit.spec.ts`

## Files to Read (context)
- `e2e/fixtures/test-fixtures.ts` — existing axe fixture
- `e2e/tests/smoke/all-pages-load.spec.ts` — route patterns

## Success Criteria
- [x] All 13 routes covered by axe tests (14 tests total)
- [x] Tests use existing `makeAxeBuilder` fixture (with BubblaV exclusion added)
- [x] Tests run successfully locally
- [x] Dynamic routes handled gracefully with skip on empty CMS
- [x] Wizard multi-step scanning implemented

## Risks
- CMS-dependent routes may skip if no data — acceptable for CI, but log warnings
- `networkidle` can be flaky — may need `domcontentloaded` + explicit waits
- Wizard step selectors may need adjustment based on actual UI
