import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { WebPageSchema } from '@/components/seo'
import { LEGAL_DATES } from '@/lib/legal-dates'
import { CONTACT_EMAIL } from '@/lib/contact-constants'
import {
  PrivacyHero,
  PrivacyTableOfContents,
  PrivacyControllerCard,
  PrivacyProcessingTable,
  PrivacySubProcessorTable,
  PrivacyRightsAccordion,
  PrivacyProse,
  PrivacyComplaintCallout,
  PrivacyContactCta,
  type ProcessingRow,
  type SubProcessorRow,
  type RightItem,
  type ProseSection,
  type TocItem,
} from '@/components/privacy'

const TOC_KEYS = [
  'controller',
  'scope',
  'dataCollected',
  'purposes',
  'subProcessors',
  'transfers',
  'retention',
  'rights',
  'complaint',
  'cookies',
  'children',
  'automated',
  'security',
  'changes',
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as Locale,
    pathname: '/privacy',
  })
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  const tocItems: TocItem[] = TOC_KEYS.map((k, i) => ({
    id: k,
    numeral: String(i + 1).padStart(2, '0'),
    label: t(`toc.items.${k}`),
  }))

  const proseBefore: ProseSection[] = [
    {
      id: 'scope',
      heading: t('scope.heading'),
      paragraphs: t.raw('scope.paragraphs') as string[],
    },
    {
      id: 'dataCollected',
      heading: t('dataCollected.heading'),
      intro: t('dataCollected.intro'),
      bullets: t.raw('dataCollected.bullets') as string[],
    },
  ]

  const proseMiddle: ProseSection[] = [
    {
      id: 'transfers',
      heading: t('transfers.heading'),
      paragraphs: t.raw('transfers.paragraphs') as string[],
    },
    {
      id: 'retention',
      heading: t('retention.heading'),
      intro: t('retention.intro'),
      bullets: t.raw('retention.bullets') as string[],
    },
  ]

  const proseAfter: ProseSection[] = [
    {
      id: 'cookies',
      heading: t('cookies.heading'),
      intro: t('cookies.intro'),
      bullets: t.raw('cookies.bullets') as string[],
      paragraphs: [t('cookies.trailing')],
    },
    {
      id: 'children',
      heading: t('children.heading'),
      paragraphs: [t('children.body')],
    },
    {
      id: 'automated',
      heading: t('automated.heading'),
      paragraphs: [t('automated.body')],
    },
    {
      id: 'security',
      heading: t('security.heading'),
      paragraphs: [t('security.body')],
    },
    {
      id: 'changes',
      heading: t('changes.heading'),
      paragraphs: [t('changes.body')],
    },
  ]

  return (
    <>
      <WebPageSchema
        name={t('meta.title')}
        description={t('meta.description')}
        url={`${baseUrl}/${locale}/privacy`}
      />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <PrivacyHero
          breadcrumb={[
            { label: t('hero.breadcrumbHome'), href: `/${locale}` },
            { label: t('hero.breadcrumbCurrent') },
          ]}
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          updatedChip={{ label: t('hero.updatedLabel'), date: LEGAL_DATES.privacy }}
        />

        <div className="container mx-auto px-4 py-12 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12 lg:px-8 lg:py-20">
          <PrivacyTableOfContents
            items={tocItems}
            title={t('toc.title')}
            closeLabel={t('toc.closeLabel')}
          />

          <div className="space-y-16">
            <PrivacyControllerCard
              id="controller"
              heading={t('controller.heading')}
              controllerLabel={t('controller.controllerLabel')}
              contactLabel={t('controller.contactLabel')}
              emailLabel={t('controller.emailLabel')}
              controller={{
                legalName: t('controller.legalName'),
                orgNumber: t('controller.orgNumber'),
                address: t.raw('controller.address') as string[],
                email: CONTACT_EMAIL,
              }}
            />

            <PrivacyProse sections={proseBefore} />

            <PrivacyProcessingTable
              id="purposes"
              heading={t('purposes.heading')}
              caption={t('purposes.caption')}
              columnHeaders={t.raw('purposes.columnHeaders') as {
                activity: string
                data: string
                basis: string
                retention: string
              }}
              rows={t.raw('purposes.rows') as ProcessingRow[]}
            />

            <PrivacySubProcessorTable
              id="subProcessors"
              heading={t('subProcessors.heading')}
              intro={t('subProcessors.intro')}
              caption={t('subProcessors.caption')}
              columnHeaders={t.raw('subProcessors.columnHeaders') as {
                provider: string
                role: string
                location: string
                transfer: string
              }}
              rows={t.raw('subProcessors.rows') as SubProcessorRow[]}
            />

            <PrivacyProse sections={proseMiddle} />

            <PrivacyRightsAccordion
              id="rights"
              heading={t('rights.heading')}
              items={t.raw('rights.items') as RightItem[]}
              slaCallout={t('rights.slaCallout')}
              contactEmail={CONTACT_EMAIL}
            />

            <PrivacyProse sections={proseAfter} />
          </div>
        </div>

        <PrivacyComplaintCallout
          id="complaint"
          heading={t('complaint.heading')}
          body={t('complaint.body')}
          primaryCta={{
            label: t('complaint.primaryCtaLabel'),
            mailto: `mailto:${CONTACT_EMAIL}`,
          }}
          secondaryCta={{
            label: t('complaint.secondaryCtaLabel'),
            href: 'https://www.imy.se',
            ariaLabel: t('complaint.secondaryCtaAriaLabel'),
          }}
        />

        <PrivacyContactCta
          heading={t('contactCta.heading')}
          email={CONTACT_EMAIL}
          emailDisplay={t('contactCta.emailDisplay')}
          responseSla={t('contactCta.responseSla')}
        />
      </main>
      <Footer />
    </>
  )
}
