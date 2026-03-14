'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

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
      {/* Background Image */}
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
        {/* Subtle gradient — bottom-heavy for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>

      {/* Hero Content — centered, minimal */}
      <div className="container relative z-20 mx-auto px-4 text-center lg:px-8">
        {/* Single CTA — outline white */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <Link
            href="/tours"
            className="inline-block rounded-full border-2 border-white px-8 py-3 text-lg font-medium text-white transition-all hover:bg-white hover:text-[#252525]"
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
