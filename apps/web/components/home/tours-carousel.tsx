'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getButtonClassName } from '@/components/ui/button'
import { TourCard, type TourCardData } from './tour-card'

const featuredTours: TourCardData[] = [
  {
    id: 'gamla-stan-walking',
    title: 'Gamla Stan Walking Tour',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    duration: 120,
    maxCapacity: 15,
    rating: 4.9,
    reviewCount: 234,
    price: 495,
  },
  {
    id: 'royal-palace',
    title: 'Royal Palace Experience',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    duration: 150,
    maxCapacity: 12,
    rating: 4.8,
    reviewCount: 189,
    price: 695,
  },
  {
    id: 'vasa-museum',
    title: 'Vasa Museum Deep Dive',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    duration: 90,
    maxCapacity: 20,
    rating: 4.9,
    reviewCount: 312,
    price: 545,
  },
]

export function ToursCarousel() {
  const t = useTranslations('home.featured')
  const sectionRef = useRef<HTMLElement>(null)
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-background)] py-20 md:py-28"
      aria-label="Featured tours"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div
          className={`mb-12 text-center md:mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {t('label')}
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            {t('subtitle')}
          </p>
        </div>

        {/* Carousel / Grid */}
        <div
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4
            lg:grid lg:grid-cols-3 lg:overflow-visible"
        >
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center md:mt-16">
          <Link href="/tours" className={getButtonClassName('outline-dark', 'lg')}>
            {t('viewAll')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
