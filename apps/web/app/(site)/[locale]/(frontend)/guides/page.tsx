import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GuideListingHero } from '@/components/guide/guide-listing-hero'
import { GuideFilterBar } from '@/components/guide/guide-filter-bar'
import { GuideGridClient } from '@/components/guide/guide-grid-client'
import { getGuides, getGuideFilterOptions, type GuideFilters } from '@/lib/api/get-guides'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { GuideListSchema } from '@/components/seo'

interface GuidesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<GuideFilters>
}

export async function generateMetadata({ params }: GuidesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'guides' })
  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/guides',
  })
}

export default async function GuidesPage({ params, searchParams }: GuidesPageProps) {
  const { locale } = await params
  const filters = await searchParams

  const [{ guides, total, totalPages }, filterOptions] = await Promise.all([
    getGuides({ ...filters, limit: '9' }, locale),
    getGuideFilterOptions(locale),
  ])

  return (
    <>
      <GuideListSchema guides={guides} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <GuideListingHero />
        <section className="container mx-auto px-4 py-6 lg:py-8">
          <GuideFilterBar
            totalGuides={total}
            languages={filterOptions.languages}
            specializations={filterOptions.specializations}
            areas={filterOptions.areas}
          />
          <div className="mt-6">
            <GuideGridClient
              initialGuides={guides}
              totalPages={totalPages}
              locale={locale}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
