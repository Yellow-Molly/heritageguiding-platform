import type { PrivacyProseProps } from './types'

/**
 * Renders an array of prose sections — each <section id> with h2, optional
 * intro paragraph, optional bullet list, optional paragraphs.
 */
export function PrivacyProse({ sections }: PrivacyProseProps) {
  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="scroll-mt-24"
        >
          <h2
            id={`${section.id}-heading`}
            className="mb-4 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
          >
            {section.heading}
            <span className="mt-2 block h-[2px] w-8 bg-[var(--color-secondary-light)]" />
          </h2>
          {section.intro && (
            <p className="mb-3 text-[var(--color-text)]">{section.intro}</p>
          )}
          {section.bullets && section.bullets.length > 0 && (
            <ul className="mb-3 list-disc space-y-2 pl-5 text-[var(--color-text)] marker:text-[var(--color-secondary-light)]">
              {section.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {section.paragraphs && section.paragraphs.length > 0 && (
            <div className="space-y-3 text-[var(--color-text)]">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
