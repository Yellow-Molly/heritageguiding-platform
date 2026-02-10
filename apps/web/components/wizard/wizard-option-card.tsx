'use client'

import { cn } from '@/lib/utils'

interface WizardOptionCardProps {
  emoji: string
  label: string
  selected?: boolean
  onClick: () => void
}

/** Selectable option card for wizard steps with keyboard support */
export function WizardOptionCard({ emoji, label, selected, onClick }: WizardOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        'flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6',
        'cursor-pointer transition-all duration-200',
        'hover:border-[var(--color-accent)] hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
        selected && 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-2 ring-[var(--color-accent)]'
      )}
    >
      <span className="text-4xl" aria-hidden="true">{emoji}</span>
      <span className="mt-3 text-sm font-medium text-[var(--color-text)]">{label}</span>
    </button>
  )
}
