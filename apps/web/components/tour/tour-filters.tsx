/**
 * @deprecated Use FilterBar from '@/components/tour/filter-bar' instead.
 * This component will be removed in a future release.
 * Migration: Replace <TourFilters /> with <FilterBar categories={...} totalResults={...} />
 */

'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Grid3X3, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TourSearch } from './tour-search'
import { TourSort } from './tour-sort'
import { FilterDrawer } from './filter-drawer'

interface TourFiltersProps {
  /** Orientation for filter layout */
  orientation?: 'horizontal' | 'vertical'
  /** Callback when view mode changes */
  onViewModeChange?: (mode: 'grid' | 'list') => void
  /** Current view mode */
  viewMode?: 'grid' | 'list'
}

/**
 * Filter bar component for tour catalog.
 * Manages URL-based filter state for shareable links.
 */
export function TourFilters({
  orientation = 'horizontal',
  onViewModeChange,
  viewMode = 'grid',
}: TourFiltersProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const currentCategory = searchParams.get('category') || ''
  const currentDuration = searchParams.get('duration') || ''
  const isAccessible = searchParams.get('accessible') === 'true'

  const categories = [
    { id: '', label: t('allCategories') },
    { id: 'history', label: t('history') },
    { id: 'architecture', label: t('architecture') },
    { id: 'food', label: t('food') },
    { id: 'nature', label: t('nature') },
    { id: 'museum', label: t('museum') },
  ]

  const durations = [
    { id: '', label: t('anyDuration') },
    { id: '90', label: t('upTo90min') },
    { id: '120', label: t('upTo2hours') },
    { id: '180', label: t('upTo3hours') },
  ]

  const isVertical = orientation === 'vertical'

  return (
    <div
      className={cn(
        'rounded-lg border bg-[var(--color-surface)] p-4',
        isVertical ? 'space-y-4' : 'flex flex-wrap items-center gap-4'
      )}
    >
      {/* Search */}
      <div className={cn(isVertical ? 'w-full' : 'flex-1 min-w-[200px]')}>
        <TourSearch />
      </div>

      {/* Desktop filters - hidden on mobile */}
      <div className={cn('hidden lg:flex items-center gap-4', isVertical && 'flex-col w-full lg:items-stretch')}>
        {/* Category Filter */}
        <div className={cn(isVertical && 'w-full')}>
          <label htmlFor="category-filter" className="sr-only">
            {t('category')}
          </label>
          <select
            id="category-filter"
            value={currentCategory}
            onChange={(e) => updateFilter('category', e.target.value || null)}
            className={cn(
              'h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
              'px-3 text-sm text-[var(--color-text)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              isVertical && 'w-full'
            )}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Filter */}
        <div className={cn(isVertical && 'w-full')}>
          <label htmlFor="duration-filter" className="sr-only">
            {t('duration')}
          </label>
          <select
            id="duration-filter"
            value={currentDuration}
            onChange={(e) => updateFilter('duration', e.target.value || null)}
            className={cn(
              'h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
              'px-3 text-sm text-[var(--color-text)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              isVertical && 'w-full'
            )}
          >
            {durations.map((dur) => (
              <option key={dur.id} value={dur.id}>
                {dur.label}
              </option>
            ))}
          </select>
        </div>

        {/* Accessibility Toggle */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isAccessible}
            onChange={(e) => updateFilter('accessible', e.target.checked ? 'true' : null)}
            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-text)]">
            {t('wheelchairAccessible')}
          </span>
        </label>
      </div>

      {/* Sort */}
      <div className={cn(isVertical ? 'w-full' : 'hidden lg:block')}>
        <TourSort />
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <FilterDrawer />
      </div>

      {/* View mode toggle */}
      {onViewModeChange && (
        <div className="hidden items-center gap-1 rounded-lg border border-[var(--color-border)] p-1 sm:flex">
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
      )}
    </div>
  )
}
