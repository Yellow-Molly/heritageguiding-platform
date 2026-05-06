import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface HelpBandProps {
  title: string
  subtitle: string
  primaryCta: { label: string; href: string }
  secondaryLink?: { label: string; href: string }
}

/**
 * "Need help?" footer band, placed below body content.
 * Two-column desktop, stacked mobile. Background: --color-background-alt.
 */
export function HelpBand({ title, subtitle, primaryCta, secondaryLink }: HelpBandProps) {
  return (
    <section className="terms-help-band bg-[var(--color-background-alt)] py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="font-serif text-2xl text-[var(--color-primary)]">{title}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-text-on-primary)] transition-colors hover:bg-[var(--color-primary-light)]"
            >
              {primaryCta.label}
            </Link>
            {secondaryLink && (
              <Link
                href={secondaryLink.href}
                className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
              >
                {secondaryLink.label}
                <ArrowRight width={16} height={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
