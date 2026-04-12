'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { GuideListingCard } from './guide-listing-card'
import { GuideLoadMoreButton } from './guide-load-more-button'
import type { GuideListItem } from '@/lib/api/get-guides'

interface GuideGridClientProps {
  initialGuides: GuideListItem[]
  totalGuides: number
  pageSize: number
}

/**
 * Client wrapper for guide grid that manages load-more state.
 * Resets when URL search params change (filters/search).
 */
export function GuideGridClient({ initialGuides, totalGuides, pageSize }: GuideGridClientProps) {
  const t = useTranslations('guides')
  const searchParams = useSearchParams()
  const [guides, setGuides] = useState(initialGuides)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(totalGuides / pageSize) || 1

  // Reset when filters change (searchParams is the source of truth)
  const paramsKey = searchParams.toString()
  useEffect(() => {
    setGuides(initialGuides)
    setCurrentPage(1)
  }, [paramsKey, initialGuides])

  const handleLoadMore = useCallback((newGuides: GuideListItem[]) => {
    setGuides((prev) => [...prev, ...newGuides])
    setCurrentPage((prev) => prev + 1)
  }, [])

  if (guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-[var(--color-text-muted)]">{t('emptyState')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideListingCard key={guide.id} guide={guide} />
        ))}
      </div>

      {currentPage < totalPages && (
        <div className="mt-8 flex justify-center">
          <GuideLoadMoreButton
            nextPage={currentPage + 1}
            filters={paramsKey}
            onLoaded={handleLoadMore}
          />
        </div>
      )}
    </div>
  )
}
