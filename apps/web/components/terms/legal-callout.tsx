import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

interface LegalCalloutProps {
  title: string
  children: ReactNode
}

/**
 * Critical-clause callout: gold-tint background + 4px gold left border + alert icon.
 * Used in §08 (withdrawal exclusion) and any other clause requiring emphasis.
 */
export function LegalCallout({ title, children }: LegalCalloutProps) {
  return (
    <aside
      className="my-6 rounded-lg border-l-4 border-[var(--color-secondary)] bg-[var(--color-secondary-tint)] p-6"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          width={20}
          height={20}
          aria-hidden="true"
          className="mt-0.5 flex-shrink-0 text-[var(--color-secondary)]"
        />
        <div className="flex-1">
          <p className="m-0 text-sm font-semibold text-[var(--color-text)]">{title}</p>
          <div className="mt-2 text-sm leading-[1.55] text-[var(--color-text)]">
            {children}
          </div>
        </div>
      </div>
    </aside>
  )
}
