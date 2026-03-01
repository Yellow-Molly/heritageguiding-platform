'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

type Season = 'winter' | 'spring' | 'summer' | 'autumn'

const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn']

const seasonImages: Record<Season, string> = {
  winter: 'https://images.unsplash.com/photo-1548783300-70b41bc89e32?auto=format&fit=crop&w=800&q=80',
  spring: 'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80',
  summer: 'https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=800&q=80',
  autumn: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
}

/** Returns current season based on month */
function getCurrentSeason(): Season {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function SeasonalTabs() {
  const t = useTranslations('home.seasons')
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [activeSeason, setActiveSeason] = useState<Season>(getCurrentSeason)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-background-alt)] py-20"
      aria-label="Seasonal experiences"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div
          className={`mb-10 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {t('label')}
          </span>
          <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
        </div>

        {/* Tab Bar */}
        <div role="tablist" className="mb-8 flex justify-center gap-2 overflow-x-auto border-b border-[var(--color-border)]">
          {SEASONS.map((season) => (
            <button
              key={season}
              role="tab"
              aria-selected={activeSeason === season}
              aria-controls={`season-panel-${season}`}
              id={`season-tab-${season}`}
              onClick={() => setActiveSeason(season)}
              className={`whitespace-nowrap px-6 py-3 text-sm font-medium transition-all md:text-base ${
                activeSeason === season
                  ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)] font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {t(`${season}.tab`)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          id={`season-panel-${activeSeason}`}
          aria-labelledby={`season-tab-${activeSeason}`}
          className="grid gap-8 lg:grid-cols-2 lg:items-center"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src={seasonImages[activeSeason]}
              alt={t(`${activeSeason}.imageAlt`)}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center">
            <h3 className="mb-4 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
              {t(`${activeSeason}.title`)}
            </h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              {t(`${activeSeason}.description`)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
