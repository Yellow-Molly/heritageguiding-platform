import type { PrivacyContactCtaProps } from './types'

/**
 * Slim navy band — privacy-question CTA with email + response SLA.
 */
export function PrivacyContactCta({
  heading,
  email,
  emailDisplay,
  responseSla,
}: PrivacyContactCtaProps) {
  return (
    <section
      aria-label={heading}
      className="bg-[var(--color-primary)] py-10 text-center text-white"
    >
      <div className="container mx-auto px-5 md:px-8">
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <h2 className="font-serif text-xl font-semibold text-white md:text-2xl">
            {heading}
          </h2>
          <a
            href={`mailto:${email}`}
            className="font-medium text-[var(--color-accent-light)] underline-offset-4 hover:underline"
          >
            {emailDisplay}
          </a>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-on-primary-muted)]">{responseSla}</p>
      </div>
    </section>
  )
}
