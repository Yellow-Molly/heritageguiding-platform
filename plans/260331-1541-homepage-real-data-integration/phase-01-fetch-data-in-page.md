---
phase: 1
title: "Fetch CMS Data in Homepage Server Component"
status: todo
priority: high
effort: 30m
---

# Phase 1: Fetch CMS Data in Homepage Server Component

## Overview

Update `page.tsx` to fetch tours, guides, and guide count from Payload CMS, then pass as props to child components.

## Related Files
- **Modify**: `apps/web/app/(site)/[locale]/(frontend)/page.tsx`
- **Import from**: `apps/web/lib/api/get-featured-tours.ts`, `apps/web/lib/api/get-guides.ts`

## Implementation Steps

1. Import `getFeaturedTours` and `getGuides` in page.tsx
2. Extract `locale` from page params in the `HomePage` component (already available in `generateMetadata`)
3. Fetch in parallel using `Promise.all`:
   - `getFeaturedTours(locale, 3)` — returns `FeaturedTour[]`
   - `getGuides({ limit: '4' }, locale)` — returns `GuidesResponse` (use `.guides` and `.total`)
4. Pass data as props:
   - `<FeaturedTours tours={featuredTours} />`
   - `<GuidesPreview guides={guides} />`
   - `<TrustSignals guideCount={totalGuides} />`
5. Update `HomePage` to accept `params` prop for locale extraction

## Code Sketch

```tsx
import { getFeaturedTours } from '@/lib/api/get-featured-tours'
import { getGuides } from '@/lib/api/get-guides'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [featuredTours, guidesResponse] = await Promise.all([
    getFeaturedTours(locale, 3),
    getGuides({ limit: '4' }, locale),
  ])

  return (
    <>
      <TravelAgencySchema />
      <Header />
      <main>
        <HeroSection />
        <TrustSignals guideCount={guidesResponse.total} />
        <VideoHighlight />
        <FeaturedTours tours={featuredTours} />
        <SeasonalCta />
        <GuidesPreview guides={guidesResponse.guides} />
        <Testimonials />
        <LatestPosts />
      </main>
      <Footer />
    </>
  )
}
```

## Success Criteria
- [ ] Page fetches real data server-side
- [ ] No client-side fetch waterfalls
- [ ] Props passed correctly to child components
- [ ] Build compiles without errors
