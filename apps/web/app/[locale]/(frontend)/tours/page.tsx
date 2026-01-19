import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TourGrid, TourGridSkeleton } from '@/components/tour'
import { TourCatalogClient } from './tour-catalog-client'
import type { TourFilters } from '@/lib/api/get-tours'

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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* Hero Section */}
        <section className="bg-[var(--color-primary)] py-12 text-white md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              {t('description')}
            </p>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="container mx-auto px-4 py-8 lg:py-12">
          <TourCatalogClient>
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
