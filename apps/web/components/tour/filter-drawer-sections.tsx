'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { TourSort } from './tour-sort'
import { DrawerSlugListSection } from './drawer-slug-list-section'
import { useFilterState } from './filter-state-provider'
import type { Category } from '@/lib/api/get-categories'
import type { City } from '@/lib/api/get-cities'

interface DrawerSectionsProps {
  categories: Category[]
  cities: City[]
  selectedCategories: string[]
  selectedCities: string[]
}

/**
 * Filter drawer content sections.
 * Order top-to-bottom: City → Categories → Duration → Accessibility → Sort.
 * Slug-list sections (city/category) reuse `DrawerSlugListSection`.
 * Reads/writes URL state via FilterStateProvider for instant optimistic flip.
 */
export function DrawerFilterSections({
  categories,
  cities,
  selectedCategories,
  selectedCities,
}: DrawerSectionsProps) {
  const t = useTranslations('tours.filters')
  const { params, setParam } = useFilterState()

  const currentDuration = params.get('duration') || ''
  const isAccessible = params.get('accessible') === 'true'

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      setParam(key, value)
    },
    [setParam],
  )

  const durationOptions = [
    { id: '120', label: t('under2hours') },
    { id: '180', label: t('twoToThreeHours') },
    { id: '240', label: t('threeHoursPlus') },
  ]

  return (
    <>
      <DrawerSlugListSection
        title={t('city')}
        paramKey="cities"
        items={cities}
        selected={selectedCities}
        clearLabel={t('clearCities')}
      />

      <DrawerSlugListSection
        title={t('category')}
        paramKey="categories"
        items={categories}
        selected={selectedCategories}
        clearLabel={t('clearCategories')}
        topBorder
      />

      {/* Duration checkboxes (single-select) */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">{t('duration')}</span>
        <div className="space-y-2">
          {durationOptions.map((dur) => (
            <label key={dur.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={currentDuration === dur.id}
                onChange={() => updateFilter('duration', currentDuration === dur.id ? null : dur.id)}
                className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">{dur.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isAccessible}
            onChange={(e) => updateFilter('accessible', e.target.checked ? 'true' : null)}
            className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-text)]">{t('wheelchairAccessible')}</span>
        </label>
      </div>

      {/* Sort */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <TourSort />
      </div>
    </>
  )
}
