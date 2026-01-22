'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Grid3X3, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TourSearch } from '../tour-search'
import { TourSort } from '../tour-sort'
import { FilterDrawer } from '../filter-drawer'
import { CategoryChips } from './category-chips'
import { ResultsCount } from './results-count'
import type { Category } from '@/lib/api/get-categories'

// Scroll amount for arrow navigation
const SCROLL_AMOUNT = 200

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
  const chipsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll state for arrow visibility
  const updateScrollState = useCallback(() => {
    const container = chipsContainerRef.current
    if (!container) return
    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    )
  }, [])

  // Scroll left handler
  const scrollLeft = useCallback(() => {
    chipsContainerRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
  }, [])

  // Scroll right handler
  const scrollRight = useCallback(() => {
    chipsContainerRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
  }, [])

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

  // Update scroll state on mount and when categories change
  useEffect(() => {
    updateScrollState()
    const container = chipsContainerRef.current
    if (!container) return

    container.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)
    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState, categories])

  return (
    <>
      {/* Scroll sentinel - placed above filter bar */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* Sticky filter bar */}
      <div
        className={cn(
          'sticky top-[var(--header-height)] z-[var(--z-sticky)] bg-[var(--color-surface)] transition-shadow duration-150',
          'border-b border-[var(--color-border)]',
          isScrolled && 'shadow-md'
        )}
      >
        {/* Desktop layout */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-4 py-3">
            {/* Row 1: Search, Sort, View Toggle */}
            <div className="flex items-center justify-between gap-4">
              {/* Search - stretches to fill available space */}
              <div className="flex-1">
                <TourSearch />
              </div>

              {/* Sort + View toggle grouped on the right */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <TourSort />
                {onViewModeChange && (
                  <ViewModeToggle
                    viewMode={viewMode}
                    onViewModeChange={onViewModeChange}
                  />
                )}
              </div>
            </div>

            {/* Row 2: Category chips with arrows + Results count */}
            <div className="mt-3 flex items-center gap-4">
              {/* Left arrow */}
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                aria-label="Scroll categories left"
                className={cn(
                  'flex-shrink-0 p-1.5',
                  !canScrollLeft && 'opacity-30'
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              {/* Category chips - takes remaining space */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <CategoryChips
                  categories={categories}
                  containerRef={chipsContainerRef}
                />
              </div>

              {/* Right arrow */}
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollRight}
                disabled={!canScrollRight}
                aria-label="Scroll categories right"
                className={cn(
                  'flex-shrink-0 p-1.5',
                  !canScrollRight && 'opacity-30'
                )}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-[var(--color-border)] flex-shrink-0" />

              {/* Results count */}
              <div className="flex-shrink-0">
                <ResultsCount count={totalResults} />
              </div>
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
