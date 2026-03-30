'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/api/get-categories'

// Scroll amount for keyboard navigation
const SCROLL_AMOUNT = 100

interface CategoryChipsProps {
  categories: Category[]
  /** Optional ref for external scroll control (desktop arrow buttons) */
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Sanitize category slug to prevent XSS/injection.
 */
function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

/**
 * Horizontal scrollable multi-select category chips.
 * Uses URL state for shareable filter links.
 * Accepts any CMS slug — server handles unknown slugs safely.
 */
export function CategoryChips({ categories, containerRef }: CategoryChipsProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse and sanitize selected categories from URL
  const selectedCategories = useMemo(() => {
    const raw = searchParams.get('categories')?.split(',').filter(Boolean) || []
    return raw.map(sanitizeSlug).filter(Boolean)
  }, [searchParams])

  // Toggle category selection
  const toggleCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      let newSelected: string[]

      if (slug === '') {
        // "All" clicked - clear categories
        newSelected = []
      } else {
        const sanitized = sanitizeSlug(slug)
        if (!sanitized) return

        if (selectedCategories.includes(sanitized)) {
          newSelected = selectedCategories.filter((s) => s !== sanitized)
        } else {
          newSelected = [...selectedCategories, sanitized]
        }
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

  // Keyboard navigation for scroll container
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const container = e.currentTarget
      if (e.key === 'ArrowRight') {
        container.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
      } else if (e.key === 'ArrowLeft') {
        container.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
      }
    },
    []
  )

  return (
    <div className="relative">
      {/* Left fade gradient */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-[var(--color-surface)] to-transparent" />

      {/* Scrollable chip container */}
      <div
        ref={containerRef}
        className={cn(
          'flex gap-2 overflow-x-auto px-8 py-2',
          'scroll-smooth snap-x snap-mandatory',
          'scrollbar-hide'
        )}
        role="listbox"
        aria-label={t('selectCategories')}
        aria-multiselectable="true"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* "All" chip */}
        <CategoryChip
          label={t('allCategories')}
          isSelected={selectedCategories.length === 0}
          onClick={() => toggleCategory('')}
        />

        {/* Category chips */}
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            isSelected={selectedCategories.includes(category.slug)}
            onClick={() => toggleCategory(category.slug)}
          />
        ))}
      </div>

      {/* Right fade gradient */}
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />
    </div>
  )
}

interface CategoryChipProps {
  label: string
  isSelected: boolean
  onClick: () => void
}

/**
 * Individual category chip with selection state.
 */
function CategoryChip({ label, isSelected, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      className={cn(
        'whitespace-nowrap rounded-full px-4 py-2',
        'text-sm font-medium transition-all duration-200',
        'snap-start scroll-ml-8',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        isSelected
          ? 'bg-[var(--color-primary)] text-white shadow-md'
          : 'bg-[var(--color-background-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
      )}
    >
      {label}
    </button>
  )
}
