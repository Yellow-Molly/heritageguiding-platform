'use client'

import { useTranslations } from 'next-intl'
import { TourSort } from './tour-sort'
import { ResultsCount } from './filter-bar/results-count'
import { ViewModeToggle } from './view-mode-toggle'

interface TourPageHeaderProps {
  totalResults: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

/**
 * Desktop-only static page header for tours catalog.
 * Shows title, subtitle, results count, sort dropdown, and view mode toggle.
 * Not sticky — sits below nav as a static section.
 */
export function TourPageHeader({
  totalResults,
  viewMode,
  onViewModeChange,
}: TourPageHeaderProps) {
  const t = useTranslations('tours.filters')

  return (
    <div className="hidden lg:block bg-[var(--color-background)] py-6 px-8">
      <div className="mx-auto flex max-w-7xl items-end justify-between">
        {/* Left: title + subtitle */}
        <div>
          <h1 className="font-serif text-[28px] text-[var(--color-primary)]">
            {t('pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Right: results + sort + view toggle */}
        <div className="flex items-center gap-4">
          <ResultsCount count={totalResults} />
          <TourSort />
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>
    </div>
  )
}
