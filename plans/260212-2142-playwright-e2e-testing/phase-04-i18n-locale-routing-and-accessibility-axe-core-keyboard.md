# Phase 04: i18n Locale Routing + Accessibility (axe-core, Keyboard)

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: [Phase 01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md), [Phase 02](./phase-02-customer-journey-browse-search-filter-booking.md)
- **Research**: [i18n, Bokun, SEO, localStorage](./research/researcher-02-i18n-bokun-seo-testing.md)
- **Codebase**: `apps/web/messages/` (sv.json, en.json, de.json), `apps/web/i18n/`, `apps/web/components/layout/footer-language-selector.tsx`, `apps/web/proxy.ts`

## Overview
- **Date**: 2026-02-12 (rewritten 2026-05-19)
- **Priority**: HIGH
- **Effort**: 2h (axe-core audit already shipped — see `e2e/tests/accessibility/wcag-audit.spec.ts`)
- **Implementation Status**: **Partial** — WCAG 2.1 AA audit complete; i18n routing + keyboard-nav specs pending
- **Review Status**: axe-core audit reviewed in code; remaining items not started

Test i18n locale routing for all 3 locales (sv/en/de), language switcher navigation, cookie persistence, content localization. **Accessibility coverage already exists** (`wcag-audit.spec.ts` covers 10 public routes + tour/guide detail + 404 + wizard steps) — extend to cover new routes (`/contact` already in spec, `/imprint`, `/cancellation`, coming-soon if applicable) and add keyboard navigation specs for wizard / modal / filter chips.

## Key Insights
- next-intl uses `[locale]` dynamic segment with `sv` / `en` / `de`
- Default locale on staging: `en` for simpler assertions
- Locale middleware lives in `apps/web/proxy.ts` (renamed from `middleware.ts` in Next.js 16)
- Language switcher in `components/layout/footer-language-selector.tsx`
- next-intl uses cookie `NEXT_LOCALE` set automatically by proxy
- Hreflang alternates rendered in `<head>` for all pages via `lib/seo.ts`
- Bokun iframe + `#bubblav-iframe` already excluded from axe scans in `test-fixtures.ts`
- **Existing `wcag-audit.spec.ts` covers:** `/`, `/tours`, `/guides`, `/find-tour`, `/about-us`, `/contact`, `/faq`, `/terms`, `/privacy`, `/group-booking`, tour detail, guide detail, 404, wizard steps
- **Missing from axe audit (added since 2026-03-14):** `/imprint`, `/cancellation`
- Custom 404 page exists at `app/(site)/[locale]/not-found.tsx` + `[...rest]/page.tsx`
- Filter chips on tour listing: client-side state via `useFilterState` provider; keyboard nav untested

## Requirements

### Functional
- Locale routing: `/sv/...`, `/en/...`, `/de/...` all load 200 for homepage + tours
- Language switcher: clicking switches locale and URL prefix
- Cookie persistence: `NEXT_LOCALE` set after switch and stable across navigation
- Content localization: tour catalog h1 differs across at least 2 of 3 locales (homepage h1 removed)
- Hreflang: every public page has `<link rel="alternate" hreflang="sv|en|de|x-default">`
- **Extend axe audit** to `/imprint` and `/cancellation`
- Keyboard navigation: Tab → first option card → Enter selects; Space toggles; Escape closes group inquiry modal
- Filter chip keyboard nav: focus chip → Enter → URL updates with filter

### Non-Functional
- Each new spec under 200 lines
- Parameterized locale tests use array `['sv', 'en', 'de']`
- axe-core scans already exclude third-party widgets in `test-fixtures.ts`
- Reuse existing `makeAxeBuilder` fixture — do not duplicate

## Architecture

