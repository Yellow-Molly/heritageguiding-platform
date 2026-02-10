'use client'

import { useState } from 'react'
import { WizardOptionCard } from './wizard-option-card'

interface WizardOption {
  value: string
  emoji: string
  label: string
}

interface WizardStepSelectorProps {
  title: string
  subtitle?: string
  options: WizardOption[]
  onSelect: (values: string[]) => void
  /** If false, clicking an option immediately advances (single-select) */
  allowMultiple?: boolean
  initialSelected?: string[]
}

/** Renders a wizard step with selectable option cards */
export function WizardStepSelector({
  title,
  subtitle,
  options,
  onSelect,
  allowMultiple = false,
  initialSelected = [],
}: WizardStepSelectorProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(initialSelected)

  const handleSelect = (value: string) => {
    if (allowMultiple) {
      setLocalSelected((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      )
    } else {
      // Single-select: immediately advance
      onSelect([value])
    }
  }

  return (
    <div className="text-center">
      <h2 className="font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-[var(--color-text-muted)]">{subtitle}</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <WizardOptionCard
            key={option.value}
            emoji={option.emoji}
            label={option.label}
            selected={allowMultiple ? localSelected.includes(option.value) : false}
            onClick={() => handleSelect(option.value)}
          />
        ))}
      </div>

      {/* Show confirm button for multi-select mode */}
      {allowMultiple && localSelected.length > 0 && (
        <button
          type="button"
          onClick={() => onSelect(localSelected)}
          className={
            'mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 font-medium ' +
            'bg-[var(--color-accent)] text-white shadow-md transition-all duration-300 ' +
            'hover:bg-[var(--color-accent-dark)] hover:shadow-lg ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2'
          }
        >
          Continue ({localSelected.length} selected)
        </button>
      )}
    </div>
  )
}
