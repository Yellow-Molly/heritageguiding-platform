'use client'

import { useState, type ReactNode } from 'react'
import { FilterBar } from '@/components/tour/filter-bar'
import type { Category } from '@/lib/api/get-categories'

interface TourCatalogClientProps {
  children: ReactNode
  categories: Category[]
  totalResults: number
}

/**
 * Client wrapper for tour catalog.
 * Manages client-side state like view mode toggle.
 * Integrates new GetYourGuide-style FilterBar.
 */
export function TourCatalogClient({
  children,
  categories,
  totalResults,
}: TourCatalogClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-6">
      <FilterBar
        totalResults={totalResults}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {children}
    </div>
  )
}
