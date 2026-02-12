# E2E Testing: i18n, Bokun Widget, SEO, Performance & localStorage

**Research ID:** researcher-02-i18n-bokun-seo-testing
**Date:** 2026-02-12
**Context:** Playwright E2E testing strategies for multi-locale, iframe widgets, SEO, performance, localStorage

---

## 1. Multi-Locale (i18n) Testing

### Parameterized Tests Across Locales

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'sv', use: { locale: 'sv-SE', baseURL: 'http://localhost:3000/sv' } },
    { name: 'en', use: { locale: 'en-US', baseURL: 'http://localhost:3000/en' } },
    { name: 'de', use: { locale: 'de-DE', baseURL: 'http://localhost:3000/de' } },
  ],
});

// tests/i18n.spec.ts
import { test, expect } from '@playwright/test';

const localeData = [
  { locale: 'sv', greeting: 'Välkommen', url: '/sv' },
  { locale: 'en', greeting: 'Welcome', url: '/en' },
  { locale: 'de', greeting: 'Willkommen', url: '/de' },
];

localeData.forEach(({ locale, greeting, url }) => {
  test.describe(`${locale.toUpperCase()} locale`, () => {
    test('displays correct translations', async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('h1')).toContainText(greeting);
    });

    test('locale routing works', async ({ page }) => {
      await page.goto('/');
      await page.click(`[data-locale="${locale}"]`);
      await expect(page).toHaveURL(new RegExp(`/${locale}`));
    });

    test('persists locale in cookie', async ({ page, context }) => {
      await page.goto(url);
      const cookies = await context.cookies();
      const localeCookie = cookies.find(c => c.name === 'NEXT_LOCALE');
      expect(localeCookie?.value).toBe(locale);
    });
  });
});
```

### Hreflang Validation

```typescript
test('validates hreflang alternate links', async ({ page }) => {
  await page.goto('/sv/tours/stockholm');

  const hreflangs = await page.$$eval('link[rel="alternate"][hreflang]', links =>
    links.map(l => ({
      hreflang: l.getAttribute('hreflang'),
      href: l.getAttribute('href'),
    }))
  );

  expect(hreflangs).toContainEqual({ hreflang: 'sv', href: expect.stringContaining('/sv/tours/stockholm') });
  expect(hreflangs).toContainEqual({ hreflang: 'en', href: expect.stringContaining('/en/tours/stockholm') });
  expect(hreflangs).toContainEqual({ hreflang: 'de', href: expect.stringContaining('/de/tours/stockholm') });
  expect(hreflangs).toContainEqual({ hreflang: 'x-default', href: expect.any(String) });
});
```

---

## 2. Testing Iframe-Embedded Bokun Widget

### Cross-Origin Iframe Handling

```typescript
test('interacts with Bokun booking widget', async ({ page }) => {
  await page.goto('/tours/stockholm');

  // Wait for iframe to load
  const iframeElement = page.frameLocator('iframe[src*="bokun.io"]');

  // Interact with iframe content (if not cross-origin restricted)
  await iframeElement.locator('button[data-testid="select-date"]').click();
  await iframeElement.locator('[data-date="2026-03-15"]').click();

  // Verify iframe state changes
  await expect(iframeElement.locator('.selected-date')).toContainText('March 15');
});
```

### Cross-Origin Limitations & Workarounds

```typescript
// For cross-origin iframes (most Bokun widgets), use message event listeners
test('validates Bokun widget loads', async ({ page }) => {
  await page.goto('/tours/stockholm');

  // Validate iframe presence
  const iframe = page.locator('iframe[src*="bokun.io"]');
  await expect(iframe).toBeVisible();

  // Check iframe loads without error
  const iframeSrc = await iframe.getAttribute('src');
  expect(iframeSrc).toContain('bokun.io');

  // Listen for postMessage events from widget
  await page.evaluate(() => {
    window.bokunMessages = [];
    window.addEventListener('message', (e) => {
      if (e.origin.includes('bokun.io')) {
        window.bokunMessages.push(e.data);
      }
    });
  });

  // Trigger interaction by clicking button that opens widget
  await page.click('[data-widget="bokun-booking"]');

  // Wait for widget to send message
  await page.waitForFunction(() => window.bokunMessages.length > 0, { timeout: 10000 });

  const messages = await page.evaluate(() => window.bokunMessages);
  expect(messages.length).toBeGreaterThan(0);
});
```

### API Mock Strategy (Recommended)

```typescript
// Mock Bokun API responses instead of testing iframe
test('booking flow with mocked Bokun API', async ({ page }) => {
  await page.route('**/api.bokun.io/**', route => {
    if (route.request().url().includes('/availability')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ available: true, slots: ['10:00', '14:00'] }),
      });
    } else {
      route.continue();
    }
  });

  await page.goto('/tours/stockholm');
  // Test application behavior with mocked Bokun responses
});
```

---

## 3. SEO Testing

### Meta Tags & OpenGraph

```typescript
test('validates SEO meta tags', async ({ page }) => {
  await page.goto('/tours/stockholm');

  // Title
  await expect(page).toHaveTitle(/Stockholm Walking Tour/);

  // Meta description
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toBeTruthy();
  expect(description.length).toBeGreaterThan(50);
  expect(description.length).toBeLessThan(160);

  // OpenGraph
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

  expect(ogTitle).toBeTruthy();
  expect(ogImage).toMatch(/^https?:\/\//);
  expect(ogUrl).toContain('/tours/stockholm');

  // Twitter Card
  const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
  expect(twitterCard).toBe('summary_large_image');
});
```

### JSON-LD Schema Validation

```typescript
test('validates schema.org JSON-LD', async ({ page }) => {
  await page.goto('/tours/stockholm');

  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  const schema = JSON.parse(jsonLd);

  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBe('TouristAttraction');
  expect(schema.name).toBeTruthy();
  expect(schema.description).toBeTruthy();
  expect(schema.image).toMatch(/^https?:\/\//);
});
```

---

## 4. Performance Testing (Core Web Vitals)

### LCP, CLS, FCP Assertions

```typescript
test('measures Core Web Vitals', async ({ page }) => {
  await page.goto('/tours/stockholm');

  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve({
          lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.renderTime,
          cls: entries.reduce((sum, e) => sum + (e.value || 0), 0),
          fcp: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime,
        });
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => resolve({
        lcp: null,
        cls: null,
        fcp: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime,
      }), 5000);
    });
  });

  // Good thresholds: LCP < 2.5s, CLS < 0.1, FCP < 1.8s
  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.cls).toBeLessThan(0.1);
  expect(metrics.fcp).toBeLessThan(1800);
});
```

### Lighthouse Integration

```typescript
// Use @axe-core/playwright or lighthouse-ci
import { injectAxe, checkA11y } from 'axe-playwright';

