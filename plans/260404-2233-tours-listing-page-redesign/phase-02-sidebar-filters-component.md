# Phase 2: Sidebar Filters Component

## Context Links
- Design spec: Option B sidebar — Categories (checkboxes), Duration, Price Range slider, Accessibility
- Current filter-drawer.tsx (250 lines) — Has similar filter logic for mobile, reusable patterns
- API: `TourFilters` already supports `categories`, `duration`, `priceMin`, `priceMax`, `accessible`

## Overview
- **Priority:** High
- **Status:** Complete
- **Effort:** 3h
- **Depends on:** Phase 1 (sidebar `<aside>` slot must exist)

Build the desktop sidebar filter panel: checkbox groups for categories/duration/accessibility + dual-thumb price range slider. All filters update URL search params (same pattern as existing chips/drawer).

## Key Insights
- Existing `filter-drawer.tsx` has category toggle + duration select + accessibility toggle logic. Sidebar uses same URL param pattern but different UI (checkboxes vs buttons/selects).
- Price range slider is new. Design shows min/max labels + track bar. Simple implementation: two `<input type="range">` overlaid, or a custom dual-thumb component. KISS: use two range inputs with CSS styling.
- Categories come from CMS via props (not hardcoded). Checkbox labels = `category.name`.
- Duration filter in design uses checkboxes ("Under 2 hours", "2-3 hours", "3+ hours") vs current dropdown. URL param `duration` currently takes a single max value. Need to decide: keep single-value or support multi-select. KISS: keep single-value, map checkbox selection to `duration` param.

## Requirements

### Functional
- **Categories**: Checkbox list. "All Tours" checkbox (checked = no categories param). Others: multi-select, maps to `categories=slug1,slug2`.
- **Duration**: Checkbox group. "Under 2 hours" (duration=120), "2-3 hours" (duration=180), "3+ hours" (duration=240). Single select (radio behavior via checkboxes).
- **Price Range**: Dual-thumb slider. Min=695, Max=1295 SEK (or dynamic from tours data). Updates `priceMin`/`priceMax` URL params on release.
- **Accessibility**: Checkboxes for "Wheelchair accessible" and "Hearing assistance". Maps to `accessible=true` (existing) + potential `hearing=true` param.
- Sections separated by top border, 24px gap between sections, 12px gap between items.

### Non-Functional
- Desktop only (`hidden lg:block` on parent aside from Phase 1)
- Debounce price range URL updates (avoid excessive navigation)
- Under 200 lines per component file

## Architecture

### Data Flow
```
URL searchParams → useSearchParams() → derive checked state
User clicks checkbox → update URLSearchParams → router.push → server re-fetches
```

### Component Tree
```
SidebarFilters (orchestrator, ~80 lines)
  ├─ FilterCheckboxGroup (reusable, ~60 lines) — used for Categories, Duration, Accessibility
  └─ PriceRangeSlider (~90 lines) — dual thumb range input
```

### File Structure
- `apps/web/components/tour/sidebar/sidebar-filters.tsx` — Main sidebar component
- `apps/web/components/tour/sidebar/filter-checkbox-group.tsx` — Reusable checkbox group
- `apps/web/components/tour/sidebar/price-range-slider.tsx` — Dual-thumb price slider
- `apps/web/components/tour/sidebar/index.ts` — Barrel export

## Related Code Files

### Files to Create
- `apps/web/components/tour/sidebar/sidebar-filters.tsx`
- `apps/web/components/tour/sidebar/filter-checkbox-group.tsx`
- `apps/web/components/tour/sidebar/price-range-slider.tsx`
- `apps/web/components/tour/sidebar/index.ts`

