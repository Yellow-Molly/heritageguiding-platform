'use client'

import { useState, type ReactNode } from 'react'
import { FilterBar } from '@/components/tour/filter-bar'
import { ViewModeContext } from '@/components/tour/view-mode-context'
import type { Category } from '@/lib/api/get-categories'

interface TourCatalogClientProps {
  children: ReactNode
  categories: Category[]
  totalResults: number
}

/**
 * Client wrapper for tour catalog.
 * Manages client-side state like view mode toggle.
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
      <div className="space-y-6">
        <FilterBar
          totalResults={totalResults}
          categories={categories}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        {children}
      </div>
    </ViewModeContext>
  )
}
