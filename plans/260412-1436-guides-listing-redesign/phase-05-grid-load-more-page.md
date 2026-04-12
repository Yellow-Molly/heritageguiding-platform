# Phase 05: Grid, Load More & Page Assembly

## Context Links
- Current page: `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx`
- Current grid: `apps/web/components/guide/guide-grid.tsx`
- Pagination component: `apps/web/components/tour/tour-pagination.tsx`
- Tour catalog client wrapper pattern: `apps/web/components/tour/tour-catalog-client.tsx`

## Overview
- **Priority:** High (final assembly)
- **Status:** Complete
- **Description:** Update grid for responsive layout, add mobile "load more" button, assemble full page with hero + filters + grid.

## Key Insights
- Desktop keeps standard pagination (TourPagination reused)
- Mobile replaces pagination with "Load more" button that fetches next page client-side
- Page needs to pass filter options (languages, specializations, areas) to filter bar
- Server component page fetches initial data; load-more is client-side additive

## Requirements

### Functional
- **Desktop:** 3-column grid, **9 guides per page** (3×3), "Load more" button below
- **Mobile:** single column, 3 guides initial, "Load more guides" button
- **Both layouts use infinite scroll / Load More** (no traditional pagination)
- Page assembles: Hero → Filter Bar → Grid → Load More
- Filter bar receives CMS taxonomy data for dropdown options

### Non-Functional
- Page remains server component for initial render
- "Load more" client component fetches via server action or API route
- Reset loaded state when filters change

## Architecture

```
guides/page.tsx (server)
├── GuideListSchema (SEO)
├── Header (solid)
├── main
│   ├── GuideListingHero (server)
│   ├── GuideFilterBar (client, receives taxonomy options + totalGuides)
│   ├── GuideGridClient (client wrapper)
│   │   ├── Cards in 3-col grid (desktop 9 per load, mobile 3)
│   │   └── GuideLoadMoreButton (both desktop and mobile)
│   └── Empty state
├── Footer

guide-load-more-button.tsx (client)
├── "Load more guides" text button
├── Fetches next page via fetch('/api/guides?page=N&...filters')
├── Appends results to displayed list
└── Hides when no more pages
```

## Related Code Files
- **Modify:** `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` — add hero, pass filter options
- **Modify:** `apps/web/components/guide/guide-grid.tsx` — add mobile load-more support
- **Create:** `apps/web/components/guide/guide-load-more-button.tsx`

## Implementation Steps

1. **Update `guides/page.tsx`:**
   - Import `GuideListingHero`, `GuideFilterBar`
   - Fetch taxonomy data for filters (languages from CMS options, categories, cities)
   - Pass `totalGuides`, `languages`, `specializations`, `areas` to `GuideFilterBar`
   - Keep existing `GuideGrid` usage
   - Remove inline h1/p (replaced by hero)

2. **Update `guide-grid.tsx` → `guide-grid-client.tsx`:**
   - Client wrapper that manages guide list state (initial + appended)
   - Both desktop and mobile show `GuideLoadMoreButton` below grid
   - Desktop: 3-col grid, 9 guides per load; Mobile: 1-col, 3 per load
   - Pass `totalGuides`, current filters to load-more button
   - Reset loaded guides when URL search params change

3. **Create `guide-load-more-button.tsx`:**
   - Props: `{ currentPage, totalPages, filters: Record<string, string> }`
   - State: `loadedGuides: GuideListItem[]`, `currentPage: number`, `loading: boolean`
   - On click: fetch next page from `/guides?page={n+1}&...filters` (use API route or Server Action)
   - Append results to parent (lift state up to a client wrapper OR use context)
   - Hide button when `currentPage >= totalPages`

4. **Client wrapper consideration:**
   - For mobile load-more to work, grid needs client-side state for appended guides
   - Create a thin client wrapper `guide-grid-client.tsx` that:
     - Receives initial guides as props
     - Manages appended guides in state
     - Renders all cards + load-more button
   - Desktop still uses server-rendered grid with pagination links
   - Use responsive conditional rendering or two separate components

## Todo List
- [ ] Update `page.tsx` with hero + filter bar + taxonomy data fetching
- [ ] Update `guide-grid.tsx` for responsive pagination/load-more
- [ ] Create `guide-load-more-button.tsx`
- [ ] Handle mobile client-side guide appending
- [ ] Test pagination on desktop still works
- [ ] Test load-more on mobile appends correctly
- [ ] Verify filter + load-more interaction (reset on filter change)

## Success Criteria
- Desktop: hero → filters → 3-col grid → pagination (all working)
- Mobile: hero → search+filter button → single-col → load more button
- Filters correctly narrow results on both layouts
- Load more appends next page without full page reload
- Empty state shown when no guides match filters

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Load-more + filter interaction complexity | Medium | Medium | Reset loaded state when filters change (useEffect on searchParams) |
| Hydration mismatch between server/client grid | Medium | High | Use single grid component; conditionally render pagination vs load-more by CSS only |
| Taxonomy fetch adds latency | Low | Low | Parallel fetch with guides data using Promise.all |

## Security Considerations
- Load-more fetch reuses same `getGuides()` with pagination — no new attack surface
- Filter params validated/sanitized in existing API layer

## Next Steps
- Phase 6 writes tests for all new components
