'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

interface FeaturedToursProps {
  tours: FeaturedTour[]
}

function TourCard({ tour, index }: { tour: FeaturedTour; index: number }) {
  const t = useTranslations('home.featured')
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <Link
      ref={cardRef}
      href={`/tours/${tour.slug}`}
      className={cn(
        'group block min-w-[260px] snap-start overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow duration-300',
        'shadow-sm hover:shadow-md',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Portrait image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={tour.image.url}
          alt={tour.image.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Card info — clean, below image */}
      <div className="p-5">
        <h3 className="mb-2 font-serif text-lg font-semibold text-[#252525]">
          {tour.title}
        </h3>

        {/* Rating + Price row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[#DBC078] text-[#DBC078]" />
            <span className="text-sm font-medium text-[#252525]">{tour.rating}</span>
            <span className="text-xs text-[#3e3e3e]">({tour.reviewCount})</span>
          </div>
          {tour.price > 0 && (
            <span className="text-sm font-bold text-[#d0ad50]">
              {t('from')} {formatPrice(tour.price)}
            </span>
          )}
        </div>

        {/* Read More indicator */}
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#d0ad50] transition-colors group-hover:underline">
          {t('readMore')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

export function FeaturedTours({ tours }: FeaturedToursProps) {
  const t = useTranslations('home.featured')
  if (tours.length === 0) return null

  return (
    <section className="bg-white py-16 md:py-24" aria-label="Featured tours">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
            {t('title')}
          </h2>
          <p className="font-serif text-3xl font-bold text-[#252525] md:text-4xl">
            {t('subtitle')}
          </p>
        </div>

        {/* Desktop: 3-col grid | Mobile: horizontal scroll */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {tours.map((tour, index) => (
            <TourCard key={tour.id} tour={tour} index={index} />
          ))}
        </div>

        {/* View All Tours CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#d0ad50] px-8 py-3 font-medium text-[#d0ad50] transition-all hover:bg-[#d0ad50] hover:text-white"
          >
            {t('viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
