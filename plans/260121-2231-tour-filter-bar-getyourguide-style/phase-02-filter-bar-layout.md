# Phase 02: Filter Bar Layout

## Context Links

- [Phase 01: Category Chips](./phase-01-category-chips.md) - Prerequisite
- [Design Guidelines](../../docs/design-guidelines.md) - Z-index scale, shadows
- [Existing tour-catalog-client.tsx](../../apps/web/app/[locale]/(frontend)/tours/tour-catalog-client.tsx)

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 2h |
| Dependencies | Phase 01 (Category Chips) |

Build the main FilterBar container with sticky positioning, shadow on scroll, and integration of CategoryChips and existing TourSort/TourSearch components.

## Key Insights

1. **Sticky positioning**: `position: sticky; top: 0` with z-index above content
2. **Shadow on scroll**: Use IntersectionObserver to detect scroll, add shadow
3. **Layout**: Search | CategoryChips | Sort | Mobile Filter Button
4. **Results count**: Display in filter bar, synced with API response
5. **Preserve existing**: TourSort, TourSearch, FilterDrawer remain unchanged

## Requirements

### Functional
- FR-01: Filter bar sticks to top when scrolling
- FR-02: Shadow appears when scrolled (visual depth cue)
- FR-03: Display results count ("42 results")
- FR-04: Integrate CategoryChips component
- FR-05: Keep existing TourSort dropdown
- FR-06: Keep existing TourSearch input
- FR-07: Mobile shows FilterDrawer trigger button

### Non-Functional
- NFR-01: Smooth shadow transition (150ms)
- NFR-02: Z-index 200 (--z-sticky from design tokens)
- NFR-03: Responsive layout: stack on mobile, row on desktop
- NFR-04: Background blur effect (optional enhancement)

## Architecture

```tsx
interface FilterBarProps {
  totalResults: number              // From API response
  categories: Category[]            // For chips
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}
```

### Visual Structure

```
Desktop:
┌──────────────────────────────────────────────────────────────────────┐
│ [Search___________] [All][History][Arch][...chips...] [Sort ▼] [≡][▤] │
│                                                        42 results     │
└──────────────────────────────────────────────────────────────────────┘

Mobile:
┌───────────────────────────────────┐
│ [Search_______________] [Filters] │
│ [All][History][Architecture][...] │
│ 42 results              [Sort ▼]  │
└───────────────────────────────────┘
```

## Related Code Files

### Files to Create
- `apps/web/components/tour/filter-bar/index.ts`
- `apps/web/components/tour/filter-bar/filter-bar.tsx`
- `apps/web/components/tour/filter-bar/results-count.tsx`

### Files to Modify
- `apps/web/app/[locale]/(frontend)/tours/tour-catalog-client.tsx` - Use new FilterBar
- `apps/web/app/globals.css` - Add sticky shadow utilities

### Files to Reference (Unchanged)
- `apps/web/components/tour/tour-search.tsx`
- `apps/web/components/tour/tour-sort.tsx`
- `apps/web/components/tour/filter-drawer.tsx`

## Implementation Steps

### Step 1: Create Barrel Export
```ts
// apps/web/components/tour/filter-bar/index.ts
export { FilterBar } from './filter-bar'
export { CategoryChips } from './category-chips'
export { ResultsCount } from './results-count'
```

### Step 2: Create ResultsCount Component
```tsx
// apps/web/components/tour/filter-bar/results-count.tsx
import { useTranslations } from 'next-intl'

interface ResultsCountProps {
  count: number
}

export function ResultsCount({ count }: ResultsCountProps) {
  const t = useTranslations('tours.filters')

  return (
    <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
      {t('resultsCount', { count })}
    </span>
  )
}
```

