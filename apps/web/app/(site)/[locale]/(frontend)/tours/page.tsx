import type { Metadata } from 'next'
import { after } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TourGridLayout } from '@/components/tour'
import { TourEmptyState } from '@/components/tour/tour-empty-state'
import { TourCatalogClient } from './tour-catalog-client'
import { getTours, type TourFilters } from '@/lib/api/get-tours'
import { getCategories } from '@/lib/api/get-categories'
import { getCities } from '@/lib/api/get-cities'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { TourListSchema } from '@/components/seo'

interface ToursPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<TourFilters>
}

export async function generateMetadata({ params }: ToursPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tours' })

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/tours',
  })
}

export default async function ToursPage({ params, searchParams }: ToursPageProps) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations({ locale, namespace: 'tours' })

  // [PERF-MEASURE] Temporary instrumentation — removed in Phase 06.
  // Logs deferred via `after()` so they fire post-response-stream and survive
  // Vercel's serverless log aggregation (see plans/260502-2215-perf-measurement-fix/).
  const t0 = performance.now()
  const tCat0 = performance.now()
  const categoriesP = getCategories('theme', locale).then((r) => {
    const dur = performance.now() - tCat0
    after(() => console.log(`[tours-perf] categories;dur=${dur.toFixed(1)}`))
    return r
  })
  const tCity0 = performance.now()
  const citiesP = getCities(locale).then((r) => {
    const dur = performance.now() - tCity0
    after(() => console.log(`[tours-perf] cities;dur=${dur.toFixed(1)}`))
    return r
  })
  const tTours0 = performance.now()
  const toursP = getTours(filters, locale).then((r) => {
    const dur = performance.now() - tTours0
    after(() => console.log(`[tours-perf] tours;dur=${dur.toFixed(1)}`))
    return r
  })
  const [categories, cities, { tours, total, totalPages }] = await Promise.all([
    categoriesP,
    citiesP,
    toursP,
  ])
  const totalDur = performance.now() - t0
  after(() => console.log(`[tours-perf] total;dur=${totalDur.toFixed(1)} filters=${JSON.stringify(filters)}`))

  return (
    <>
      <TourListSchema tours={tours} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <TourCatalogClient
          categories={categories}
          cities={cities}
          totalResults={total}
        >
          {tours.length === 0 ? (
            <TourEmptyState />
          ) : (
            <TourGridLayout
              initialTours={tours}
              totalPages={totalPages}
              filters={filters}
              locale={locale}
            />
          )}
        </TourCatalogClient>
      </main>
      <Footer />
    </>
  )
}
