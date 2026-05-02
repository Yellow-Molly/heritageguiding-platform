'use client'

import { useCallback } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilterState } from './filter-state-provider'

interface SlugItem {
  id: string | number
  name: string
  slug: string
}

interface DrawerSlugListSectionProps {
  title: string
  paramKey: 'categories' | 'cities'
  items: SlugItem[]
  selected: string[]
  clearLabel: string
  topBorder?: boolean
}

/**
 * Generic chip-list section for the mobile filter drawer.
 * Used by category and city filters — they share the same URL-state pattern
 * (comma-separated slug list under `paramKey`).
 * Reads/writes optimistic URL state via FilterStateProvider.
 */
export function DrawerSlugListSection({
  title,
  paramKey,
  items,
  selected,
  clearLabel,
  topBorder = false,
}: DrawerSlugListSectionProps) {
  const { setParam, toggleListItem } = useFilterState()

  const toggle = useCallback(
    (slug: string) => {
      toggleListItem(paramKey, slug)
    },
    [paramKey, toggleListItem],
  )

  const clear = useCallback(() => {
    setParam(paramKey, null)
  }, [paramKey, setParam])

  if (items.length === 0) return null

  return (
    <div className={topBorder ? 'border-t border-[var(--color-border)] pt-4' : ''}>
      <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">{title}</span>
      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.slug)
          return (
            <button
              key={String(item.id)}
              type="button"
              onClick={() => toggle(item.slug)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                isSelected
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-background-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
              )}
            >
              <span>{item.name}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-xs text-[var(--color-primary)] hover:underline"
        >
          {clearLabel}
        </button>
      )}
    </div>
  )
}
