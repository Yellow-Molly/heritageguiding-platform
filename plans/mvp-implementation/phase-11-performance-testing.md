# Phase 11: Performance + Testing

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Vercel Performance Docs](https://vercel.com/docs/concepts/speed)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 32-40h |

Optimize Core Web Vitals, implement image optimization, code splitting, caching strategies. Conduct cross-browser testing, mobile responsiveness testing, accessibility audit, and booking flow QA.

## Key Insights

- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Next.js Image optimization automatic with `next/image`
- Server Components reduce client bundle
- Caching: Next.js Data Cache + React cache()
- Manual testing focus for MVP (E2E optional)

## Requirements

### Performance
- Lighthouse Performance score > 90
- LCP < 2.5 seconds
- FID < 100ms
- CLS < 0.1
- TTFB < 600ms
- Total bundle size < 200KB (first load)

### Testing
- Cross-browser: Chrome, Firefox, Safari, Edge
- Mobile devices: iOS Safari, Android Chrome
- Accessibility audit passes
- Booking flow works end-to-end
- All 3 language variants work
- Form submissions successful

## Architecture

### Performance Strategy

```
1. Image Optimization
   ├── next/image with automatic WebP
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

### Testing Matrix

```
Browsers
├── Chrome (latest)
├── Firefox (latest)
├── Safari (latest)
├── Edge (latest)
└── Safari iOS 15+

Devices
├── iPhone 13/14/15
├── iPad
├── Android phone (Pixel/Samsung)
├── Android tablet
└── Desktop (1920x1080)

Features
├── Homepage load
├── Tour catalog filters
├── Tour detail page
├── Booking flow
├── Group inquiry form
├── Language switching
├── WhatsApp button
└── Accessibility
```

## Related Code Files

### Create
- `apps/web/lib/performance/preload.ts` - Preload utilities
- `apps/web/lib/performance/bundle-analyzer.ts` - Analysis
- `scripts/lighthouse-ci.js` - CI performance tests
- `apps/web/__tests__/booking-flow.spec.ts` - E2E (optional)
- `docs/testing-checklist.md` - Manual test checklist

### Modify
- `next.config.ts` - Optimization settings
- `apps/web/app/[locale]/layout.tsx` - Preload hints
- Image components - Add sizes attribute

## Implementation Steps

### Part 1: Performance Optimization

1. **Configure Next.js Optimization**
   ```typescript
   // next.config.ts
   import type { NextConfig } from 'next'

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
           {
             key: 'Cache-Control',
             value: 'public, max-age=31536000, immutable'
           }
         ]
       }
     ]
   }

   export default nextConfig
   ```

2. **Implement Image Optimization**
   ```typescript
   // apps/web/components/optimized-image.tsx
   import Image from 'next/image'

   interface Props {
     src: string
     alt: string
     priority?: boolean
     fill?: boolean
     width?: number
     height?: number
     className?: string
   }

   export function OptimizedImage({
     src,
     alt,
     priority = false,
     fill = false,
     width,
     height,
     className
   }: Props) {
     // Calculate responsive sizes
     const sizes = fill
       ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
       : undefined

     return (
       <Image
         src={src}
         alt={alt}
         fill={fill}
         width={!fill ? width : undefined}
         height={!fill ? height : undefined}
         priority={priority}
         sizes={sizes}
         className={className}
         placeholder="blur"
         blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD..."
       />
     )
   }
   ```

3. **Add Dynamic Imports for Heavy Components**
   ```typescript
   // apps/web/app/[locale]/tours/[slug]/page.tsx
   import dynamic from 'next/dynamic'

   // Lazy load gallery (only needed when clicked)
   const TourGallery = dynamic(
     () => import('@/components/tour/tour-gallery'),
     {
       loading: () => <div className="aspect-video animate-pulse bg-muted" />,
       ssr: false
     }
   )

   // Lazy load booking calendar (not above fold)
   const AvailabilityCalendar = dynamic(
     () => import('@/components/booking/availability-calendar'),
     {
       loading: () => <div className="h-64 animate-pulse bg-muted" />
     }
   )
   ```

4. **Implement Caching Strategy**
   ```typescript
   // apps/web/lib/api/get-tours.ts
   import { unstable_cache } from 'next/cache'
   import { getPayload } from 'payload'

   export const getTours = unstable_cache(
     async (locale: string, filters: TourFilters) => {
       const payload = await getPayload({ config })
       const { docs } = await payload.find({
         collection: 'tours',
         locale,
         where: buildWhereClause(filters),
         depth: 2
       })
       return docs
     },
     ['tours'],
     {
       revalidate: 300, // 5 minutes
       tags: ['tours']
     }
   )

   // Revalidate on content update
   // apps/web/app/api/revalidate/route.ts
   import { revalidateTag } from 'next/cache'

   export async function POST(request: Request) {
     const { tag, secret } = await request.json()

     if (secret !== process.env.REVALIDATION_SECRET) {
       return Response.json({ error: 'Unauthorized' }, { status: 401 })
     }

     revalidateTag(tag)
     return Response.json({ revalidated: true })
   }
   ```

5. **Add Preload Hints**
   ```typescript
   // apps/web/app/[locale]/layout.tsx
   export default function LocaleLayout({ children }) {
     return (
       <html>
         <head>
           {/* Preconnect to external resources */}
           <link rel="preconnect" href="https://fonts.googleapis.com" />
           <link rel="preconnect" href="https://api.rezdy.com" />

           {/* DNS prefetch for images */}
           <link rel="dns-prefetch" href="https://res.cloudinary.com" />

           {/* Preload critical font */}
           <link
             rel="preload"
             href="/fonts/inter-var.woff2"
             as="font"
             type="font/woff2"
             crossOrigin="anonymous"
           />
         </head>
         <body>{children}</body>
       </html>
     )
   }
   ```

6. **Fix CLS Issues**
   ```typescript
   // Prevent layout shift with aspect-ratio
   // apps/web/components/tour/tour-card.tsx

   export function TourCard({ tour }) {
     return (
       <Card>
         {/* Fixed aspect ratio prevents CLS */}
         <div className="relative aspect-[4/3] overflow-hidden">
           <Image
             src={tour.image}
             alt={tour.title}
             fill
             className="object-cover"
           />
         </div>
         <CardContent>
           {/* Content with fixed heights where appropriate */}
           <h3 className="line-clamp-2 min-h-[3.5rem]">{tour.title}</h3>
         </CardContent>
       </Card>
     )
   }
   ```

7. **Configure Bundle Analyzer**
   ```bash
   npm install @next/bundle-analyzer
   ```

   ```typescript
   // next.config.ts
   import withBundleAnalyzer from '@next/bundle-analyzer'

   const withAnalyzer = withBundleAnalyzer({
     enabled: process.env.ANALYZE === 'true'
   })

   export default withAnalyzer(nextConfig)
   ```

   ```bash
   # Analyze bundle
   ANALYZE=true npm run build
   ```

### Part 2: Testing

8. **Create Manual Testing Checklist**
   ```markdown
   # Testing Checklist - HeritageGuiding MVP

   ## Browser Testing

   ### Chrome (Latest)
   - [ ] Homepage loads correctly
   - [ ] Tour catalog displays all tours
   - [ ] Filters work correctly
   - [ ] Tour detail page renders
   - [ ] Gallery lightbox opens
   - [ ] Booking section functional
   - [ ] Language switcher works
   - [ ] Forms submit correctly

   ### Firefox (Latest)
   - [ ] Same as Chrome checklist

   ### Safari (Latest)
   - [ ] Same as Chrome checklist
   - [ ] Check date picker compatibility

   ### Edge (Latest)
   - [ ] Same as Chrome checklist

   ### Safari iOS (iPhone)
   - [ ] Touch interactions work
   - [ ] Mobile navigation functions
   - [ ] Forms are usable
   - [ ] WhatsApp button visible
   - [ ] Keyboard doesn't break layout

   ### Chrome Android
   - [ ] Same as iOS checklist

   ## Functional Testing

   ### Booking Flow
   1. [ ] Select tour from catalog
   2. [ ] View tour details
   3. [ ] Check availability calendar
   4. [ ] Select date and time
   5. [ ] Click "Book Now"
   6. [ ] Verify redirect to Rezdy checkout

   ### Group Inquiry
   1. [ ] Navigate to group booking page
   2. [ ] Fill out all required fields
   3. [ ] Submit form
   4. [ ] Verify success message
   5. [ ] Check admin receives email
   6. [ ] Check customer receives confirmation

   ### Language Switching
   1. [ ] Switch from SV to EN
   2. [ ] Verify content changes
   3. [ ] Verify URL changes
   4. [ ] Switch to DE
   5. [ ] Navigate to different page
   6. [ ] Verify language persists

   ## Accessibility Testing

   - [ ] Run Lighthouse accessibility audit
   - [ ] Run axe DevTools scan
   - [ ] Test keyboard-only navigation
   - [ ] Test with VoiceOver (Mac/iOS)
   - [ ] Test with NVDA (Windows)
   - [ ] Verify focus indicators visible
   - [ ] Check color contrast

   ## Performance Testing

   - [ ] Lighthouse Performance > 90
   - [ ] LCP < 2.5s on mobile
   - [ ] CLS < 0.1
   - [ ] No console errors
   - [ ] Images lazy load correctly
   ```

9. **Set Up Lighthouse CI (Optional)**
   ```javascript
   // lighthouserc.js
   module.exports = {
     ci: {
       collect: {
         url: [
           'http://localhost:3000/',
           'http://localhost:3000/en/tours',
           'http://localhost:3000/en/tours/sample-tour'
         ],
         numberOfRuns: 3
       },
       assert: {
         assertions: {
           'categories:performance': ['error', { minScore: 0.9 }],
           'categories:accessibility': ['error', { minScore: 0.95 }],
           'categories:seo': ['error', { minScore: 0.95 }],
           'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
           'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
           'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
         }
       },
       upload: {
         target: 'temporary-public-storage'
       }
     }
   }
   ```

10. **Create E2E Test (Optional with Playwright)**
    ```typescript
    // apps/web/__tests__/booking-flow.spec.ts
    import { test, expect } from '@playwright/test'

    test.describe('Booking Flow', () => {
      test('user can view tour and initiate booking', async ({ page }) => {
        // Navigate to tour catalog
        await page.goto('/en/tours')

        // Wait for tours to load
        await expect(page.getByRole('article')).toHaveCount.above(0)

        // Click first tour
        await page.getByRole('article').first().click()

        // Verify on tour detail page
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        // Check booking section exists
        await expect(page.getByText('Book This Tour')).toBeVisible()

        // Verify price is displayed
        await expect(page.getByText(/SEK/)).toBeVisible()
      })

      test('language switcher changes content', async ({ page }) => {
        await page.goto('/sv')

        // Switch to English
        await page.getByRole('button', { name: /language/i }).click()
        await page.getByRole('menuitem', { name: 'English' }).click()

        // Verify URL changed
        await expect(page).toHaveURL('/en')

        // Verify content changed (navigation should be in English)
        await expect(page.getByRole('link', { name: 'Tours' })).toBeVisible()
      })
    })
    ```

11. **Performance Monitoring Setup**
    ```typescript
    // apps/web/lib/performance/web-vitals.ts
    'use client'

    import { useReportWebVitals } from 'next/web-vitals'

    export function WebVitalsReporter() {
      useReportWebVitals((metric) => {
        // Send to analytics
        if (process.env.NODE_ENV === 'production') {
          const body = {
            name: metric.name,
            value: metric.value,
            id: metric.id
          }

          // Send to your analytics endpoint
          navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(body))
        }

        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(metric)
        }
      })

      return null
    }
    ```

## Todo List

### Performance
- [ ] Configure Next.js image optimization
- [ ] Add responsive image sizes
- [ ] Implement dynamic imports for heavy components
- [ ] Set up caching strategy (unstable_cache)
- [ ] Add preload hints for critical resources
- [ ] Fix CLS issues with aspect-ratio
- [ ] Analyze and optimize bundle size
- [ ] Run Lighthouse audit and fix issues
- [ ] Test on slow 3G connection
- [ ] Verify Core Web Vitals pass

### Testing
- [ ] Create manual testing checklist
- [ ] Test all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test mobile devices (iOS, Android)
- [ ] Test booking flow end-to-end
- [ ] Test group inquiry form
- [ ] Test language switching
- [ ] Run accessibility audit (axe)
- [ ] Test with screen reader
- [ ] Test keyboard-only navigation
- [ ] Document any bugs found
- [ ] Fix all critical bugs

### Optional
- [ ] Set up Playwright for E2E tests
- [ ] Configure Lighthouse CI
- [ ] Add Web Vitals reporting

## Success Criteria

- [ ] Lighthouse Performance > 90 on all pages
- [ ] Lighthouse Accessibility > 95
- [ ] LCP < 2.5s on mobile 3G
- [ ] CLS < 0.1 on all pages
- [ ] All browsers tested and working
- [ ] Mobile responsive on all devices
- [ ] Booking flow works end-to-end
- [ ] All forms submit correctly
- [ ] No console errors in production
- [ ] All critical bugs fixed

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Poor mobile performance | Medium | High | Optimize images, reduce JS |
| Browser compatibility issues | Medium | Medium | Test early, use polyfills |
| Accessibility failures | Medium | High | Regular audits, screen reader testing |

## Security Considerations

- Don't expose performance metrics publicly
- Validate analytics data before processing
- Rate limit analytics endpoints

## Next Steps

After completion:
1. Proceed to [Phase 12: Documentation + Deployment](./phase-12-documentation-deployment.md)
2. Create CMS user guide
3. Deploy to production
