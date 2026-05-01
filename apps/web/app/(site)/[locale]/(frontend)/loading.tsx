import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="h-[var(--header-height)] w-full border-b border-[var(--color-border)] bg-[var(--color-background)]" />
      <main className="min-h-screen">
        <Skeleton className="h-[60vh] w-full rounded-none" />
        <div className="container mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" variant="rounded" />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
