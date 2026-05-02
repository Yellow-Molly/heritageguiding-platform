---
phase: 02
title: FilterStateProvider + Shared Pending Overlay
status: complete
priority: high
effort: 45m
---

# Phase 02 — Provider Scaffold + Shared Overlay

## Context Links
- Brainstorm: `plans/reports/brainstorm-260501-1949-instant-filter-feedback.md` (§ "Recommended solution")

## Overview
**Priority:** High (foundation for Phase 03 + 04)
**Status:** Pending

Build the React 19 `<FilterStateProvider>` that owns optimistic URL state + transition. Build the shared `<GridPendingOverlay>` consumed by both grids. No consumer migration in this phase — only scaffold + types.

## Key Insights
- `useOptimistic` initial state must equal SSR-rendered state → use `searchParams.toString()` (deterministic)
- Provider must support both `router.push` (filters) and `router.replace` (search debounce — preserves history hygiene)
- `URLSearchParams` is mutable — clone before each operation to keep optimistic state immutable across renders
- `toggleListItem` for comma-delimited lists (categories, cities, languages) — preserves existing URL contract

## Requirements
**Functional**
- Provider exposes via `useFilterState()`:
  - `params: URLSearchParams` — current optimistic params (cloned)
  - `isPending: boolean` — transition pending flag
  - `setParam(key: string, value: string | null, opts?: { replace?: boolean }): void`
  - `toggleListItem(key: string, slug: string, opts?: { replace?: boolean }): void` — comma-list toggle
  - `clearAll(opts?: { replace?: boolean }): void` — push pathname only
- `<GridPendingOverlay>`: absolutely-positioned overlay, `Loader2` spinner, fade transition, `aria-busy`

**Non-functional**
- Both files <200 LOC
- Zero new dependencies (Loader2 already from `lucide-react`)
- Provider must throw clear error if `useFilterState` called outside provider

## Architecture
```
<FilterStateProvider>          // useOptimistic + useTransition
  ├─ useSearchParams()         // server truth
  ├─ useOptimistic(serverStr)  // optimistic mirror
  ├─ useTransition()           // wraps router.push/replace
  └─ context value: {params, isPending, setParam, toggleListItem, clearAll}

<GridPendingOverlay isPending>
  └─ absolute inset-0, opacity-50 backdrop, centered Loader2
```

## Related Code Files
**Created:**
- `apps/web/components/tour/filter-state-provider.tsx` (~120 LOC budget)
- `apps/web/components/shared/grid-pending-overlay.tsx` (~30 LOC budget)

**Read for context:**
- `apps/web/components/tour/tour-search.tsx` (existing transition pattern to mirror)
- `apps/web/components/tour/filter-bar/category-chips.tsx` (consumer shape)
- `apps/web/components/ui/spinner.tsx` or wherever Loader2 is currently used

## Implementation Steps
1. Read existing `tour-search.tsx` to mirror its `useTransition` + `router.replace` style
2. Create `filter-state-provider.tsx`:
   ```tsx
   'use client'
   const FilterCtx = createContext<FilterState | null>(null)
   export function FilterStateProvider({ children }) {
     const router = useRouter()
     const pathname = usePathname()
     const searchParams = useSearchParams()
     const serverStr = searchParams.toString()
     const [optimisticStr, setOptimistic] = useOptimistic(serverStr)
     const [isPending, startTransition] = useTransition()

     const commit = (next: URLSearchParams, replace = false) => {
       const str = next.toString()
       startTransition(() => {
         setOptimistic(str)
         const url = str ? `${pathname}?${str}` : pathname
         replace ? router.replace(url, { scroll: false }) : router.push(url, { scroll: false })
       })
     }

     const setParam = (key, value, { replace } = {}) => {
       const next = new URLSearchParams(optimisticStr)
       value ? next.set(key, value) : next.delete(key)
       commit(next, replace)
     }

     const toggleListItem = (key, slug, { replace } = {}) => {
       const next = new URLSearchParams(optimisticStr)
       const list = next.get(key)?.split(',').filter(Boolean) ?? []
       const idx = list.indexOf(slug)
       idx >= 0 ? list.splice(idx, 1) : list.push(slug)
       list.length ? next.set(key, list.join(',')) : next.delete(key)
       commit(next, replace)
     }

     const clearAll = ({ replace } = {}) => commit(new URLSearchParams(), replace)

     const params = useMemo(() => new URLSearchParams(optimisticStr), [optimisticStr])
     return <FilterCtx.Provider value={{params, isPending, setParam, toggleListItem, clearAll}}>{children}</FilterCtx.Provider>
   }
   export const useFilterState = () => {
     const ctx = useContext(FilterCtx)
     if (!ctx) throw new Error('useFilterState must be used within FilterStateProvider')
     return ctx
   }
   ```
3. Create `grid-pending-overlay.tsx`:
   ```tsx
   'use client'
   export function GridPendingOverlay({ isPending }: { isPending: boolean }) {
     return (
       <div
         aria-busy={isPending}
         className={cn(
           'pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 transition-opacity duration-150',
           isPending ? 'opacity-100' : 'opacity-0'
         )}
       >
         {isPending && <Loader2 className="size-8 animate-spin text-primary" />}
       </div>
     )
   }
   ```
4. Run `npm run typecheck` (or workspace equivalent) to verify no TS errors
5. No runtime test yet — Phase 05 covers integration

## Todo List
- [ ] Read `tour-search.tsx` for existing transition pattern
- [ ] Locate Loader2 usage / spinner conventions
- [ ] Create `filter-state-provider.tsx`
- [ ] Create `grid-pending-overlay.tsx`
- [ ] Run typecheck — fix any type errors
- [ ] Confirm files <200 LOC each

## Success Criteria
- TypeScript compiles cleanly
- Both files exist with documented exports
- Provider throws if hook used outside

## Risk Assessment
- **Risk:** `useOptimistic` requires render inside transition — wrapping `setOptimistic` + `router.push` in same `startTransition` is the documented pattern (React 19 docs). **Mitigation:** Mirror exact pattern from React docs example
- **Risk:** Overlay z-index conflicts with existing card hover states. **Mitigation:** `pointer-events-none` already on overlay; grid wrapper needs `relative` (Phase 03/04 detail)

## Security
- N/A (UI scaffolding only, no data handling)

## Next Steps
- Phase 03 (tour migration) and Phase 04 (guides migration) can run in parallel after this lands
