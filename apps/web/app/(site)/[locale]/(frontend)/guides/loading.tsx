import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="h-[var(--header-height)] w-full border-b border-[var(--color-border)] bg-[var(--color-background)]" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        {/* Hero */}
        <div className="container mx-auto px-4 py-10 space-y-3">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <section className="container mx-auto px-4 py-6 lg:py-8">
          {/* Filter bar */}
          <div className="flex gap-3 flex-wrap mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" variant="rounded" />
            ))}
          </div>
          {/* Guide grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
