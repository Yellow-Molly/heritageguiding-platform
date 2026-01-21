'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/api/get-categories'

// Scroll amount for keyboard navigation
const SCROLL_AMOUNT = 100

// Regex for valid category slug (alphanumeric + hyphens only)
const VALID_SLUG_PATTERN = /^[a-z0-9-]+$/

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
 * Validate slug against known categories.
 */
function isValidSlug(slug: string, validSlugs: string[]): boolean {
  return VALID_SLUG_PATTERN.test(slug) && validSlugs.includes(slug)
}

/**
 * Horizontal scrollable multi-select category chips.
 * Uses URL state for shareable filter links.
 */
export function CategoryChips({ categories, containerRef }: CategoryChipsProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Memoize valid category slugs for validation
  const validSlugs = useMemo(
    () => categories.map((c) => c.slug),
    [categories]
  )

  // Parse and sanitize selected categories from URL
  const selectedCategories = useMemo(() => {
    const raw = searchParams.get('categories')?.split(',').filter(Boolean) || []
    return raw
      .map(sanitizeSlug)
      .filter((slug) => isValidSlug(slug, validSlugs))
  }, [searchParams, validSlugs])

  // Toggle category selection with memoization
  const toggleCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      let newSelected: string[]

      if (slug === '') {
        // "All" clicked - clear categories
        newSelected = []
      } else {
        // Sanitize incoming slug
        const sanitized = sanitizeSlug(slug)
        if (!isValidSlug(sanitized, validSlugs)) return

        if (selectedCategories.includes(sanitized)) {
          // Deselect
          newSelected = selectedCategories.filter((s) => s !== sanitized)
        } else {
          // Select
          newSelected = [...selectedCategories, sanitized]
        }
      }

      if (newSelected.length > 0) {
        params.set('categories', newSelected.join(','))
      } else {
        params.delete('categories')
      }
      params.delete('page') // Reset pagination

      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router, selectedCategories, validSlugs]
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
            count={category.tourCount}
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
  count?: number
  isSelected: boolean
  onClick: () => void
}

/**
 * Individual category chip with selection state.
 */
function CategoryChip({ label, count, isSelected, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      className={cn(
        'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2',
        'text-sm font-medium transition-all duration-200',
        'snap-start scroll-ml-8',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        isSelected
          ? 'bg-[var(--color-primary)] text-white shadow-md'
          : 'bg-[var(--color-background-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-xs',
            isSelected
              ? 'bg-white/20 text-white'
              : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
