# Phase 10: Accessibility + SEO

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Schema.org Tourism Types](https://schema.org/TouristAttraction)
- [Google SEO Documentation](https://developers.google.com/search/docs)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 42-52h |

Implement WCAG 2.1 Level AA compliance, comprehensive SEO foundation including meta tags, Open Graph, sitemaps, and Schema.org structured data for AI discoverability.

## Key Insights

- WCAG 2.1 AA: keyboard nav, focus management, color contrast, screen readers
- Schema.org: TouristAttraction, Person, Organization, AggregateRating
- AI-first: structured data crucial for ChatGPT, Perplexity discoverability
- hreflang tags for multi-language SEO
- Core Web Vitals affect search ranking

## Requirements

### Functional - Accessibility
- Skip to content link
- Keyboard navigation for all interactions
- Focus indicators (visible, consistent)
- Screen reader support (ARIA labels)
- Color contrast 4.5:1 (AA)
- Reduced motion preference support
- Form error announcements

### Functional - SEO
- Meta title/description per page
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs
- hreflang for language variants
- XML sitemap
- robots.txt
- Google Business Profile integration

### Functional - Schema.org
- TouristAttraction for tours
- Person for guides
- Organization for HeritageGuiding
- AggregateRating for reviews
- Offer for pricing

### Non-Functional
- Lighthouse Accessibility score > 95
- Lighthouse SEO score > 95
- Schema.org validates without errors
- 0 WCAG 2.1 AA violations

## Architecture

### Accessibility Layer

```
Layout
├── Skip to content link
├── Header (nav with keyboard support)
├── Main content (#main)
│   ├── Focus management on route change
│   └── ARIA live regions for updates
└── Footer (keyboard accessible)

Forms
├── Labels linked to inputs
├── Error messages with aria-describedby
├── Required field indicators
└── Submit button state announcements
```

### SEO Structure

```
app/
├── sitemap.ts           # Dynamic XML sitemap
├── robots.ts            # robots.txt
└── [locale]/
    ├── layout.tsx       # hreflang + base meta
    ├── page.tsx         # Per-page metadata
    └── tours/
        └── [slug]/
            └── page.tsx # Tour-specific Schema.org
```

## Related Code Files

### Create
- `apps/web/components/accessibility/skip-link.tsx` - Skip nav
- `apps/web/components/accessibility/focus-trap.tsx` - Modal focus
- `apps/web/components/accessibility/visually-hidden.tsx` - SR only
- `apps/web/lib/accessibility/announce.ts` - ARIA live announcer
- `apps/web/app/sitemap.ts` - XML sitemap generator
- `apps/web/app/robots.ts` - robots.txt generator
- `apps/web/components/seo/json-ld.tsx` - Schema.org wrapper
- `apps/web/components/seo/organization-schema.tsx` - Org markup
- `apps/web/components/seo/tour-schema.tsx` - Tour markup
- `apps/web/lib/seo/generate-metadata.ts` - Metadata helper

### Modify
- `apps/web/app/[locale]/layout.tsx` - Add skip link, hreflang
- `apps/web/components/layout/header.tsx` - Keyboard nav
- `apps/web/components/ui/*.tsx` - ARIA attributes
- `apps/web/styles/globals.css` - Focus styles
- `tailwind.config.ts` - Motion-safe utilities

## Implementation Steps

### Part 1: Accessibility (WCAG 2.1 AA)

1. **Add Skip to Content Link**
   ```typescript
   // apps/web/components/accessibility/skip-link.tsx
   export function SkipLink() {
     return (
       <a
         href="#main"
         className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
       >
         Skip to main content
       </a>
     )
   }
   ```

2. **Implement Focus Management**
   ```typescript
   // apps/web/lib/accessibility/use-focus-on-route-change.ts
   'use client'

   import { useEffect } from 'react'
   import { usePathname } from 'next/navigation'

   export function useFocusOnRouteChange() {
     const pathname = usePathname()

     useEffect(() => {
       // Focus main content on route change
       const main = document.getElementById('main')
       if (main) {
         main.tabIndex = -1
         main.focus()
         main.removeAttribute('tabindex')
       }
     }, [pathname])
   }
   ```

3. **Create ARIA Live Announcer**
   ```typescript
   // apps/web/lib/accessibility/announce.ts
   export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
     const announcer = document.getElementById('aria-announcer')
     if (announcer) {
       announcer.setAttribute('aria-live', priority)
       announcer.textContent = message
       // Clear after announcement
       setTimeout(() => {
         announcer.textContent = ''
       }, 1000)
     }
   }

   // In layout
   <div
     id="aria-announcer"
     role="status"
     aria-live="polite"
     className="sr-only"
   />
   ```

4. **Add Keyboard Navigation to Header**
   ```typescript
   // apps/web/components/layout/header.tsx (accessibility update)
   'use client'

   import { useRef } from 'react'

   export function Navigation() {
     const navRef = useRef<HTMLElement>(null)

     const handleKeyDown = (e: React.KeyboardEvent) => {
       const items = navRef.current?.querySelectorAll('a, button')
       if (!items) return

       const currentIndex = Array.from(items).indexOf(document.activeElement as Element)

       switch (e.key) {
         case 'ArrowRight':
           (items[(currentIndex + 1) % items.length] as HTMLElement).focus()
           break
         case 'ArrowLeft':
           (items[(currentIndex - 1 + items.length) % items.length] as HTMLElement).focus()
           break
         case 'Home':
           (items[0] as HTMLElement).focus()
           break
         case 'End':
           (items[items.length - 1] as HTMLElement).focus()
           break
       }
     }

     return (
       <nav
         ref={navRef}
         role="navigation"
         aria-label="Main navigation"
         onKeyDown={handleKeyDown}
       >
         {/* Navigation items */}
       </nav>
     )
   }
   ```

5. **Enhance Focus Styles**
   ```css
   /* apps/web/styles/globals.css */
   @layer base {
     /* High-contrast focus ring */
     *:focus-visible {
       @apply outline-none ring-2 ring-primary ring-offset-2 ring-offset-background;
     }

     /* Ensure focus visible in dark backgrounds */
     .dark *:focus-visible {
       @apply ring-offset-slate-900;
     }
   }

   /* Reduced motion preference */
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

6. **Add ARIA to Form Components**
   ```typescript
   // apps/web/components/ui/input.tsx (accessibility update)
   interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
     error?: string
     description?: string
   }

   export function Input({ error, description, id, ...props }: InputProps) {
     const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
     const errorId = `${inputId}-error`
     const descId = `${inputId}-desc`

     return (
       <div>
         <input
           id={inputId}
           aria-invalid={error ? 'true' : undefined}
           aria-describedby={
             [error && errorId, description && descId].filter(Boolean).join(' ') || undefined
           }
           {...props}
         />
         {description && (
           <p id={descId} className="text-sm text-muted-foreground">
             {description}
           </p>
         )}
         {error && (
           <p id={errorId} className="text-sm text-destructive" role="alert">
             {error}
           </p>
         )}
       </div>
     )
   }
   ```

7. **Create VisuallyHidden Component**
   ```typescript
   // apps/web/components/accessibility/visually-hidden.tsx
   export function VisuallyHidden({ children }: { children: React.ReactNode }) {
     return (
       <span className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
         {children}
       </span>
     )
   }
   ```

### Part 2: SEO Foundation

8. **Create Dynamic Sitemap**
   ```typescript
   // apps/web/app/sitemap.ts
   import { MetadataRoute } from 'next'
   import { getAllTourSlugs } from '@/lib/api/get-all-tour-slugs'

   const BASE_URL = 'https://heritageguiding.com'
   const LOCALES = ['sv', 'en', 'de']

   export default async function sitemap(): MetadataRoute.Sitemap {
     const tours = await getAllTourSlugs()

     const staticPages = [
       '',
       '/tours',
       '/about',
       '/contact',
       '/group-booking'
     ]

     const staticUrls = LOCALES.flatMap((locale) =>
       staticPages.map((page) => ({
         url: `${BASE_URL}/${locale}${page}`,
         lastModified: new Date(),
         changeFrequency: 'weekly' as const,
         priority: page === '' ? 1 : 0.8
       }))
     )

     const tourUrls = LOCALES.flatMap((locale) =>
       tours.map((tour) => ({
         url: `${BASE_URL}/${locale}/tours/${tour.slug}`,
         lastModified: new Date(tour.updatedAt),
         changeFrequency: 'weekly' as const,
         priority: 0.9
       }))
     )

     return [...staticUrls, ...tourUrls]
   }
   ```

9. **Create robots.txt**
   ```typescript
   // apps/web/app/robots.ts
   import { MetadataRoute } from 'next'

   export default function robots(): MetadataRoute.Robots {
     return {
       rules: [
         {
           userAgent: '*',
           allow: '/',
           disallow: ['/admin/', '/api/']
         }
       ],
       sitemap: 'https://heritageguiding.com/sitemap.xml'
     }
   }
   ```

10. **Add hreflang to Layout**
    ```typescript
    // apps/web/app/[locale]/layout.tsx
    export async function generateMetadata({ params: { locale } }) {
      return {
        alternates: {
          canonical: `https://heritageguiding.com/${locale}`,
          languages: {
            'sv': 'https://heritageguiding.com/sv',
            'en': 'https://heritageguiding.com/en',
            'de': 'https://heritageguiding.com/de',
            'x-default': 'https://heritageguiding.com/sv'
          }
        }
      }
    }
    ```

11. **Create Metadata Helper**
    ```typescript
    // apps/web/lib/seo/generate-metadata.ts
    import { Metadata } from 'next'

    interface MetadataParams {
      title: string
      description: string
      locale: string
      path: string
      image?: string
    }

    export function generatePageMetadata({
      title,
      description,
      locale,
      path,
      image
    }: MetadataParams): Metadata {
      const url = `https://heritageguiding.com/${locale}${path}`

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url,
          siteName: 'HeritageGuiding',
          locale,
          type: 'website',
          images: image ? [{ url: image, width: 1200, height: 630 }] : undefined
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: image ? [image] : undefined
        },
        alternates: {
          canonical: url,
          languages: {
            'sv': `https://heritageguiding.com/sv${path}`,
            'en': `https://heritageguiding.com/en${path}`,
            'de': `https://heritageguiding.com/de${path}`
          }
        }
      }
    }
    ```

### Part 3: Schema.org Structured Data

12. **Create JSON-LD Wrapper**
    ```typescript
    // apps/web/components/seo/json-ld.tsx
    interface JsonLdProps {
      data: Record<string, unknown>
    }

    export function JsonLd({ data }: JsonLdProps) {
      return (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      )
    }
    ```

13. **Create Organization Schema**
    ```typescript
    // apps/web/components/seo/organization-schema.tsx
    import { JsonLd } from './json-ld'

    export function OrganizationSchema() {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        name: 'HeritageGuiding',
        description: 'Expert-led guided tours in Stockholm, Sweden',
        url: 'https://heritageguiding.com',
        logo: 'https://heritageguiding.com/logo.png',
        sameAs: [
          'https://www.instagram.com/heritageguiding',
          'https://www.facebook.com/heritageguiding'
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Stockholm',
          addressCountry: 'SE'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['Swedish', 'English', 'German']
        }
      }

      return <JsonLd data={data} />
    }
    ```

14. **Create Tour Schema**
    ```typescript
    // apps/web/components/seo/tour-schema.tsx
    import { JsonLd } from './json-ld'
    import { Tour, Review } from '@/payload-types'

    interface Props {
      tour: Tour
      reviews: Review[]
    }

    export function TourSchema({ tour, reviews }: Props) {
      const averageRating = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null

      const data = {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: tour.title,
        description: tour.description,
        image: tour.gallery?.[0]?.image?.url,
        url: `https://heritageguiding.com/tours/${tour.slug}`,
        touristType: tour.categories?.map((c) => c.name),
        isAccessibleForFree: false,
        publicAccess: true,
        ...(tour.accessibility?.wheelchairAccessible && {
          accessibilityFeature: ['Wheelchair accessible']
        }),
        ...(averageRating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating.toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1
          }
        }),
        offers: {
          '@type': 'Offer',
          price: tour.price,
          priceCurrency: 'SEK',
          availability: 'https://schema.org/InStock',
          validFrom: new Date().toISOString()
        },
        provider: {
          '@type': 'TravelAgency',
          name: 'HeritageGuiding',
          url: 'https://heritageguiding.com'
        }
      }

      // Add guide (Person) schema
      if (tour.guide) {
        data.organizer = {
          '@type': 'Person',
          name: tour.guide.name,
          description: tour.guide.bio,
          image: tour.guide.photo?.url,
          jobTitle: 'Tour Guide'
        }
      }

      return <JsonLd data={data} />
    }
    ```

15. **Add Breadcrumb Schema**
    ```typescript
    // apps/web/components/seo/breadcrumb-schema.tsx
    import { JsonLd } from './json-ld'

    interface BreadcrumbItem {
      name: string
      url: string
    }

    export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      }

      return <JsonLd data={data} />
    }
    ```

## Todo List

### Accessibility
- [ ] Add skip to content link
- [ ] Implement focus management on route change
- [ ] Create ARIA live announcer
- [ ] Add keyboard navigation to header
- [ ] Enhance focus styles (visible ring)
- [ ] Add reduced motion support
- [ ] Add ARIA attributes to form components
- [ ] Create VisuallyHidden component
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Run Lighthouse accessibility audit
- [ ] Fix all contrast issues

### SEO
- [ ] Create dynamic XML sitemap
- [ ] Create robots.txt
- [ ] Add hreflang tags to layout
- [ ] Create metadata helper function
- [ ] Add Open Graph tags to all pages
- [ ] Add Twitter Card tags
- [ ] Configure canonical URLs
- [ ] Submit sitemap to Google Search Console

### Schema.org
- [ ] Create JSON-LD wrapper component
- [ ] Add Organization schema to homepage
- [ ] Add TouristAttraction schema to tour pages
- [ ] Add Person schema for guides
- [ ] Add AggregateRating schema
- [ ] Add Breadcrumb schema
- [ ] Validate all schemas on schema.org validator
- [ ] Test rich results in Google Search Console

## Success Criteria

- [ ] Lighthouse Accessibility score > 95
- [ ] Lighthouse SEO score > 95
- [ ] 0 WCAG 2.1 AA violations (axe DevTools)
- [ ] Schema.org validates without errors
- [ ] hreflang tags present for all languages
- [ ] Sitemap accessible at /sitemap.xml
- [ ] All images have alt text
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all elements
- [ ] Rich results preview works in Google

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hidden accessibility issues | Medium | High | Regular audits, screen reader testing |
| Schema validation errors | Medium | Medium | Validate before deploy |
| Missing hreflang | Low | Medium | Automated testing in CI |

## Security Considerations

- Sanitize all user content in Schema.org
- Validate URLs before including in sitemap
- Ensure robots.txt doesn't expose sensitive paths

## Next Steps

After completion:
1. Proceed to [Phase 11: Performance + Testing](./phase-11-performance-testing.md)
2. Core Web Vitals optimization
3. Cross-browser testing
