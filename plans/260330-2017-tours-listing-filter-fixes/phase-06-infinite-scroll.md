# Phase 6: Infinite Scroll (Replace Pagination)

**Status:** TODO
**Priority:** Medium
**Depends on:** Phase 1 (TourGrid client-side restructure)

## Problem

Current pagination uses numbered page buttons at the bottom. User must click to load next page, triggering full server navigation. For a tour catalog with ~10-50 tours, infinite scroll is more natural and engaging.

## Current State

- `TourPagination` component renders numbered page buttons
- Each page click = `router.push` with `?page=N` → full server re-render
- `TourGrid` (server) fetches one page of tours via `getTours()`
- API already supports `page` and `limit` params

## Solution

Replace pagination with "load more" infinite scroll using IntersectionObserver:

1. **Initial load**: Server renders first page of tours (SSR preserved)
2. **Scroll trigger**: When user scrolls near bottom, client fetches next page via Server Action
3. **Append**: New tours append to existing list (no page reload)
4. **End state**: Show "No more tours" when all pages loaded

### Architecture

```
Server (SSR)          Client (after hydration)
┌─────────────┐       ┌──────────────────────┐
│ TourGrid    │──────→│ TourGridLayout       │
│ fetches p1  │       │ - renders tours      │
│ returns     │       │ - IntersectionObserver│
│ tours +     │       │ - calls loadMore()   │
│ totalPages  │       │ - appends new tours  │
└─────────────┘       └──────────────────────┘
                              │
                              ▼
                      ┌──────────────────────┐
                      │ Server Action:       │
                      │ fetchMoreTours(page) │
                      │ returns FeaturedTour[]│
                      └──────────────────────┘
```

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/tour/tour-grid.tsx` | Pass `totalPages` to client layout component |
| `apps/web/components/tour/tour-grid-layout.tsx` | New client component: renders tours, manages infinite scroll state |
| `apps/web/lib/api/tour-actions.ts` | New file: `fetchMoreTours` Server Action (separate from get-tours.ts) |
| `apps/web/components/tour/tour-pagination.tsx` | Delete (replaced by infinite scroll) |

## Implementation Steps

### 1. Create Server Action for loading more tours

Create `apps/web/lib/api/tour-actions.ts` (separate file, validated):
```ts
'use server'
export async function fetchMoreTours(
  filters: TourFilters,
  page: number,
  locale: string
): Promise<{ tours: FeaturedTour[]; hasMore: boolean }> {
  const result = await getTours({ ...filters, page: String(page) }, locale)
  return {
    tours: result.tours,
    hasMore: result.page < result.totalPages,
  }
}
```

### 2. Create `TourGridLayout` client component

Client component that:
- Receives initial tours + filters + totalPages from server
- Uses `useState` to accumulate tours across pages
- Uses `IntersectionObserver` on a sentinel div at bottom
- Calls `fetchMoreTours` when sentinel becomes visible
- Shows loading spinner while fetching
- Shows "All tours loaded" when no more pages

### 3. Update `TourGrid` server component

- Fetch page 1 data (as before)
- Pass `tours`, `totalPages`, `filters`, `locale` to `TourGridLayout`
- Remove `TourPagination` usage

### 4. Delete `TourPagination`

Remove the component and its export from `index.ts`.

## Edge Cases

- **Filter change**: Reset accumulated tours, start from page 1 (filters trigger server navigation anyway)
- **No results**: Show `TourEmptyState` as before
- **Single page**: No sentinel rendered, no load-more logic
- **Network error on load-more**: Show retry button, don't break existing tours

## Success Criteria

- Tours load progressively as user scrolls
- Initial SSR page load unchanged (first page server-rendered)
- Filter/search changes reset scroll state correctly
- Loading indicator visible while fetching next page
- Clean end state when all tours loaded
