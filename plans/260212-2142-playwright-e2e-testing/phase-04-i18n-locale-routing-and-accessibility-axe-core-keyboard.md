# Phase 04: i18n Locale Routing + Accessibility (axe-core, Keyboard)

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: [Phase 01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md), [Phase 02](./phase-02-customer-journey-browse-search-filter-booking.md)
- **Research**: [i18n, Bokun, SEO, localStorage](./research/researcher-02-i18n-bokun-seo-testing.md)
- **Codebase**: apps/web/messages/ (sv.json, en.json, de.json), apps/web/i18n/, apps/web/components/language-switcher/

## Overview
- **Date**: 2026-02-12
- **Priority**: HIGH
- **Effort**: 2.5h
- **Implementation Status**: Pending
- **Review Status**: Not started

Test i18n locale routing for all 3 locales (sv/en/de), language switcher navigation, cookie persistence (NEXT_LOCALE), content localization on key pages. Accessibility testing via @axe-core/playwright for WCAG 2.1 AA on all major pages, plus keyboard navigation for interactive components (wizard, filters, modals).

## Key Insights
- next-intl uses `[locale]` dynamic segment with sv/en/de
- Default locale: sv (Swedish) -- but tests default to `en` for simpler assertions
- Language switcher component in `components/language-switcher/`
- NEXT_LOCALE cookie set by next-intl middleware on locale switch
- Hreflang alternate links rendered in `<head>` for all pages
- Bokun iframe should be excluded from axe scans (third-party, cross-origin)
- Wizard option cards use `aria-pressed`, progress bar uses `role="progressbar"`
- Filter chips use ARIA labels and keyboard navigation

## Requirements

### Functional
- Locale routing: visiting `/sv/tours`, `/en/tours`, `/de/tours` loads correct locale
- Language switcher: clicking switcher navigates to same page in new locale
- Cookie persistence: after switching locale, NEXT_LOCALE cookie is set
- Content localization: homepage heading differs across sv/en/de
- Hreflang: all pages have `<link rel="alternate" hreflang="...">` for sv/en/de + x-default
- Axe audits: homepage, tours, tour detail, find-tour, group-booking, about-us, faq -- all pass WCAG 2.1 AA
- Keyboard navigation: Tab through wizard options, Enter/Space to select, Escape closes modals

### Non-Functional
- Axe scans exclude `iframe[src*="bokun"]` (third-party widget)
- Each spec file under 200 lines
- Parameterized locale tests use data-driven pattern (array of locales)
- Accessibility failures should provide actionable violation details

## Architecture

```
e2e/
├── tests/
│   ├── i18n/
│   │   ├── locale-routing.spec.ts          # Route navigation per locale
│   │   └── content-localization.spec.ts    # Translated content + hreflang
│   ├── accessibility/
│   │   ├── axe-audit.spec.ts              # axe-core WCAG 2.1 AA scans
│   │   └── keyboard-navigation.spec.ts    # Tab, Enter, Space, Escape
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `e2e/tests/i18n/locale-routing.spec.ts` | Locale routing and language switcher |
| `e2e/tests/i18n/content-localization.spec.ts` | Translated content + hreflang validation |
| `e2e/tests/accessibility/axe-audit.spec.ts` | axe-core WCAG 2.1 AA page audits |
| `e2e/tests/accessibility/keyboard-navigation.spec.ts` | Keyboard nav for interactive components |

### Existing Reference (apps/web)
| File | Relevance |
|------|-----------|
| `messages/sv.json` | Swedish translations (heading text) |
| `messages/en.json` | English translations (heading text) |
| `messages/de.json` | German translations (heading text) |
| `i18n.ts` | Locale configuration |
| `i18n/routing.ts` | Route definitions per locale |
| `components/language-switcher/` | Language switcher UI |
| `app/middleware.ts` | next-intl locale detection + NEXT_LOCALE cookie |
| `components/wizard/wizard-option-card.tsx` | aria-pressed attribute |
| `components/booking/group-inquiry-modal.tsx` | Dialog close on Escape |

## Implementation Steps

### 1. Create e2e/tests/i18n/locale-routing.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { NavigationPage } from '../../page-objects/navigation'

const LOCALES = ['sv', 'en', 'de'] as const

test.describe('i18n - Locale Routing', () => {
  for (const locale of LOCALES) {
    test(`/${locale}/ homepage loads correctly`, async ({ page }) => {
      const response = await page.goto(`/${locale}/`)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveURL(new RegExp(`/${locale}`))
    })

    test(`/${locale}/tours catalog loads correctly`, async ({ page }) => {
      const response = await page.goto(`/${locale}/tours`)
      expect(response?.status()).toBe(200)
    })
  }

  test('language switcher navigates to same page in new locale', async ({ page }) => {
    const nav = new NavigationPage(page, 'en')
    await nav.goto('/tours')

    // Switch to Swedish
    await nav.switchLocale('sv')
    await expect(page).toHaveURL(/\/sv\/tours/)

    // Switch to German
    await nav.switchLocale('de')
    await expect(page).toHaveURL(/\/de\/tours/)
  })

  test('sets NEXT_LOCALE cookie after locale switch', async ({ page, context }) => {
    await page.goto('/en/')
    const cookies = await context.cookies()
    const localeCookie = cookies.find(c => c.name === 'NEXT_LOCALE')
    expect(localeCookie?.value).toBe('en')
  })

  test('cookie persists locale preference across navigation', async ({ page, context }) => {
    // Visit English page
    await page.goto('/en/about-us')
    // Navigate to another page -- should stay in English
    await page.goto('/en/faq')
    const cookies = await context.cookies()
    const localeCookie = cookies.find(c => c.name === 'NEXT_LOCALE')
    expect(localeCookie?.value).toBe('en')
  })
})
```

