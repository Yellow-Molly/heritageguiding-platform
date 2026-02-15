# Phase 11: Performance Optimization + Manual QA

## Context Links

- [MVP Project Plan](./plan.md)
- [Playwright E2E Testing Plan](../260212-2142-playwright-e2e-testing/plan.md) — automated E2E covered separately
- [Core Web Vitals](https://web.dev/vitals/)
- [Phase 10: Accessibility + SEO](./phase-10-accessibility-seo.md) (completed)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | done (2026-02-15) | 24-30h |

Optimize Core Web Vitals, implement image optimization, code splitting, caching strategies. Manual QA across browsers/devices for MVP launch readiness. E2E automation handled by [Playwright plan](../260212-2142-playwright-e2e-testing/plan.md).

## Key Insights

- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Next.js Image optimization automatic with `next/image`
- Server Components reduce client bundle size
- Caching: Next.js Data Cache + React cache()
- Turbopack is default bundler in Next.js 16 — `@next/bundle-analyzer` only works with webpack build
- Vercel Blob used for media storage (not Cloudinary)
- Bokun widget is booking system (not Rezdy)

## Requirements

### Performance
- Lighthouse Performance score > 90
- LCP < 2.5 seconds
- FID < 100ms
- CLS < 0.1
- TTFB < 600ms
- Total bundle size < 200KB (first load)

### Manual QA
- Cross-browser: Chrome, Firefox, Safari, Edge
- Mobile devices: iOS Safari, Android Chrome
- Accessibility audit passes (WCAG 2.1 AA)
- Booking flow works end-to-end via Bokun widget
- All 3 language variants work (SV/EN/DE)
- Form submissions successful (group inquiry, contact)
- Concierge Wizard completes 3-step flow

## Architecture

### Performance Strategy

```
1. Image Optimization
   ├── next/image with automatic WebP/AVIF
   ├── Responsive sizes attribute
   ├── Priority for above-fold
   └── Lazy loading for below-fold

2. Code Splitting
   ├── Dynamic imports for heavy components
   ├── Route-based splitting (automatic)
   └── Third-party bundle analysis

3. Caching
   ├── Static pages (ISR where applicable)
   ├── API route caching
   ├── Payload query caching
   └── CDN caching (Vercel Edge)

4. Core Web Vitals
   ├── Preload critical assets
   ├── Minimize CLS with aspect-ratio
   ├── Reduce TBT with code splitting
   └── Optimize server response time
```

## Related Code Files

### Create
- `apps/web/lib/performance/preload.ts` - Preload utilities
- `scripts/lighthouse-ci.js` - CI performance tests (optional)

### Modify
- `next.config.ts` - Optimization settings
- `apps/web/app/[locale]/layout.tsx` - Preload hints
- Image components - Add sizes attribute

## Implementation Steps

### Part 1: Performance Optimization

1. **Configure Next.js Optimization**
   ```typescript
   // next.config.ts additions
   const nextConfig: NextConfig = {
     images: {
       formats: ['image/avif', 'image/webp'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920],
       imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
       minimumCacheTTL: 60 * 60 * 24 * 7 // 1 week
     },
     experimental: {
       optimizePackageImports: ['lucide-react', 'date-fns']
     },
     headers: async () => [
       {
         source: '/:all*(svg|jpg|png|webp|avif)',
         headers: [
           { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
         ]
       }
     ]
   }
   ```

2. **Add Responsive Image Sizes** — audit all `<Image>` components, add `sizes` prop for responsive breakpoints

3. **Add Dynamic Imports for Heavy Components** — lazy load gallery, booking calendar, Concierge Wizard steps

4. **Implement Caching Strategy** — `unstable_cache` for Payload queries (tours, pages), on-demand revalidation via `revalidateTag()` from CMS webhook (no time-based TTL)

5. **Add Preload Hints** — preconnect to Bokun API, Vercel Blob; preload critical fonts

6. **Fix CLS Issues** — aspect-ratio containers for images, min-height for text blocks, skeleton loaders

7. **Check Bundle Size** — review first-load JS in `npm run build` output, ensure < 200KB per route

### Part 2: Performance Monitoring

8. **Web Vitals Reporter** — `useReportWebVitals` hook for dev/prod metric collection + `/api/analytics/vitals` endpoint

9. **Lighthouse CI** — `lighthouserc.js` config for automated score assertions in GitHub Actions

### Part 3: Manual QA

10. **Execute Manual Testing Checklist** (see below) — document bugs, fix critical ones

## Manual Testing Checklist - HeritageGuiding MVP

### Browser Testing

#### Chrome (Latest) — Desktop
- [ ] Homepage loads correctly with hero, featured tours, CTA sections
- [ ] Tour catalog displays all tours with correct images
- [ ] Catalog filters work (category, duration, audience tags)
- [ ] Tour detail page renders with full content
- [ ] Bokun booking widget loads and is interactive
- [ ] Concierge Wizard completes 3-step flow, shows results
- [ ] Language switcher works (SV ↔ EN ↔ DE)
- [ ] All forms submit correctly (group inquiry, contact)
- [ ] Navigation menu works on all pages
- [ ] Footer links work
- [ ] Schema.org structured data validates (check via Rich Results Test)

#### Firefox (Latest) — Desktop
- [ ] All Chrome checklist items pass
- [ ] Date picker compatibility verified

#### Safari (Latest) — Desktop
- [ ] All Chrome checklist items pass
- [ ] WebP/AVIF image fallback works
- [ ] Date picker compatibility verified

#### Edge (Latest) — Desktop
- [ ] All Chrome checklist items pass

#### Safari iOS (iPhone 13+)
- [ ] Touch interactions work (swipe, tap, scroll)
- [ ] Mobile navigation hamburger menu functions
- [ ] Forms are usable with on-screen keyboard
- [ ] Bokun widget usable on mobile
- [ ] Keyboard doesn't break layout
- [ ] WhatsApp button visible and functional
- [ ] Concierge Wizard works on mobile
- [ ] Images load and are sized correctly

#### Chrome Android (Pixel/Samsung)
- [ ] All iOS checklist items pass
- [ ] Back button behavior correct

#### Tablet (iPad / Android tablet)
- [ ] Layout adapts correctly (not just stretched mobile)
- [ ] Tour catalog grid adjusts
- [ ] Forms are usable

### Functional Testing

#### Booking Flow (Bokun)
1. [ ] Select tour from catalog
2. [ ] View tour detail page
3. [ ] Bokun widget loads with availability
4. [ ] Select date and participants
5. [ ] Click book / proceed to checkout
6. [ ] Verify Bokun checkout flow works (TEST environment)

#### Group Inquiry
1. [ ] Navigate to group booking page
2. [ ] Fill out all required fields
3. [ ] Form validation shows errors for invalid input
4. [ ] Submit form successfully
5. [ ] Verify success message displayed
6. [ ] Check admin receives email notification
7. [ ] Check customer receives confirmation email
8. [ ] Verify inquiry stored in Payload CMS admin

#### Concierge Wizard
1. [ ] Navigate to /find-tour (or wizard entry point)
2. [ ] Step 1: Select interests/preferences
3. [ ] Step 2: Select group size / audience
4. [ ] Step 3: View recommendations
5. [ ] Click recommended tour → navigates to tour detail
6. [ ] Back navigation between steps works
7. [ ] Works in all 3 languages

#### Language Switching
1. [ ] Switch from SV to EN — content changes, URL updates
2. [ ] Switch from EN to DE — content changes, URL updates
3. [ ] Navigate to different page — language persists
4. [ ] Direct URL with locale works (e.g., /de/tours)
5. [ ] SEO meta tags update per locale
6. [ ] Hreflang tags present and correct

#### Static Pages
1. [ ] FAQ page loads with all questions
2. [ ] FAQ accordion expand/collapse works
3. [ ] About page renders with team/mission content
4. [ ] Terms & Privacy pages render
5. [ ] 404 page displays correctly

### Accessibility Testing (WCAG 2.1 AA)

- [ ] Run Lighthouse accessibility audit — score > 95
- [ ] Run axe DevTools browser extension scan — 0 critical issues
- [ ] Keyboard-only navigation: Tab through all interactive elements
- [ ] Focus indicators visible on all focusable elements
- [ ] Skip-to-content link works
- [ ] Screen reader test: VoiceOver (Mac/iOS) or NVDA (Windows)
- [ ] Color contrast ratio meets 4.5:1 (text) / 3:1 (large text)
- [ ] All images have meaningful alt text
- [ ] Form labels associated with inputs
- [ ] ARIA landmarks present (main, nav, footer)
- [ ] Bokun widget accessibility (best effort — third-party iframe)

### Performance Testing

- [ ] Lighthouse Performance > 90 (homepage)
- [ ] Lighthouse Performance > 90 (tour catalog)
- [ ] Lighthouse Performance > 90 (tour detail)
- [ ] LCP < 2.5s on mobile (simulated 3G)
- [ ] CLS < 0.1 on all pages
- [ ] No console errors in production build
- [ ] Images lazy load correctly (check Network tab)
- [ ] No render-blocking resources
- [ ] First load JS < 200KB

### SEO Validation

- [ ] Schema.org TourProduct markup validates on tour pages
- [ ] Schema.org FAQPage markup validates on FAQ
- [ ] Schema.org BreadcrumbList on all pages
- [ ] Open Graph tags present on all public pages
- [ ] Sitemap.xml accessible and contains all pages
- [ ] Robots.txt configured correctly
- [ ] Canonical URLs correct
- [ ] Hreflang tags correct across locales

## Todo List

### Performance
- [x] Configure Next.js image optimization
- [x] Add responsive image sizes to all Image components
- [x] Implement dynamic imports for heavy components
- [x] Set up caching strategy (unstable_cache + tags)
- [x] Add preload hints for critical resources
- [x] Fix CLS issues with aspect-ratio
- [x] Analyze and optimize bundle size
- [x] Run Lighthouse audit and fix issues
- [x] Test on slow 3G connection
- [x] Verify Core Web Vitals pass

### Manual QA
- [ ] Execute browser testing checklist (Chrome, Firefox, Safari, Edge)
- [ ] Execute mobile testing checklist (iOS, Android, tablet)
- [ ] Execute functional testing (booking, group inquiry, wizard, i18n, static pages)
- [ ] Execute accessibility testing (Lighthouse, axe, keyboard, screen reader)
- [ ] Execute performance testing (Lighthouse scores, CWV, bundle size)
- [ ] Execute SEO validation (Schema.org, OG, sitemap, hreflang)
- [ ] Document all bugs found with severity
- [ ] Fix all critical and high-severity bugs
- [ ] Re-test fixed bugs

### Monitoring
- [x] Implement Web Vitals reporter with useReportWebVitals
- [x] Create /api/analytics/vitals endpoint
- [x] Configure Lighthouse CI (lighthouserc.js + GitHub Actions)

### Deferred to Separate Plan
- ~~Set up Playwright for E2E tests~~ → [Playwright E2E Testing Plan](../260212-2142-playwright-e2e-testing/plan.md)

## Success Criteria

- [ ] Lighthouse Performance > 90 on all key pages
- [ ] Lighthouse Accessibility > 95
- [ ] LCP < 2.5s on mobile 3G
- [ ] CLS < 0.1 on all pages
- [ ] All browsers tested and working (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive on iOS, Android, tablet
- [ ] Booking flow works end-to-end via Bokun
- [ ] All forms submit correctly
- [ ] Concierge Wizard functional across languages
- [ ] No console errors in production build
- [ ] All critical/high bugs fixed
- [ ] SEO markup validated

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Poor mobile performance | Medium | High | Optimize images, reduce JS, test early |
| Browser compatibility | Medium | Medium | Test early, CSS fallbacks |
| Bokun widget issues on mobile | Medium | High | Test early, document limitations |
| Accessibility regressions | Low | High | axe audit + screen reader test |

## Security Considerations

- Don't expose performance metrics publicly
- Validate analytics data before processing
- Rate limit analytics endpoints if Web Vitals reporting added

## Validation Summary

**Validated:** 2026-02-15
**Questions asked:** 4

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| **Bundle analysis** | Skip @next/bundle-analyzer — trust Turbopack tree-shaking, check first-load JS in build output |
| **Cache revalidation** | On-demand only via `revalidateTag('tours')` from CMS webhook, no time-based TTL |
| **Monitoring** | Include both Web Vitals reporter + Lighthouse CI for MVP |
| **QA browser scope** | Full matrix: Chrome, Firefox, Safari, Edge desktop + iOS Safari + Chrome Android |

### Action Items (Plan Revisions Applied)
- [x] Step 7: Replace bundle analyzer with build output check
- [x] Step 4: Change caching from 5-min revalidation to on-demand only
- [x] Steps 8-9: Move Web Vitals + Lighthouse CI from "Optional" to required
- [x] Manual QA: Keep full browser matrix as-is

## Next Steps

After completion:
1. Proceed to [Phase 12: Documentation + Deployment](./phase-12-documentation-deployment.md)
2. Implement [Playwright E2E Testing](../260212-2142-playwright-e2e-testing/plan.md) (can run in parallel)
3. Deploy to production
