'use client'

import { SearchX } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * Empty state component shown when no tours match the current filters.
 */
export function TourEmptyState() {
  const router = useRouter()
  const pathname = usePathname()

  const handleClearFilters = () => {
    router.push(pathname)
  }

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="rounded-full bg-[var(--color-background-alt)] p-4">
        <SearchX className="h-12 w-12 text-[var(--color-text-muted)]" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[var(--color-primary)]">
        No tours found
      </h3>
      <p className="mt-2 max-w-md text-[var(--color-text-muted)]">
        We couldn&apos;t find any tours matching your criteria. Try adjusting your filters
        or search terms.
      </p>
      <Button onClick={handleClearFilters} className="mt-6">
        Clear all filters
      </Button>
    </div>
  )
}