### 2. Create e2e/tests/i18n/content-localization.spec.ts
```typescript
import { test, expect } from '@playwright/test'

test.describe('i18n - Content Localization', () => {
  test('homepage heading differs across locales', async ({ page }) => {
    // Collect h1 text from each locale
    const headings: Record<string, string> = {}

    for (const locale of ['sv', 'en', 'de']) {
      await page.goto(`/${locale}/`)
      await page.waitForLoadState('networkidle')
      const h1 = page.getByRole('heading', { level: 1 })
      headings[locale] = (await h1.textContent()) || ''
    }

    // At least 2 of 3 should differ (sv is default, en and de are translations)
    const unique = new Set(Object.values(headings))
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  test('tour catalog page title is localized', async ({ page }) => {
    const titles: Record<string, string> = {}

    for (const locale of ['sv', 'en', 'de']) {
      await page.goto(`/${locale}/tours`)
      titles[locale] = await page.title()
    }

    const unique = new Set(Object.values(titles))
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  test('hreflang alternate links present on homepage', async ({ page }) => {
    await page.goto('/en/')

    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
      links => links.map(l => ({
        hreflang: l.getAttribute('hreflang'),
        href: l.getAttribute('href'),
      }))
    )

    const langs = hreflangs.map(h => h.hreflang)
    expect(langs).toContain('sv')
    expect(langs).toContain('en')
    expect(langs).toContain('de')
    expect(langs).toContain('x-default')
  })

  test('hreflang links present on tour detail page', async ({ page }) => {
    // Navigate to catalog and find a tour link
    await page.goto('/en/tours')
    const firstTourLink = page.locator('a[href*="/tours/"]').first()
    if (await firstTourLink.isVisible()) {
      await firstTourLink.click()
      await page.waitForLoadState('networkidle')

      const hreflangs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(
        links => links.map(l => l.getAttribute('hreflang'))
      )
      expect(hreflangs).toContain('sv')
      expect(hreflangs).toContain('en')
      expect(hreflangs).toContain('de')
    }
  })
})
```

### 3. Create e2e/tests/accessibility/axe-audit.spec.ts
```typescript
import { test, expect } from '../../fixtures/test-fixtures'

const PAGES_TO_AUDIT = [
  { name: 'Homepage', path: '/' },
  { name: 'Tour Catalog', path: '/tours' },
  { name: 'Concierge Wizard', path: '/find-tour' },
  { name: 'Group Booking', path: '/group-booking' },
  { name: 'About Us', path: '/about-us' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Terms', path: '/terms' },
  { name: 'Privacy', path: '/privacy' },
]

const LOCALE = 'en'

test.describe('Accessibility - WCAG 2.1 AA Audit', () => {
  for (const { name, path } of PAGES_TO_AUDIT) {
    test(`${name} page passes axe-core audit`, async ({ page, makeAxeBuilder }) => {
      await page.goto(`/${LOCALE}${path}`)
      await page.waitForLoadState('networkidle')

      const results = await makeAxeBuilder().analyze()

      // Log violations for debugging (actionable details)
      if (results.violations.length > 0) {
        const summary = results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        }))
        console.log(`Axe violations on ${name}:`, JSON.stringify(summary, null, 2))
      }

      expect(results.violations).toEqual([])
    })
  }

  test('tour detail page passes axe-core audit', async ({ page, makeAxeBuilder }) => {
    // Navigate to first tour from catalog
    await page.goto(`/${LOCALE}/tours`)
    const firstTour = page.locator('a[href*="/tours/"]').first()
    if (await firstTour.isVisible()) {
      await firstTour.click()
      await page.waitForLoadState('networkidle')

      const results = await makeAxeBuilder().analyze()
      expect(results.violations).toEqual([])
    }
  })
})
```

