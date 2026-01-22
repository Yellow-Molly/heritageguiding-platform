import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TourGrid, TourGridSkeleton } from '@/components/tour'
import { TourCatalogClient } from './tour-catalog-client'
import { getTours, type TourFilters } from '@/lib/api/get-tours'
import { getCategories } from '@/lib/api/get-categories'

interface ToursPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<TourFilters>
}

export async function generateMetadata({ params }: ToursPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tours' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ToursPage({ params, searchParams }: ToursPageProps) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations({ locale, namespace: 'tours' })

  // Fetch categories and tour count for FilterBar
  const [categories, { total }] = await Promise.all([
    getCategories('theme', locale),
    getTours(filters),
  ])

  return (
    <>
      <Header />
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
