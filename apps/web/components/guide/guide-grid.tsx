import { getTranslations } from 'next-intl/server'
import { GuideListingCard } from './guide-listing-card'
import { TourPagination } from '@/components/tour/tour-pagination'
import type { GuideListItem } from '@/lib/api/get-guides'

interface GuideGridProps {
  guides: GuideListItem[]
  page: number
  totalPages: number
}

/**
 * Grid layout for guide listing cards with pagination.
 * Server component — receives data as props from page.tsx.
 */
export async function GuideGrid({ guides, page, totalPages }: GuideGridProps) {
  const t = await getTranslations('guides')

  if (guides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-[var(--color-text-muted)]">
          {t('emptyState')}
        </p>
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

      {totalPages > 1 && (
        <div className="mt-8">
          <TourPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
