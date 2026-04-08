'use client'

import { cn } from '@/lib/utils'

interface CheckboxOption {
  id: string
  label: string
}

interface FilterCheckboxGroupProps {
  title: string
  options: CheckboxOption[]
  /** Selected IDs for multi-select mode */
  selected: string[]
  /** If true, only one option can be selected at a time (radio behavior) */
  singleSelect?: boolean
  onChange: (id: string) => void
}

/**
 * Reusable checkbox group for sidebar filters.
 * Supports multi-select (categories) and single-select (duration) modes.
 */
export function FilterCheckboxGroup({
  title,
  options,
  selected,
  singleSelect = false,
  onChange,
}: FilterCheckboxGroupProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[var(--color-primary)] mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {options.map((option) => {
          const isChecked = selected.includes(option.id)
          return (
            <label
              key={option.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                  isChecked
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-white group-hover:border-[var(--color-primary)]'
                )}
              >
                {isChecked && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(option.id)}
                className="sr-only"
                aria-label={option.label}
              />
              <span className="text-sm text-[var(--color-text)]">
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
