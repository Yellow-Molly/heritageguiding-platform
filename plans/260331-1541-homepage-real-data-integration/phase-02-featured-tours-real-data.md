---
phase: 2
title: "FeaturedTours: Accept Real Tour Data as Props"
status: todo
priority: high
effort: 45m
---

# Phase 2: FeaturedTours — Real CMS Data

## Overview

Replace hardcoded `featuredTours` array with props from server component. Keep `'use client'` for IntersectionObserver animations.

## Related Files
- **Modify**: `apps/web/components/home/featured-tours.tsx`
- **Reference**: `apps/web/lib/api/get-featured-tours.ts` (FeaturedTour interface)

## Implementation Steps

1. Import `FeaturedTour` type from `@/lib/api/get-featured-tours`
2. Add props interface: `{ tours: FeaturedTour[] }`
3. Remove hardcoded `featuredTours` array and local `Tour` interface
4. Update `TourCard` to use `FeaturedTour` shape:
   - `tour.image` → `tour.image.url` (CMS returns `{ url, alt }` object)
   - `tour.id` → `tour.slug` for links (`/tours/${tour.slug}`)
   - `tour.rating`, `tour.reviewCount`, `tour.price` already match
5. Update image `alt` to use `tour.image.alt`
6. Handle empty state: if `tours.length === 0`, don't render section
7. Use translations for section header text ("Most Popular Tours")

## Key Changes

```diff
- const featuredTours: Tour[] = [/* hardcoded */]
+ interface FeaturedToursProps { tours: FeaturedTour[] }

- export function FeaturedTours() {
+ export function FeaturedTours({ tours }: FeaturedToursProps) {
+   if (tours.length === 0) return null

  // In TourCard:
- <Image src={tour.image} alt={tour.title} ... />
+ <Image src={tour.image.url} alt={tour.image.alt} ... />

- <Link href={`/tours/${tour.id}`}>
+ <Link href={`/tours/${tour.slug}`}>
```

## Success Criteria
- [ ] Renders real tour images from Vercel Blob
- [ ] Tour links point to correct `/tours/{slug}` URLs
- [ ] Prices, ratings display correctly
- [ ] Empty state handled (no section if no featured tours)
- [ ] Animations still work (IntersectionObserver)
