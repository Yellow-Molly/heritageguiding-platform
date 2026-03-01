# Phase 03 - Tours Carousel Redesign

## Context Links
- [Research Report](research/researcher-01-reference-site-design.md)
- [Current Featured Tours](../../apps/web/components/home/featured-tours.tsx) (~203 LOC)
- [Featured Tours API](../../apps/web/lib/api/get-featured-tours.ts)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
- **Priority:** P1
- **Status:** complete
- **Effort:** 1.5h
- **Description:** Redesign tour cards to match Stepi's cleaner card style. Add horizontal scroll carousel on mobile, grid on desktop. Split 203-line file into smaller modules.

## Key Insights
- Stepi tour cards: image top, title, star rating, metadata as plain text tags ("2h . Walking . All Ages"), price, CTA button
- Current cards have: gradient overlay on image, featured badge, price badge on image, quick info overlay. Too heavy
- Stepi uses horizontal swipe carousel on mobile, 3-4 col grid on desktop
- Current implementation is a static 3-col grid with no carousel

## Requirements

### Card Redesign
- Image top: full-width, `aspect-[4/3]`, no gradient overlay
- Below image: title, star rating row, metadata as plain text with dot separators
- Price: prominent below metadata, `From SEK 495 / person`
- CTA: orange "Book Now" button (full width on mobile, auto on desktop)
- No floating badges on image (remove featured badge, price badge overlay)
- Hover: subtle shadow lift, no image scale effect

### Carousel Behavior
- Mobile (<768px): horizontal scroll with snap, show 1.2 cards (peek next)
- Tablet (768-1024px): show 2.2 cards
- Desktop (>1024px): 3-column grid, no carousel
- Touch swipe on mobile/tablet
- Optional: left/right arrow buttons on desktop hover
- Use CSS `scroll-snap-type: x mandatory` + `scroll-snap-align: start` (no JS carousel lib)

## Architecture

### File Split (current file is 203 LOC)
Split `featured-tours.tsx` into:
1. `tour-card.tsx` - individual card component (~80 LOC)
2. `tours-carousel.tsx` - carousel container + section header (~100 LOC)

### Card Structure
```
<div> (rounded-2xl, bg-white, shadow-card, overflow-hidden)
  <div> (aspect-[4/3], relative)
    <Image> (fill, object-cover)
  <div> (p-5)
    <h3> (font-serif, text-lg, primary color)
    <div> (flex, items-center, gap-1 - rating row)
      <Star> (filled gold, h-4)
      <span> (rating number)
      <span> (review count, muted)
    <p> (text-sm, muted - metadata: "2h . Walking . Max 15")
    <div> (flex, justify-between, items-center, mt-4)
      <span> (price, font-bold, primary)
      <Link> (CTA button, primary, sm)
```

### Carousel Container
```
<section> (bg-white, py-20)
  <div> (container)
    <div> (section header: label + h2 + subtitle)
    <div> (carousel wrapper)
      <!-- Mobile/Tablet: horizontal scroll -->
      <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory
                      scrollbar-hide pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {tours.map(tour => <TourCard />)}
      </div>
    <div> (View All CTA, centered)
```

## Related Code Files

### MODIFY
- `apps/web/components/home/index.ts` - update exports (rename FeaturedTours -> ToursCarousel)
- `apps/web/messages/en.json` - update `home.featured` keys, add metadata labels
- `apps/web/messages/sv.json` - same
- `apps/web/messages/de.json` - same
- `apps/web/app/globals.css` - add `.scrollbar-hide` utility if not present

### CREATE
- `apps/web/components/home/tour-card.tsx` - extracted card component
- `apps/web/components/home/tours-carousel.tsx` - carousel section (replaces featured-tours.tsx)

### REMOVE
- `apps/web/components/home/featured-tours.tsx` - replaced by tour-card + tours-carousel

## Implementation Steps

1. **Add scrollbar-hide utility** to `globals.css` (if not present):
   ```css
   .scrollbar-hide {
     -ms-overflow-style: none;
     scrollbar-width: none;
   }
   .scrollbar-hide::-webkit-scrollbar {
     display: none;
   }
   ```

2. **Add i18n keys** to all 3 message files:
   ```json
   "featured": {
     "label": "Popular Experiences",
     "title": "Our Popular Tours",
     "subtitle": "Discover our most beloved heritage experiences in Stockholm",
     "viewAll": "View All Tours",
     "bookNow": "Book Now",
     "from": "From",
     "perPerson": "/ person",
     "reviews": "reviews"
   }
   ```

3. **Create `tour-card.tsx`** (~80 LOC):
   - Accept props: `tour: FeaturedTour` (reuse interface from `get-featured-tours.ts`)
   - Import `FeaturedTour` type from `@/lib/api/get-featured-tours`
   - Clean card design: image (no overlay), title, rating, metadata text, price, CTA
   - Use `formatPrice` and `formatDuration` from `@/lib/utils`
   - Card width: `min-w-[280px] w-[85vw] md:w-[45vw] lg:w-auto lg:min-w-0` for carousel sizing
   - `snap-start` class for scroll snap alignment
   - Use `Link` from `@/i18n/navigation` for CTA

4. **Create `tours-carousel.tsx`** (~100 LOC):
   - Section header: label span + H2 + subtitle paragraph
   - Carousel wrapper: flex container with `overflow-x-auto snap-x snap-mandatory` on mobile
   - Breakpoint switch: `lg:grid lg:grid-cols-3 lg:overflow-visible`
   - Import tour data from `get-featured-tours.ts` (keep mock data for now)
   - IntersectionObserver for fade-in animation
   - "View All Tours" CTA at bottom

5. **Update barrel export** `index.ts`:
   - Remove `export { FeaturedTours } from './featured-tours'`
   - Add `export { ToursCarousel } from './tours-carousel'`
   - Add `export { TourCard } from './tour-card'`

6. **Delete `featured-tours.tsx`** after new files verified

7. **Verify build** compiles without errors

## Todo List
- [x] Add scrollbar-hide CSS utility
- [x] Add/update featured i18n keys in en/sv/de
- [x] Create tour-card.tsx (clean card design, snap alignment)
- [x] Create tours-carousel.tsx (horizontal scroll mobile, grid desktop)
- [x] Update barrel export in index.ts
- [x] Delete featured-tours.tsx
- [x] Verify both files under 200 LOC
- [x] Verify build compiles

## Success Criteria
- Mobile: cards scroll horizontally with snap, peek next card visible
- Tablet: 2 cards visible with peek
- Desktop: 3-column grid, no horizontal scroll
- Cards are clean: no image overlays, plain text metadata
- Touch swipe works on mobile
- "View All Tours" CTA links to `/tours`
- All 3 locales render

## Risk Assessment
- **Low:** CSS scroll-snap has excellent browser support (97%+)
- **Medium:** Removing `FeaturedTours` export breaks `page.tsx` import; update page.tsx in Phase 6
- **Low:** Tour data stays mock; no API changes needed

## Security Considerations
- No new data inputs or user interactions beyond existing link navigation
- Tour links use locale-aware routing via `@/i18n/navigation`

## Next Steps
- Phase 04: Seasonal Tabs + Guides Section
