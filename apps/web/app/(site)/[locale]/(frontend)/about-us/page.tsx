import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { AboutSchema } from '@/components/seo'
import { AboutHeroSection } from '@/components/pages/about-hero-section'
import { AboutStorySection } from '@/components/pages/about-story-section'
import { AboutMissionVisionSection } from '@/components/pages/about-mission-vision-section'
import { ValuesSection } from '@/components/pages/values-section'
import { AboutResponsibleTourismSection } from '@/components/pages/about-responsible-tourism-section'
import { AboutCertificationsSection } from '@/components/pages/about-certifications-section'
import { AboutCtaSection } from '@/components/pages/about-cta-section'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/about-us',
  })
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params

  return (
    <>
      <AboutSchema />
      <Header />
      <main className="min-h-screen">
        <AboutHeroSection />
        <AboutStorySection />
        <AboutMissionVisionSection />
        <ValuesSection />
        <AboutResponsibleTourismSection />
        <AboutCertificationsSection />
        <AboutCtaSection />
      </main>
      <Footer />
    </>
  )
}
