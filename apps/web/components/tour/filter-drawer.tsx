'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TourSort } from './tour-sort'

// Consistent categories with CategoryChips and get-tours
const CATEGORIES = [
  { id: 'history', translationKey: 'history' },
  { id: 'architecture', translationKey: 'architecture' },
  { id: 'nature', translationKey: 'nature' },
  { id: 'maritime', translationKey: 'maritime' },
  { id: 'royal', translationKey: 'royal' },
]

/**
 * Mobile filter drawer component.
 * Provides a slide-out panel for filter controls on mobile devices.
 * Uses 'categories' URL param (plural) for sync with CategoryChips.
 */
export function FilterDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse selected categories from URL (comma-separated)
  const selectedCategories = useMemo(() => {
    const raw = searchParams.get('categories')?.split(',').filter(Boolean) || []
    return raw.filter((cat) => CATEGORIES.some((c) => c.id === cat))
  }, [searchParams])

  // Toggle a single category (multi-select)
  const toggleCategory = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      let newSelected: string[]

      if (selectedCategories.includes(categoryId)) {
        newSelected = selectedCategories.filter((c) => c !== categoryId)
      } else {
        newSelected = [...selectedCategories, categoryId]
      }

      if (newSelected.length > 0) {
        params.set('categories', newSelected.join(','))
      } else {
        params.delete('categories')
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router, selectedCategories]
  )

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
    setIsOpen(false)
  }, [router, pathname])

  const currentDuration = searchParams.get('duration') || ''
  const isAccessible = searchParams.get('accessible') === 'true'

  const durations = [
    { id: '', label: t('anyDuration') },
    { id: '90', label: t('upTo90min') },
    { id: '120', label: t('upTo2hours') },
    { id: '180', label: t('upTo3hours') },
  ]

  // Count active filters (categories count as 1 if any selected)
  const activeFiltersCount = [
    selectedCategories.length > 0 ? 'categories' : '',
    currentDuration,
    isAccessible ? 'true' : '',
  ].filter(Boolean).length

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline-dark"
        onClick={() => setIsOpen(true)}
        className="relative"
        aria-label={t('openFilters')}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        {t('filters')}
        {activeFiltersCount > 0 && (
          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs text-white">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">
            {t('filters')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            aria-label={t('closeFilters')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Content */}
        <div className="space-y-6 p-4">
          {/* Category Filter (Multi-select) */}
          <div>
            <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">
              {t('category')}
            </span>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isSelected
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-background-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                    )}
                  >
                    <span>{t(cat.translationKey)}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                )
              })}
            </div>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete('categories')
                  params.delete('page')
                  router.push(`${pathname}?${params.toString()}`)
                }}
                className="mt-2 text-xs text-[var(--color-primary)] hover:underline"
              >
                {t('clearCategories')}
              </button>
            )}
          </div>

          {/* Duration Filter */}
          <div>
            <label
              htmlFor="mobile-duration"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              {t('duration')}
            </label>
            <select
              id="mobile-duration"
              value={currentDuration}
              onChange={(e) => updateFilter('duration', e.target.value || null)}
              className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {durations.map((dur) => (
                <option key={dur.id} value={dur.id}>
                  {dur.label}
                </option>
              ))}
            </select>
          </div>

          {/* Accessibility Toggle */}
          <div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isAccessible}
                onChange={(e) => updateFilter('accessible', e.target.checked ? 'true' : null)}
                className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">
                {t('wheelchairAccessible')}
              </span>
            </label>
          </div>

          {/* Sort */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <TourSort />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex gap-3">
            <Button
              variant="outline-dark"
              onClick={clearAllFilters}
              className="flex-1"
            >
              {t('clearAll')}
            </Button>
            <Button onClick={() => setIsOpen(false)} className="flex-1">
              {t('applyFilters')}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
