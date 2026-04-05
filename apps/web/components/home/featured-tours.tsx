'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Clock, Users, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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
        'group block overflow-hidden rounded-xl border border-gray-100 bg-white',
        'shadow-sm transition-all duration-500 hover:shadow-md',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Landscape image */}
      <div className="relative h-[220px] overflow-hidden md:h-[320px]">
        <Image
          src={tour.image.url}
          alt={tour.image.alt}
          fill
          placeholder={tour.image.blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={tour.image.blurDataUrl}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4 md:gap-3 md:p-6">
        <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)] md:text-[22px]">
          {tour.title}
        </h3>

        {tour.description && (
          <p className="line-clamp-2 text-[13px] leading-[1.5] text-[#6B7280] md:text-sm md:leading-[1.6]">
            {tour.description}
          </p>
        )}

        {/* Meta row — duration + group size */}
        <div className="flex items-center gap-4 text-[13px] text-[#6B7280]">
          {tour.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {tour.duration}h
            </span>
          )}
          {tour.maxCapacity > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {t('upTo')} {tour.maxCapacity}
            </span>
          )}
        </div>

        {/* VIEW TOUR CTA */}
        <span className="inline-flex items-center gap-1 text-[13px] font-bold uppercase tracking-[1px] text-[var(--color-accent)] transition-colors group-hover:underline">
          {t('viewTour')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

export function FeaturedTours({ tours }: FeaturedToursProps) {
  const t = useTranslations('home.featured')
  if (tours.length === 0) return null

  return (
    <section
      className="bg-[var(--color-background)] px-4 py-10 md:px-20 md:py-20"
      aria-label="Featured tours"
    >
      {/* Section header — left-aligned with tag */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 md:mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--color-secondary)] md:text-[11px]">
            {t('tag')}
          </span>
          <h2 className="mt-2 font-serif text-[28px] font-bold text-[var(--color-primary)] md:text-[42px]">
            {t('subtitle')}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280] md:text-[15px]">
            {t('title')}
          </p>
        </div>

        {/* 3-col desktop grid, 1-col mobile (vertical stack) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tours.map((tour, index) => (
            <TourCard key={tour.id} tour={tour} index={index} />
          ))}
        </div>

        {/* View All Tours CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-secondary)] px-8 py-3 font-medium text-[var(--color-secondary)] transition-all hover:bg-[var(--color-secondary)] hover:text-white"
          >
            {t('viewAll')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
