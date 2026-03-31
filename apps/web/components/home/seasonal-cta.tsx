'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

const FALLBACK_WINTER = 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&w=600&q=80'
const FALLBACK_SUMMER = 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=600&q=80'

interface SeasonalCtaProps {
  tourImages?: { winter?: string; summer?: string }
}

/**
 * SeasonalCta — full-width gold gradient band promoting seasonal tours.
 * Uses real CMS tour images with Unsplash fallbacks.
 */
export function SeasonalCta({ tourImages }: SeasonalCtaProps) {
  const t = useTranslations('home.seasonal')
  const seasons = [
    {
      label: t('winter'),
      image: tourImages?.winter || FALLBACK_WINTER,
      href: '/tours?season=winter',
    },
    {
      label: t('summer'),
      image: tourImages?.summer || FALLBACK_SUMMER,
      href: '/tours?season=summer',
    },
  ]
  return (
    <section
      className="bg-gradient-to-r from-[#d0ad50] to-[#DBC078] py-16 md:py-24"
      aria-label="Seasonal tours"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
          {/* Left text */}
          <div className="text-center md:max-w-md md:text-left">
            <h2 className="mb-4 font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {t('title')}
            </h2>
            <p className="text-white/80">
              {t('subtitle')}
            </p>
          </div>

          {/* Season cards */}
          <div className="flex gap-6">
            {seasons.map((season) => (
              <div
                key={season.label}
                className="group w-44 overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm md:w-52"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={season.image}
                    alt={season.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="208px"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="mb-2 text-sm font-semibold text-white">{season.label}</h3>
                  <Link
                    href={season.href}
                    className="inline-block rounded-full bg-white px-5 py-2 text-xs font-medium text-[#d0ad50] transition-colors hover:bg-white/90"
                  >
                    {t('bookNow')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
