# Phase 01: Foundation - Setup, Config, POM Base, Smoke Tests

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Research**: [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- **Code Standards**: [docs/code-standards.md](../../docs/code-standards.md)

## Overview
- **Date**: 2026-02-12
- **Priority**: CRITICAL (blocks all other phases)
- **Effort**: 3h
- **Implementation Status**: Pending
- **Review Status**: Not started

Install Playwright + axe-core in root `e2e/` directory. Create playwright.config.ts targeting STAGING_URL, POM base class, custom test fixtures (locale, a11y), and smoke tests verifying all pages load without 4xx/5xx.

## Key Insights
- No `webServer` block needed -- testing deployed staging URL
- Playwright 1.48+ has no conflicts with Next.js 16
- `@axe-core/playwright` 4.9+ for WCAG 2.1 AA fixture
- Use `blob` reporter in CI for cross-shard report merging
- BasePage pattern keeps locators DRY across page objects

## Requirements

### Functional
- Install Playwright + @axe-core/playwright as devDependencies in `e2e/package.json`
- Configure 3 browser projects (Chromium, Firefox, WebKit)
- BasePage class with goto(), waitForPageLoad(), locale-aware navigation
- Custom test fixture extending base test with `locale` and `makeAxeBuilder` fixtures
- Staging data discovery helper (fetch real tour slugs from staging for parameterized tests)
- Smoke tests: all 10 customer-facing routes + /admin return 200

### Non-Functional
- All config files under 200 lines
- Each page object under 200 lines
- TypeScript strict mode in e2e/tsconfig.json
- Screenshots only on failure, trace on first retry, video retain on failure

## Architecture

```
e2e/
├── fixtures/
│   ├── base-page.ts              # BasePage class (goto, waitForLoad, locale nav)
│   ├── test-fixtures.ts          # Extended test with locale + a11y fixtures
│   └── staging-data.ts           # Discover real tour slugs from staging HTML
├── page-objects/
│   └── navigation.ts             # Header, footer, language switcher locators
├── tests/
│   └── smoke/
│       └── all-pages-load.spec.ts  # Every route returns 200
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `e2e/package.json` | Dependencies: @playwright/test, @axe-core/playwright |
| `e2e/tsconfig.json` | TypeScript config for e2e directory |
| `e2e/playwright.config.ts` | Playwright config: 3 browsers, staging URL, reporters |
| `e2e/fixtures/base-page.ts` | BasePage POM class |
| `e2e/fixtures/test-fixtures.ts` | Custom test with locale + axe fixtures |
| `e2e/fixtures/staging-data.ts` | Discover real slugs from staging |
| `e2e/page-objects/navigation.ts` | Nav header/footer/language switcher POM |
| `e2e/tests/smoke/all-pages-load.spec.ts` | Smoke test all routes |

### To Modify
| File | Change |
|------|--------|
| `.gitignore` | Add `e2e/test-results/`, `e2e/playwright-report/`, `e2e/blob-report/` |

## Implementation Steps

### 1. Initialize e2e directory
```bash
mkdir e2e && cd e2e
npm init -y
npm install -D @playwright/test @axe-core/playwright typescript
npx playwright install
```

### 2. Create e2e/package.json
```json
{
  "name": "heritageguiding-e2e",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:chromium": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:webkit": "playwright test --project=webkit",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@axe-core/playwright": "^4.9.0",
    "typescript": "^5.9.0"
  }
}
```

### 3. Create e2e/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@fixtures/*": ["./fixtures/*"],
      "@page-objects/*": ["./page-objects/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "test-results", "playwright-report"]
}
```

