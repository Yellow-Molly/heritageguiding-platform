'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Grid3X3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

/**
 * Toggle between grid and list view modes.
 * Shared between desktop page header and any other location needing view switching.
 */
export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  const t = useTranslations('tours.filters')
  const handleGridClick = useCallback(() => {
    onViewModeChange('grid')
  }, [onViewModeChange])

  const handleListClick = useCallback(() => {
    onViewModeChange('list')
  }, [onViewModeChange])

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-1">
      <Button
        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleGridClick}
        aria-label={t('gridView')}
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleListClick}
        aria-label={t('listView')}
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
