---
phase: 04
title: Guides Catalog Migration
status: complete
priority: high
effort: 45m
depends: [02]
parallel_with: [03]
---

# Phase 04 — Guides Catalog Migration

## Context Links
- Brainstorm: `plans/reports/brainstorm-260501-1949-instant-filter-feedback.md`
- Provider API: `phase-02-provider-scaffold.md`
- Mirror reference: `phase-03-tour-migration.md`

## Overview
**Priority:** High
**Status:** Pending (blocked by Phase 02; parallel with Phase 03)

Mirror the tour migration for `/guides`. Key difference: guides has **no client wrapper today** — `GuideFilterBar` and `GuideGridClient` are siblings inside the server component `guides/page.tsx`. Must introduce `<GuideCatalogClient>` wrapper.

## Key Insights
- `guide-filter-bar.tsx` already has local `useTransition` + `router.replace({ scroll: false })` — must replace local transition with provider; consumer becomes simpler
- 300ms debounce on search input (vs tour's 500ms) — preserve existing value
- `guide-grid-client.tsx` `fetchMoreGuides(paramsKey, page, locale)` signature differs from tour's `fetchMoreTours(filters, ...)` — `paramsKey` is `searchParams.toString()`. Provider's `params.toString()` substitutes cleanly
- Same `generationRef` infinite-scroll race protection in `guide-grid-client.tsx` — leave intact

## Requirements
**Functional**
- Filter dropdowns (language, specialization, area) → `setParam(key, value || null)`
- Mobile drawer toggles → fire per-change
- Search input → 300ms debounce preserved, `setParam('q', v, {replace: true})`
- Grid dims + overlay during pending

**Non-functional**
- New `guide-catalog-client.tsx` <100 LOC (composition only)
- Migrated `guide-filter-bar.tsx` smaller than current 134 LOC
- All files <200 LOC

## Architecture
```
guides/page.tsx (server component)
  └─ <GuideCatalogClient>            // NEW
       └─ <FilterStateProvider>
            ├─ <GuideFilterBar />     // useFilterState
            ├─ <GuideFilterDrawerMobile />  // useFilterState
            └─ <GuideGridClient />    // reads isPending + params.toString() for paramsKey
                 └─ <GridPendingOverlay />
```

## Related Code Files
**Created:**
- `apps/web/components/guide/guide-catalog-client.tsx`

**Modified:**
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` — replace direct sibling render with `<GuideCatalogClient>` wrapper
- `apps/web/components/guide/guide-filter-bar.tsx` — drop local `useTransition`, consume `useFilterState`
- `apps/web/components/guide/guide-filter-drawer-mobile.tsx` (verify exact filename) — consume hook
- `apps/web/components/guide/guide-grid-client.tsx` — read `isPending`, render overlay, derive `paramsKey` from `params.toString()`

## Implementation Steps
1. **Confirm guide drawer filename** — `Glob apps/web/components/guide/*drawer*` to find exact path
2. **Create `guide-catalog-client.tsx`:**
   ```tsx
   'use client'
   import { FilterStateProvider } from '@/components/tour/filter-state-provider'

   type Props = { filterBar: ReactNode; grid: ReactNode }
   export function GuideCatalogClient({ filterBar, grid }: Props) {
     return (
       <FilterStateProvider>
         {filterBar}
         {grid}
       </FilterStateProvider>
     )
   }
   ```
   *(Pass children as named slots so the server component composes server-fetched data into them.)*
3. **Update `guides/page.tsx`:**
   - Wrap existing `<GuideFilterBar>` + `<GuideGridClient>` inside `<GuideCatalogClient>` with appropriate slot props (or simpler: a single `children` prop containing both)
4. **Migrate `guide-filter-bar.tsx`:**
   - Remove local `useTransition`, `useRouter`, `usePathname`, `useSearchParams`
   - Replace each dropdown handler with `setParam(key, value || null)`
   - Replace search debounced fn with `setParam('q', v, {replace: true})`
5. **Migrate `guide-filter-drawer-mobile.tsx`:**
   - Same hook-consumer swap as `filter-drawer-sections.tsx` did for tours
6. **Update `guide-grid-client.tsx`:**
   - `const { isPending, params } = useFilterState()`
   - Use `params.toString()` as `paramsKey` (replaces external prop or local searchParams call)
   - Add overlay + dim grid same as `tour-grid-layout.tsx`
   - Confirm `generationRef` block intact (no code change)
7. **Run typecheck + lint**
8. **Local smoke test:** `/guides` — change language filter, observe instant flip + grid dim + overlay

## Todo List
- [ ] Confirm guide drawer mobile filename via Glob
- [ ] Create `guide-catalog-client.tsx`
- [ ] Update `guides/page.tsx` to wrap with new client component
- [ ] Migrate `guide-filter-bar.tsx`
- [ ] Migrate `guide-filter-drawer-mobile.tsx`
- [ ] Update `guide-grid-client.tsx` with overlay + isPending + paramsKey from hook
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] Local smoke: dropdown changes, search, drawer

## Success Criteria
- `/guides` filter changes feel instant (visual flip <50ms)
- Grid pending overlay appears within 100ms
- 300ms search debounce preserved
- No regression in deep-linking, infinite scroll
- New `guide-catalog-client.tsx` is the only new file in this phase

## Risk Assessment
- **Risk:** Server component → client component data passing for filter bar (which needs server-fetched languages/specializations/areas). **Mitigation:** Pre-fetch on server, pass as props through `GuideCatalogClient` slots; provider only owns URL state, not list data
- **Risk:** Drawer filename guess may be wrong. **Mitigation:** Glob first (Step 1)
- **Risk:** `paramsKey` change may break existing memoization in `guide-grid-client.tsx`. **Mitigation:** `params.toString()` is referentially stable for same content; verify by smoke test

## Security
- N/A

## Next Steps
- Phase 05 verifies both migrations together
