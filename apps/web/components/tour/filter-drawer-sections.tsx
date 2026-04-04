'use client'

import { useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriceRangeSlider } from './sidebar/price-range-slider'
import { TourSort } from './tour-sort'
import type { Category } from '@/lib/api/get-categories'

const PRICE_MIN = 0
const PRICE_MAX = 2000

/** Sanitize category slug to prevent injection */
function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

interface DrawerSectionsProps {
  categories: Category[]
  selectedCategories: string[]
}

/**
 * Filter drawer content sections: categories, duration, price, accessibility, sort.
 * Extracted from FilterDrawer to keep each file under 200 lines.
 */
export function DrawerFilterSections({ categories, selectedCategories }: DrawerSectionsProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentDuration = searchParams.get('duration') || ''
  const isAccessible = searchParams.get('accessible') === 'true'
  const priceMinParam = searchParams.get('priceMin')
  const priceMaxParam = searchParams.get('priceMax')
  const priceMin = priceMinParam !== null ? Number(priceMinParam) : PRICE_MIN
  const priceMax = priceMaxParam !== null ? Number(priceMaxParam) : PRICE_MAX

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const toggleCategory = useCallback(
    (categoryId: string) => {
      const sanitized = sanitizeSlug(categoryId)
      if (!sanitized) return
      const params = new URLSearchParams(searchParams.toString())
      let newSelected: string[]

      if (selectedCategories.includes(sanitized)) {
        newSelected = selectedCategories.filter((c) => c !== sanitized)
      } else {
        newSelected = [...selectedCategories, sanitized]
      }

      if (newSelected.length > 0) params.set('categories', newSelected.join(','))
      else params.delete('categories')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router, selectedCategories]
  )

  const handlePriceChange = useCallback(
    (newMin: number, newMax: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newMin > PRICE_MIN) params.set('priceMin', String(newMin))
      else params.delete('priceMin')
      if (newMax < PRICE_MAX) params.set('priceMax', String(newMax))
      else params.delete('priceMax')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const durationOptions = [
    { id: '120', label: t('under2hours') },
    { id: '180', label: t('twoToThreeHours') },
    { id: '240', label: t('threeHoursPlus') },
  ]

  return (
    <>
      {/* Category Filter */}
      <div>
        <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">{t('category')}</span>
        <div className="space-y-2">
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.slug)
            return (
              <button key={cat.id} type="button" onClick={() => toggleCategory(cat.slug)}
                className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-background-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                )}>
                <span>{cat.name}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            )
          })}
        </div>
        {selectedCategories.length > 0 && (
          <button type="button" onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('categories'); params.delete('page')
            router.push(`${pathname}?${params.toString()}`)
          }} className="mt-2 text-xs text-[var(--color-primary)] hover:underline">
            {t('clearCategories')}
          </button>
        )}
      </div>

      {/* Duration checkboxes (single-select) */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">{t('duration')}</span>
        <div className="space-y-2">
          {durationOptions.map((dur) => (
            <label key={dur.id} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={currentDuration === dur.id}
                onChange={() => updateFilter('duration', currentDuration === dur.id ? null : dur.id)}
                className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
              <span className="text-sm text-[var(--color-text)]">{dur.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <PriceRangeSlider min={PRICE_MIN} max={PRICE_MAX} currentMin={priceMin} currentMax={priceMax} onChange={handlePriceChange} />
      </div>

      {/* Accessibility */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={isAccessible}
            onChange={(e) => updateFilter('accessible', e.target.checked ? 'true' : null)}
            className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
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