```
e2e/tests/
├── accessibility/
│   ├── wcag-audit.spec.ts            # EXISTS — extend with /imprint, /cancellation
│   └── keyboard-navigation.spec.ts   # NEW — wizard, modal, filter chips
└── i18n/
    ├── locale-routing.spec.ts        # NEW — routes + switcher + cookie
    └── content-localization.spec.ts  # NEW — translated content + hreflang
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `e2e/tests/i18n/locale-routing.spec.ts` | Locale routing + language switcher + cookie |
| `e2e/tests/i18n/content-localization.spec.ts` | Translated content + hreflang |
| `e2e/tests/accessibility/keyboard-navigation.spec.ts` | Keyboard for wizard / modal / filter chips |

### To Update
| File | Change |
|------|--------|
| `e2e/tests/accessibility/wcag-audit.spec.ts` | Add `/imprint`, `/cancellation` to `PUBLIC_ROUTES` |

### Existing Reference (apps/web)
| File | Relevance |
|------|-----------|
| `messages/sv.json` `messages/en.json` `messages/de.json` | Translation source of truth |
| `i18n.ts` `i18n/routing.ts` | Locale config |
| `proxy.ts` | next-intl middleware (renamed in Next 16) |
| `components/layout/footer-language-selector.tsx` | Language switcher UI |
| `components/wizard/wizard-option-card.tsx` | `aria-pressed` attribute |
| `components/booking/group-inquiry-modal.tsx` | Dialog close on Escape |
| `app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` | Sidebar filter chips |

## Implementation Steps

### 1. Update `e2e/tests/accessibility/wcag-audit.spec.ts`

Append to `PUBLIC_ROUTES`:

```typescript
{ path: '/imprint', name: 'Imprint (TMG §5)' },
{ path: '/cancellation', name: 'Cancellation policy' },
```

No other changes required — existing fixture handles iframe exclusions.

### 2. Create `e2e/tests/i18n/locale-routing.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

const LOCALES = ['sv', 'en', 'de'] as const

test.describe('i18n - Locale Routing', () => {
  for (const locale of LOCALES) {
    test(`/${locale}/ loads 200`, async ({ page }) => {
      const response = await page.goto(`/${locale}/`)
      expect(response?.status()).toBe(200)
    })
    test(`/${locale}/tours loads 200`, async ({ page }) => {
      const response = await page.goto(`/${locale}/tours`)
      expect(response?.status()).toBe(200)
    })
  }

  test('language switcher changes URL prefix', async ({ page }) => {
    await page.goto('/en/tours')
    // Footer language selector renders <button>/<a> per locale
    const sv = page.getByRole('link', { name: /svenska|swedish/i })
      .or(page.getByRole('button', { name: /svenska|swedish/i }))
    if (await sv.first().isVisible().catch(() => false)) {
      await sv.first().click()
      await expect(page).toHaveURL(/\/sv(\/|$)/)
    }
  })

  test('NEXT_LOCALE cookie is set after visiting locale', async ({ page, context }) => {
    await page.goto('/en/')
    const cookies = await context.cookies()
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE')
    expect(localeCookie?.value).toBe('en')
  })
})
```

### 3. Create `e2e/tests/i18n/content-localization.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('i18n - Content Localization', () => {
  test('tour catalog h1 differs across locales', async ({ page }) => {
    const headings: Record<string, string> = {}
    for (const locale of ['sv', 'en', 'de']) {
      await page.goto(`/${locale}/tours`)
      await page.waitForLoadState('domcontentloaded')
      const h1 = page.getByRole('heading', { level: 1 })
      headings[locale] = (await h1.textContent())?.trim() ?? ''
    }
    expect(new Set(Object.values(headings)).size).toBeGreaterThanOrEqual(2)
  })

  test('hreflang alternates present on homepage', async ({ page }) => {
    await page.goto('/en/')
    const hreflangs = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) => links.map((l) => l.getAttribute('hreflang')))
    expect(hreflangs).toEqual(expect.arrayContaining(['sv', 'en', 'de', 'x-default']))
  })

  test('hreflang alternates present on tour detail', async ({ page }) => {
    await page.goto('/en/tours')
    const firstTour = page.locator('a[href*="/tours/"]').first()
    const visible = await firstTour.isVisible().catch(() => false)
    test.skip(!visible, 'no tour in CMS')
    await firstTour.click()
    await page.waitForLoadState('domcontentloaded')
    const hreflangs = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) => links.map((l) => l.getAttribute('hreflang')))
    expect(hreflangs).toEqual(expect.arrayContaining(['sv', 'en', 'de']))
  })
})
```

### 4. Create `e2e/tests/accessibility/keyboard-navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

