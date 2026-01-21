import { getTours, type TourFilters } from '@/lib/api/get-tours'
import { TourCard } from './tour-card'
import { TourEmptyState } from './tour-empty-state'
import { TourPagination } from './tour-pagination'

interface TourGridProps {
  searchParams: TourFilters
  /** Display mode: grid (default) or list */
  viewMode?: 'grid' | 'list'
}

/**
 * Server component that fetches and displays tours.
 * Handles empty states and pagination.
 */
export async function TourGrid({ searchParams, viewMode = 'grid' }: TourGridProps) {
  const { tours, page, totalPages } = await getTours(searchParams)

  if (tours.length === 0) {
    return <TourEmptyState />
  }

  return (
    <div className="space-y-8">
      {/* Tour Grid/List */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <TourPagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  )
}
