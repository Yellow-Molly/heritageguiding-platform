import { notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { setRequestLocale } from 'next-intl/server'
import { getTourBySlug } from '@/lib/api/get-tour-by-slug'
import { getTourReviews } from '@/lib/api/get-tour-reviews'
import { TourHero } from '@/components/tour/tour-hero'
import { TourTitleSection } from '@/components/tour/tour-title-section'
import { TourMobilePriceBar } from '@/components/tour/tour-mobile-price-bar'
import { TourHighlightsSection } from '@/components/tour/tour-highlights-section'
import { TourContent } from '@/components/tour/tour-content'
import { InclusionsSection } from '@/components/tour/inclusions-section'
import { LogisticsSection } from '@/components/tour/logistics-section'
// MVP-HIDE: re-enable after MVP launch
// import { GuidesSection } from '@/components/tour/guides-section'
import { RelatedTours } from '@/components/tour/related-tours'
import { TourSchema } from '@/components/tour/tour-schema'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'

// Lazy-load booking sidebar (includes Bokun widget + group inquiry modal)
const BookingSection = nextDynamic(
  () => import('@/components/tour/booking-section').then((mod) => ({ default: mod.BookingSection })),
  { loading: () => <div className="h-[400px] animate-pulse rounded-2xl bg-[var(--color-surface)]" role="status" aria-label="Loading booking" /> }
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
      {/* Warm TLS handshake to Bokun origins. Tour-detail is the only route
          that embeds the booking widget, so per-route preconnect avoids
          wasting handshakes on bouncers from other routes. Global
          dns-prefetch in [locale]/layout.tsx stays as a safety net. */}
      <link rel="preconnect" href="https://widgets.bokun.io" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://static.bokun.io" crossOrigin="anonymous" />
      <TourSchema tour={tour} reviews={reviews} />
      <Header variant="solid" />
      <main className="min-h-screen pt-20">
        {/* Image Grid */}
        <TourHero tour={tour} />

        {/* Title Section */}
        <TourTitleSection tour={tour} />

        {/* Sticky Mobile Price Bar — sticks below header on scroll, hidden on desktop */}
        <TourMobilePriceBar tour={tour} />

        {/* Body: Main Content + Sidebar */}
        <div className="mt-8 border-t border-[var(--color-border)] px-5 pt-8 lg:px-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            {/* Main Content Column */}
            <div className="space-y-10">
              <TourHighlightsSection highlights={tour.highlights} />
              <TourContent tour={tour} />
              <InclusionsSection tour={tour} />
              <LogisticsSection tour={tour} />
              {/* MVP-HIDE: Guides section temporarily hidden for launch — re-enable after MVP */}
              {/* {tour.guides.length > 0 && <GuidesSection guides={tour.guides} />} */}
            </div>

            {/* Booking Sidebar — sticky on desktop, stacks below content on mobile */}
            <div id="booking" className="scroll-mt-24">
              <BookingSection tour={tour} />
            </div>
          </div>
        </div>

        {/* Related Tours */}
        <RelatedTours currentTourId={tour.id} categories={tour.categories} locale={locale} />
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