test('passes Lighthouse performance audit', async ({ page }) => {
  await page.goto('/tours/stockholm');

  // Use lighthouse-ci programmatically or via CLI
  // Alternative: use Playwright's built-in coverage/performance APIs
  const performanceTimings = await page.evaluate(() => JSON.stringify(window.performance.timing));
  const timings = JSON.parse(performanceTimings);

  const loadTime = timings.loadEventEnd - timings.navigationStart;
  expect(loadTime).toBeLessThan(3000);
});
```

---

## 5. localStorage Testing

### State Persistence Validation

```typescript
test('persists concierge wizard state in localStorage', async ({ page }) => {
  await page.goto('/concierge');

  // Fill wizard form
  await page.fill('[name="interests"]', 'History, Architecture');
  await page.click('button:has-text("Next")');

  // Check localStorage
  const stored = await page.evaluate(() => localStorage.getItem('concierge_wizard'));
  const data = JSON.parse(stored);

  expect(data.interests).toBe('History, Architecture');
  expect(data.step).toBe(2);

  // Reload page and verify state restored
  await page.reload();
  await expect(page.locator('[name="interests"]')).toHaveValue('History, Architecture');
});

test('clears localStorage on logout', async ({ page, context }) => {
  await page.goto('/profile');

  // Set some localStorage data
  await page.evaluate(() => {
    localStorage.setItem('user_preferences', '{"theme":"dark"}');
    localStorage.setItem('tour_favorites', '["stockholm","malmo"]');
  });

  // Logout
  await page.click('[data-testid="logout-button"]');

  // Verify localStorage cleared
  const remaining = await page.evaluate(() => Object.keys(localStorage).length);
  expect(remaining).toBe(0);
});

test('handles WhatsApp dismiss state', async ({ page }) => {
  await page.goto('/');

  // Dismiss WhatsApp widget
  await page.click('[data-testid="whatsapp-dismiss"]');

  const dismissed = await page.evaluate(() => localStorage.getItem('whatsapp_dismissed'));
  expect(dismissed).toBe('true');

  // Reload and verify widget not shown
  await page.reload();
  await expect(page.locator('[data-testid="whatsapp-widget"]')).not.toBeVisible();
});
```

---

## Unresolved Questions

1. **Bokun widget iframe access** - Cross-origin policy likely prevents direct interaction. Confirm if Bokun provides test environment or postMessage API for E2E tests.
2. **Performance baseline** - What are acceptable LCP/CLS/FCP thresholds for tour detail pages with images/maps?
3. **Locale-specific schema.org** - Should JSON-LD be translated per locale or remain in English?
4. **localStorage quota** - Should tests validate storage quota limits for large wizard/preference data?
