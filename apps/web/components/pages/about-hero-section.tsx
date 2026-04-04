'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { BLUR_DATA } from '@/lib/image-blur-constants'

/**
 * About page hero with background image, dark overlay, and centered text.
 * Falls back to gradient if hero image is missing.
 */
export function AboutHeroSection() {
  const t = useTranslations('about')

  return (
    <section className="relative h-[300px] overflow-hidden md:h-[450px]">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=1920&q=75"
        alt={t('heroAlt')}
        fill
        priority
        fetchPriority="high"
        placeholder="blur"
        blurDataURL={BLUR_DATA.HERO_GAMLA_STAN}
        className="object-cover"
        sizes="100vw"
      />
      {/* Gradient fallback + dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/87 to-[#0f2440]/87" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[2px] text-[var(--color-secondary)]">
            {t('hero.label')}
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold !text-white md:text-5xl lg:text-[56px]">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 md:text-xl">
            {t('subtitle')}
          </p>
          <div className="mx-auto mt-6 h-[3px] w-[60px] bg-[var(--color-secondary)]" />
        </div>
      </div>
    </section>
  )
}
