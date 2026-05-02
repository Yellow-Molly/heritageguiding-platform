'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { FilterCheckboxGroup } from './filter-checkbox-group'
import { useFilterState } from '../filter-state-provider'
import { sanitizeSlug } from '@/lib/utils'
import type { Category } from '@/lib/api/get-categories'
import type { City } from '@/lib/api/get-cities'

interface SidebarFiltersProps {
  categories: Category[]
  cities: City[]
}

/**
 * Desktop sidebar filter panel.
 * Order top-to-bottom: City → Categories → Duration → Accessibility.
 * All filters sync to URL search params via FilterStateProvider for shareable links.
 */
export function SidebarFilters({ categories, cities }: SidebarFiltersProps) {
  const t = useTranslations('tours.filters')
  const { params, setParam, toggleListItem } = useFilterState()

  const parseSlugList = useCallback((key: string) => {
    const raw = params.get(key)?.split(',').filter(Boolean) ?? []
    return [...new Set(raw.map(sanitizeSlug).filter(Boolean))]
  }, [params])

  const selectedCategories = useMemo(() => parseSlugList('categories'), [parseSlugList])
  const selectedCities = useMemo(() => parseSlugList('cities'), [parseSlugList])

  const selectedDuration = useMemo(() => {
    const d = params.get('duration')
    return d ? [d] : []
  }, [params])

  const isAccessible = params.get('accessible') === 'true'

  // Multi-select: 'all' clears the key, slug toggles list membership
  const makeMultiToggle = useCallback(
    (key: string) => (slug: string) => {
      if (slug === 'all') {
        setParam(key, null)
        return
      }
      toggleListItem(key, slug)
    },
    [setParam, toggleListItem],
  )

  const handleCityToggle = useMemo(() => makeMultiToggle('cities'), [makeMultiToggle])
  const handleCategoryToggle = useMemo(() => makeMultiToggle('categories'), [makeMultiToggle])

  const handleDurationToggle = useCallback(
    (id: string) => {
      setParam('duration', selectedDuration.includes(id) ? null : id)
    },
    [selectedDuration, setParam],
  )

  const handleAccessibilityToggle = useCallback(
    (id: string) => {
      if (id === 'wheelchair') {
        setParam('accessible', isAccessible ? null : 'true')
      }
    },
    [isAccessible, setParam],
  )

  const cityOptions = [
    { id: 'all', label: t('allCities') },
    ...cities.map((c) => ({ id: c.slug, label: c.name })),
  ]
  const citySelected = selectedCities.length === 0 ? ['all'] : selectedCities

  const categoryOptions = [
    { id: 'all', label: t('allTours') },
    ...categories.map((c) => ({ id: c.slug, label: c.name })),
  ]
  const categorySelected =
    selectedCategories.length === 0 ? ['all'] : selectedCategories

  const durationOptions = [
    { id: '120', label: t('under2hours') },
    { id: '180', label: t('twoToThreeHours') },
    { id: '240', label: t('threeHoursPlus') },
  ]

  const accessibilityOptions = [
    { id: 'wheelchair', label: t('wheelchairAccessible') },
  ]
  const accessibilitySelected = isAccessible ? ['wheelchair'] : []

  return (
    <div className="space-y-6">
      <FilterCheckboxGroup
        title={t('city')}
        options={cityOptions}
        selected={citySelected}
        onChange={handleCityToggle}
      />

      <div className="border-t border-[var(--color-border)] pt-6">
        <FilterCheckboxGroup
          title={t('categories')}
          options={categoryOptions}
          selected={categorySelected}
          onChange={handleCategoryToggle}
        />
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <FilterCheckboxGroup
          title={t('duration')}
          options={durationOptions}
          selected={selectedDuration}
          singleSelect
          onChange={handleDurationToggle}
        />
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <FilterCheckboxGroup
          title={t('accessibility')}
          options={accessibilityOptions}
          selected={accessibilitySelected}
          onChange={handleAccessibilityToggle}
        />
      </div>
    </div>
  )
}
