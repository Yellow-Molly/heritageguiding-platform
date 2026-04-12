# Phase 7: Related Tours Compact Cards

**Status:** Complete
**Priority:** Medium
**Effort:** Small

## Overview

Replace full TourCard grid with compact horizontal cards matching Option B design. 4 cards in a row (desktop), stacked (mobile).

## Key Design Specs

- Section: `bg-[var(--color-background-alt)]`, `py-48 px-80`
- Heading: "More Tours You'll Love", Playfair 28px, letter-spacing -0.5
- Cards: `bg-surface`, `rounded-xl`, shadow `0 2px 12px #0000000A`, padding 16px, gap 16px between image and info, flex row
- Thumbnail: 100x80px, `rounded-lg`, `object-cover`
- Title: Playfair 15px, `--color-primary`
- Meta: "4.8★ · 2h · 750 SEK", Inter 12px, `--color-text-muted`
- Grid: 4 columns (desktop), 2 columns (tablet), 1 column (mobile)

## Related Code Files

### Modify
- `apps/web/components/tour/related-tours.tsx` — Replace TourCard with compact card

### Create
- `apps/web/components/tour/related-tour-card.tsx` — Compact horizontal card component

## Implementation Steps

1. Create `related-tour-card.tsx`:
   - Accept tour data (title, slug, image, rating, duration, price)
   - Horizontal layout: 100x80 thumbnail + info column
   - Link wraps entire card
   - Info: title + meta line

2. Update `related-tours.tsx`:
   - Change heading text to match design
   - Fetch 4 tours instead of 3
   - Replace TourCard with RelatedTourCard
   - Update grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
   - Update section styling: alt background, adjusted padding

## Todo

- [x] Create compact `related-tour-card.tsx`
- [x] Update `related-tours.tsx` layout and heading
- [x] Fetch 4 related tours instead of 3