### 4. Create e2e/playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['blob'], ['github']]
    : [['html'], ['json', { outputFile: 'test-results/results.json' }]],

  use: {
    baseURL: process.env.STAGING_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixels: 100, threshold: 0.2 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

### 5. Create e2e/fixtures/base-page.ts
```typescript
import { type Page, type Locator } from '@playwright/test'

export class BasePage {
  readonly page: Page
  protected locale: string

  constructor(page: Page, locale = 'en') {
    this.page = page
    this.locale = locale
  }

  /** Navigate to locale-prefixed path */
  async goto(path = '/') {
    const url = path.startsWith('/') ? `/${this.locale}${path}` : path
    await this.page.goto(url)
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  /** Get current page title */
  async getTitle(): Promise<string> {
    return this.page.title()
  }

  /** Check page did not return error status */
  async expectNoErrorStatus() {
    // Page loaded without 4xx/5xx -- check no error heading
    const body = this.page.locator('body')
    await body.waitFor({ state: 'visible' })
  }
}
```

### 6. Create e2e/fixtures/test-fixtures.ts
```typescript
import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/** Custom test fixture with locale and accessibility helpers */
export const test = base.extend<{
  locale: string
  makeAxeBuilder: () => AxeBuilder
}>({
  locale: ['en', { option: true }],

  makeAxeBuilder: async ({ page }, use) => {
    const builder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('iframe[src*="bokun"]') // Exclude third-party widget
    await use(builder)
  },
})

export { expect }
```

### 7. Create e2e/fixtures/staging-data.ts
```typescript
import { type Page } from '@playwright/test'

/**
 * Discover real tour slugs from staging /en/tours page.
 * Avoids hardcoding slugs that may change in CMS.
 */
export async function discoverTourSlugs(page: Page, locale = 'en'): Promise<string[]> {
  await page.goto(`/${locale}/tours`)
  await page.waitForLoadState('networkidle')

  const links = await page.locator('a[href*="/tours/"]').all()
  const slugs: string[] = []

  for (const link of links) {
    const href = await link.getAttribute('href')
    if (href) {
      const match = href.match(/\/tours\/([^/?#]+)/)
      if (match && !slugs.includes(match[1])) {
        slugs.push(match[1])
      }
    }
  }
  return slugs
}

/** Get the first available tour slug from staging */
export async function getFirstTourSlug(page: Page, locale = 'en'): Promise<string> {
  const slugs = await discoverTourSlugs(page, locale)
  if (slugs.length === 0) throw new Error('No tours found on staging')
  return slugs[0]
}
```

### 8. Create e2e/page-objects/navigation.ts
```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class NavigationPage extends BasePage {
  readonly header: Locator
  readonly footer: Locator
  readonly languageSwitcher: Locator
  readonly mobileMenuButton: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.header = page.locator('header')
    this.footer = page.locator('footer')
    this.languageSwitcher = page.getByRole('button', { name: /language|svenska|english|deutsch/i })
    this.mobileMenuButton = page.getByRole('button', { name: /menu/i })
  }

  async switchLocale(targetLocale: string) {
    await this.languageSwitcher.click()
    await this.page.getByRole('link', { name: new RegExp(targetLocale, 'i') }).click()
  }
}
```

### 9. Create e2e/tests/smoke/all-pages-load.spec.ts
```typescript
import { test, expect } from '@playwright/test'

const CUSTOMER_ROUTES = [
  '/',
  '/tours',
  '/find-tour',
  '/group-booking',
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
})
```

### 10. Update .gitignore
Add these entries:
```
# Playwright
e2e/test-results/
e2e/playwright-report/
e2e/blob-report/
e2e/node_modules/
```

## Todo List
- [ ] Create `e2e/` directory structure
- [ ] Write `e2e/package.json` with Playwright + axe-core deps
- [ ] Write `e2e/tsconfig.json` with strict mode
- [ ] Write `e2e/playwright.config.ts` with 3 browser projects
- [ ] Write `e2e/fixtures/base-page.ts` BasePage POM class
- [ ] Write `e2e/fixtures/test-fixtures.ts` with locale + axe fixtures
- [ ] Write `e2e/fixtures/staging-data.ts` tour slug discovery
- [ ] Write `e2e/page-objects/navigation.ts` nav POM
- [ ] Write `e2e/tests/smoke/all-pages-load.spec.ts`
- [ ] Update `.gitignore` with Playwright artifacts
- [ ] Run `npm install` in e2e/ and `npx playwright install`
- [ ] Verify smoke tests pass against staging

## Success Criteria
- `npx playwright test` runs from `e2e/` directory
- All 3 browsers configured and installable
- Smoke tests verify all 10 routes return 200
- BasePage provides locale-aware navigation
- Custom fixture provides axe-core builder
- staging-data.ts discovers real tour slugs dynamically

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Staging URL not available | Medium | Fallback to localhost:3000 in config |
| WebKit install issues on Windows | Low | CI runs on ubuntu-latest; local dev can skip WebKit |
| Tour slugs change in CMS | Low | Dynamic slug discovery via staging-data.ts |

## Security Considerations
- STAGING_URL, ADMIN_EMAIL, ADMIN_PASSWORD passed as env vars (never hardcoded)
- No secrets committed to e2e/ directory
- `.gitignore` excludes test artifacts that may contain screenshots of admin panels

## Next Steps
- Phase 02 depends on this: uses BasePage, fixtures, staging-data helpers
- All subsequent phases import from `e2e/fixtures/` and `e2e/page-objects/`
