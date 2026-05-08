import { Scale, ExternalLink } from 'lucide-react'
import type { PrivacyComplaintCalloutProps } from './types'

/**
 * Right-to-complain band — full-bleed, centered icon + heading + body,
 * primary mailto + secondary external IMY link.
 */
export function PrivacyComplaintCallout({
  id,
  heading,
  body,
  primaryCta,
  secondaryCta,
}: PrivacyComplaintCalloutProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className="scroll-mt-24 bg-[var(--color-background-alt)] py-12 md:py-16"
    >
      <div className="container mx-auto px-5 md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Scale aria-hidden="true" className="mb-4 h-12 w-12 text-[var(--color-primary)]" />
          <h2
            id={id ? `${id}-heading` : undefined}
            className="font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
          >
            {heading}
          </h2>
          <p className="mt-4 text-base text-[var(--color-text)] md:text-lg">{body}</p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <a
              href={primaryCta.mailto}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-dark)]"
            >
              {primaryCta.label}
            </a>
            <a
              href={secondaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={secondaryCta.ariaLabel}
              className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-[var(--color-primary)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
            >
              {secondaryCta.label}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
