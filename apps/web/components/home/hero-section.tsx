'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BLUR_DATA } from '@/lib/image-blur-constants'

export function HeroSection() {
  const t = useTranslations()
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return
      const scrollY = window.scrollY
      const parallaxElements = heroRef.current.querySelectorAll('[data-parallax]')

      parallaxElements.forEach((el) => {
        const speed = parseFloat((el as HTMLElement).dataset.parallax || '0.5')
        ;(el as HTMLElement).style.transform = `translateY(${scrollY * speed}px)`
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToContent = () => {
    const nextSection = document.getElementById('trust-signals')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background Image — explicit width/height so Lighthouse classifies as LCP candidate.
          object-cover fills the wrapper visually regardless of intrinsic ratio.
          Source is a CMS Media file served from Vercel Blob via /api/media/file/<name>
          (env-portable: resolves to each environment's own Blob once uploaded there). */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/api/media/file/boats-in-front-of-stockholm.jpg"
          alt="Boats moored on the waterfront in front of Stockholm, Sweden"
          width={1600}
          height={900}
          priority
          fetchPriority="high"
          placeholder="blur"
          blurDataURL={BLUR_DATA.HERO_STOCKHOLM_BOATS}
          className="h-full w-full object-cover"
          sizes="100vw"
          quality={75}
          data-parallax="0.3"
        />
        {/* Subtle gradient — bottom-heavy for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Hero Content — centered, minimal */}
      <div className="container relative z-20 mx-auto px-4 text-center lg:px-8">
        {/* Single CTA — solid accent pill, matching the primary "Book Now" button
            (bg-[var(--color-accent)] + white text). The white-on-accent contrast
            (~4.7:1) is self-contained, so the button stays WCAG AA readable over ANY
            hero image, independent of the background scrim (which is transparent at
            this vertical center). White focus ring keeps keyboard focus visible on the
            accent fill, where an accent-colored ring would blend into the button. */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <Link
            href="/tours"
            className="inline-block rounded-full bg-[var(--color-accent)] px-8 py-3 text-lg font-medium text-white shadow-lg transition-all hover:bg-[var(--color-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-accent)]"
          >
            {t('home.hero.cta')}
          </Link>
        </div>
      </div>

      {/* Scroll Indicator — minimal chevron */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce text-white/70 transition-colors hover:text-white motion-reduce:animate-none"
        aria-label="Scroll to content"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  )
}
