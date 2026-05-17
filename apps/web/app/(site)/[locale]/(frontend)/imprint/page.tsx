import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { WebPageSchema } from '@/components/seo'
import { LEGAL_DATES } from '@/lib/legal-dates'
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  LEGAL_ENTITY,
} from '@/lib/contact-constants'

/**
 * Imprint / Impressum page — Germany Telemediengesetz §5 + §55 RStV.
 * Required when targeting DE audience.
 *
 * Visual style mirrors privacy/terms hero pattern but the body is a flat
 * fact sheet (dl) rather than multi-section editorial content — no need
 * for sub-components per KISS. All values flow from `contact-constants.ts`
 * so there is one source of truth across schema.org, footer, and imprint.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'imprint' })

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as Locale,
    pathname: '/imprint',
  })
}

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'imprint' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  const addressLines = [
    LEGAL_ENTITY.legalName,
    `${t('tradingAs')} ${LEGAL_ENTITY.tradingName}`,
    `${CONTACT_ADDRESS.streetAddress}`,
    `${CONTACT_ADDRESS.postalCode} ${CONTACT_ADDRESS.addressLocality}, ${CONTACT_ADDRESS.addressCountry}`,
  ]

  return (
    <>
      <WebPageSchema
        name={t('meta.title')}
        description={t('meta.description')}
        url={`${baseUrl}/${locale}/imprint`}
      />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        {/* Hero */}
        <section
          aria-label={t('hero.title')}
          className="relative bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)] py-16 md:py-20 lg:py-24"
        >
          <div className="container mx-auto px-5 md:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-6 h-px w-[120px] bg-[var(--color-secondary-light)]/40" />
              <nav
                aria-label="Breadcrumb"
                className="mb-5 flex items-center text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-secondary-light)]"
              >
                <ol className="flex items-center gap-1">
                  <li>
                    <Link href={`/${locale}`} className="transition-colors hover:text-white">
                      {t('hero.breadcrumbHome')}
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="mx-1 h-3.5 w-3.5 text-[var(--color-secondary-light)]/60" />
                    <span className="text-white">{t('hero.breadcrumbCurrent')}</span>
                  </li>
                </ol>
              </nav>
              <h1 className="font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl">
                {t('hero.title')}
              </h1>
              <div className="mt-6 h-1 w-16 bg-[var(--color-secondary-light)]" />
              <p className="mt-6 max-w-2xl text-base text-white/85 md:text-lg">
                {t('hero.subtitle')}
              </p>
              <p className="mt-4 inline-flex items-center rounded-full border border-[var(--color-secondary-light)]/40 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-secondary-light)]">
                {t('hero.updatedLabel')}: {LEGAL_DATES.imprint}
              </p>
            </div>
          </div>
        </section>

        {/* Body */}
        <div className="container mx-auto max-w-3xl px-5 py-12 md:px-8 lg:py-20">
          <div className="space-y-12">
            {/* Provider */}
            <section aria-labelledby="provider">
              <h2 id="provider" className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {t('sections.provider.heading')}
              </h2>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {t('sections.provider.intro')}
              </p>
              <address className="mt-5 not-italic">
                {addressLines.map((line) => (
                  <div key={line} className="text-base text-[var(--color-text)]">
                    {line}
                  </div>
                ))}
              </address>
            </section>

            {/* Contact */}
            <section aria-labelledby="contact">
              <h2 id="contact" className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {t('sections.contact.heading')}
              </h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('sections.contact.phoneLabel')}
                </dt>
                <dd>
                  <a
                    href={`tel:${CONTACT_PHONE_TEL}`}
                    className="text-base text-[var(--color-text)] underline decoration-[var(--color-secondary)]/40 underline-offset-4 hover:decoration-[var(--color-secondary)]"
                  >
                    {CONTACT_PHONE}
                  </a>
                </dd>
                <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('sections.contact.emailLabel')}
                </dt>
                <dd>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-base text-[var(--color-text)] underline decoration-[var(--color-secondary)]/40 underline-offset-4 hover:decoration-[var(--color-secondary)]"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </dl>
            </section>

            {/* Registration */}
            <section aria-labelledby="registration">
              <h2 id="registration" className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {t('sections.registration.heading')}
              </h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('sections.registration.authorityLabel')}
                </dt>
                <dd className="text-base text-[var(--color-text)]">
                  {t('sections.registration.authorityValue')}
                </dd>
                <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('sections.registration.orgNumberLabel')}
                </dt>
                <dd className="text-base text-[var(--color-text)]">{LEGAL_ENTITY.orgNr}</dd>
                <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('sections.registration.courtLabel')}
                </dt>
                <dd className="text-base text-[var(--color-text)]">
                  {LEGAL_ENTITY.competentCourt}
                </dd>
              </dl>
            </section>

            {/* VAT */}
            <section aria-labelledby="vat">
              <h2 id="vat" className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {t('sections.vat.heading')}
              </h2>
              <dl className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('sections.vat.idLabel')}
                </dt>
                <dd className="text-base text-[var(--color-text)]">{LEGAL_ENTITY.vat}</dd>
              </dl>
              {LEGAL_ENTITY.vat === '<VAT-TBD>' && (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                  {t('sections.vat.pendingNote')}
                </p>
              )}
            </section>

            {/* Editorial responsibility — §55 RStV */}
            <section aria-labelledby="editorial">
              <h2 id="editorial" className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {t('sections.editorial.heading')}
              </h2>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {t('sections.editorial.intro')}
              </p>
              <address className="mt-5 not-italic">
                <div className="text-base text-[var(--color-text)]">{LEGAL_ENTITY.legalName}</div>
                <div className="text-base text-[var(--color-text)]">
                  {CONTACT_ADDRESS.streetAddress}
                </div>
                <div className="text-base text-[var(--color-text)]">
                  {CONTACT_ADDRESS.postalCode} {CONTACT_ADDRESS.addressLocality}
                </div>
              </address>
            </section>

            {/* EU online dispute resolution */}
            <section aria-labelledby="odr">
              <h2 id="odr" className="font-serif text-2xl font-bold text-[var(--color-text)]">
                {t('sections.odr.heading')}
              </h2>
              <p className="mt-3 text-base text-[var(--color-text)]">
                {t('sections.odr.body')}{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[var(--color-secondary)]/40 underline-offset-4 hover:decoration-[var(--color-secondary)]"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {t('sections.odr.consumerNote')}
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
