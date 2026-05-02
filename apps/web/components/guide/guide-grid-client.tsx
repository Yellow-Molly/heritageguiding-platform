'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { GuideListingCard } from './guide-listing-card'
import { fetchMoreGuides } from './guide-load-more-action'
import { useFilterState } from '@/components/tour/filter-state-provider'
import { GridPendingOverlay } from '@/components/shared/grid-pending-overlay'
import { cn } from '@/lib/utils'
import type { GuideListItem } from '@/lib/api/get-guides'

interface GuideGridClientProps {
  initialGuides: GuideListItem[]
  totalPages: number
  locale: string
}

/**
 * Client wrapper for guide grid with infinite scroll.
 * Reads `isPending` and `params` from FilterStateProvider — pending overlay
 * shows during filter changes; `params.toString()` is the cache key for resets.
 */
export function GuideGridClient({ initialGuides, totalPages, locale }: GuideGridClientProps) {
  const t = useTranslations('guides')
  const { params, isPending: isFilterPending } = useFilterState()
  const [guides, setGuides] = useState(initialGuides)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [isLoadingMore, startLoadMoreTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const generationRef = useRef(0)

  // Reset infinite-scroll state on server re-render (filter resolved). We deliberately
  // do NOT include the optimistic params string here — resetting on optimistic change
  // would collapse the visible grid back to page 1 before the server returns, breaking
  // the dim-overlay illusion. Tour grid uses the same pattern.
  const paramsKey = params.toString()
  useEffect(() => {
    generationRef.current++
    setGuides(initialGuides)
    pageRef.current = 1
    setHasMore(totalPages > 1)
  }, [initialGuides, totalPages])

  const loadMore = useCallback(() => {
    // Bail during a filter transition — paginating the old result set with a new-filter
    // paramsKey would interleave guides from two filters until the server re-render lands.
    if (isLoadingMore || !hasMore || isFilterPending) return
    const generation = generationRef.current
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    startLoadMoreTransition(async () => {
      const result = await fetchMoreGuides(paramsKey, nextPage, locale)
      if (generationRef.current !== generation) return
      setGuides((prev) => [...prev, ...result.guides])
      setHasMore(result.hasMore)
    })
  }, [isLoadingMore, hasMore, isFilterPending, paramsKey, locale])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  if (guides.length === 0) {
    return (
      <div className="relative">
        <div
          className={cn(
            'flex flex-col items-center justify-center py-16 text-center',
            isFilterPending && 'opacity-50 pointer-events-none transition-opacity duration-150',
          )}
        >
          <p className="text-lg text-[var(--color-text-muted)]">{t('emptyState')}</p>
        </div>
        <GridPendingOverlay isPending={isFilterPending} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div
          className={cn(
            'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
            isFilterPending && 'opacity-50 pointer-events-none transition-opacity duration-150',
          )}
        >
          {guides.map((guide, index) => (
            <GuideListingCard key={guide.id} guide={guide} priority={index < 3} />
          ))}
        </div>
        <GridPendingOverlay isPending={isFilterPending} />
      </div>

      {/* Sentinel for infinite scroll + loading spinner */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />}
        </div>
      )}

      {/* End state */}
      {!hasMore && guides.length > 9 && (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
          {t('allGuidesLoaded')}
        </p>
      )}
    </div>
  )
}