const LOCALE = 'en'

test.describe('Keyboard Navigation', () => {
  test('wizard option cards activate with Enter/Space', async ({ page }) => {
    await page.goto(`/${LOCALE}/find-tour`)
    const firstCard = page.locator('[aria-pressed]').first()
    await firstCard.focus()
    await page.keyboard.press('Space')
    await expect(firstCard).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Space')
    await expect(firstCard).toHaveAttribute('aria-pressed', 'false')
  })

  test('group inquiry modal closes with Escape', async ({ page }) => {
    await page.goto(`/${LOCALE}/tours`)
    const firstTour = page.locator('a[href*="/tours/"]').first()
    const visible = await firstTour.isVisible().catch(() => false)
    test.skip(!visible, 'no tour in CMS')
    await firstTour.click()
    await page.waitForLoadState('domcontentloaded')

    const groupBtn = page.getByRole('button', { name: /group/i }).first()
    await groupBtn.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('tour catalog filter chips are keyboard-activatable', async ({ page }) => {
    await page.goto(`/${LOCALE}/tours`)
    await page.waitForLoadState('domcontentloaded')
    // Sidebar filter buttons (city / category / duration / etc.)
    const chip = page
      .locator('aside, [role="complementary"]')
      .getByRole('button')
      .first()
    if (await chip.isVisible().catch(() => false)) {
      const before = page.url()
      await chip.focus()
      await page.keyboard.press('Enter')
      await page.waitForLoadState('domcontentloaded')
      expect(page.url()).not.toBe(before) // URL updated with filter
    }
  })
})
```

## Todo List
- [ ] Append `/imprint` and `/cancellation` to `PUBLIC_ROUTES` in `wcag-audit.spec.ts`
- [ ] Create `e2e/tests/i18n/locale-routing.spec.ts`
- [ ] Create `e2e/tests/i18n/content-localization.spec.ts`
- [ ] Create `e2e/tests/accessibility/keyboard-navigation.spec.ts`
- [ ] Verify footer language selector exposes role/text matching the regex
- [ ] Confirm `NEXT_LOCALE` cookie name (next-intl v4 default)
- [ ] Run all specs across 3 browsers

## Success Criteria
- `/imprint` and `/cancellation` both pass critical/serious WCAG audit
- All 3 locales return 200 for `/` and `/tours`
- Language switcher updates URL prefix
- `NEXT_LOCALE` cookie set after locale visit
- Tour catalog h1 differs across at least 2 of 3 locales
- Hreflang alternates present for sv/en/de/x-default on homepage + tour detail
- Wizard option cards activate via Space; group modal closes via Escape
- Tour catalog filter chip URL update via Enter
- Specs pass on Chromium / Firefox / WebKit

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `/imprint` or `/cancellation` audit surfaces critical violation | Medium | Filter to `critical`/`serious` already in existing fixture — fix source if blocking |
| Language switcher markup differs across breakpoints | Medium | Flexible role-or-text matcher, scoped to footer in next iteration |
| `NEXT_LOCALE` cookie not set yet on first visit (race) | Low | Wait for navigation completion before reading cookies |
| Filter chip keyboard activation has no visual signal | Low | URL-change assertion is observable |

## Security Considerations
- No credentials required for i18n / keyboard tests
- axe-core fixture excludes third-party iframes — no cross-origin reads
- Cookie inspection is read-only via Playwright context API

## Next Steps
- Phase 05 builds on hreflang assertions for schema markup tests
- Any axe violations in `/imprint` or `/cancellation` filed as upstream component bugs
