'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn, sanitizeSlug } from '@/lib/utils'
import { useFilterState } from '../filter-state-provider'
import type { Category } from '@/lib/api/get-categories'

const SCROLL_AMOUNT = 100

interface CategoryChipsProps {
  categories: Category[]
  /** Optional ref for external scroll control (desktop arrow buttons). */
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Horizontal scrollable multi-select category chips.
 * Reads optimistic URL state via FilterStateProvider — chip flip is instant,
 * router transition pends in background.
 */
export function CategoryChips({ categories, containerRef }: CategoryChipsProps) {
  const t = useTranslations('tours.filters')
  const { params, toggleListItem, setParam } = useFilterState()

  const selectedCategories = useMemo(() => {
    const raw = params.get('categories')?.split(',').filter(Boolean) ?? []
    return raw.map(sanitizeSlug).filter(Boolean)
  }, [params])

  const toggleCategory = useCallback(
    (slug: string) => {
      if (slug === '') {
        setParam('categories', null)
        return
      }
      toggleListItem('categories', slug)
    },
    [setParam, toggleListItem],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const container = e.currentTarget
      if (e.key === 'ArrowRight') {
        container.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
      } else if (e.key === 'ArrowLeft') {
        container.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
      }
    },
    [],
  )

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={cn(
          'flex gap-2 overflow-x-auto py-2',
          'scroll-smooth snap-x snap-mandatory',
          'scrollbar-hide',
        )}
        role="listbox"
        aria-label={t('selectCategories')}
        aria-multiselectable="true"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <CategoryChip
          label={t('allCategories')}
          isSelected={selectedCategories.length === 0}
          onClick={() => toggleCategory('')}
        />

        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            isSelected={selectedCategories.includes(category.slug)}
            onClick={() => toggleCategory(category.slug)}
          />
        ))}
      </div>
    </div>
  )
}

interface CategoryChipProps {
  label: string
  isSelected: boolean
  onClick: () => void
}

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
          : 'border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-background-alt)]',
      )}
    >
      {label}
    </button>
  )
}
