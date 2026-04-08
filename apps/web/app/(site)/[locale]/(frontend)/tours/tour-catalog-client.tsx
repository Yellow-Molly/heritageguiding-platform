'use client'

import { useState, type ReactNode } from 'react'
import { FilterBar } from '@/components/tour/filter-bar'
import { TourPageHeader } from '@/components/tour/tour-page-header'
import { SidebarFilters } from '@/components/tour/sidebar'
import { ViewModeContext } from '@/components/tour/view-mode-context'
import type { Category } from '@/lib/api/get-categories'

interface TourCatalogClientProps {
  children: ReactNode
  categories: Category[]
  totalResults: number
}

/**
 * Client wrapper for tour catalog.
 * Desktop: static page header + 2-column layout (sidebar + grid).
 * Mobile: FilterBar header + single column grid.
 * Provides ViewModeContext so TourGridLayout can consume viewMode.
 */
export function TourCatalogClient({
  children,
  categories,
  totalResults,
}: TourCatalogClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <ViewModeContext value={viewMode}>
      {/* Desktop page header (hidden on mobile) */}
      <TourPageHeader
        totalResults={totalResults}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Mobile filter bar (hidden on desktop) */}
      <div className="lg:hidden">
        <FilterBar
          totalResults={totalResults}
          categories={categories}
        />
      </div>

      {/* Body: sidebar + grid */}
      <div className="mx-auto flex max-w-[1536px] gap-8 px-4 pb-8 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <SidebarFilters categories={categories} />
        </aside>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </ViewModeContext>
  )
}
