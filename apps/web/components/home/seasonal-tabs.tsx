'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { getButtonClassName } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

const seasons = [
  {
    id: 'winter',
    image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'spring',
    image: 'https://images.unsplash.com/photo-1527154713806-7a05e2739aa0?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'summer',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'autumn',
    image: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1600&q=80',
  },
] as const

type SeasonId = (typeof seasons)[number]['id']

export function SeasonalTabs() {
  const [activeSeason, setActiveSeason] = useState<SeasonId>('winter')
  const t = useTranslations('home.seasonal')
  const activeData = seasons.find((s) => s.id === activeSeason)!

  return (
    <section className="bg-[var(--color-background)] py-16 md:py-24" aria-label={t('title')}>
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
            {t('tagline')}
          </span>
          <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
            {t('title')}
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setActiveSeason(season.id)}
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-medium transition-all',
                activeSeason === season.id
                  ? 'bg-[var(--color-secondary)] text-[var(--color-primary-dark)]'
                  : 'bg-[var(--color-primary)]/10 text-[var(--color-text)] hover:bg-[var(--color-primary)]/20'
              )}
              aria-pressed={activeSeason === season.id}
            >
              {t(`${season.id}.title`).replace(/ Tours$/, '')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div key={activeSeason} className="animate-fade-in overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/9] md:aspect-[21/9]">
            <Image
              src={activeData.image}
              alt={t(`${activeSeason}.imageAlt`)}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-dark)]/80 via-[var(--color-primary-dark)]/50 to-transparent" />
            {/* Text Overlay */}
            <div className="absolute inset-0 flex items-center p-6 md:p-12">
              <div className="max-w-lg">
                <h3 className="mb-3 font-serif text-2xl font-bold text-white md:text-3xl">
                  {t(`${activeSeason}.title`)}
                </h3>
                <p className="mb-6 text-white/80 leading-relaxed">
                  {t(`${activeSeason}.description`)}
                </p>
                <Link href="/tours" className={getButtonClassName('secondary', 'lg')}>
                  {t('cta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
