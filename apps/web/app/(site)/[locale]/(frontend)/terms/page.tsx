import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import {
  ScrollText,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { WebPageSchema } from '@/components/seo'
import { LEGAL_DATES } from '@/lib/legal-dates'
import {
  CONTACT_ADDRESS_LINE,
  CONTACT_EMAIL,
  LEGAL_ENTITY,
} from '@/lib/contact-constants'
import {
  CompanyInfoCard,
  HelpBand,
  LegalCallout,
  TocSidebar,
  type TocEntry,
} from '@/components/terms'
import { InlineCrossLinkCard } from '@/components/shared/inline-cross-link-card'

const SECTION_KEYS = [
  'parties',
  'definitions',
  'service',
  'booking',
  'pricing',
  'payment',
  'cancellation',
  'withdrawalExclusion',
  'modifications',
  'forceMajeure',
  'participantObligations',
  'minors',
  'liability',
  'ip',
  'privacy',
  'complaints',
  'governingLaw',
  'changes',
  'acceptance',
] as const

const LIST_SECTIONS = new Set(['booking', 'cancellation', 'participantObligations'])

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/terms',
  })
}

interface SectionShellProps {
  id: string
  number: string
  title: string
  children: ReactNode
}

function SectionShell({ id, number, title, children }: SectionShellProps) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-[var(--color-border-light)] pt-10 first:border-t-0 first:pt-0">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
        § {number}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-[var(--color-primary)] md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-[1.7] text-[var(--color-text)]">
        {children}
      </div>
    </section>
  )
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  const tocItems: TocEntry[] = SECTION_KEYS.map((key, idx) => ({
    id: key,
    number: String(idx + 1).padStart(2, '0'),
    title: t(`sections.${key}.title`),
  }))

  const renderListSection = (key: 'booking' | 'cancellation' | 'participantObligations', useChecks: boolean) => {
    const intro = t(`sections.${key}.intro`)
    const itemsRaw = t.raw(`sections.${key}.items`) as string[]
    return (
      <>
        <p>{intro}</p>
        <ul className={useChecks ? 'space-y-2 list-none pl-0' : 'list-disc space-y-2 pl-5'}>
          {itemsRaw.map((item, i) => (
            <li key={i} className={useChecks ? 'flex items-start gap-2' : ''}>
              {useChecks && (
                <Check
                  width={18}
                  height={18}
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0 text-[var(--color-secondary)]"
                />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <>
      <WebPageSchema
        name={t('title')}
        description={t('description')}
        url={`${baseUrl}/${locale}/terms`}
      />
      <Header />
      <main className="terms-page min-h-screen bg-[var(--color-background)]">
        {/* Hero */}
        <section className="terms-hero bg-[var(--color-primary)] py-14 text-[var(--color-text-on-primary)]">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl font-bold text-[var(--color-text-on-primary)] md:text-5xl">
              {t('title')}
            </h1>
            <div className="mx-auto mt-4 h-0.5 w-16 bg-[var(--color-secondary-light)]" />
            <p className="mt-3 text-[var(--color-text-on-primary-muted)]">
              {t('lastUpdated')}: {LEGAL_DATES.terms}
            </p>
          </div>
        </section>

        {/* Body grid: ToC sidebar + article */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
            <TocSidebar
              items={tocItems}
              eyebrow={t('tocLabel')}
              jumpToLabel={t('tocJumpLabel')}
            />

            <article className="min-w-0 max-w-3xl">
              {/* §01 Parties */}
              <SectionShell id="parties" number="01" title={t('sections.parties.title')}>
                <p>{t('sections.parties.content')}</p>
                <CompanyInfoCard
                  entries={[
                    { label: t('company.labelLegalName'), value: LEGAL_ENTITY.legalName },
                    { label: t('company.labelOrgNr'), value: LEGAL_ENTITY.orgNr },
                    { label: t('company.labelVat'), value: LEGAL_ENTITY.vat },
                    { label: t('company.labelAddress'), value: CONTACT_ADDRESS_LINE },
                    { label: t('company.labelEmail'), value: CONTACT_EMAIL },
                    { label: t('company.labelCourt'), value: LEGAL_ENTITY.competentCourt },
                  ]}
                />
              </SectionShell>

              {SECTION_KEYS.slice(1).map((key, idx) => {
                const num = String(idx + 2).padStart(2, '0')
                const title = t(`sections.${key}.title`)
                return (
                  <SectionShell key={key} id={key} number={num} title={title}>
                    {key === 'withdrawalExclusion' ? (
                      <LegalCallout title={t('sections.withdrawalExclusion.title')}>
                        <p className="m-0">{t('sections.withdrawalExclusion.content')}</p>
                      </LegalCallout>
                    ) : LIST_SECTIONS.has(key) ? (
                      renderListSection(
                        key as 'booking' | 'cancellation' | 'participantObligations',
                        key === 'participantObligations'
                      )
                    ) : (
                      <p>{t(`sections.${key}.content`)}</p>
                    )}

                    {key === 'cancellation' && (
                      <InlineCrossLinkCard
                        icon={ScrollText}
                        title={t('crossLinks.cancellationTitle')}
                        description={t('crossLinks.cancellationDescription')}
                        href={`/${locale}/cancellation`}
                      />
                    )}

                    {key === 'privacy' && (
                      <InlineCrossLinkCard
                        icon={ShieldCheck}
                        title={t('crossLinks.privacyTitle')}
                        description={t('crossLinks.privacyDescription')}
                        href={`/${locale}/privacy`}
                      />
                    )}
                  </SectionShell>
                )
              })}
            </article>
          </div>
        </div>

        <HelpBand
          title={t('help.title')}
          subtitle={t('help.subtitle')}
          primaryCta={{ label: t('help.primaryCta'), href: `/${locale}/contact` }}
          secondaryLink={{ label: t('help.secondaryLink'), href: `/${locale}/cancellation` }}
        />
      </main>
      <Footer />
    </>
  )
}
