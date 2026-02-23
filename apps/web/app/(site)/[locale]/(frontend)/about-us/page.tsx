import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ValuesSection } from '@/components/pages/values-section'
import { Button } from '@/components/ui/button'
import { Award, Shield, MapPin } from 'lucide-react'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { AboutSchema } from '@/components/seo'

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
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <>
      <AboutSchema />
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-[#1a365d] to-[#0f2440]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="container mx-auto px-4 text-center text-white">
              <h1 className="text-shadow-hero font-serif text-4xl font-bold md:text-5xl lg:text-6xl">
                {t('title')}
              </h1>
              <p className="text-shadow-sm mx-auto mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)]">
                {t('story.title')}
              </h2>
              <div className="mt-6 space-y-4 text-[var(--color-text)]">
                <p>{t('story.paragraph1')}</p>
                <p>{t('story.paragraph2')}</p>
                <blockquote className="border-l-4 border-[var(--color-primary)] pl-4 text-lg italic font-medium text-[var(--color-text)]">
                  {t('story.paragraph3')}
                </blockquote>
                <p>{t('story.paragraph4')}</p>
                <p>{t('story.paragraph5')}</p>
                <p>{t('story.paragraph6')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="bg-[var(--color-background-alt)] py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[var(--color-primary)]">
                  {t('mission.title')}
                </h2>
                <p className="mt-4 text-[var(--color-text)]">
                  {t('mission.description')}
                </p>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-[var(--color-primary)]">
                  {t('vision.title')}
                </h2>
                <p className="mt-4 text-[var(--color-text)]">
                  {t('vision.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <ValuesSection />

        {/* Responsible Tourism Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)]">
                {t('responsibleTourism.title')}
              </h2>
              <div className="mt-6 space-y-4 text-[var(--color-text)]">
                <p>{t('responsibleTourism.paragraph1')}</p>
                <p>{t('responsibleTourism.paragraph2')}</p>
                <p>{t('responsibleTourism.paragraph3')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="bg-[var(--color-background-alt)] py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)]">
                {t('team.title')}
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-[var(--color-text-muted)]">
                {t('team.subtitle')}
              </p>
              <p className="mt-6 text-[var(--color-text)]">
                {t('team.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="bg-[var(--color-primary)] py-16 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-center font-serif text-3xl font-bold text-white">
              {t('certifications.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-white/80">
              {t('certifications.subtitle')}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-12">
              <div className="flex flex-col items-center">
                <Award className="h-12 w-12 text-[var(--color-secondary)]" />
                <span className="mt-2 text-sm">{t('certifications.licensed')}</span>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="h-12 w-12 text-[var(--color-secondary)]" />
                <span className="mt-2 text-sm">{t('certifications.insured')}</span>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="h-12 w-12 text-[var(--color-secondary)]" />
                <span className="mt-2 text-sm">{t('certifications.local')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-xl bg-[var(--color-background-alt)] p-8 text-center">
              <h3 className="font-serif text-2xl font-bold text-[var(--color-primary)]">
                {t('cta.title')}
              </h3>
              <p className="mt-2 text-[var(--color-text-muted)]">{t('cta.description')}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link href="/tours">{t('cta.exploreTours')}</Link>
                </Button>
                <Button variant="outline-dark" asChild>
                  <Link href="/contact">{t('cta.contactUs')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
