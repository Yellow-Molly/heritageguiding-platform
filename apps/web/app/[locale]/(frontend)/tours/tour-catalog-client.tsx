'use client'

import { useState, type ReactNode } from 'react'
import { TourFilters } from '@/components/tour'

interface TourCatalogClientProps {
  children: ReactNode
}

/**
 * Client wrapper for tour catalog.
 * Manages client-side state like view mode toggle.
 */
export function TourCatalogClient({ children }: TourCatalogClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-6">
      <TourFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {children}
    </div>
  )
}
