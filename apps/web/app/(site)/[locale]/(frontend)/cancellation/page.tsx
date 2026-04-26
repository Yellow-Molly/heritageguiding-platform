import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { WebPageSchema } from '@/components/seo'
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/lib/contact-constants'
import {
  CancellationHero,
  CancellationTiers,
  CancellationStepper,
  CancellationProse,
  CancellationTrustBanner,
  CancellationCta,
} from '@/components/cancellation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cancellation' })

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as Locale,
    pathname: '/cancellation',
  })
}

export default async function CancellationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cancellation' })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  return (
    <>
      <WebPageSchema
        name={t('meta.title')}
        description={t('meta.description')}
        url={`${baseUrl}/${locale}/cancellation`}
      />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <CancellationHero
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          breadcrumbHome={t('hero.breadcrumbHome')}
          breadcrumbCurrent={t('hero.breadcrumbCurrent')}
          locale={locale}
        />
        <CancellationTiers
          sectionTag={t('tiers.sectionTag')}
          title={t('tiers.title')}
          subtitle={t('tiers.subtitle')}
          cards={[
            { title: t('tiers.card1.title'), timeframe: t('tiers.card1.timeframe'), description: t('tiers.card1.description') },
            { title: t('tiers.card2.title'), timeframe: t('tiers.card2.timeframe'), description: t('tiers.card2.description') },
            { title: t('tiers.card3.title'), timeframe: t('tiers.card3.timeframe'), description: t('tiers.card3.description') },
          ]}
        />
        <CancellationStepper
          title={t('stepper.title')}
          subtitle={t('stepper.subtitle')}
          steps={[
            { title: t('stepper.step1.title'), description: t('stepper.step1.description') },
            { title: t('stepper.step2.title'), description: t('stepper.step2.description') },
            { title: t('stepper.step3.title'), description: t('stepper.step3.description') },
          ]}
        />
        <CancellationProse
          title={t('prose.title')}
          blocks={[
            { title: t('prose.block1.title'), content: t('prose.block1.content') },
            { title: t('prose.block2.title'), content: t('prose.block2.content') },
            { title: t('prose.block3.title'), content: t('prose.block3.content') },
            { title: t('prose.block4.title'), content: t('prose.block4.content') },
          ]}
        />
        <CancellationTrustBanner
          title={t('trust.title')}
          items={[t('trust.item1'), t('trust.item2'), t('trust.item3')]}
        />
        <CancellationCta
          title={t('cta.title')}
          subtitle={t('cta.subtitle')}
          buttonText={t('cta.buttonText')}
          email={CONTACT_EMAIL}
          phone={CONTACT_PHONE}
        />
      </main>
      <Footer />
    </>
  )
}
