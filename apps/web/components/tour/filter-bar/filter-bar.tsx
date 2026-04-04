'use client'

import { TourSearch } from '../tour-search'
import { TourSort } from '../tour-sort'
import { FilterDrawer } from '../filter-drawer'
import { CategoryChips } from './category-chips'
import { ResultsCount } from './results-count'
import type { Category } from '@/lib/api/get-categories'

interface FilterBarProps {
  totalResults: number
  categories: Category[]
}

/**
 * Mobile-only filter bar for tour catalog.
 * Search, category chips, sort, results count, and filter drawer trigger.
 * Desktop header is handled by TourPageHeader component.
 */
export function FilterBar({
  totalResults,
  categories,
}: FilterBarProps) {
  return (
    <div className="bg-[var(--color-background)] p-4 space-y-3">
      {/* Row 1: Search + Filter pill button */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TourSearch />
        </div>
        <FilterDrawer categories={categories} />
      </div>

      {/* Row 2: Category chips */}
      <CategoryChips categories={categories} />

      {/* Row 3: Results + Sort */}
      <div className="flex items-center justify-between">
        <ResultsCount count={totalResults} />
        <TourSort />
      </div>
    </div>
  )
}
