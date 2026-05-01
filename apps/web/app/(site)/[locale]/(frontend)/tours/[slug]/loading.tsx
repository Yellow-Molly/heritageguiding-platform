import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="h-[var(--header-height)] w-full border-b border-[var(--color-border)] bg-[var(--color-background)]" />
      <main className="min-h-screen pt-20">
        {/* Hero gallery */}
        <div className="grid gap-2 sm:grid-cols-4">
          <Skeleton className="aspect-[4/3] sm:col-span-2 sm:row-span-2" variant="rounded" />
          <Skeleton className="aspect-[4/3]" variant="rounded" />
          <Skeleton className="aspect-[4/3]" variant="rounded" />
          <Skeleton className="aspect-[4/3]" variant="rounded" />
          <Skeleton className="aspect-[4/3]" variant="rounded" />
        </div>

        {/* Title + meta */}
        <div className="px-5 lg:px-20 mt-8 space-y-3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Body grid: content + booking sidebar */}
        <div className="mt-8 border-t border-[var(--color-border)] px-5 pt-8 lg:px-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
            <Skeleton className="h-[400px] w-full" variant="rounded" />
          </div>
        </div>
      </main>
    </>
  )
}
