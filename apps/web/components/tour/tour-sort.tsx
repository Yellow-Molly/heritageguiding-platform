'use client'

import { useTranslations } from 'next-intl'
import { useFilterState } from './filter-state-provider'

/**
 * Sort dropdown component for tour catalog.
 * Updates URL via FilterStateProvider for instant optimistic flip + shareable views.
 */
export function TourSort() {
  const t = useTranslations('tours.filters')
  const { params, setParam } = useFilterState()

  const currentSort = params.get('sort') || 'popular'

  const handleSort = (value: string) => {
    setParam('sort', value === 'popular' ? null : value)
  }

  const sortOptions = [
    { id: 'popular', label: t('sortPopular') },
    { id: 'price-asc', label: t('sortPriceAsc') },
    { id: 'price-desc', label: t('sortPriceDesc') },
    { id: 'duration-asc', label: t('sortDurationAsc') },
    { id: 'rating', label: t('sortRating') },
  ]

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
        {t('sortBy')}:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={(e) => handleSort(e.target.value)}
        className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        {sortOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
