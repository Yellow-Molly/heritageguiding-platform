# Tours Listing Page - Filter & UI Fixes

**Status:** Ready
**Priority:** High
**Created:** 2026-03-30
**Branch:** `fix/tours-listing-filters`

## Overview

Fix 4 broken features on the tours listing page (`/tours`):
1. Grid/List view toggle does nothing (client state never reaches server component)
2. Category filter chips don't filter correctly (validation rejects real CMS slugs)
3. Search is slow and incorrect (full navigation per keystroke, `like` on title only)
4. Mobile FilterDrawer shows hardcoded categories instead of CMS data

**Root Cause:** Multiple hardcoded category lists (`tour-filters.ts`, `filter-drawer.tsx`) that don't match CMS data. View mode is client state that never propagates to the server-rendered `TourGrid`.

## Phases

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | [View Mode Toggle Fix](phase-01-view-mode-toggle.md) | TODO | 3 files |
| 2 | [Dynamic Category Validation](phase-02-dynamic-category-validation.md) | TODO | 3 files |
| 3 | [Search Performance Fix](phase-03-search-performance.md) | TODO | 2 files |
| 4 | [Mobile FilterDrawer Dynamic Categories](phase-04-mobile-filter-drawer.md) | TODO | 2 files |
| 5 | Delete deprecated tour-filters.tsx | TODO | 1 file |
| 6 | [Infinite Scroll](phase-06-infinite-scroll.md) | TODO | 4 files |
| 7 | Make entire tour card clickable | TODO | 1 file |

## Dependencies

- None (no blocking plans)
- Related: `260330-1821-tour-detail-page-improvements` (complete, no conflict)

## Validation Summary

**Validated:** 2026-03-30
**Questions asked:** 4

### Confirmed Decisions
- **View toggle**: Client-side only — keep `useState`, make TourGrid a client component. No URL param for view mode.
- **Tour counts**: Skip tourCount for now — remove count badges from chips entirely. Avoids extra DB queries.
- **Search scope**: Title + shortDescription + description (richText) — most comprehensive. Needs testing for richText `contains` compatibility.
- **Deprecated tour-filters.tsx**: Delete it — dead code cleanup included in this plan.

### Phase 6 Decisions (validated 2026-03-30, 3 questions)
- **UX pattern**: Auto infinite scroll — IntersectionObserver, no manual button
- **Server Action**: Separate file `tour-actions.ts` — don't pollute `get-tours.ts` with `'use server'`
- **Batch size**: 9 per batch — matches current page size, fills 3x3 grid

### Action Items
- [ ] Phase 1: Revise approach — convert TourGrid to client component instead of URL params. Keep viewMode as client state.
- [ ] Phase 2: Remove tourCount display from CategoryChips instead of computing counts. Simplify scope.
- [ ] Phase 3: Add `description` field to search `or` clause. Test richText `contains` behavior.
- [ ] Phase 5 (new): Delete deprecated `tour-filters.tsx` file.
- [ ] Phase 6: Create `tour-actions.ts` for Server Action instead of adding to `get-tours.ts`.
