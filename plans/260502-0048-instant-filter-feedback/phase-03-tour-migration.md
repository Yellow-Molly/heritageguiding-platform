---
phase: 03
title: Tour Catalog Migration
status: complete
priority: high
effort: 1h
depends: [02]
---

# Phase 03 — Tour Catalog Migration

## Context Links
- Brainstorm: `plans/reports/brainstorm-260501-1949-instant-filter-feedback.md`
- Provider API: `phase-02-provider-scaffold.md`

## Overview
**Priority:** High
**Status:** Pending (blocked by Phase 02)

Mount `<FilterStateProvider>` in `tour-catalog-client.tsx`. Migrate 5 consumers (`category-chips`, `sidebar-filters`, `filter-drawer-sections`, `tour-search`, `tour-sort`) to `useFilterState()`. Wire `<GridPendingOverlay>` into `tour-grid-layout`.

## Key Insights
- Each consumer currently duplicates `useSearchParams + useRouter + usePathname` block — provider collapses all
- Selected state in chips currently derived from `useSearchParams()` → switches to `params` from hook (optimistic)
- `tour-search.tsx` must keep its 500ms `useDebouncedCallback` and use `replace: true` to avoid history pollution
- `filter-drawer.tsx` shell stays as-is; only `filter-drawer-sections.tsx` (the inner content) consumes hook
- `generationRef` in `tour-grid-layout.tsx:32` already discards stale infinite-scroll fetches — leave intact, just confirm during migration

## Requirements
**Functional**
- Chip click → `aria-selected` flips within one frame
- Filter changes → grid dims (opacity-50) + overlay shows until server completes
- Search input → 500ms debounce preserved, fires `setParam('q', value, {replace: true})`
- Sort change → fires `setParam('sort', value)`
- Drawer toggles → fire on each interaction (not on Apply); existing UX preserved
- Clear all → `clearAll()`

**Non-functional**
- Each migrated file shrinks (less boilerplate)
- No new prop drilling — provider context handles distribution
- All affected files stay <200 LOC

## Architecture
```
tour-catalog-client.tsx
  └─ <FilterStateProvider>
       ├─ <CategoryChips />          // useFilterState()
       ├─ <SidebarFilters />         // useFilterState()
       ├─ <FilterDrawer>
       │    └─ <FilterDrawerSections /> // useFilterState()
       ├─ <TourSearch />             // useFilterState() + debounce
       ├─ <TourSort />               // useFilterState()
       └─ <TourGridLayout>           // reads isPending
            ├─ <GridPendingOverlay />
            └─ grid (opacity-50 when pending)
```

## Related Code Files
**Modified:**
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` — wrap children in provider
- `apps/web/components/tour/filter-bar/category-chips.tsx` — replace boilerplate with `useFilterState`
- `apps/web/components/tour/sidebar/sidebar-filters.tsx` — same; preserve duration single-select + accessibility boolean
- `apps/web/components/tour/filter-drawer-sections.tsx` — replace `updateFilter` callback with `setParam`/`toggleListItem`
- `apps/web/components/tour/tour-search.tsx` — keep debounce, swap router.replace call for `setParam('q', v, {replace: true})`
- `apps/web/components/tour/tour-sort.tsx` — replace router.push with `setParam('sort', value)`
- `apps/web/components/tour/tour-grid-layout.tsx` — read `isPending` from hook, render overlay, add `relative` + conditional opacity to grid wrapper

## Implementation Steps
1. **Wrap provider** in `tour-catalog-client.tsx`:
   - Import `FilterStateProvider`
   - Wrap existing children with provider; no other changes
2. **Migrate `category-chips.tsx`:**
   - Remove `useSearchParams`, `useRouter`, `usePathname`
   - `const { params, toggleListItem } = useFilterState()`
   - Selected: `params.get('categories')?.split(',').includes(slug)`
   - onClick: `toggleListItem('categories', slug)`
3. **Migrate `sidebar-filters.tsx`:**
   - Same swap; `makeMultiToggle(key)` returns `slug => toggleListItem(key, slug)`
   - Duration: `setParam('duration', value === 'all' ? null : value)`
   - Accessibility: `setParam('accessible', checked ? '1' : null)`
4. **Migrate `filter-drawer-sections.tsx`:**
   - `updateFilter(key, value)` → either `setParam(key, value)` or `toggleListItem(key, value)` depending on filter shape
   - Confirm clear-all branch routes through `clearAll()`
5. **Migrate `tour-search.tsx`:**
   - Keep `useDebouncedCallback` (500ms)
   - Inside debounced fn: `setParam('q', value || null, { replace: true })`
   - Drop local `useTransition` (provider owns it now)
6. **Migrate `tour-sort.tsx`:**
   - `onChange={(e) => setParam('sort', e.target.value)}`
7. **Update `tour-grid-layout.tsx`:**
   - Add `const { isPending } = useFilterState()`
   - Wrap grid container: `<div className="relative">` ... `<GridPendingOverlay isPending={isPending} />`
   - Apply `cn('grid ...', isPending && 'opacity-50 pointer-events-none transition-opacity')` to inner grid
   - Confirm `generationRef` block at line 32 still works (no code change — just verify by reading)
8. **Run typecheck + lint** on tour package
9. **Local smoke test:** `npm run dev`, open `/tours`, click category chips rapidly — chips should flip instantly, overlay visible during refetch

## Todo List
- [ ] Wrap `tour-catalog-client.tsx` with provider
- [ ] Migrate `category-chips.tsx`
- [ ] Migrate `sidebar-filters.tsx`
- [ ] Migrate `filter-drawer-sections.tsx`
- [ ] Migrate `tour-search.tsx` (preserve debounce, use replace)
- [ ] Migrate `tour-sort.tsx`
- [ ] Update `tour-grid-layout.tsx` with overlay + dim
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean (workspace allows)
- [ ] Local smoke: rapid chip clicks, search input, sort, drawer

## Success Criteria
- Chip-click visual flip <50ms (browser perf measure)
- Overlay visible within 100ms of click
- Search debounce still 500ms; no URL pollution (history clean)
- All migrated files smaller LOC than before
- `generationRef` infinite-scroll race protection still in place

## Risk Assessment
- **Risk:** `useDebouncedCallback` + transition interaction — debounced fn fires outside React render. **Mitigation:** Provider's `setParam` wraps `startTransition` internally; debounced caller doesn't need transition awareness
- **Risk:** Drawer "Apply" button user expectation — confirmed brainstorm: drawer commits per-change, button only closes drawer. Don't change semantics
- **Risk:** Hydration mismatch on initial render. **Mitigation:** `useOptimistic(searchParams.toString())` — initial state matches SSR exactly

## Security
- N/A (URL state only, no new data flows)

## Next Steps
- Phase 04 (guides) can run in parallel
- Phase 05 tests verify after both migrations land
