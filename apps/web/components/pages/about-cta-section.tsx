import { useTranslations } from 'next-intl'
import { Compass, Mail } from 'lucide-react'
import { Link } from '@/i18n/navigation'

/**
 * About page CTA section with two rounded-full buttons.
 */
export function AboutCtaSection() {
  const t = useTranslations('about.cta')

  return (
    <section className="py-12 lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-[32px] font-bold text-[var(--color-primary)] md:text-[42px]">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] text-[var(--color-text-muted)] md:text-lg">
          {t('description')}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3 font-medium text-white shadow-md transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-lg"
          >
            <Compass className="h-5 w-5" />
            {t('exploreTours')}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-secondary)] px-8 py-3 font-medium text-[var(--color-primary)] transition-all hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary-dark)]"
          >
            <Mail className="h-5 w-5" />
            {t('contactUs')}
          </Link>
        </div>
      </div>
    </section>
  )
}
