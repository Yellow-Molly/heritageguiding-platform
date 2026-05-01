import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="h-[var(--header-height)] w-full border-b border-[var(--color-border)] bg-[var(--color-background)]" />
      <main className="min-h-screen bg-gradient-to-b from-[var(--color-primary)]/5 to-[var(--color-background)] pt-[var(--header-height)]">
        <div className="container mx-auto px-4 pt-12 pb-4 text-center space-y-3">
          <Skeleton className="mx-auto h-12 w-2/3" />
          <Skeleton className="mx-auto h-5 w-1/2" />
        </div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-[500px] w-full" variant="rounded" />
        </div>
      </main>
    </>
  )
}
