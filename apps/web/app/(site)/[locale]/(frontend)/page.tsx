import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { TrustSignals } from '@/components/home/trust-signals'
import { VideoHighlight } from '@/components/home/video-highlight'
import { FeaturedTours } from '@/components/home/featured-tours'
import { GuidesPreview } from '@/components/home/guides-preview'
import { TravelAgencySchema } from '@/components/seo'
import { getFeaturedTours } from '@/lib/api/get-featured-tours'
import { getCachedGuides } from '@/lib/api/get-guides'

/**
 * Generate SEO metadata for homepage
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      images: [
        {
          url: '/images/og-homepage.jpg',
          width: 1200,
          height: 630,
          alt: 'Private Tours - Expert Stockholm Tours',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  }
}

/**
 * Homepage - Server Component for optimal SEO and performance.
 * Section order: Hero → TrustSignals → Tours → Guides → Video → Footer
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [allFeaturedTours, guidesResponse] = await Promise.all([
    getFeaturedTours(locale, 3),
    getCachedGuides({ limit: '4' }, locale),
  ])

  // Filter out tours with missing images (CMS can return empty url)
  const featuredTours = allFeaturedTours.filter((t) => t.image.url)

  return (
    <>
      {/* Schema.org structured data for SEO */}
      <TravelAgencySchema />

      <Header />
      <main>
        <HeroSection />
        <TrustSignals guideCount={guidesResponse.total} />
        <FeaturedTours tours={featuredTours} />
        <GuidesPreview guides={guidesResponse.guides} />
        <VideoHighlight />
      </main>
      {/* Gold separator line (decorative) */}
      <div
        className="h-[3px] w-full bg-[var(--color-secondary-light)] md:h-1"
        aria-hidden="true"
      />
      <Footer />
    </>
  )
}
