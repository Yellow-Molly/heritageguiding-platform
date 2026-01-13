# Phase 05: Homepage

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Design System](./phase-04-design-system.md)
- [Data Models](./phase-03-data-models-cms-schema.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 20-24h |

Build responsive homepage with hero section, featured tours carousel, trust signals, and clear CTAs. Server-rendered for SEO with localized content.

## Key Insights

- Server Component for SEO and performance
- Featured tours fetched from Payload CMS
- Trust signals: expert credentials, reviews count, certifications
- Hero image optimization with Next.js Image
- AI-first: structured data for discoverability

## Requirements

### Functional
- Hero section with compelling headline and CTA
- Featured tours grid (3-6 tours)
- Trust signals section (reviews, certifications)
- Quick navigation to tour categories
- Language-aware content from CMS

### Non-Functional
- Largest Contentful Paint < 2.5s
- Above-the-fold content SSR
- Responsive: mobile, tablet, desktop
- Accessible navigation and CTAs

## Architecture

### Page Structure

```
Homepage
├── Header (nav, language switcher)
├── Hero Section
│   ├── Background image
│   ├── Headline (localized)
│   ├── Subheadline
│   └── CTA buttons
├── Featured Tours
│   ├── Section heading
│   └── Tour cards grid (3-6)
├── Trust Signals
│   ├── Reviews count
│   ├── Expert credentials
│   └── Certifications
├── Category Navigation
│   ├── By theme
│   └── By neighborhood
└── Footer
```

## Related Code Files

### Create
- `apps/web/app/[locale]/page.tsx` - Homepage
- `apps/web/components/home/hero-section.tsx` - Hero
- `apps/web/components/home/featured-tours.tsx` - Tours grid
- `apps/web/components/home/trust-signals.tsx` - Social proof
- `apps/web/components/home/category-nav.tsx` - Quick links
- `apps/web/components/tour/tour-card.tsx` - Tour card
- `apps/web/lib/api/get-featured-tours.ts` - Data fetching
- `apps/web/lib/api/get-trust-stats.ts` - Stats fetching

### Modify
- `messages/sv.json` - Swedish homepage strings
- `messages/en.json` - English homepage strings
- `messages/de.json` - German homepage strings

## Implementation Steps

1. **Create Homepage Server Component**
   ```typescript
   // apps/web/app/[locale]/page.tsx
   import { getTranslations } from 'next-intl/server'
   import { HeroSection } from '@/components/home/hero-section'
   import { FeaturedTours } from '@/components/home/featured-tours'
   import { TrustSignals } from '@/components/home/trust-signals'
   import { CategoryNav } from '@/components/home/category-nav'
   import { getFeaturedTours } from '@/lib/api/get-featured-tours'

   export default async function HomePage({ params: { locale } }) {
     const t = await getTranslations('home')
     const tours = await getFeaturedTours(locale, 6)

     return (
       <main>
         <HeroSection />
         <FeaturedTours tours={tours} />
         <TrustSignals />
         <CategoryNav />
       </main>
     )
   }

   export async function generateMetadata({ params: { locale } }) {
     const t = await getTranslations('home')
     return {
       title: t('meta.title'),
       description: t('meta.description')
     }
   }
   ```

2. **Build Hero Section**
   ```typescript
   // apps/web/components/home/hero-section.tsx
   import Image from 'next/image'
   import { useTranslations } from 'next-intl'
   import { Button } from '@/components/ui/button'
   import { Link } from '@/i18n/routing'

   export function HeroSection() {
     const t = useTranslations('home.hero')

     return (
       <section className="relative h-[70vh] min-h-[500px]">
         <Image
           src="/images/stockholm-hero.jpg"
           alt={t('imageAlt')}
           fill
           priority
           className="object-cover"
         />
         <div className="absolute inset-0 bg-black/40" />
         <div className="container relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
           <h1 className="max-w-3xl text-4xl font-bold sm:text-5xl lg:text-6xl">
             {t('headline')}
           </h1>
           <p className="mt-4 max-w-xl text-lg sm:text-xl">
             {t('subheadline')}
           </p>
           <div className="mt-8 flex gap-4">
             <Button asChild size="lg">
               <Link href="/tours">{t('cta.explore')}</Link>
             </Button>
             <Button asChild variant="outline" size="lg">
               <Link href="/contact">{t('cta.contact')}</Link>
             </Button>
           </div>
         </div>
       </section>
     )
   }
   ```

3. **Build Featured Tours Grid**
   ```typescript
   // apps/web/components/home/featured-tours.tsx
   import { TourCard } from '@/components/tour/tour-card'
   import { useTranslations } from 'next-intl'

   export function FeaturedTours({ tours }) {
     const t = useTranslations('home.featured')

     return (
       <section className="py-16">
         <div className="container">
           <h2 className="text-center text-3xl font-bold">
             {t('heading')}
           </h2>
           <p className="mt-2 text-center text-muted-foreground">
             {t('subheading')}
           </p>
           <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {tours.map((tour) => (
               <TourCard key={tour.id} tour={tour} />
             ))}
           </div>
         </div>
       </section>
     )
   }
   ```

4. **Create Tour Card Component**
   ```typescript
   // apps/web/components/tour/tour-card.tsx
   import Image from 'next/image'
   import { Link } from '@/i18n/routing'
   import { Card, CardContent, CardFooter } from '@/components/ui/card'
   import { Badge } from '@/components/ui/badge'
   import { RatingStars } from '@/components/shared/rating-stars'
   import { AccessibilityBadge } from '@/components/shared/accessibility-badge'
   import { Clock, Users } from 'lucide-react'

   export function TourCard({ tour }) {
     return (
       <Card className="overflow-hidden">
         <div className="relative aspect-[4/3]">
           <Image
             src={tour.gallery[0]?.image.url}
             alt={tour.gallery[0]?.image.alt}
             fill
             className="object-cover"
           />
           {tour.accessibility?.wheelchairAccessible && (
             <AccessibilityBadge type="wheelchair" className="absolute right-2 top-2" />
           )}
         </div>
         <CardContent className="p-4">
           <h3 className="font-semibold">{tour.title}</h3>
           <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
             {tour.description}
           </p>
           <div className="mt-3 flex items-center gap-4 text-sm">
             <span className="flex items-center gap-1">
               <Clock className="h-4 w-4" />
               {tour.duration} min
             </span>
             <span className="flex items-center gap-1">
               <Users className="h-4 w-4" />
               Max {tour.maxCapacity}
             </span>
           </div>
         </CardContent>
         <CardFooter className="flex items-center justify-between p-4 pt-0">
           <span className="text-lg font-bold">{tour.price} SEK</span>
           <Link
             href={`/tours/${tour.slug}`}
             className="text-primary hover:underline"
           >
             View details
           </Link>
         </CardFooter>
       </Card>
     )
   }
   ```

5. **Build Trust Signals Section**
   ```typescript
   // apps/web/components/home/trust-signals.tsx
   import { Star, Award, Shield } from 'lucide-react'

   const stats = [
     { icon: Star, value: '4.9', label: 'Average Rating' },
     { icon: Award, value: '500+', label: 'Tours Completed' },
     { icon: Shield, value: '100%', label: 'Licensed Guides' }
   ]

   export function TrustSignals() {
     return (
       <section className="bg-muted py-12">
         <div className="container">
           <div className="grid gap-8 sm:grid-cols-3">
             {stats.map((stat) => (
               <div key={stat.label} className="flex flex-col items-center text-center">
                 <stat.icon className="h-10 w-10 text-accent" />
                 <span className="mt-2 text-3xl font-bold">{stat.value}</span>
                 <span className="text-muted-foreground">{stat.label}</span>
               </div>
             ))}
           </div>
         </div>
       </section>
     )
   }
   ```

6. **Build Category Navigation**
   ```typescript
   // apps/web/components/home/category-nav.tsx
   import { Link } from '@/i18n/routing'
   import { getCategories } from '@/lib/api/get-categories'

   export async function CategoryNav() {
     const themes = await getCategories('theme')
     const neighborhoods = await getCategories('neighborhood')

     return (
       <section className="py-16">
         <div className="container">
           <h2 className="text-2xl font-bold">Explore by Theme</h2>
           <div className="mt-6 flex flex-wrap gap-3">
             {themes.map((cat) => (
               <Link
                 key={cat.id}
                 href={`/tours?category=${cat.slug}`}
                 className="rounded-full border px-4 py-2 hover:bg-muted"
               >
                 {cat.name}
               </Link>
             ))}
           </div>
           <h2 className="mt-10 text-2xl font-bold">Explore by Area</h2>
           <div className="mt-6 flex flex-wrap gap-3">
             {neighborhoods.map((cat) => (
               <Link
                 key={cat.id}
                 href={`/tours?category=${cat.slug}`}
                 className="rounded-full border px-4 py-2 hover:bg-muted"
               >
                 {cat.name}
               </Link>
             ))}
           </div>
         </div>
       </section>
     )
   }
   ```

7. **Create Data Fetching Functions**
   ```typescript
   // apps/web/lib/api/get-featured-tours.ts
   import { getPayload } from 'payload'
   import config from '@payload-config'

   export async function getFeaturedTours(locale: string, limit = 6) {
     const payload = await getPayload({ config })
     const { docs } = await payload.find({
       collection: 'tours',
       where: { status: { equals: 'published' } },
       limit,
       locale,
       depth: 2
     })
     return docs
   }
   ```

8. **Add Translation Strings**
   ```json
   // messages/en.json
   {
     "home": {
       "meta": {
         "title": "HeritageGuiding - Expert-Led Stockholm Tours",
         "description": "Discover Stockholm with certified local guides..."
       },
       "hero": {
         "headline": "Experience Stockholm Like Never Before",
         "subheadline": "Expert-guided tours revealing the hidden stories...",
         "imageAlt": "Panoramic view of Stockholm",
         "cta": {
           "explore": "Explore Tours",
           "contact": "Contact Us"
         }
       },
       "featured": {
         "heading": "Popular Tours",
         "subheading": "Our most loved experiences"
       }
     }
   }
   ```

9. **Optimize Images**
   - Use `priority` for hero image
   - Use `sizes` attribute for responsive images
   - Configure `next.config.ts` for image domains

10. **Add Schema.org Markup**
    ```typescript
    // apps/web/app/[locale]/page.tsx
    export default async function HomePage() {
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'TravelAgency',
                name: 'HeritageGuiding',
                description: 'Expert-led Stockholm tours',
                url: 'https://heritageguiding.com'
              })
            }}
          />
          <main>...</main>
        </>
      )
    }
    ```

## Todo List

- [ ] Create homepage Server Component
- [ ] Build HeroSection with responsive image
- [ ] Build FeaturedTours grid component
- [ ] Create TourCard component
- [ ] Build TrustSignals section
- [ ] Build CategoryNav component
- [ ] Create getFeaturedTours API function
- [ ] Create getCategories API function
- [ ] Add Swedish translation strings
- [ ] Add English translation strings
- [ ] Add German translation strings
- [ ] Optimize hero image (WebP, sizes)
- [ ] Add Schema.org TravelAgency markup
- [ ] Generate SEO metadata
- [ ] Test responsive layouts
- [ ] Verify LCP < 2.5s

## Success Criteria

- [ ] Homepage loads in all 3 locales
- [ ] Featured tours display from CMS
- [ ] Hero image optimized and lazy-loaded
- [ ] Trust signals section visible
- [ ] Category navigation works
- [ ] Mobile layout responsive
- [ ] Lighthouse performance score > 90
- [ ] Schema.org markup validates

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No tour content yet | High | Medium | Use placeholder content |
| Hero image too large | Medium | Medium | Optimize before deploy |
| CMS connection errors | Low | High | Add error boundaries |

## Security Considerations

- Validate CMS content before rendering
- Use next/image for external images (domain whitelist)
- Sanitize rich text content

## Next Steps

After completion:
1. Proceed to [Phase 06: Tour Catalog](./phase-06-tour-catalog.md)
2. Build tour listing with filters
3. Implement search and sorting
