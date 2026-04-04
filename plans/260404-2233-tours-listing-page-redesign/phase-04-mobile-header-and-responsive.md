# Phase 4: Mobile Header & Responsive

## Context Links
- Design: Mobile layout (375px) — search bar, filters pill, category pills, results row
- Current mobile: `filter-bar.tsx` lines 178-198 (mobile section)
- Current: `category-chips.tsx` (159 lines) — horizontal scrollable chips
- Current: `filter-drawer.tsx` (250 lines) — slide-out mobile filter panel

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Effort:** 2.5h
- **Depends on:** Phase 1 (FilterBar desktop section removed)

Redesign mobile header to match Option B: search bar with "Filters" pill button, horizontal category pills, results + sort row. Keep filter drawer but update to match sidebar filter options (duration checkboxes, price range, accessibility).

## Key Insights
- Current mobile layout already has: search + filter button (row 1), category chips (row 2), results + sort (row 3). Structure is very close to design.
- Main changes: (1) "Filters" button becomes a pill with navy bg + sliders icon, (2) search bar and filter pill on same row, (3) bg #FAFAF8 + padding 16px, (4) category pills as horizontal scroll with "All" filled navy.
- Filter drawer needs updates to include price range slider (reuse from Phase 2) and checkbox-style duration (instead of dropdown).

## Requirements

### Functional
- **Search row**: Search input + "Filters" pill button (navy bg, white text, sliders icon)
- **Category pills**: Horizontal scroll, "All" = filled navy, others = border pills, 8px gap
- **Results row**: "{n} results" left, "Most Popular ▾" sort dropdown right
- **Filter drawer**: Update duration from dropdown to checkboxes, add price range slider
- Section bg: `bg-[var(--color-background)]`, padding 16px, 12px vertical gap

### Non-Functional
- Only visible on `< lg` breakpoint
- Maintain URL state pattern
- Filter drawer reuses `PriceRangeSlider` from Phase 2

## Architecture

### Component Tree (Mobile)
```
MobileFilterHeader (lg:hidden)
  ├─ Row 1: TourSearch + FiltersPillButton
  ├─ Row 2: CategoryChips (horizontal scroll)
  └─ Row 3: ResultsCount + TourSort
FilterDrawer (modal, updated)
  ├─ Categories (checkbox list, same as current)
  ├─ Duration (checkboxes instead of dropdown)
  ├─ Price Range (PriceRangeSlider from Phase 2)
  └─ Accessibility (checkboxes)
```

## Related Code Files

### Files to Modify
- `apps/web/components/tour/filter-bar/filter-bar.tsx` — Restyle mobile section to match design. This was already slimmed to mobile-only in Phase 1. Now update styling.
- `apps/web/components/tour/filter-bar/category-chips.tsx` — Update chip styles: "All" = navy filled, others = border/outline pills. Adjust gap to 8px.
- `apps/web/components/tour/filter-drawer.tsx` — Replace duration dropdown with checkboxes, add PriceRangeSlider, add hearing accessibility checkbox.

### Files Unchanged
- `tour-search.tsx`, `tour-sort.tsx`, `results-count.tsx` — Reused as-is

## Implementation Steps

### Step 1: Restyle FilterBar mobile section
Current mobile layout (lines 178-198 of filter-bar.tsx) needs:
- Wrapper: `bg-[var(--color-background)] p-4 space-y-3 lg:hidden`
- Remove sticky positioning for mobile header (design shows static)
- Row 1: Search + Filters pill button in same flex row
- "Filters" button: navy bg (`bg-[var(--color-primary)]`), white text, `SlidersHorizontal` icon, rounded-full pill shape, compact
- Row 2: CategoryChips (keep as-is, style updates in Step 2)
- Row 3: ResultsCount left + TourSort right (already this layout)

### Step 2: Update CategoryChips styles
- "All" chip when selected: `bg-[var(--color-primary)] text-white` (already correct)
- Unselected chips: change from `bg-[var(--color-background-alt)]` to bordered style: `border border-[var(--color-border)] bg-transparent text-[var(--color-text)]`
- Gap: `gap-2` (8px) — already correct
- Remove left/right fade gradients on mobile (design shows clean edges)
- Keep gradient on desktop if still used anywhere

### Step 3: Update FilterDrawer
Current filter-drawer.tsx changes:
- **Duration section** (lines 189-209): Replace `<select>` dropdown with checkbox group
  - Options: "Under 2 hours", "2-3 hours", "3+ hours"
  - Reuse `FilterCheckboxGroup` from Phase 2's sidebar, or inline simpler version
  - Single-select behavior (selecting one deselects others)
- **Price Range section**: Add new section between Duration and Accessibility
  - Import `PriceRangeSlider` from `../sidebar/price-range-slider`
  - Read `priceMin`/`priceMax` from URL params
  - On change: update URL params (debounced)
- **Hearing Accessibility**: Add checkbox for "Hearing assistance" below wheelchair toggle
- Keep existing category multi-select as-is (already works well)

### Step 4: FilterDrawer modularization check
Current filter-drawer.tsx is 250 lines. Adding price range + duration checkboxes will push it over 200. Split:
- Extract filter sections into `filter-drawer-sections.tsx` (~100 lines) containing CategorySection, DurationSection, PriceSection, AccessibilitySection
- `filter-drawer.tsx` keeps drawer shell (open/close, backdrop, header, footer) + imports sections

### Step 5: Integration test
- Verify: open drawer, select category, close → URL updated, page re-fetches
- Verify: price range in drawer → priceMin/priceMax in URL
- Verify: search + filter pill + chips + sort all work together

## Todo List
- [x] Restyle FilterBar mobile section: bg, padding, Filters pill button
- [x] Update CategoryChips: border style for unselected, remove gradients on mobile
- [x] Update FilterDrawer: duration checkboxes instead of dropdown
- [x] Add PriceRangeSlider to FilterDrawer
- [x] Add hearing accessibility checkbox to FilterDrawer
- [x] Modularize filter-drawer if >200 lines
- [x] Test all mobile filter interactions
- [x] Test that desktop layout is unaffected

## Success Criteria
- Mobile header: search bar + navy "Filters" pill, category pills, results + sort row
- Mobile header bg matches #FAFAF8, 16px padding, 12px gaps
- Filter drawer has checkboxes for duration, price range slider, both accessibility options
- All filters update URL correctly
- No desktop regressions

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PriceRangeSlider import from sidebar creates coupling | Low | Low | Sidebar components are generic/reusable by design |
| FilterDrawer exceeds 200 lines | High | Low | Plan includes modularization step |
| Mobile sticky header removed but user expects scroll persistence | Med | Med | Design shows non-sticky; if UX issue arises, re-add sticky in follow-up |

## Security Considerations
- No new attack surface. Same URL param sanitization applies.

## Next Steps
- Phase 5: i18n keys for new labels, visual polish across breakpoints
