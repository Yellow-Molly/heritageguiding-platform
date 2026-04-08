# Phase 3: Tour Card Redesign

## Context Links
- Current: `apps/web/components/tour/tour-card.tsx` (124 lines)
- Current: `apps/web/components/tour/tour-grid-layout.tsx` (101 lines)
- Design: Desktop grid card (vertical), Mobile horizontal card

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Effort:** 2h
- **Can run parallel with:** Phase 2

Redesign tour card to match Option B design. Desktop grid card: image top (180px) with duration pill + featured badge, body has rating+price row, title, description, meta. Mobile: horizontal card (130px height) with image left.

## Key Insights
- Current card has price badge on image overlay (bottom-right). Design moves price to body (rating+price row).
- Current card has gradient overlay on image. Design is cleaner — just featured badge (gold) top-left + duration pill (black translucent) bottom-left.
- Mobile list variant currently uses `sm:flex-row` with 288px image. Design wants 130px height horizontal cards with 130px-wide image.
- Need a new `'mobile-list'` variant or rework `'list'` variant for mobile horizontal layout.

## Requirements

### Functional
- **Desktop Grid Card:**
  - Image: full width, 180px height (`h-[180px]`), `object-cover`
  - Featured badge: gold (#C4A052 / `var(--color-secondary-light)`) pill, top-left
  - Duration pill: black translucent bg, bottom-left on image, shows formatted duration
  - Body (12px padding, 6px gap between elements):
    - Row 1: Star icon + rating + (count) left-aligned gold, price right-aligned navy
    - Title: Playfair Display (font-serif) 15px
    - Description: Inter 12px, line-height 1.4, line-clamp-2
    - Meta: Users icon + "Max {n}", accessibility icons
  - Card: white bg, 12px radius, subtle shadow, 1px border #F3F4F6
- **Mobile Horizontal Card:**
  - 130px total height, horizontal layout
  - Image: 130px wide, fill height, optional featured badge
  - Right content (10px padding, 4px gap): rating+price row, title (14px), duration+capacity text
  - Card: white bg, 12px radius, 1px border

### Non-Functional
- Maintain `Link` wrapper for navigation
- Keep `group` hover effects
- Responsive: grid variant on `lg:`, mobile-list on `< lg` (controlled by `viewMode` context or responsive CSS)

## Architecture

### Approach Decision
**Option A**: Single `TourCard` with `variant` prop controlling layout — current pattern, extend it.
**Option B**: Two separate components (`TourCardGrid`, `TourCardMobile`).

**Decision: Option A** — KISS, DRY. Add responsive behavior within single component. The `list` variant becomes the mobile horizontal layout. Grid cards adapt via Tailwind responsive classes.

### Data Flow
```
TourGridLayout reads ViewModeContext
  viewMode='grid' → desktop: 3-col grid of TourCard(variant='grid')
                   → mobile: ViewModeContext irrelevant, CSS handles card layout
  viewMode='list' → TourCard(variant='list') — mobile horizontal style
```

Actually, simpler: on mobile, always show horizontal cards regardless of viewMode (viewMode toggle is desktop-only per design). Use responsive CSS within the card.

**Revised approach**: TourCard `variant='grid'` is default. On mobile (< lg), grid cards automatically become horizontal via responsive Tailwind classes on the card itself. No separate variant needed for mobile — just responsive styling within the grid variant.

Wait — the design shows mobile as a vertical list of horizontal cards, which is fundamentally different from a 3-col grid. Better to let `TourGridLayout` handle the responsive grid class change, and have `TourCard` render differently based on screen size using responsive Tailwind.

**Final approach**: 
- `TourCard` uses responsive classes: `lg:flex-col flex-row` (horizontal on mobile, vertical on desktop)
- `TourGridLayout` grid classes: `grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-5`
- This avoids JS-based variant switching for responsive behavior

## Related Code Files

### Files to Modify
- `apps/web/components/tour/tour-card.tsx` — Rework card layout for design match
- `apps/web/components/tour/tour-grid-layout.tsx` — Update grid classes for responsive behavior

### Files Unchanged
- `tour-card` still receives same `FeaturedTour` type, no data model changes

## Implementation Steps

### Step 1: Redesign `tour-card.tsx` for grid variant (desktop)
Replace current image section:
- Remove gradient overlay
- Change image container: `relative overflow-hidden h-[180px] lg:h-[180px]` (desktop), mobile will be different
- Featured badge: `absolute left-3 top-3`, use Badge with `bg-[var(--color-secondary-light)] text-white`
- Duration pill: `absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full`
- Remove price from image overlay (move to body)

Replace current body:
- Padding: `p-3` (12px)
- Rating + Price row: flex justify-between
  - Left: Star icon (fill gold) + rating + `({reviewCount})` in gold/amber
  - Right: `formatPrice(tour.price)` in navy/primary bold
- Title: `font-serif text-[15px] font-semibold text-[var(--color-primary)]`
- Description: `text-xs leading-[1.4] text-[var(--color-text-muted)] line-clamp-2`
- Meta: Users icon + "Max {n}", accessibility badges

### Step 2: Add responsive mobile layout within same component
Use Tailwind responsive prefixes:
- Card: `flex flex-row h-[130px] lg:flex-col lg:h-auto`
- Image: `w-[130px] shrink-0 lg:w-full lg:h-[180px]`
- Body: mobile gets `p-2.5 gap-1` (10px/4px), desktop gets `p-3 gap-1.5`
- Mobile body: show rating+price, title (14px), "2h 30m . Max 8 people" text line
- Mobile: hide description (not in mobile design)
- Mobile: duration+capacity as single text line instead of separate elements

### Step 3: Update `tour-grid-layout.tsx`
- Change grid classes:
  - Current: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`
  - New: `grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-5`
- Mobile: single column, 12px gap (gap-3)
- Desktop: 3 columns, 20px gap (gap-5)
- Remove `viewMode === 'list'` branch for now (list view on desktop can stay as-is or be simplified)

### Step 4: Handle `list` viewMode on desktop
- When viewMode='list', cards show in single column on desktop too
- Use: `viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-5'`
- List variant card: keep the existing horizontal style for desktop list view

## Todo List
- [x] Redesign card image section: remove gradient, add duration pill, reposition featured badge
- [x] Redesign card body: rating+price row, smaller text, tighter spacing
- [x] Add responsive mobile horizontal layout using Tailwind responsive prefixes
- [x] Mobile: duration+capacity as text line, hide description
- [x] Update grid layout responsive classes
- [x] Verify card stays under 200 lines (modularize if needed)
- [x] Test hover effects still work
- [x] Test image sizes/aspect ratios on both breakpoints

## Success Criteria
- Desktop grid: vertical cards with 180px image, duration pill, price in body
- Mobile: horizontal 130px cards with 130px image, compact info
- Cards under 200 lines
- No layout shift between breakpoints
- Featured badge gold, duration pill translucent black

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Responsive flex-row/flex-col causes image sizing issues | Med | Med | Test thoroughly; may need explicit width/height constraints |
| Card exceeds 200 lines after redesign | Med | Low | Extract image section or body section into sub-components |
| Mobile horizontal card text overflow | Low | Low | Use truncation (line-clamp-1) on title, ensure min-width |

## Security Considerations
- No new user input. Image URLs from CMS (already trusted).

## Next Steps
- Phase 5 audits visual alignment with design
- Verify card works correctly inside sidebar layout from Phase 1+2
