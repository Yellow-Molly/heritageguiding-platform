import { Skeleton, SkeletonAvatar } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="h-[var(--header-height)] w-full border-b border-[var(--color-border)] bg-[var(--color-background)]" />
      <main className="min-h-screen bg-[var(--color-background)] pb-20 pt-[var(--header-height)] lg:pb-0">
        <div className="mx-auto flex max-w-[1536px] flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-[420px] lg:shrink-0 px-5 py-6 lg:px-10 lg:py-10 space-y-5">
            <div className="flex items-center gap-4">
              <SkeletonAvatar size="lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="aspect-[3/4] w-full" variant="rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </aside>

          {/* Content column */}
          <div className="flex-1 px-5 py-6 lg:px-16 lg:py-10 space-y-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
