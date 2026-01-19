import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface TourGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number
  /** Display mode */
  viewMode?: 'grid' | 'list'
}

/**
 * Loading skeleton for tour grid.
 * Matches the layout of TourCard for smooth loading transitions.
 */
export function TourGridSkeleton({ count = 6, viewMode = 'grid' }: TourGridSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <TourListItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((i) => (
        <TourCardSkeleton key={i} />
      ))}
    </div>
  )
}

function TourCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />

      <CardContent className="p-4">
        {/* Rating skeleton */}
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Title skeleton */}
        <Skeleton className="mb-2 h-6 w-3/4" />

        {/* Description skeleton */}
        <Skeleton className="mb-1 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-2/3" />

        {/* Meta info skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-6" />
        </div>
      </CardContent>
    </Card>
  )
}

function TourListItemSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden sm:flex-row">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full sm:aspect-auto sm:h-48 sm:w-72 sm:shrink-0" />

      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Rating skeleton */}
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Title skeleton */}
        <Skeleton className="mb-2 h-6 w-1/2" />

        {/* Description skeleton */}
        <Skeleton className="mb-1 h-4 w-full" />
        <Skeleton className="mb-1 h-4 w-full" />
        <Skeleton className="mb-3 h-4 w-1/2" />

        {/* Meta info skeleton */}
        <div className="mt-auto flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-6" />
        </div>

        {/* CTA skeleton */}
        <Skeleton className="mt-4 h-5 w-24" />
      </CardContent>
    </Card>
  )
}
