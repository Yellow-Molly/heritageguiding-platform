import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { TrustSignals } from '@/components/home/trust-signals'
import { FeaturedTours } from '@/components/home/featured-tours'
import { FindTourCta } from '@/components/home/find-tour-cta'
import { WhyChooseUs } from '@/components/home/why-choose-us'
import { Testimonials } from '@/components/home/testimonials'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustSignals />
        <FeaturedTours />
        <FindTourCta />
        <WhyChooseUs />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}
