# Playwright E2E Testing Best Practices for Next.js Monorepo (2026)

**Research Date:** 2026-02-12
**Focus:** Playwright setup, POM patterns, external staging testing, multi-browser sharding, accessibility, visual regression, CI/CD

---

## 1. Playwright Latest Version & Next.js 16 Setup

**Current Version:** Playwright 1.48+ (as of Jan 2025)

### Installation (Monorepo Root)
```bash
npm init playwright@latest
# or
pnpm create playwright
```

### Package Structure
```json
// package.json (root)
{
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@axe-core/playwright": "^4.9.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:staging": "BASE_URL=https://staging.example.com playwright test"
  }
}
```

### Config for Next.js 16 Monorepo
```typescript
// playwright.config.ts (root)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['github'] // GitHub Actions annotations
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://staging.heritageguiding.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],

  // External staging URL - no webServer needed
  // webServer omitted when testing deployed environments
});
```

---

## 2. Page Object Model (POM) Best Practices

### Directory Structure
```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── signup.spec.ts
│   ├── booking/
│   │   ├── tour-booking.spec.ts
│   │   └── group-booking.spec.ts
│   └── accessibility/
│       └── wcag-compliance.spec.ts
├── fixtures/
│   ├── test-data.ts
│   └── custom-fixtures.ts
└── pages/
    ├── base-page.ts
    ├── home-page.ts
    ├── login-page.ts
    └── booking-page.ts
```

### BasePage Pattern
```typescript
// tests/pages/base-page.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
```

### Concrete Page Example
```typescript
// tests/pages/login-page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.getByRole('alert');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    return this.errorMessage.textContent();
  }
}
```

---

## 3. External Staging URL Configuration

**No `webServer` block needed** when testing deployed environments.

### Environment-Based Config
```typescript
// playwright.config.ts
use: {
  baseURL: process.env.BASE_URL || 'https://staging.heritageguiding.com',
  // Add auth state if needed
  storageState: process.env.STORAGE_STATE || undefined,
}
```

### Multi-Environment Support
```bash
# .env.staging
BASE_URL=https://staging.heritageguiding.com

# .env.production
BASE_URL=https://heritageguiding.com
```

```typescript
// Load env dynamically
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.ENV || 'staging'}` });
```

---

## 4. Multi-Browser Testing & Sharding

### Sharding for CI Performance
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### GitHub Actions Sharding
```yaml
# .github/workflows/playwright.yml
- name: Run Playwright tests
  run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
  strategy:
    matrix:
      shardIndex: [1, 2, 3, 4]
      shardTotal: [4]
```

---

## 5. Axe-Core Accessibility Testing (WCAG 2.1 AA)

### Installation
```bash
npm install -D @axe-core/playwright
```

### Custom Fixture
```typescript
// tests/fixtures/a11y-fixture.ts
import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const test = base.extend<{ makeAxeBuilder: () => AxeBuilder }>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('#third-party-widget'); // Exclude external widgets
    await use(makeAxeBuilder);
  },
});

export { expect } from '@playwright/test';
```

### Accessibility Test Example
```typescript
// tests/e2e/accessibility/wcag-compliance.spec.ts
import { test, expect } from '../../fixtures/a11y-fixture';

test.describe('WCAG 2.1 AA Compliance', () => {
  test('homepage should have no accessibility violations', async ({ page, makeAxeBuilder }) => {
    await page.goto('/');
    const accessibilityScanResults = await makeAxeBuilder().analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('tour booking page should be accessible', async ({ page, makeAxeBuilder }) => {
    await page.goto('/tours/historical-athens');
    const results = await makeAxeBuilder().analyze();
    expect(results.violations).toEqual([]);
  });
});
```

---

## 6. Visual Regression Testing

### Screenshot Comparison Config
```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100, // Allow minor rendering differences
      threshold: 0.2,     // 20% threshold
    },
  },
});
```

### Visual Test Example
```typescript
// tests/e2e/visual/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('homepage visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled', // Disable animations for consistency
  });
});

test('tour card component', async ({ page }) => {
  await page.goto('/tours');
  const tourCard = page.locator('[data-testid="tour-card"]').first();
  await expect(tourCard).toHaveScreenshot('tour-card.png');
});
```

### Update Snapshots
```bash
npx playwright test --update-snapshots
```

---

## 7. GitHub Actions Workflow (On-Demand + Sharding)

```yaml
# .github/workflows/playwright-e2e.yml
name: Playwright E2E Tests

on:
  workflow_dispatch: # Manual trigger
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          BASE_URL: ${{ inputs.environment == 'production' && 'https://heritageguiding.com' || 'https://staging.heritageguiding.com' }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.browser }}-${{ matrix.shardIndex }}
          path: playwright-report/
          retention-days: 30

      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.browser }}-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 7

  merge-reports:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          pattern: blob-report-*
          path: all-blob-reports

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 30
```

---

## Summary

**Key Recommendations:**
1. **Version:** Use Playwright 1.48+ with Next.js 16 (no conflicts)
2. **POM:** BasePage + concrete pages in `tests/pages/`, fixtures in `tests/fixtures/`
3. **Staging:** Use `baseURL` env var, omit `webServer` block for deployed URLs
4. **Sharding:** 4 shards × 3 browsers = 12 parallel jobs in CI (9-12min total vs 45min sequential)
5. **A11y:** `@axe-core/playwright` with WCAG 2.1 AA tags, custom fixture for reusability
6. **Visual:** `toHaveScreenshot()` with `maxDiffPixels` threshold, disable animations
7. **CI:** `workflow_dispatch` for on-demand runs, matrix strategy for sharding + browsers

**Unresolved Questions:**
- Auth state persistence strategy (global setup vs per-test login)?
- Monorepo-specific test organization (per-app vs shared)?
- Snapshot baseline management across environments (staging vs prod)?