### Step 3: Create FilterBar Container
```tsx
// apps/web/components/tour/filter-bar/filter-bar.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Grid3X3, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TourSearch } from '../tour-search'
import { TourSort } from '../tour-sort'
import { FilterDrawer } from '../filter-drawer'
import { CategoryChips } from './category-chips'
import { ResultsCount } from './results-count'
import type { Category } from '@/lib/api/get-categories'

interface FilterBarProps {
  totalResults: number
  categories: Category[]
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

export function FilterBar({
  totalResults,
  categories,
  viewMode = 'grid',
  onViewModeChange,
}: FilterBarProps) {
  const t = useTranslations('tours.filters')
  const [isScrolled, setIsScrolled] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Detect scroll to add shadow
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Scroll sentinel - placed above filter bar */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* Sticky filter bar */}
      <div
        className={cn(
          'sticky top-0 z-[200] bg-[var(--color-surface)] transition-shadow duration-150',
          'border-b border-[var(--color-border)]',
          isScrolled && 'shadow-md'
        )}
      >
        {/* Desktop layout */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-4 py-3">
            {/* Row 1: Search, Chips, Sort, View Toggle */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="w-64 flex-shrink-0">
                <TourSearch />
              </div>

              {/* Category chips - takes remaining space */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <CategoryChips categories={categories} />
              </div>

              {/* Sort */}
              <div className="flex-shrink-0">
                <TourSort />
              </div>

              {/* View mode toggle */}
              {onViewModeChange && (
                <ViewModeToggle
                  viewMode={viewMode}
                  onViewModeChange={onViewModeChange}
                />
              )}
            </div>

            {/* Row 2: Results count */}
            <div className="mt-2 flex items-center justify-between">
              <ResultsCount count={totalResults} />
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          <div className="container mx-auto px-4 py-3 space-y-3">
            {/* Row 1: Search + Filter button */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TourSearch />
              </div>
              <FilterDrawer />
            </div>

            {/* Row 2: Category chips */}
            <CategoryChips categories={categories} />

            {/* Row 3: Results + Sort */}
            <div className="flex items-center justify-between">
              <ResultsCount count={totalResults} />
              <TourSort />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Internal view mode toggle component
interface ViewModeToggleProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-1">
      <Button
        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

### Step 4: Update tour-catalog-client.tsx
```tsx
// apps/web/app/[locale]/(frontend)/tours/tour-catalog-client.tsx
'use client'

import { useState, type ReactNode } from 'react'
import { FilterBar } from '@/components/tour/filter-bar'
import type { Category } from '@/lib/api/get-categories'

interface TourCatalogClientProps {
  children: ReactNode
  categories: Category[]
  totalResults: number
}

export function TourCatalogClient({
  children,
  categories,
  totalResults,
}: TourCatalogClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-6">
      <FilterBar
        totalResults={totalResults}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {children}
    </div>
  )
}
```

### Step 5: Update Tours Page to Pass Data
```tsx
// apps/web/app/[locale]/(frontend)/tours/page.tsx
// Add imports and fetch categories
import { getCategories } from '@/lib/api/get-categories'

// In component, before return:
const [categories, { tours, total }] = await Promise.all([
  getCategories('theme', locale),
  getTours(filters),
])

// Pass to client wrapper:
<TourCatalogClient categories={categories} totalResults={total}>
```

### Step 6: Add i18n Keys
```json
// apps/web/messages/en.json
{
  "tours": {
    "filters": {
      "resultsCount": "{count, plural, =0 {No results} one {# result} other {# results}}"
    }
  }
}
```

## Todo List

- [ ] Create `index.ts` barrel export
- [ ] Create `results-count.tsx` component
- [ ] Create `filter-bar.tsx` with sticky positioning
- [ ] Implement IntersectionObserver for scroll detection
- [ ] Add desktop layout (search, chips, sort, view toggle)
- [ ] Add mobile layout (stacked, with FilterDrawer)
- [ ] Update `tour-catalog-client.tsx` to use new FilterBar
- [ ] Update `tours/page.tsx` to fetch and pass categories
- [ ] Add i18n keys with plural forms
- [ ] Remove results count from `tour-grid.tsx` (moved to filter bar)

## Success Criteria

- [ ] Filter bar sticks to top on scroll
- [ ] Shadow appears smoothly when scrolled
- [ ] Desktop shows: Search | Chips | Sort | View Toggle
- [ ] Mobile shows: Search + Filter Button, then Chips, then Results + Sort
- [ ] Results count displays correctly with pluralization
- [ ] No layout shift during scroll

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sticky not working on iOS Safari | Low | High | Test on real iOS device; use `-webkit-sticky` |
| Z-index conflicts with modals | Low | Medium | Use design token z-index scale (200 for sticky) |
| Sentinel causes layout issues | Low | Low | Use `h-0` and `aria-hidden` |

## Security Considerations

- No user input handled directly in FilterBar
- CategoryChips sanitizes URL params (done in Phase 01)

## Next Steps

After completion:
1. Proceed to [Phase 03: Dates Picker](./phase-03-dates-picker.md)
2. Install react-day-picker dependency
