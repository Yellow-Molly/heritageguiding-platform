'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FilterCheckboxGroup } from './filter-checkbox-group'
import type { Category } from '@/lib/api/get-categories'
import type { City } from '@/lib/api/get-cities'

/** Sanitize slug to prevent injection in URL params. */
function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

interface SidebarFiltersProps {
  categories: Category[]
  cities: City[]
}

/**
 * Desktop sidebar filter panel.
 * Order top-to-bottom: City → Categories → Duration → Accessibility.
 * All filters sync to URL search params for shareable links.
 */
export function SidebarFilters({ categories, cities }: SidebarFiltersProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // --- Parse URL state (sanitize + dedupe) ---
  const parseSlugList = (key: string) => {
    const raw = searchParams.get(key)?.split(',').filter(Boolean) || []
    return [...new Set(raw.map(sanitizeSlug).filter(Boolean))]
  }
  const selectedCategories = useMemo(() => parseSlugList('categories'), [searchParams])
  const selectedCities = useMemo(() => parseSlugList('cities'), [searchParams])

  const selectedDuration = useMemo(() => {
    const d = searchParams.get('duration')
    return d ? [d] : []
  }, [searchParams])

  const isAccessible = searchParams.get('accessible') === 'true'

  // --- URL update helper ---
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) params.delete(key)
        else params.set(key, value)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  // --- Generic multi-select toggle factory ---
  const makeMultiToggle = useCallback(
    (key: string, current: string[]) => (slug: string) => {
      if (slug === 'all') {
        updateParams({ [key]: null })
        return
      }
      const next = current.includes(slug)
        ? current.filter((c) => c !== slug)
        : [...current, slug]
      updateParams({ [key]: next.length > 0 ? next.join(',') : null })
    },
    [updateParams]
  )

  const handleCityToggle = useMemo(
    () => makeMultiToggle('cities', selectedCities),
    [makeMultiToggle, selectedCities]
  )
  const handleCategoryToggle = useMemo(
    () => makeMultiToggle('categories', selectedCategories),
    [makeMultiToggle, selectedCategories]
  )

  // --- Duration toggle (single-select: clicking same deselects) ---
  const handleDurationToggle = useCallback(
    (id: string) => {
      updateParams({ duration: selectedDuration.includes(id) ? null : id })
    },
    [selectedDuration, updateParams]
  )

  // --- Accessibility toggle ---
  const handleAccessibilityToggle = useCallback(
    (id: string) => {
      if (id === 'wheelchair') {
        updateParams({ accessible: isAccessible ? null : 'true' })
      }
    },
    [isAccessible, updateParams]
  )

  // --- Build options ---
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
      {/* City */}
      <FilterCheckboxGroup
        title={t('city')}
        options={cityOptions}
        selected={citySelected}
        onChange={handleCityToggle}
      />

      {/* Categories */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <FilterCheckboxGroup
          title={t('categories')}
          options={categoryOptions}
          selected={categorySelected}
          onChange={handleCategoryToggle}
        />
      </div>

      {/* Duration */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <FilterCheckboxGroup
          title={t('duration')}
          options={durationOptions}
          selected={selectedDuration}
          singleSelect
          onChange={handleDurationToggle}
        />
      </div>

      {/* Accessibility */}
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