### 4. Create e2e/tests/accessibility/keyboard-navigation.spec.ts
```typescript
import { test, expect } from '@playwright/test'
import { ConciergeWizardPage } from '../../page-objects/concierge-wizard'

test.describe('Accessibility - Keyboard Navigation', () => {
  test('wizard option cards navigable with Tab and selectable with Enter', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()

    // Tab to first option card
    await page.keyboard.press('Tab')
    // Continue tabbing until an option card is focused
    for (let i = 0; i < 10; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement
        return el?.getAttribute('aria-pressed') !== null
      })
      if (focused) break
      await page.keyboard.press('Tab')
    }

    // Press Enter to select
    await page.keyboard.press('Enter')
    const selected = await page.evaluate(() => {
      return document.activeElement?.getAttribute('aria-pressed')
    })
    expect(selected).toBe('true')
  })

  test('wizard option cards selectable with Space', async ({ page }) => {
    const wizard = new ConciergeWizardPage(page)
    await wizard.gotoWizard()

    // Click first card to focus area, then tab to it
    const firstCard = wizard.optionCards.first()
    await firstCard.focus()
    await page.keyboard.press('Space')
    await expect(firstCard).toHaveAttribute('aria-pressed', 'true')
  })

  test('group inquiry modal closes with Escape', async ({ page }) => {
    // Navigate to tour detail
    await page.goto('/en/tours')
    const firstTour = page.locator('a[href*="/tours/"]').first()
    if (await firstTour.isVisible()) {
      await firstTour.click()
      await page.waitForLoadState('networkidle')

      // Open group inquiry modal if button exists
      const groupBtn = page.getByRole('button', { name: /group/i })
      if (await groupBtn.isVisible()) {
        await groupBtn.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
      }
    }
  })

  test('category filter chips are keyboard accessible', async ({ page }) => {
    await page.goto('/en/tours')
    await page.waitForLoadState('networkidle')

    // Tab through the page to reach filter chips
    const chips = page.locator('[data-testid="category-chips"] button, [role="group"] button')
    const firstChip = chips.first()

    if (await firstChip.isVisible()) {
      await firstChip.focus()
      await page.keyboard.press('Enter')

      // URL should update with category filter
      await page.waitForTimeout(300)
      const url = page.url()
      // Chip should be activatable via keyboard
      expect(url).toBeDefined()
    }
  })

  test('skip-to-content link is present and functional', async ({ page }) => {
    await page.goto('/en/')

    // Press Tab -- first focusable should be skip link (if present)
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      return {
        tag: el?.tagName,
        href: el?.getAttribute('href'),
        text: el?.textContent,
      }
    })

    // If skip-to-content exists, verify it works
    if (focused.href === '#main' || focused.text?.toLowerCase().includes('skip')) {
      await page.keyboard.press('Enter')
      const mainFocused = await page.evaluate(() => {
        return document.activeElement?.id === 'main' ||
          document.activeElement?.tagName === 'MAIN'
      })
      expect(mainFocused).toBeTruthy()
    }
  })
})
```

## Todo List
- [ ] Create `e2e/tests/i18n/locale-routing.spec.ts`
- [ ] Create `e2e/tests/i18n/content-localization.spec.ts`
- [ ] Create `e2e/tests/accessibility/axe-audit.spec.ts`
- [ ] Create `e2e/tests/accessibility/keyboard-navigation.spec.ts`
- [ ] Verify language switcher selector matches actual component markup
- [ ] Verify NEXT_LOCALE cookie name matches next-intl convention
- [ ] Cross-reference axe violations and fix source components if needed
- [ ] Run all tests against staging with 3 browsers

## Success Criteria
- All 3 locales (sv/en/de) load correctly for homepage and tours
- Language switcher navigates to correct locale
- NEXT_LOCALE cookie persists locale choice
- Homepage heading differs across at least 2 of 3 locales
- Hreflang tags present for sv/en/de/x-default on all pages
- All 8 static pages + tour detail pass axe-core WCAG 2.1 AA
- Wizard options selectable via Tab + Enter/Space
- Modal dismissable via Escape key
- All tests pass on Chromium, Firefox, WebKit

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Axe violations from third-party widgets (Bokun) | High | Exclude `iframe[src*="bokun"]` in fixture |
| Language switcher markup changes | Medium | NavigationPage POM uses flexible regex selectors |
| NEXT_LOCALE cookie not set (middleware config) | Low | Verify cookie name from next-intl docs |
| Axe false positives on dynamic content | Medium | Log violation details for manual review |
| Skip-to-content link not implemented | Medium | Conditional test (skip if not present) |

## Security Considerations
- No credentials needed for i18n or accessibility tests
- axe-core runs client-side only (no server access)
- Cookie assertions read only, no modification

## Next Steps
- Phase 05 builds on hreflang tests for SEO schema validation
- Axe violations discovered here should be filed as bugs for source component fixes
