'use client'

import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getButtonClassName } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export function HeroSection() {
  const t = useTranslations('home.hero')

  const scrollToContent = () => {
    const nextSection = document.getElementById('trust-signals')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=2070&q=80"
          alt="Gamla Stan, Stockholm Old Town at sunset with historic buildings reflecting on water"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0b]/80 via-[#252525]/60 to-[#0b0b0b]/80" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        {/* Tagline */}
        <span
          className="mb-4 inline-block animate-fade-in text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary)]"
        >
          {t('tagline')}
        </span>

        {/* Headline */}
        <h1
          className="mb-6 animate-fade-in-up font-serif text-4xl font-bold leading-tight text-white text-shadow-hero md:text-5xl lg:text-6xl xl:text-7xl"
          style={{ animationDelay: '150ms' }}
        >
          {t('title')}
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mb-10 max-w-2xl animate-fade-in-up text-lg text-white/85 md:text-xl"
          style={{ animationDelay: '300ms' }}
        >
          {t('subtitle')}
        </p>

        {/* Single CTA */}
        <div className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <Link href="/tours" className={getButtonClassName('secondary', 'xl')}>
            {t('cta')}
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/70 transition-colors hover:text-white"
        aria-label="Scroll to content"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  )
}
