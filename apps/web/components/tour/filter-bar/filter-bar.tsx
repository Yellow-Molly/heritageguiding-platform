'use client'

import { TourSearch } from '../tour-search'
import { TourSort } from '../tour-sort'
import { FilterDrawer } from '../filter-drawer'
import { CategoryChips } from './category-chips'
import { ResultsCount } from './results-count'
import type { Category } from '@/lib/api/get-categories'
import type { City } from '@/lib/api/get-cities'

interface FilterBarProps {
  totalResults: number
  categories: Category[]
  cities: City[]
}

/**
 * Mobile-only filter bar for tour catalog.
 * Search, category chips, sort, results count, and filter drawer trigger.
 * Desktop header is handled by TourPageHeader component.
 */
export function FilterBar({
  totalResults,
  categories,
  cities,
}: FilterBarProps) {
  return (
    <div className="bg-[var(--color-background)] px-4 pt-5 pb-4 space-y-3">
      {/* Row 1: Search + Filter pill button */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TourSearch />
        </div>
        <FilterDrawer
          categories={categories}
          cities={cities}
        />
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
