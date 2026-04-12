# Phase 04: Filter Bar & Search

## Context Links
- Tour filter pattern: `apps/web/components/tour/filter-bar/filter-bar.tsx`
- Tour search with debounce: `apps/web/components/tour/tour-search.tsx`
- Debounce hook: `apps/web/lib/hooks/use-debounce.ts`
- Tour filter drawer: `apps/web/components/tour/filter-drawer.tsx`

## Overview
- **Priority:** High (core UX feature)
- **Status:** Complete
- **Description:** Create desktop filter bar (search + 3 dropdowns + count) and mobile filter drawer.

## Key Insights
- Tour catalog uses URL search params for filter state — follow same pattern
- `useDebounce` hook already exists for search input delay
- Radix UI Select/Popover available for dropdowns
- Mobile: single "Filters" button opens drawer with all dropdowns
- Desktop: inline horizontal row with all controls visible

## Requirements

### Functional
- **Desktop:** Search input + Language dropdown + Specialization dropdown + Area dropdown + "{N} guides" count
- **Mobile:** Search input + "Filters" button (opens drawer) + "{N} guides" count
- Filters update URL search params (enables shareable URLs, SSR-compatible)
- Search debounced at 300ms
- Dropdowns populated from CMS data (languages, categories, cities)

### Non-Functional
- Client components (interactive)
- Each file under 150 lines
- Responsive breakpoint: `lg:` for desktop layout

## Architecture

```
guide-filter-bar.tsx (client, desktop+mobile orchestrator)
├── Search input (magnifying glass icon, debounced)
├── Desktop: 3x Select dropdowns (hidden on mobile)
├── Mobile: "Filters" button → opens GuideFilterDrawerMobile
├── Guide count text
└── URL search params sync via useSearchParams + useRouter

guide-filter-drawer-mobile.tsx (client, mobile drawer)
├── Sheet/Drawer from Radix
├── Language select
├── Specialization select
├── Area select
└── Apply/Clear buttons
```

## Related Code Files
- **Create:** `apps/web/components/guide/guide-filter-bar.tsx`
- **Create:** `apps/web/components/guide/guide-filter-drawer-mobile.tsx`

## Implementation Steps

1. Create `guide-filter-bar.tsx`:
   - Props: `{ totalGuides: number, languages: string[], specializations: Array<{id,name,slug}>, areas: Array<{id,name,slug}> }`
   - Use `useSearchParams()` + `useRouter()` + `usePathname()` for URL state
   - Search input: `<input>` with magnifying glass icon, value synced to `q` param via debounce
   - Desktop dropdowns (hidden `lg:flex`): native `<select>` or Radix Select for Language, Specialization, Area
   - **Mobile: "Filters" button INSIDE the search input** (right-aligned), primary fill, `cornerRadius 6`, `sliders-horizontal` icon + "Filters" text, `lg:hidden`
   - Count text: `{totalGuides} guides` below search bar on mobile (mresRow), inline on desktop
   - On filter change: `router.replace(pathname + '?' + newParams, { scroll: false })`

2. Create `guide-filter-drawer-mobile.tsx`:
   - Props: `{ open, onOpenChange, languages, specializations, areas }`
   - Use Sheet component (or build simple drawer with fixed positioning + backdrop)
   - Three select controls for each filter dimension
   - "Apply" closes drawer (params already synced), "Clear" resets all filters

3. Wire i18n: use `useTranslations('guides.filters')` for all labels

## Todo List
- [ ] Create `guide-filter-bar.tsx` with search + desktop dropdowns
- [ ] Create `guide-filter-drawer-mobile.tsx` for mobile filters
- [ ] Wire URL search params for all filters
- [ ] Implement debounced search
- [ ] Add guide count display
- [ ] Test responsive behavior (desktop vs mobile)

## Success Criteria
- Filters modify URL search params correctly
- Page re-renders with filtered data on param change (server component refetch)
- Search is debounced (no excessive requests)
- Mobile drawer opens/closes smoothly
- All controls are labeled and accessible

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dropdown options stale if CMS data changes | Low | Low | Props passed from server component on each render |
| Search triggers too many navigations | Medium | Medium | Debounce at 300ms, only navigate on value change |
| Radix Select not installed | Low | High | Check package.json; fallback to native select if needed |

## Security Considerations
- Search param `q` is passed to Payload `like` query — already handled in `getGuides()` with `%` wrapping
- No XSS risk: params are URL-encoded by Next.js

## Next Steps
- Phase 5 imports filter bar and passes CMS data as props
