'use client'

import type { ReactNode } from 'react'
import { FilterStateProvider } from '@/components/tour/filter-state-provider'

interface GuideCatalogClientProps {
  filterBar: ReactNode
  grid: ReactNode
}

/**
 * Client wrapper for the /guides listing.
 * Mounts FilterStateProvider so filter bar + grid share optimistic URL state.
 *
 * Server component (`guides/page.tsx`) pre-fetches list data and supplies
 * pre-rendered children as named slots; this wrapper only owns the provider boundary.
 */
export function GuideCatalogClient({ filterBar, grid }: GuideCatalogClientProps) {
  return (
    <FilterStateProvider>
      {filterBar}
      <div className="mt-6">{grid}</div>
    </FilterStateProvider>
  )
}
