import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TourGrid, TourGridSkeleton } from '@/components/tour'
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

  // Fetch categories and tours for FilterBar + schema
  const [categories, { tours, total }] = await Promise.all([
    getCategories('theme', locale),
    getTours(filters),
  ])

  return (
    <>
      <TourListSchema tours={tours} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        {/* Catalog Section */}
        <section className="container mx-auto px-4 py-6 lg:py-8">
          <TourCatalogClient categories={categories} totalResults={total}>
            <Suspense fallback={<TourGridSkeleton />}>
              <TourGrid searchParams={filters} />
            </Suspense>
          </TourCatalogClient>
        </section>
      </main>
      <Footer />
    </>
  )
}
