'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Grid3X3, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TourSearch } from '../tour-search'
import { TourSort } from '../tour-sort'
import { FilterDrawer } from '../filter-drawer'
import { CategoryChips } from './category-chips'
import { DatesPicker } from './dates-picker'
import { ResultsCount } from './results-count'
import type { Category } from '@/lib/api/get-categories'

interface FilterBarProps {
  totalResults: number
  categories: Category[]
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
}

/**
 * GetYourGuide-style sticky filter bar.
 * Features: search, category chips, sort, view toggle, results count.
 * Adds shadow when scrolled for visual depth.
 */
export function FilterBar({
  totalResults,
  categories,
  viewMode = 'grid',
  onViewModeChange,
}: FilterBarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Detect scroll to add shadow using IntersectionObserver
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

              {/* Date picker */}
              <div className="flex-shrink-0">
                <DatesPicker />
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

            {/* Row 2: Category chips + Date picker */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 overflow-hidden">
                <CategoryChips categories={categories} />
              </div>
              <DatesPicker />
            </div>

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
  const handleGridClick = useCallback(() => {
    onViewModeChange('grid')
  }, [onViewModeChange])

  const handleListClick = useCallback(() => {
    onViewModeChange('list')
  }, [onViewModeChange])

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-1">
      <Button
        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleGridClick}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleListClick}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
