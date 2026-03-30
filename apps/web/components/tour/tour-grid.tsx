import { getTours, type TourFilters } from '@/lib/api/get-tours'
import { TourGridLayout } from './tour-grid-layout'
import { TourEmptyState } from './tour-empty-state'

interface TourGridProps {
  searchParams: TourFilters
  /** Locale for content localization */
  locale?: string
}

/**
 * Server component that fetches tours and delegates rendering to TourGridLayout (client).
 * viewMode is handled client-side via ViewModeContext.
 */
export async function TourGrid({ searchParams, locale = 'sv' }: TourGridProps) {
  const { tours, totalPages } = await getTours(searchParams, locale)

  if (tours.length === 0) {
    return <TourEmptyState />
  }

  return (
    <TourGridLayout
      initialTours={tours}
      totalPages={totalPages}
      filters={searchParams}
      locale={locale}
    />
  )
}
