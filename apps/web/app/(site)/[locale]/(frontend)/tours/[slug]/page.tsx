import { notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { setRequestLocale } from 'next-intl/server'
import { getTourBySlug } from '@/lib/api/get-tour-by-slug'
import { getTourReviews } from '@/lib/api/get-tour-reviews'
import { TourHero } from '@/components/tour/tour-hero'
import { TourContent } from '@/components/tour/tour-content'
import { TourFacts } from '@/components/tour/tour-facts'
import { LogisticsSection } from '@/components/tour/logistics-section'
import { InclusionsSection } from '@/components/tour/inclusions-section'
import { GuideCard } from '@/components/tour/guide-card'
import { ReviewsSection } from '@/components/tour/reviews-section'
import { RelatedTours } from '@/components/tour/related-tours'
import { TourSchema } from '@/components/tour/tour-schema'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'

// Lazy-load booking sidebar (includes Bokun widget + group inquiry modal)
const BookingSection = nextDynamic(
  () => import('@/components/tour/booking-section').then((mod) => ({ default: mod.BookingSection })),
  { loading: () => <div className="h-[400px] animate-pulse rounded-lg bg-[var(--color-surface)]" role="status" aria-label="Loading booking" /> }
)

// Force dynamic rendering — tour data comes from Payload CMS database
export const dynamic = 'force-dynamic'

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

  const tour = await getTourBySlug(slug, locale)

  if (!tour) {
    notFound()
  }

  const reviews = await getTourReviews(tour.id)

  return (
    <>
      <TourSchema tour={tour} reviews={reviews} />
      <Header variant="solid" />
      <main className="min-h-screen pt-20">
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
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: TourPageProps) {
  const { locale, slug } = await params

  if (!isValidSlug(slug)) {
    return { title: 'Tour Not Found' }
  }

  const tour = await getTourBySlug(slug, locale)

  if (!tour) {
    return { title: 'Tour Not Found' }
  }

  return generatePageMetadata({
    title: tour.title,
    description: (tour.description || '').substring(0, 160),
    locale: locale as Locale,
    pathname: `/tours/${tour.slug}`,
    ogImage: tour.gallery?.[0]?.image?.url,
  })
}

