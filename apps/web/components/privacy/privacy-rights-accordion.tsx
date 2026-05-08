import { ChevronDown, Mail } from 'lucide-react'
import type { PrivacyRightsAccordionProps } from './types'

/**
 * 8 GDPR rights as native <details>/<summary> accordion + SLA callout.
 * Each row: gold numeral chip + name (Playfair) + chevron rotates on [open].
 */
export function PrivacyRightsAccordion({
  id,
  heading,
  items,
  slaCallout,
  contactEmail,
}: PrivacyRightsAccordionProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="scroll-mt-24">
      <h2
        id={id ? `${id}-heading` : undefined}
        className="mb-6 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
      >
        {heading}
        <span className="mt-2 block h-[2px] w-8 bg-[var(--color-secondary-light)]" />
      </h2>

      <ul className="divide-y divide-[var(--color-border-light)] overflow-hidden rounded-xl bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        {items.map((item) => {
          const subject = encodeURIComponent(item.mailtoSubject)
          return (
            <li key={item.id}>
              <details className="group" id={`right-${item.id}`}>
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 hover:bg-[var(--color-background-alt)] focus-visible:bg-[var(--color-background-alt)]">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-sm font-bold text-[var(--color-primary)]"
                  >
                    {item.numeral}
                  </span>
                  <h3 className="flex-1 font-serif text-base font-semibold text-[var(--color-primary)] md:text-lg">
                    {item.name}
                  </h3>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 flex-none text-[var(--color-text-muted)] transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="space-y-3 border-t border-[var(--color-border-light)] bg-[var(--color-background-alt)]/40 px-5 pb-5 pt-4 md:px-14">
                  <p className="text-sm text-[var(--color-text)] md:text-base">
                    {item.description}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {item.exerciseInstruction}
                  </p>
                  <a
                    href={`mailto:${contactEmail}?subject=${subject}`}
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)]"
                  >
                    <Mail className="h-4 w-4" />
                    {item.ctaLabel}
                  </a>
                </div>
              </details>
            </li>
          )
        })}
      </ul>

      <p
        role="note"
        className="mt-4 rounded-md border-l-4 border-[var(--color-secondary-light)] bg-[var(--color-secondary-tint)] p-4 text-sm text-[var(--color-text)]"
      >
        {slaCallout}
      </p>
    </section>
  )
}
