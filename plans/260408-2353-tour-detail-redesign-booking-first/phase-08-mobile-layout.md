# Phase 8: Mobile Layout & Responsive

**Status:** Complete
**Priority:** High
**Effort:** Medium

## Overview

Ensure mobile layout matches Option B Mobile design. Key mobile-specific features: single hero, inline price bar, Read More expand, no sidebar (booking accessible via price bar CTA or scroll).

## Key Design Specs (Mobile — 375px)

### Hero
- Single full-width image, 240px height (handled in Phase 1)

### Title Section
- Tags: smaller (10px font, 3px/10px padding)
- Title: 24px Playfair
- Meta row: 13px, gap 16px (no accessibility icon on mobile)
- **Price bar**: `bg-[var(--color-background-alt)]`, `rounded-xl`, py-12 px-16, flex between:
  - Left: "895 SEK / person" Playfair 20px bold
  - Right: "Book Now" accent button, `rounded-full`, py-10 px-20

### Highlights
- Alt background section
- Single column, 13px font

### Experience
- Truncated to ~3 paragraphs, "Read More" link in accent color with chevron-down

### Inclusions
- Stacked cards, `rounded-lg` (not xl), padding 16px

### Meeting Point
- Map 140px height
- Icon + text rows (map-pin, train, flag icons)

### Reviews & Related
- Same as desktop but single column

## Related Code Files

### Modify
- `apps/web/components/tour/tour-title-section.tsx` (Phase 1) — Add mobile price bar
- `apps/web/components/tour/tour-content.tsx` (Phase 3) — Read More already handled
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — Ensure sidebar hidden on mobile

## Implementation Steps

1. Verify all Phase 1-7 components have correct responsive breakpoints
2. Add mobile price bar to title section (visible only on `lg:hidden`)
3. Ensure booking sidebar is `hidden lg:block`
4. Ensure proper spacing/padding at mobile breakpoints
5. Test at 375px and 768px viewports
6. Verify touch targets ≥ 44px on all interactive elements

## Todo

- [x] Add mobile price bar with Book Now CTA
- [x] Hide booking sidebar on mobile
- [x] Verify all components responsive
- [x] Test touch targets and spacing
