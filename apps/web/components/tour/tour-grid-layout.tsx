'use client'

import { useContext, useState, useRef, useEffect, useCallback, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { TourCard } from './tour-card'
import { ViewModeContext } from './view-mode-context'
import { fetchMoreTours } from '@/lib/api/tour-actions'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'
import type { TourFilters } from '@/lib/api/get-tours'

interface TourGridLayoutProps {
  initialTours: FeaturedTour[]
  totalPages: number
  filters: TourFilters
  locale: string
}

/**
 * Client component that renders tour cards with infinite scroll.
 * Consumes viewMode from ViewModeContext provided by TourCatalogClient.
 * Uses IntersectionObserver to auto-load next pages.
 */
export function TourGridLayout({ initialTours, totalPages, filters, locale }: TourGridLayoutProps) {
  const viewMode = useContext(ViewModeContext)
  const [tours, setTours] = useState(initialTours)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const generationRef = useRef(0)

  // Reset state when filters/initialTours change (server re-render)
  useEffect(() => {
    generationRef.current++
    setTours(initialTours)
    pageRef.current = 1
    setHasMore(totalPages > 1)
  }, [initialTours, totalPages])

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return
    const generation = generationRef.current
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    startTransition(async () => {
      const result = await fetchMoreTours(filters, nextPage, locale)
      // Discard result if filters changed while fetching
      if (generationRef.current !== generation) return
      setTours((prev) => [...prev, ...result.tours])
      setHasMore(result.hasMore)
    })
  }, [isPending, hasMore, filters, locale])

  // IntersectionObserver to trigger load more
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <div className="space-y-6">
      <div
        className={
          viewMode === 'list'
            ? 'space-y-4'
            : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} variant={viewMode} />
        ))}
      </div>

      {/* Sentinel for infinite scroll + loading state */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isPending && <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />}
        </div>
      )}

      {/* End state */}
      {!hasMore && tours.length > 9 && (
        <p className="text-center text-sm text-[var(--color-text-muted)] py-4">
          All tours loaded
        </p>
      )}
    </div>
  )
}
