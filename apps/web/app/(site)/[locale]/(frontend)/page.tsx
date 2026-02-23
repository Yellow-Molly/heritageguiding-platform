import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { TrustSignals } from '@/components/home/trust-signals'
import { FeaturedTours } from '@/components/home/featured-tours'
import { FindTourCta } from '@/components/home/find-tour-cta'
import { WhyChooseUs } from '@/components/home/why-choose-us'
import { Testimonials } from '@/components/home/testimonials'
import { CategoryNav } from '@/components/home/category-nav'
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
 * Renders all homepage sections with structured data.
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
        <FeaturedTours />
        <FindTourCta />
        <CategoryNav />
        <WhyChooseUs />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}
