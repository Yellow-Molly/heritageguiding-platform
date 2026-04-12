# Phase 9: Page Assembly & Cleanup

**Status:** Complete
**Priority:** High
**Effort:** Small

## Overview

Wire all redesigned components into the tour page, update section ordering, adjust grid layout, and clean up unused code.

## Key Design Specs

### Page Structure (Desktop)
```
<Header variant="solid" />
<main>
  <TourImageGrid />       ← Phase 1
  <TourTitleSection />     ← Phase 1
  <div border-top>         ← Body separator
    <div grid 2-col>
      <Main col>
        <TourHighlights /> ← Phase 2
        <TourContent />    ← Phase 3 (experience only, no highlights)
        <Inclusions />     ← Phase 3
        <MeetingPoint />   ← Phase 4
        <GuideCard />      ← Phase 4
        <Reviews />        ← Phase 5
      </Main col>
      <Sidebar col (380px)>
        <BookingSection /> ← Phase 6
      </Sidebar col>
    </div>
  </div>
  <RelatedTours />         ← Phase 7
</main>
<Footer />
```

### Layout Changes
- Body container: `px-80` desktop → `container` class
- Body separator: `border-top` with `--color-border`
- Grid: Main content `gap-48`, sidebar 380px width
- Remove `TourFacts` mobile-only block (meta now in title section)

## Related Code Files

### Modify
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — Rewire components

### Potentially Remove
- `apps/web/components/tour/tour-facts.tsx` — May become unused after meta moves to title section

## Implementation Steps

1. Update page.tsx imports and component tree
2. Adjust grid layout: `lg:grid-cols-[1fr_380px]` instead of `lg:grid-cols-3`
3. Reorder sections per design
4. Add body separator border
5. Remove mobile TourFacts block
6. Run `npm run type-check` to verify no broken imports
7. Run `npm run build` to verify production build
8. Clean up any unused imports/components

## Todo

- [x] Rewire page.tsx with new component order
- [x] Update grid to match design proportions
- [x] Remove TourFacts mobile-only block
- [x] Run type-check and build
- [x] Clean up unused code
