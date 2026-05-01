import { Skeleton } from '@/components/ui/skeleton'
import { TourGridSkeleton } from '@/components/tour/tour-grid-skeleton'

export default function Loading() {
  return (
    <>
      <div className="h-[var(--header-height)] w-full border-b border-[var(--color-border)] bg-[var(--color-background)]" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="flex gap-3 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" variant="rounded" />
            ))}
          </div>
          <TourGridSkeleton count={6} viewMode="grid" />
        </div>
      </main>
    </>
  )
}
