# Tour Detail Page Redesign — Option B (Booking-First)

**Status:** Complete
**Priority:** High
**Created:** 2026-04-08
**Design Source:** `pencils/General.pen` → "Tour Detail — Option B Desktop/Mobile (Booking-First)"

## Overview

Full redesign of the tour detail page (`/tours/[slug]`) to match Option B "Booking-First" design. Current page uses a full-bleed hero with overlay text. New design uses a padded image grid, separate title section, and a redesigned booking sidebar with date/guest fields.

## Design Summary

### Desktop (1440px)
1. **Solid nav** (already exists as `<Header variant="solid" />`)
2. **Image grid** — 1 large left + 2 small right (top: 1 image, bottom: 2 images), 420px height, px-80, rounded corners, 4px gap
3. **Title section** — Category pills → Title (Playfair 36px) → Subtitle → Meta row (rating, duration, group, accessibility)
4. **Body** — 2-column: Main (highlights, experience, inclusions, meeting point, guide, reviews) + Sidebar (booking widget 380px)
5. **Related tours** — Horizontal compact cards (thumbnail + info), alt background

### Mobile (375px)
1. **Single hero image** — Full-width, 240px height
2. **Title section** — Tags, title (24px), meta row, price bar with "Book Now" CTA
3. **Highlights** — Alt bg section, single column with checkmarks
4. **Experience** — Truncated text with "Read More" expand
5. **Inclusions** — Stacked included/not-included cards
6. **Meeting point** — Map image + icon rows
7. **Guide/Reviews** — Similar to desktop but stacked
8. **Related tours** — Horizontal cards

## Current vs Design — Key Changes

| Section | Current | Design |
|---------|---------|--------|
| Hero | Full-bleed image + gradient overlay + title on image | Padded image grid, no text overlay |
| Title | On hero with text-shadow | Below image grid, separate section |
| Categories | Badges on hero top-left | Colored pills below image grid |
| Quick Facts | On hero (desktop) / separate component (mobile) | Inline meta row in title section |
| Highlights | Inside TourContent, under Experience heading | Dedicated section above Experience |
| Experience | With highlights | Standalone long-form section |
| Inclusions | Green/red/amber with hard-coded colors | Design tokens, green/red/neutral cards with `$--color-success`/`$--color-error` borders |
| Meeting Point | Card with icon list + Google Maps link | Alt bg card with map image, label-value grid |
| Guide | Card with photo + badges + languages | Horizontal card: avatar + name/meta/bio |
| Reviews | Border cards with Quote icon | Cleaner cards: name — score, italic body |
| Booking Sidebar | Card with quick info + Bokun widget | Styled widget: price, cancel badge, date/guest fields, CTA, total, inquiry button |
| Related Tours | Full TourCard grid (3 cols) | Compact horizontal cards: 100x80 thumbnail + title/meta |

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Image Grid & Title Section](phase-01-image-grid-title-section.md) | Complete | Medium |
| 2 | [Highlights Section](phase-02-highlights-section.md) | Complete | Small |
| 3 | [Experience & Inclusions Redesign](phase-03-experience-inclusions.md) | Complete | Medium |
| 4 | [Meeting Point & Guide Redesign](phase-04-meeting-point-guide.md) | Complete | Medium |
| 5 | [Reviews Redesign](phase-05-reviews-redesign.md) | Complete | Small |
| 6 | [Booking Sidebar Redesign](phase-06-booking-sidebar.md) | Complete | Medium |
| 7 | [Related Tours Compact Cards](phase-07-related-tours-compact.md) | Complete | Small |
| 8 | [Mobile Layout & Responsive](phase-08-mobile-layout.md) | Complete | Medium |
| 9 | [Page Assembly & Cleanup](phase-09-page-assembly.md) | Complete | Small |

## Validation Summary

**Validated:** 2026-04-09
**Questions asked:** 6

### Confirmed Decisions
- **Booking sidebar (no Bokun):** Visual placeholder fields — styled date/guest inputs that look like design but CTA triggers email inquiry
- **Image grid fallback:** Graceful degradation — 4+: full grid, 3: large+2, 2: large+1, 1: full-width single
- **Mobile Book Now CTA:** Sticky bottom bar — persistent bar at bottom of mobile viewport with price + Book Now
- **Read More expand:** CSS-only truncation — use `line-clamp` + checkbox hack, TourContent stays server component
- **Meeting point map:** Google Maps static image — generate static image URL from coordinates, free tier
- **TourFacts component:** Keep for reuse — refactor into shared component used by both title section and potentially other pages

### Action Items
- [x] Phase 1: Add graceful image grid fallback for 1/2/3 images
- [x] Phase 3: Use CSS-only line-clamp for Read More (no client conversion needed)
- [x] Phase 4: Use Google Maps Static API for meeting point map image
- [x] Phase 6: Implement visual placeholder fields for non-Bokun booking sidebar
- [x] Phase 8: Add sticky bottom bar on mobile (not just inline price bar)
- [x] Phase 9: Refactor TourFacts into shared meta component, keep file

## Dependencies

- Existing Payload CMS data model unchanged (no schema changes needed)
- Bokun booking widget integration stays as-is
- Design token CSS variables already defined in `docs/design-guidelines.md`
- Previous plan `260330-1821-tour-detail-page-improvements` is Complete — no conflicts

## Success Criteria

- Desktop layout matches Option B design (image grid, title below, 2-col body)
- Mobile layout matches mobile design (hero image, price bar, Read More)
- All existing data (tour, guide, reviews, booking) renders correctly
- Lighthouse performance score maintained (no regressions)
- WCAG AA compliance maintained
- Existing tests pass; update snapshots where needed
