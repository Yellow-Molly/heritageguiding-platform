'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DrawerFilterSections } from './filter-drawer-sections'
import type { Category } from '@/lib/api/get-categories'
import type { City } from '@/lib/api/get-cities'

interface FilterDrawerProps {
  categories: Category[]
  cities: City[]
}

/**
 * Mobile filter drawer shell: trigger button, backdrop, sliding panel.
 * Filter content sections are in filter-drawer-sections.tsx.
 */
export function FilterDrawer({ categories, cities }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const selectedCategories = useMemo(() => {
    return searchParams.get('categories')?.split(',').filter(Boolean) || []
  }, [searchParams])

  const selectedCities = useMemo(() => {
    return searchParams.get('cities')?.split(',').filter(Boolean) || []
  }, [searchParams])

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
    setIsOpen(false)
  }, [router, pathname])

  // Count active filters
  const currentDuration = searchParams.get('duration') || ''
  const isAccessible = searchParams.get('accessible') === 'true'
  const activeFiltersCount = [
    selectedCities.length > 0 ? 'city' : '',
    selectedCategories.length > 0 ? 'cat' : '',
    currentDuration,
    isAccessible ? 'a' : '',
  ].filter(Boolean).length

  return (
    <>
      {/* Trigger — navy pill button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white shrink-0"
        aria-label={t('openFilters')}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t('filters')}
        {activeFiltersCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-[var(--color-primary)] font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 bg-[var(--color-surface)] shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('filterPanel')}
      >
        <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">{t('filters')}</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label={t('closeFilters')}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter sections (scrollable) */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          <DrawerFilterSections
            categories={categories}
            cities={cities}
            selectedCategories={selectedCategories}
            selectedCities={selectedCities}
          />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex gap-3">
            <Button variant="outline-dark" onClick={clearAllFilters} className="flex-1">{t('clearAll')}</Button>
            <Button onClick={() => setIsOpen(false)} className="flex-1">{t('applyFilters')}</Button>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
