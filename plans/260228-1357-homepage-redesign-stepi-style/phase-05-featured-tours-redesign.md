# Phase 05: Featured Tours Redesign

## Context Links
- [Plan Overview](./plan.md)
- [Current featured-tours.tsx](../../apps/web/components/home/featured-tours.tsx) (202 lines)
- Stepi reference: tour cards with image, category badge, title, price, rating, hover CTA

## Overview
- **Priority:** P1
- **Status:** complete
- **Description:** Redesign tour cards to match Stepi style: category badge on image, cleaner card layout, responsive grid (1 col mobile, 2 col tablet, 3 col desktop). Maintain existing data structure but update visual presentation.

## Key Insights
- Current: 202 lines, hardcoded tour data, IntersectionObserver per card
- Stepi cards: image with category badge top-left, price badge bottom-right, title + short desc + rating below image, hover reveals "View Tour" CTA
- Current TourCard is 100 lines -- needs simplification
- Keep hardcoded data for now (CMS integration is separate feature)
- Use i18n keys for section header text
- Consider extracting TourCard to separate file if total exceeds 200 lines

## Requirements

### Functional
- Section header: tagline + title + subtitle (centered, i18n)
- Tour cards with:
  - Image (aspect-ratio 4:3)
  - Category badge (top-left on image, gold bg)
  - Price badge (bottom-right on image)
  - Below image: rating stars + count, title (serif), description (2-line clamp)
  - Hover: subtle scale + shadow lift
  - Link wraps entire card for better click target
- Grid: 1 col mobile, 2 col md, 3 col lg
- "View All Tours" CTA button below grid

### Non-Functional
- Total file < 200 lines (split TourCard if needed)
- Mobile touch targets 44px+
- Image lazy loading (except first card)
- Smooth hover transitions

## Architecture
Modify existing `featured-tours.tsx`. If TourCard exceeds component complexity, extract to `tour-card-home.tsx` (separate from catalog tour card).

## Related Code Files
- **Modify:** `apps/web/components/home/featured-tours.tsx`
- **Maybe create:** `apps/web/components/home/tour-card-home.tsx` (if split needed)
- **Modify:** `apps/web/components/home/index.ts` (if new export)

## Implementation Steps

1. Simplify TourCard component:
   - Remove per-card IntersectionObserver (use single section-level observer or CSS animations)
   - Wrap entire card in Link for full click target
   - Category badge: gold bg, dark text, top-left absolute position
   - Price badge: white bg, primary text, bottom-right absolute position
   - Below image: rating row, title, description, "View Details" text link
2. Card structure (mobile-first):
   ```tsx
   <Link href={`/tours/${tour.id}`} className="group block overflow-hidden rounded-2xl
     bg-white shadow-[var(--shadow-card)] transition-all duration-300
     hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1">
     {/* Image */}
     <div className="relative aspect-[4/3] overflow-hidden">
       <Image ... />
       <div className="absolute left-3 top-3 rounded-full bg-[var(--color-secondary)]
         px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
         {tour.category}
       </div>
       <div className="absolute bottom-3 right-3 rounded-lg bg-white/95
         px-3 py-1.5 shadow-sm">
         <span className="text-sm font-bold text-[var(--color-primary)]">
           From {formatPrice(tour.price)}
         </span>
       </div>
     </div>
     {/* Content */}
     <div className="p-5">
       <div className="mb-2 flex items-center gap-1.5">
         <Star className="h-4 w-4 fill-[var(--color-secondary)]
           text-[var(--color-secondary)]" />
         <span className="text-sm font-medium">{tour.rating}</span>
         <span className="text-sm text-[var(--color-text-muted)]">
           ({tour.reviewCount})
         </span>
       </div>
       <h3 className="mb-1.5 font-serif text-lg font-semibold
         text-[var(--color-primary)]">{tour.title}</h3>
       <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">
         {tour.description}
       </p>
     </div>
   </Link>
   ```
3. Update section header with tagline pattern (uppercase small text above title)
4. Add `category` field to tour data objects
5. Update grid: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`
6. Keep "View All Tours" CTA with `outline-dark` button style
7. Replace hardcoded English text with i18n keys
8. Use section-level fade-in animation instead of per-card observers

## Todo List
- [x] Simplify TourCard (remove per-card observers)
- [x] Wrap card in Link for full click target
- [x] Add category badge on image
- [x] Update price badge styling
- [x] Clean rating + title + description layout
- [x] Responsive grid: 1/2/3 columns
- [x] i18n for section header text
- [x] Section-level scroll animation
- [x] "View All" CTA button
- [x] File under 200 lines

## Success Criteria
- Cards match Stepi pattern: category badge, price overlay, clean content area
- 1/2/3 column responsive grid
- Full card is clickable link
- Smooth hover animation
- i18n section headers
- File under 200 lines

## Risk Assessment
- **Low:** Self-contained, no external API deps
- **Note:** Hardcoded data -- future CMS integration will replace but structure stays same
- **Note:** Adding `category` field to mock data is trivial

## Security Considerations
None.

## Next Steps
Phase 09 positions this after VideoSection in page.tsx.
