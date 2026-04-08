# Phase 1: Page Layout & Header Redesign

## Context Links
- Design: "Catalog — Option B (Search & Compare)" from General.pen
- Current page: `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` (66 lines)
- Current client wrapper: `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` (39 lines)
- Filter bar: `apps/web/components/tour/filter-bar/filter-bar.tsx` (240 lines)

## Overview
- **Priority:** High (blocks Phase 2 and 4)
- **Status:** Complete
- **Effort:** 3h

Replace the current flat layout (sticky FilterBar above grid) with: (1) a static Page Header section, and (2) a 2-column body (sidebar + grid) on desktop. Mobile layout handled in Phase 4.

## Key Insights
- Current `FilterBar` bundles desktop+mobile layouts in one 240-line component. We split responsibilities: desktop header becomes `TourPageHeader`, desktop sidebar becomes Phase 2's `SidebarFilters`, mobile stays in refactored `FilterBar`.
- `TourCatalogClient` currently wraps FilterBar + children in a `space-y-6` div. It needs to become a 2-column flex/grid container on desktop.
- The page header is NOT sticky (per design). The old sticky behavior is removed on desktop.

## Requirements

### Functional
- Page header shows: title "Stockholm Tours", subtitle, results count, sort dropdown, grid/list toggle, map button (placeholder)
- Desktop body: 260px fixed sidebar left, remaining space for tour grid
- Pass categories + filter state down to sidebar (Phase 2 mounts here)

### Non-Functional
- No layout shift on hydration (server renders structure, client adds interactivity)
- Maintain URL-based filter state (no breaking changes to shareable links)

## Architecture

### Data Flow
```
page.tsx (server)
  ├─ fetches categories, tours, total
  └─ renders:
       TourPageHeader (client) ← totalResults, viewMode, onViewModeChange
       TourCatalogBody (client) ← categories, viewMode
         ├─ SidebarFilters (Phase 2, desktop only)
         └─ TourGridLayout (existing, children)
```

### Component Breakdown
1. **`TourPageHeader`** — New client component. Static bar below nav with title, subtitle, results count, sort, view toggle, map button.
2. **`TourCatalogClient`** — Refactored. Becomes the orchestrator: renders PageHeader (desktop) + 2-column body. Still provides `ViewModeContext`.
3. **`page.tsx`** — Minor changes: remove container padding (header is full-width bg), adjust section structure.

## Related Code Files

### Files to Create
- `apps/web/components/tour/tour-page-header.tsx` — Desktop page header (title, subtitle, results, sort, view toggle, map)

### Files to Modify
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — Remove `container mx-auto px-4 py-6` wrapper, use new full-width sections
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` — Restructure: add PageHeader, 2-column layout with sidebar slot + children slot
- `apps/web/components/tour/filter-bar/filter-bar.tsx` — Remove desktop section (lines 105-175). Keep mobile section only. Rename or keep as `MobileFilterBar`.

### Files Unchanged
- `tour-search.tsx`, `tour-sort.tsx`, `results-count.tsx` — Reused as-is in new locations

## Implementation Steps

### Step 1: Create `tour-page-header.tsx`
```
Location: apps/web/components/tour/tour-page-header.tsx
Props: { totalResults: number, viewMode, onViewModeChange, onMapToggle? }
```
- Left side: "Stockholm Tours" (font-serif text-[28px] text-[var(--color-primary)]) + subtitle (text-sm text-[var(--color-text-muted)])
- Right side: ResultsCount + TourSort + ViewModeToggle (extract from filter-bar.tsx) + Map button (placeholder, disabled)
- Background: `bg-[var(--color-background)]`, padding `py-6 px-20` (80px = 5rem ≈ px-20)
- Hidden on mobile: `hidden lg:block`
- Extract `ViewModeToggle` from filter-bar.tsx into shared location or inline here

### Step 2: Refactor `tour-catalog-client.tsx`
- Import `TourPageHeader`
- Wrap layout in ViewModeContext provider (keep existing)
- Structure:
  ```jsx
  <ViewModeContext value={viewMode}>
    {/* Desktop page header */}
    <TourPageHeader ... /> {/* hidden lg:block inside */}
    {/* Mobile header — FilterBar mobile section */}
    <MobileFilterHeader ... /> {/* lg:hidden inside — Phase 4 */}
    {/* Body: sidebar + grid */}
    <div className="flex gap-8 px-20 pb-8"> {/* px-20 = 80px */}
      <aside className="hidden lg:block w-[260px] shrink-0">
        {/* SidebarFilters mounted in Phase 2, placeholder div for now */}
      </aside>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  </ViewModeContext>
  ```
- Accept `categories` prop to pass to sidebar later

### Step 3: Update `page.tsx`
- Remove `container mx-auto px-4 py-6 lg:py-8` from `<section>`
- Let `TourCatalogClient` handle its own padding
- Keep server data fetching as-is

### Step 4: Slim down `filter-bar.tsx`
- Remove desktop layout block (lines 105-175)
- Keep only mobile layout (lines 178-198)
- Extract `ViewModeToggle` to `apps/web/components/tour/view-mode-toggle.tsx` (~35 lines, shared)
- Remove scroll sentinel + sticky behavior (desktop no longer needs it)
- Rename component to reflect mobile-only if desired, or keep name and note desktop is Phase 1's PageHeader

### Step 5: Export updates
- Update `apps/web/components/tour/index.ts` barrel to export new components
- Update `apps/web/components/tour/filter-bar/index.ts` if FilterBar is renamed

## Todo List
- [x] Create `tour-page-header.tsx` with title, subtitle, results, sort, view toggle, map button
- [x] Extract `ViewModeToggle` to shared component
- [x] Refactor `tour-catalog-client.tsx` to 2-column layout
- [x] Update `page.tsx` section wrapper
- [x] Slim `filter-bar.tsx` to mobile-only
- [x] Update barrel exports
- [x] Verify no hydration mismatch (server/client structure aligned)

## Success Criteria
- Desktop: page header visible below nav, not sticky, full-width bg #FAFAF8
- Desktop: 2-column layout with 260px left slot (empty placeholder) + grid fills remaining
- Mobile: existing behavior preserved (filter bar still works)
- URL filter state still works (no regressions)
- All existing tests pass

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hydration mismatch from responsive `hidden`/`block` | Low | Med | Use CSS only (`hidden lg:block`), no conditional rendering |
| ViewModeToggle extraction breaks existing imports | Low | Low | Keep re-export from old location |
| FilterBar refactor breaks mobile | Med | High | Phase 4 handles mobile; keep mobile section intact in Phase 1 |

## Security Considerations
- No new user input surfaces. Sort/view mode are controlled values.

## Next Steps
- Phase 2 mounts `SidebarFilters` in the `<aside>` slot
- Phase 4 replaces FilterBar mobile section with new `MobileFilterHeader`
