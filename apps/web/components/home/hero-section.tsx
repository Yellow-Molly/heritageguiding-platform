'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Star, Shield, Award } from 'lucide-react'
import { getButtonClassName } from '@/components/ui/button'

export function HeroSection() {
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
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=2070&q=80"
          alt="Gamla Stan, Stockholm Old Town at sunset with historic buildings reflecting on water"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          data-parallax="0.3"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)]/70 via-[var(--color-primary)]/50 to-[var(--color-primary-dark)]/80" />
      </div>

      {/* Decorative SVG Elements */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {/* Top right decorative circle */}
        <svg
          className="absolute -right-20 -top-20 h-80 w-80 text-[var(--color-secondary)]/10"
          viewBox="0 0 200 200"
          data-parallax="-0.2"
        >
          <circle cx="100" cy="100" r="80" fill="currentColor" />
        </svg>
        {/* Bottom left decorative shape */}
        <svg
          className="absolute -bottom-10 -left-10 h-60 w-60 text-[var(--color-accent)]/10"
          viewBox="0 0 200 200"
          data-parallax="-0.15"
        >
          <polygon points="100,10 190,190 10,190" fill="currentColor" />
        </svg>
      </div>

      {/* Hero Content */}
      <div className="container relative z-20 mx-auto px-4 py-32 text-center lg:px-8">
        {/* Trust Badge */}
        <div className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
          <span className="text-sm font-medium text-white">
            4.9 Rating | 500+ Tours | Licensed Guides
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mb-6 animate-fade-in-up font-serif text-4xl font-bold leading-tight text-white text-shadow-hero md:text-5xl lg:text-6xl xl:text-7xl"
          style={{ animationDelay: '150ms' }}
        >
          Discover Stockholm&apos;s
          <br />
          <span className="text-[var(--color-secondary)]">Hidden Heritage</span>
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-10 max-w-2xl animate-fade-in-up text-lg text-white/90 md:text-xl"
          style={{ animationDelay: '300ms' }}
        >
          Expert-led tours revealing centuries of Swedish history.
          <br className="hidden sm:block" />
          Experience the stories behind Stockholm&apos;s most treasured landmarks.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex animate-fade-in-up flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: '450ms' }}
        >
          <Link href="/find-tour" className={getButtonClassName('primary', 'xl')}>
            Find Your Tour
          </Link>
          <Link href="/tours" className={getButtonClassName('outline', 'xl')}>
            Explore All Tours
          </Link>
        </div>

        {/* Trust Indicators */}
        <div
          className="mt-16 flex animate-fade-in-up flex-wrap items-center justify-center gap-8"
          style={{ animationDelay: '600ms' }}
        >
          <div className="flex items-center gap-2 text-white/80">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Licensed & Insured</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Award className="h-5 w-5" />
            <span className="text-sm">Award-Winning Guides</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Star className="h-5 w-5" />
            <span className="text-sm">5-Star Reviews</span>
          </div>
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

      {/* Floating Image Elements (like TripFreak) */}
      <div className="pointer-events-none absolute bottom-20 left-8 z-10 hidden lg:block">
        <div
          className="animate-fade-in overflow-hidden rounded-2xl shadow-2xl"
          style={{ animationDelay: '800ms' }}
          data-parallax="-0.1"
        >
          <Image
            src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80"
            alt="Royal Palace Stockholm"
            width={200}
            height={150}
            className="h-[150px] w-[200px] object-cover"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-32 z-10 hidden lg:block">
        <div
          className="animate-fade-in overflow-hidden rounded-2xl shadow-2xl"
          style={{ animationDelay: '1000ms' }}
          data-parallax="-0.15"
        >
          <Image
            src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80"
            alt="Stockholm City Hall"
            width={180}
            height={120}
            className="h-[120px] w-[180px] object-cover"
          />
        </div>
      </div>
    </section>
  )
}
