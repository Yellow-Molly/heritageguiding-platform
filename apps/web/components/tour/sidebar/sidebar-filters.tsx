'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FilterCheckboxGroup } from './filter-checkbox-group'
import { PriceRangeSlider } from './price-range-slider'
import type { Category } from '@/lib/api/get-categories'

/** Sanitize category slug to prevent injection */
function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

/** Hardcoded price bounds per plan validation (no extra API call) */
const PRICE_MIN = 0
const PRICE_MAX = 2000

interface SidebarFiltersProps {
  categories: Category[]
}

/**
 * Desktop sidebar filter panel with 4 sections:
 * Categories (multi-select), Duration (single-select), Price Range, Accessibility.
 * All filters sync to URL search params for shareable links.
 */
export function SidebarFilters({ categories }: SidebarFiltersProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // --- Parse URL state ---
  const selectedCategories = useMemo(() => {
    const raw = searchParams.get('categories')?.split(',').filter(Boolean) || []
    return raw.map(sanitizeSlug).filter(Boolean)
  }, [searchParams])

  const selectedDuration = useMemo(() => {
    const d = searchParams.get('duration')
    return d ? [d] : []
  }, [searchParams])

  const priceMinParam = searchParams.get('priceMin')
  const priceMaxParam = searchParams.get('priceMax')
  const priceMin = priceMinParam !== null ? Number(priceMinParam) : PRICE_MIN
  const priceMax = priceMaxParam !== null ? Number(priceMaxParam) : PRICE_MAX
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

  // --- Category toggle (multi-select) ---
  const handleCategoryToggle = useCallback(
    (slug: string) => {
      // "all" clears categories
      if (slug === 'all') {
        updateParams({ categories: null })
        return
      }
      const next = selectedCategories.includes(slug)
        ? selectedCategories.filter((c) => c !== slug)
        : [...selectedCategories, slug]
      updateParams({ categories: next.length > 0 ? next.join(',') : null })
    },
    [selectedCategories, updateParams]
  )

  // --- Duration toggle (single-select: clicking same deselects) ---
  const handleDurationToggle = useCallback(
    (id: string) => {
      updateParams({ duration: selectedDuration.includes(id) ? null : id })
    },
    [selectedDuration, updateParams]
  )

  // --- Price range ---
  const handlePriceChange = useCallback(
    (newMin: number, newMax: number) => {
      updateParams({
        priceMin: newMin > PRICE_MIN ? String(newMin) : null,
        priceMax: newMax < PRICE_MAX ? String(newMax) : null,
      })
    },
    [updateParams]
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
      {/* Categories */}
      <FilterCheckboxGroup
        title={t('categories')}
        options={categoryOptions}
        selected={categorySelected}
        onChange={handleCategoryToggle}
      />

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

      {/* Price Range */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <PriceRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          currentMin={priceMin}
          currentMax={priceMax}
          onChange={handlePriceChange}
        />
      </div>

      {/* Accessibility (wheelchair only — hearing hidden until API supports it) */}
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
