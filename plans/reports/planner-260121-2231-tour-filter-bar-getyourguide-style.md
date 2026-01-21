# Planner Report: GetYourGuide-Style Tour Filter Bar

**Date:** 2026-01-21 22:31
**Status:** Plan Complete
**Plan Path:** `plans/260121-2231-tour-filter-bar-getyourguide-style/`

## Summary

Created comprehensive 4-phase implementation plan for a GetYourGuide-inspired sticky filter bar with multi-select category chips, date range picker, and URL state management.

## Plan Structure

| Phase | Title | Effort | Key Deliverables |
|-------|-------|--------|------------------|
| 01 | Category Chips | 2h | Horizontal scrollable multi-select chips with CSS scroll-snap |
| 02 | Filter Bar Layout | 2h | Sticky container, shadow on scroll, responsive layout |
| 03 | Dates Picker | 3h | react-day-picker integration with Radix Popover |
| 04 | Integration & Testing | 1h | Unit tests, 80%+ coverage, accessibility audit |

**Total Effort:** 8h

## Key Decisions

1. **Multi-select chips** over dropdown - Better UX for quick filtering
2. **CSS scroll-snap** - Native browser feature, no JS library overhead
3. **react-day-picker v9.11.1** - React 19 compatible, accessible
4. **URL state** - Shareable, bookmarkable filter combinations
5. **Deprecate old component** - Keep tour-filters.tsx during transition

## Dependencies to Install

```bash
npm install react-day-picker@^9.11.1 @radix-ui/react-popover
```

## New Files to Create

```
apps/web/components/tour/filter-bar/
├── index.ts
├── filter-bar.tsx
├── category-chips.tsx
├── dates-picker.tsx
├── results-count.tsx
└── __tests__/
    └── *.test.tsx

apps/web/components/ui/popover.tsx
```

## Files to Modify

- `apps/web/app/[locale]/(frontend)/tours/tour-catalog-client.tsx`
- `apps/web/app/[locale]/(frontend)/tours/page.tsx`
- `apps/web/lib/api/get-tours.ts`
- `apps/web/app/globals.css`
- `apps/web/messages/*.json` (en, sv, de)

## URL State Schema

```
/tours?categories=history,nature&startDate=2026-01-25&endDate=2026-01-30&sort=recommended
```

## Risks

| Risk | Mitigation |
|------|------------|
| scroll-snap browser inconsistency | Test on Safari/Chrome/Firefox |
| iOS sticky positioning | Use -webkit-sticky prefix |
| Bundle size from date-fns locales | Accept ~5KB increase per locale |

## Success Criteria

- Sticky filter bar with shadow on scroll
- Multi-select category chips with scroll
- Date range picker in popover
- 80%+ test coverage
- Lighthouse 90+
- WCAG 2.1 AA compliant

## Next Steps

1. Start Phase 01: Category Chips implementation
2. Install dependencies before Phase 03
3. Run full test suite after Phase 04
