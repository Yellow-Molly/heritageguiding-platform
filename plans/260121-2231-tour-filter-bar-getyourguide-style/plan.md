---
title: "GetYourGuide-Style Tour Filter Bar"
description: "Sticky horizontal filter bar with category chips, date picker, and URL state management for tour catalog"
status: pending
priority: P2
effort: 8h
branch: master
tags: [filter-bar, tour-catalog, UX, react-day-picker, URL-state]
created: 2026-01-21
---

# GetYourGuide-Style Tour Filter Bar

## Overview

Implement a modern, sticky horizontal filter bar for the tour catalog inspired by GetYourGuide. Replaces current `tour-filters.tsx` with a more intuitive multi-select category chips, date range picker, and improved mobile experience.

## Architecture

```
apps/web/components/tour/filter-bar/
├── index.ts                     # Barrel export
├── filter-bar.tsx               # Main sticky container (~100 lines)
├── category-chips.tsx           # Horizontal scrollable multi-select (~80 lines)
├── dates-picker.tsx             # Date range picker with popover (~100 lines)
├── results-count.tsx            # "X results" display (~20 lines)
└── __tests__/
    └── filter-bar.test.tsx      # Component tests
```

## URL State Schema

```
/tours?categories=history,nature&startDate=2026-01-25&endDate=2026-01-30&sort=recommended
```

| Param | Type | Description |
|-------|------|-------------|
| `categories` | string (comma-separated) | Multi-select category slugs |
| `startDate` | string (YYYY-MM-DD) | Tour availability start |
| `endDate` | string (YYYY-MM-DD) | Tour availability end |
| `sort` | string | Sort option (existing) |
| `q` | string | Search query (existing) |

## Dependencies

- **react-day-picker**: v9.11.1 (React 19 compatible) - NEW, needs install
- **date-fns**: v4.1.0 (already installed)
- **@radix-ui/react-popover**: For date picker popover - NEW, needs install

## Phases

| Phase | Title | Effort | Status |
|-------|-------|--------|--------|
| 01 | [Category Chips Component](./phase-01-category-chips.md) | 2h | pending |
| 02 | [Filter Bar Layout](./phase-02-filter-bar-layout.md) | 2h | pending |
| 03 | [Dates Picker Component](./phase-03-dates-picker.md) | 3h | pending |
| 04 | [Integration & Testing](./phase-04-integration-testing.md) | 1h | pending |

## Key Design Decisions

1. **Multi-select chips** over single-select dropdown for categories (better UX)
2. **CSS scroll-snap** for chip scrolling (native, no JS library)
3. **URL state** for all filters (shareable, bookmarkable links)
4. **Sticky header** with shadow on scroll (visual feedback)
5. **Deprecate** `tour-filters.tsx` after migration (keep FilterDrawer for mobile)

## Dependencies Graph

```
Phase 01 (Category Chips)
    └── Phase 02 (Filter Bar Layout)
            ├── Phase 03 (Dates Picker) [parallel possible]
            └── Phase 04 (Integration & Testing)
```

## Success Criteria

- [ ] Filter bar sticks to top on scroll with shadow
- [ ] Category chips horizontally scrollable with fade edges
- [ ] Multi-select categories update URL as comma-separated values
- [ ] Date picker opens in popover, updates URL on selection
- [ ] Results count shows "X results" from API response
- [ ] Mobile uses FilterDrawer for advanced filters
- [ ] All tests pass with 80%+ coverage
- [ ] Lighthouse performance score 90+
- [ ] WCAG 2.1 AA compliance

## Related Files

**Existing (to modify):**
- `apps/web/app/[locale]/(frontend)/tours/tour-catalog-client.tsx`
- `apps/web/lib/api/get-tours.ts` (add date filtering)
- `apps/web/messages/*.json` (add i18n keys)

**Existing (to rename as backup):**
- `apps/web/components/tour/tour-filters.tsx` → `tour-filters-legacy.tsx`

**New (to create):**
- `apps/web/components/tour/filter-bar/index.ts`
- `apps/web/components/tour/filter-bar/filter-bar.tsx`
- `apps/web/components/tour/filter-bar/category-chips.tsx`
- `apps/web/components/tour/filter-bar/dates-picker.tsx`
- `apps/web/components/tour/filter-bar/results-count.tsx`
- `apps/web/components/ui/popover.tsx` (Radix wrapper)

## Validation Summary

**Validated:** 2026-01-21
**Questions asked:** 5

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Old tour-filters.tsx handling | Rename to `tour-filters-legacy.tsx` as backup |
| Date filter backend | Filter mock data by date (add mock dates to tours) |
| Mobile category chips | Show in BOTH bar AND drawer |
| Scroll UX for chips | Fade gradients only (no arrow buttons) |
| Calendar months displayed | 1 month (compact, mobile-friendly) |

### Action Items

- [ ] Phase 02: Add CategoryChips to FilterDrawer for mobile
- [ ] Phase 03: Add mock date fields to tour mock data for testing
- [ ] Phase 04: Rename tour-filters.tsx to tour-filters-legacy.tsx (not delete)
