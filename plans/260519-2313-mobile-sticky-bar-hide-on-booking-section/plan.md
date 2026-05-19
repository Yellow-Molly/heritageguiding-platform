---
plan: mobile-sticky-bar-hide-on-booking-section
title: "Mobile Sticky Book-Now Bar — Hide on Booking Section Reach"
description: "Hide TourMobilePriceBar when #booking enters viewport; restore when scrolled back above. Removes duplicate-CTA confusion vs Bokun widget."
status: completed
priority: P2
effort: 1-2h
branch: master
created: 2026-05-19
tags: [ux, mobile, tour-detail, bokun, intersection-observer]
blockedBy: []
blocks: []
related:
  - plans/260408-2353-tour-detail-redesign-booking-first/
context:
  brainstorm: plans/reports/brainstorm-260519-2313-mobile-sticky-bar-hide-on-booking-section.md
---

# Mobile Sticky Book-Now Bar — Hide on Booking Section Reach

## Summary

On mobile tour detail pages, the sticky "Book Now" bar (`TourMobilePriceBar`) remains visible after user scrolls/taps to `#booking` (Bokun widget). Result: duplicate CTAs — sticky-bar "Book Now" + Bokun widget "Check out" — competing for user attention.

Fix: hide bar when `#booking` top crosses bar's bottom edge (≈130px from viewport top). Stay hidden through booking section + footer. Restore when scrolling back above.

## Approach

`IntersectionObserver` on `#booking` element with `rootMargin: '-130px 0px 0px 0px'`. State driven by `entry.boundingClientRect.top <= TRIGGER_PX`. Single client component change. No DOM-edits to `page.tsx` or `booking-section.tsx`.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | [Implement & QA hide-on-scroll](phase-01-implement-and-qa-hide-on-scroll.md) | completed |

## Key Dependencies

- `next-intl` (already client-side compatible)
- React 19.2.3 hooks (`useEffect`, `useState`, `useRef`)
- `IntersectionObserver` API (universal browser support)

## Risks

- **Magic trigger px (130)** — fixed header `h-20` (80px) + bar height (~50px). Document inline. Revisit if header becomes dynamic.
- **No backend / data changes** — purely client-side UX.

## Success Criteria

1. Mobile: bar fades out as Bokun widget enters viewport.
2. Bar stays hidden through end of page.
3. Scroll back up past booking → bar fades back in.
4. Desktop (`lg+`): unchanged (`lg:hidden` preserved).
5. Screen-reader: bar excluded from focus order when hidden (`aria-hidden`, `tabIndex=-1`).
6. No layout shift (transform + opacity only).
7. `prefers-reduced-motion`: no animation.
