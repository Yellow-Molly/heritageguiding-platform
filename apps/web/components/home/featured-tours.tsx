'use client'

import Image from 'next/image'
import { Star, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'
import { getButtonClassName } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

interface Tour {
  id: string
  title: string
  description: string
  image: string
  category: string
  rating: number
  reviewCount: number
  price: number
}

const featuredTours: Tour[] = [
  {
    id: 'gamla-stan-walking',
    title: 'Gamla Stan Walking Tour',
    description: 'Explore the medieval streets of Old Town, discover hidden courtyards, and hear tales of Swedish royalty.',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    category: 'Walking',
    rating: 4.9,
    reviewCount: 234,
    price: 495,
  },
  {
    id: 'royal-palace',
    title: 'Royal Palace Experience',
    description: "Step inside one of Europe's largest palaces and uncover 500 years of Swedish monarchy history.",
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    category: 'Culture',
    rating: 4.8,
    reviewCount: 189,
    price: 695,
  },
  {
    id: 'vasa-museum',
    title: 'Vasa Museum Deep Dive',
    description: "Marvel at the world's only preserved 17th-century ship and learn about its dramatic story.",
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    category: 'Museum',
    rating: 4.9,
    reviewCount: 312,
    price: 545,
  },
]

function TourCard({ tour, fromLabel }: { tour: Tour; fromLabel: string }) {
  return (
    <Link
      href={`/tours/${tour.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Category Badge */}
        <div className="absolute left-3 top-3 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
          {tour.category}
        </div>
        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-sm">
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {fromLabel} {formatPrice(tour.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Rating */}
        <div className="mb-2 flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
          <span className="text-sm font-medium">{tour.rating}</span>
          <span className="text-sm text-[var(--color-text-muted)]">({tour.reviewCount})</span>
        </div>
        {/* Title */}
        <h3 className="mb-1.5 font-serif text-lg font-semibold text-[var(--color-primary)]">
          {tour.title}
        </h3>
        {/* Description */}
        <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">{tour.description}</p>
      </div>
    </Link>
  )
}

export function FeaturedTours() {
  const t = useTranslations('home.featured')
  const tTours = useTranslations('tours')

  return (
    <section className="bg-[var(--color-background)] py-20 md:py-28" aria-label={t('title')}>
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
            {t('tagline')}
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            {t('subtitle')}
          </p>
        </div>

        {/* Tours Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} fromLabel={tTours('from')} />
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
