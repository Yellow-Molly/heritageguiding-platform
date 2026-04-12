import { Link } from '@/i18n/navigation'

interface CancellationCtaProps {
  title: string
  subtitle: string
  buttonText: string
  email: string
  phone: string
}

/**
 * Contact CTA section with button, email, and phone.
 */
export function CancellationCta({ title, subtitle, buttonText, email, phone }: CancellationCtaProps) {
  return (
    <section aria-label="Contact support" className="bg-[var(--color-background)] py-16">
      <div className="container mx-auto px-5 text-center md:px-20">
        <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)]">{title}</h2>
        <p className="mt-3 text-[var(--color-text-muted)]">{subtitle}</p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-lg bg-[var(--color-accent)] px-8 py-3 font-medium text-white transition-colors hover:bg-[var(--color-accent-dark)]"
        >
          {buttonText}
        </Link>
        <div className="mt-6 space-x-6 text-sm text-[var(--color-text-muted)]">
          <a href={`mailto:${email}`} className="hover:text-[var(--color-primary)]">
            {email}
          </a>
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-[var(--color-primary)]">
            {phone}
          </a>
        </div>
      </div>
    </section>
  )
}