### Files to Modify
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` — Mount `<SidebarFilters>` in aside slot
- `apps/web/components/tour/index.ts` — Add sidebar exports

### Files Unchanged
- API layer, page.tsx (already handled in Phase 1)

## Implementation Steps

### Step 1: Create `filter-checkbox-group.tsx`
```typescript
interface FilterCheckboxGroupProps {
  title: string
  options: { id: string; label: string }[]
  selected: string[]           // for multi-select (categories)
  selectedSingle?: string      // for single-select (duration)
  multiSelect?: boolean        // default true
  onChange: (id: string) => void
}
```
- Renders heading (Inter 14px bold, text-[var(--color-primary)]) + vertical checkbox list
- Each checkbox: custom styled `<input type="checkbox">` + label
- Checked state: filled bg-[var(--color-primary)] border-[var(--color-primary)] for selected, border-[#E5E7EB] for unselected
- Gap between items: 12px (`space-y-3`)

### Step 2: Create `price-range-slider.tsx`
```typescript
interface PriceRangeSliderProps {
  min: number      // e.g., 695
  max: number      // e.g., 1295
  currentMin: number
  currentMax: number
  onChange: (min: number, max: number) => void
  currency?: string  // "SEK"
}
```
- Two `<input type="range">` overlaid via absolute positioning
- Track: gray bar, active range segment highlighted in primary color
- Labels show current min and max values formatted with currency
- Debounce `onChange` by 300ms to avoid URL spam
- CSS: Use `appearance: none` + custom thumb styling

### Step 3: Create `sidebar-filters.tsx`
- Reads URL params via `useSearchParams()`
- Sections with `border-t border-[var(--color-border)]` separator (except first)
- **Categories section**: `FilterCheckboxGroup` with "All Tours" + CMS categories
  - "All Tours" selected when no categories in URL
  - Clicking "All Tours" clears `categories` param
  - Clicking specific category toggles in/out of comma-separated `categories` param
- **Duration section**: `FilterCheckboxGroup` single-select
  - Options: "Under 2 hours" (120), "2-3 hours" (180), "3+ hours" (240)
  - Maps to `duration` URL param
- **Price Range section**: `PriceRangeSlider`
  - Read `priceMin`/`priceMax` from URL, defaults to full range
  - On change: set `priceMin`/`priceMax` params
- **Accessibility section**: `FilterCheckboxGroup` multi-select
  - "Wheelchair accessible" → `accessible=true`
  - "Hearing assistance" → `hearing=true` (check if API supports; if not, placeholder)
- Each section: 24px gap (`space-y-6` on container), items 12px gap

### Step 4: Mount in `tour-catalog-client.tsx`
- Import `SidebarFilters` from sidebar barrel
- Replace placeholder aside content with `<SidebarFilters categories={categories} />`

### Step 5: Barrel exports
- Create `apps/web/components/tour/sidebar/index.ts`
- Update `apps/web/components/tour/index.ts`

## Todo List
- [x] Create `filter-checkbox-group.tsx` — reusable checkbox group component
- [x] Create `price-range-slider.tsx` — dual-thumb range input with debounce
- [x] Create `sidebar-filters.tsx` — orchestrator with all 4 filter sections
- [x] Create `sidebar/index.ts` barrel
- [x] Mount SidebarFilters in tour-catalog-client aside
- [x] Update barrel exports
- [x] Test: selecting categories updates URL and triggers server re-render
- [x] Test: price range slider debounces correctly
- [x] Test: accessibility checkbox toggles `accessible` param

## Success Criteria
- Desktop sidebar visible with 4 filter sections separated by borders
- Checking a category adds it to URL `categories` param
- Price slider updates `priceMin`/`priceMax` on release (debounced)
- Selecting duration sets `duration` param
- Accessibility checkbox sets `accessible=true`
- All filters are shareable via URL
- Each file under 200 lines

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Price range slider cross-browser inconsistency | Med | Med | Use `appearance: none` + thorough thumb/track styling. Test Chrome, Firefox, Safari. |
| `hearing` filter param not in API | High | Low | Check get-tours.ts. If unsupported, add param or make checkbox visual-only with TODO. |
| Too many URL updates from slider dragging | Med | Med | Debounce onChange, update URL only on `onMouseUp`/`onTouchEnd` |

## Security Considerations
- Category slugs sanitized via `sanitizeSlug` (already in codebase)
- Price values parsed as integers, validated against min/max bounds
- No XSS risk — values go to URL params then to server-side Payload query

## Next Steps
- Phase 3 runs in parallel: tour card redesign
- Phase 5 adds i18n keys for sidebar labels
