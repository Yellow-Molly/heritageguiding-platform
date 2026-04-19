'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { GuideListingCard } from './guide-listing-card'
import { fetchMoreGuides } from './guide-load-more-action'
import type { GuideListItem } from '@/lib/api/get-guides'

interface GuideGridClientProps {
  initialGuides: GuideListItem[]
  totalPages: number
  locale: string
}

/**
 * Client wrapper for guide grid with infinite scroll.
 * Uses IntersectionObserver to auto-load next pages (same pattern as tours).
 * Resets when URL search params change (filters/search).
 */
export function GuideGridClient({ initialGuides, totalPages, locale }: GuideGridClientProps) {
  const t = useTranslations('guides')
  const searchParams = useSearchParams()
  const [guides, setGuides] = useState(initialGuides)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const generationRef = useRef(0)

  // Reset when filters change (searchParams / server re-render)
  const paramsKey = searchParams.toString()
  useEffect(() => {
    generationRef.current++
    setGuides(initialGuides)
    pageRef.current = 1
    setHasMore(totalPages > 1)
  }, [paramsKey, initialGuides, totalPages])

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return
    const generation = generationRef.current
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    startTransition(async () => {
      const result = await fetchMoreGuides(paramsKey, nextPage, locale)
      // Discard result if filters changed while fetching
      if (generationRef.current !== generation) return
      setGuides((prev) => [...prev, ...result.guides])
      setHasMore(result.hasMore)
    })
  }, [isPending, hasMore, paramsKey, locale])

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
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  if (guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-[var(--color-text-muted)]">{t('emptyState')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideListingCard key={guide.id} guide={guide} />
        ))}
      </div>

      {/* Sentinel for infinite scroll + loading spinner */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isPending && <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />}
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
