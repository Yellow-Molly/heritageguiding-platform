'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BLUR_DATA } from '@/lib/image-blur-constants'

export function HeroSection() {
  const t = useTranslations()
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    /* Trigger fade-in on mount (hero is above the fold) */
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const animateClass = reducedMotion
    ? 'opacity-100'
    : isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 -translate-x-5'

  const imageAnimateClass = reducedMotion
    ? 'opacity-100'
    : isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-5'

  return (
    <section
      className="relative flex flex-col md:flex-row h-[480px] md:h-[620px] overflow-hidden"
      aria-label="Hero section"
    >
      {/* Desktop: Navy left panel */}
      <div
        className={`hidden md:flex md:w-[640px] shrink-0 flex-col justify-center gap-6 bg-[var(--color-primary)] px-20 py-20 transition-all duration-700 ease-out ${animateClass}`}
      >
        {/* Tag pill */}
        <span className="w-fit border border-[var(--color-secondary-light)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[2px] text-[var(--color-secondary-light)]">
          {t('home.hero.tag')}
        </span>

        <h1 className="font-serif text-[56px] font-bold leading-[1.1] text-white">
          {t('home.hero.title')}
        </h1>

        <p className="text-[17px] leading-[1.6] text-white/70">
          {t('home.hero.subtitle')}
        </p>

        <Link
          href="/tours"
          className="mt-2 w-fit bg-[var(--color-accent)] px-10 py-4 text-[14px] font-bold uppercase tracking-[1.5px] text-white transition-opacity hover:opacity-90"
        >
          {t('home.hero.cta')}
        </Link>
      </div>

      {/* Right image panel (desktop) / Full-bleed background (mobile) */}
      <div
        className={`relative flex-1 h-full transition-all duration-700 ease-out delay-200 ${imageAnimateClass}`}
      >
        <Image
          src="https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=1920&q=75"
          alt="Gamla Stan, Stockholm Old Town at sunset with historic buildings reflecting on water"
          fill
          priority
          fetchPriority="high"
          placeholder="blur"
          blurDataURL={BLUR_DATA.HERO_GAMLA_STAN}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 60vw"
        />
      </div>

      {/* Mobile: Gradient overlay + bottom-aligned content */}
      <div className="absolute inset-0 md:hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A5FE6] via-[#1E3A5F80] to-[#1E3A5F40]" />

        {/* Content at bottom */}
        <div
          className={`absolute inset-0 flex flex-col justify-end gap-4 px-5 pb-12 transition-all duration-700 ease-out ${animateClass}`}
        >
          <span className="w-fit border border-[var(--color-secondary-light)] px-3 py-1 text-[9px] font-bold uppercase tracking-[2px] text-[var(--color-secondary-light)]">
            {t('home.hero.tag')}
          </span>

          <h1 className="font-serif text-[38px] font-bold leading-[1.1] text-white">
            {t('home.hero.title')}
          </h1>

          <p className="text-[14px] leading-[1.5] text-white/70">
            {t('home.hero.subtitle')}
          </p>

          <Link
            href="/tours"
            className="mt-1 w-fit bg-[var(--color-accent)] px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1px] text-white transition-opacity hover:opacity-90"
          >
            {t('home.hero.cta')}
          </Link>
        </div>
      </div>
    </section>
  )
}
