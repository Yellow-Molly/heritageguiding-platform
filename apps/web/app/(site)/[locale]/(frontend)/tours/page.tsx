import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TourGridLayout } from '@/components/tour'
import { TourEmptyState } from '@/components/tour/tour-empty-state'
import { TourCatalogClient } from './tour-catalog-client'
import { getTours, type TourFilters } from '@/lib/api/get-tours'
import { getCategories } from '@/lib/api/get-categories'
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

  // Single fetch for categories + tours (no double fetch)
  const [categories, { tours, total, totalPages }] = await Promise.all([
    getCategories('theme', locale),
    getTours(filters, locale),
  ])

  return (
    <>
      <TourListSchema tours={tours} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <TourCatalogClient categories={categories} totalResults={total}>
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
