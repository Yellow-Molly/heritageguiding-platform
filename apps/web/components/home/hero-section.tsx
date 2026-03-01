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
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=2070&q=80"
          alt={t('imageAlt')}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 py-32 text-center lg:px-8">
        {/* Script Label */}
        <span
          className="mb-4 block animate-fade-in font-[family-name:var(--font-allura)] text-2xl text-[var(--color-secondary)] md:text-3xl"
        >
          {t('scriptLabel')}
        </span>

        {/* Headline */}
        <h1
          className="mb-6 animate-fade-in-up font-serif text-4xl font-bold leading-tight text-white text-shadow-hero md:text-6xl"
          style={{ animationDelay: '150ms' }}
        >
          {t('title')}
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mb-10 max-w-2xl animate-fade-in-up text-lg text-white/90 md:text-xl"
          style={{ animationDelay: '300ms' }}
        >
          {t('subtitle')}
        </p>

        {/* Single CTA */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '450ms' }}
        >
          <Link href="/tours" className={getButtonClassName('primary', 'xl')}>
            {t('cta')}
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce text-white/70 transition-colors hover:text-white"
        aria-label="Scroll to content"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  )
}
