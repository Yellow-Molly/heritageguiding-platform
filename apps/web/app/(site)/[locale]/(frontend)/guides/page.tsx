import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GuideListingHero } from '@/components/guide/guide-listing-hero'
import { GuideFilterBar } from '@/components/guide/guide-filter-bar'
import { GuideGridClient } from '@/components/guide/guide-grid-client'
import { GuideCatalogClient } from '@/components/guide/guide-catalog-client'
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

  // [PERF-MEASURE] Temporary instrumentation — removed in Phase 06
  // See plans/260502-0048-instant-filter-feedback/phase-01-measurement.md
  const t0 = performance.now()
  const tG0 = performance.now()
  const guidesP = getGuides({ ...filters, limit: '9' }, locale).then((r) => {
    console.log(`[guides-perf] guides;dur=${(performance.now() - tG0).toFixed(1)}`)
    return r
  })
  const tF0 = performance.now()
  const filterOptionsP = getGuideFilterOptions(locale).then((r) => {
    console.log(`[guides-perf] filterOptions;dur=${(performance.now() - tF0).toFixed(1)}`)
    return r
  })
  const [{ guides, total, totalPages }, filterOptions] = await Promise.all([
    guidesP,
    filterOptionsP,
  ])
  console.log(`[guides-perf] total;dur=${(performance.now() - t0).toFixed(1)} filters=${JSON.stringify(filters)}`)

  return (
    <>
      <GuideListSchema guides={guides} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <GuideListingHero />
        <section className="container mx-auto px-4 py-6 lg:py-8">
          <GuideCatalogClient
            filterBar={
              <GuideFilterBar
                totalGuides={total}
                languages={filterOptions.languages}
                specializations={filterOptions.specializations}
                areas={filterOptions.areas}
              />
            }
            grid={
              <GuideGridClient
                initialGuides={guides}
                totalPages={totalPages}
                locale={locale}
              />
            }
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
