import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getTourBySlug, getAllTourSlugs } from '@/lib/api/get-tour-by-slug'
import { getTourReviews } from '@/lib/api/get-tour-reviews'
import { TourHero } from '@/components/tour/tour-hero'
import { TourContent } from '@/components/tour/tour-content'
import { TourFacts } from '@/components/tour/tour-facts'
import { LogisticsSection } from '@/components/tour/logistics-section'
import { InclusionsSection } from '@/components/tour/inclusions-section'
import { GuideCard } from '@/components/tour/guide-card'
import { BookingSection } from '@/components/tour/booking-section'
import { ReviewsSection } from '@/components/tour/reviews-section'
import { RelatedTours } from '@/components/tour/related-tours'
import { TourSchema } from '@/components/tour/tour-schema'
import { Breadcrumb } from '@/components/shared/breadcrumb'

interface TourPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

/** Validate slug format - allows lowercase letters, numbers, hyphens */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 100
}

export default async function TourPage({ params }: TourPageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  // Validate slug format to prevent injection attacks
  if (!isValidSlug(slug)) {
    notFound()
  }

  const t = await getTranslations('tourDetail')
  const tour = await getTourBySlug(slug, locale)

  if (!tour) {
    notFound()
  }

  const reviews = await getTourReviews(tour.id)

  const breadcrumbs = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('breadcrumb.tours'), href: '/tours' },
    { label: tour.title, href: `/tours/${tour.slug}` },
  ]

  return (
    <>
      <TourSchema tour={tour} reviews={reviews} />
      <main className="min-h-screen">
        {/* Breadcrumb Navigation */}
        <div className="container py-4">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Hero Section */}
        <TourHero tour={tour} />

        {/* Main Content */}
        <div className="container py-12">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="space-y-12 lg:col-span-2">
              {/* Quick Facts (Mobile) */}
              <div className="lg:hidden">
                <TourFacts tour={tour} />
              </div>

              {/* Tour Content */}
              <TourContent tour={tour} />

              {/* Logistics Section */}
              <LogisticsSection tour={tour} />

              {/* Inclusions Section */}
              <InclusionsSection tour={tour} />

              {/* Guide Card */}
              {tour.guide && <GuideCard guide={tour.guide} />}

              {/* Reviews Section */}
              <ReviewsSection reviews={reviews} />
            </div>

            {/* Right Column - Booking Sidebar */}
            <div className="lg:col-span-1">
              <BookingSection tour={tour} />
            </div>
          </div>
        </div>

        {/* Related Tours */}
        <RelatedTours currentTourId={tour.id} categories={tour.categories} />
      </main>
    </>
  )
}

export async function generateMetadata({ params }: TourPageProps) {
  const { locale, slug } = await params
  const tour = await getTourBySlug(slug, locale)

  if (!tour) {
    return {
      title: 'Tour Not Found',
    }
  }

  return {
    title: tour.title,
    description: tour.description.substring(0, 160),
    openGraph: {
      title: tour.title,
      description: tour.description,
      images: tour.gallery?.[0]?.image?.url
        ? [{ url: tour.gallery[0].image.url, alt: tour.gallery[0].image.alt }]
        : undefined,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  const tours = await getAllTourSlugs()
  const locales = ['sv', 'en', 'de']

  return tours.flatMap(({ slug }) => locales.map((locale) => ({ locale, slug })))
}
