import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { TrustSignals } from '@/components/home/trust-signals'
import { VideoHighlight } from '@/components/home/video-highlight'
import { FeaturedTours } from '@/components/home/featured-tours'
import { SeasonalCta } from '@/components/home/seasonal-cta'
import { GuidesPreview } from '@/components/home/guides-preview'
import { Testimonials } from '@/components/home/testimonials'
import { LatestPosts } from '@/components/home/latest-posts'
import { TravelAgencySchema } from '@/components/seo'

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
 * Section order: Hero → TrustSignals → Video → Tours → SeasonalCta → Guides → Testimonials → Blog → Footer
 */
export default async function HomePage() {
  return (
    <>
      {/* Schema.org structured data for SEO */}
      <TravelAgencySchema />

      <Header />
      <main>
        <HeroSection />
        <TrustSignals />
        <VideoHighlight />
        <FeaturedTours />
        <SeasonalCta />
        <GuidesPreview />
        <Testimonials />
        <LatestPosts />
      </main>
      <Footer />
    </>
  )
}
