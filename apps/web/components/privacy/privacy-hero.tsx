import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { PrivacyHeroProps } from './types'

/**
 * Hero section — Editorial Heritage style.
 * Navy gradient background, gold dividers, breadcrumb, "Updated" chip,
 * Playfair h1, gold accent line, white subtitle.
 */
export function PrivacyHero({ breadcrumb, title, subtitle, updatedChip }: PrivacyHeroProps) {
  return (
    <section
      aria-label="Privacy policy"
      className="relative bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)] py-16 md:py-20 lg:py-24"
    >
      <div className="container mx-auto px-5 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {/* Top gold divider */}
          <div className="mb-6 h-px w-[120px] bg-[var(--color-secondary-light)]/40" />

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-secondary-light)]"
          >
            <ol className="flex items-center gap-1">
              {breadcrumb.map((item, i) => {
                const isLast = i === breadcrumb.length - 1
                return (
                  <li key={`${item.label}-${i}`} className="flex items-center">
                    {i > 0 && (
                      <ChevronRight className="mx-1 h-3.5 w-3.5 text-[var(--color-secondary-light)]/60" />
                    )}
                    {!isLast && item.href ? (
                      <Link
                        href={item.href}
                        className="transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span aria-current={isLast ? 'page' : undefined} className="text-white/90">
                        {item.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          {/* Updated chip */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-4 py-1.5 text-xs font-semibold text-[var(--color-primary-dark)]">
            <span className="uppercase tracking-wider">{updatedChip.label}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={updatedChip.date}>{updatedChip.date}</time>
          </span>

          {/* Title */}
          <h1 className="font-serif text-4xl font-bold leading-[1.1] text-white md:text-5xl lg:text-[clamp(2.5rem,5vw,4.5rem)]">
            {title}
          </h1>

          {/* Gold accent line */}
          <div className="my-6 h-[2px] w-16 bg-[var(--color-secondary-light)]" />

          {/* Subtitle */}
          <p className="max-w-2xl text-base text-[var(--color-text-on-primary-muted)] md:text-lg">
            {subtitle}
          </p>

          {/* Bottom gold divider */}
          <div className="mt-10 h-px w-[120px] bg-[var(--color-secondary-light)]/40" />
        </div>
      </div>
    </section>
  )
}
