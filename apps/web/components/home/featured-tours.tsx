'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Users, Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, formatPrice } from '@/lib/utils'
import { getButtonClassName } from '@/components/ui/button'

interface Tour {
  id: string
  title: string
  description: string
  image: string
  duration: number
  maxCapacity: number
  rating: number
  reviewCount: number
  price: number
  featured?: boolean
}

const featuredTours: Tour[] = [
  {
    id: 'gamla-stan-walking',
    title: 'Gamla Stan Walking Tour',
    description:
      'Explore the medieval streets of Old Town, discover hidden courtyards, and hear tales of Swedish royalty.',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?q=80&w=800',
    duration: 120,
    maxCapacity: 15,
    rating: 4.9,
    reviewCount: 234,
    price: 495,
    featured: true,
  },
  {
    id: 'royal-palace',
    title: 'Royal Palace Experience',
    description:
      'Step inside one of Europe\'s largest palaces and uncover 500 years of Swedish monarchy history.',
    image: 'https://images.unsplash.com/photo-1570654639102-bdd95efeca90?q=80&w=800',
    duration: 150,
    maxCapacity: 12,
    rating: 4.8,
    reviewCount: 189,
    price: 695,
  },
  {
    id: 'vasa-museum',
    title: 'Vasa Museum Deep Dive',
    description:
      'Marvel at the world\'s only preserved 17th-century ship and learn about its dramatic story.',
    image: 'https://images.unsplash.com/photo-1583269460323-1c9e5caa0ed4?q=80&w=800',
    duration: 90,
    maxCapacity: 20,
    rating: 4.9,
    reviewCount: 312,
    price: 545,
  },
]

function TourCard({ tour, index }: { tour: Tour; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
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
    <div
      ref={cardRef}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300',
        'hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.02]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Featured Badge */}
        {tour.featured && (
          <div className="absolute left-4 top-4 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
            Featured
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4 rounded-lg bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <span className="text-sm font-bold text-[var(--color-primary)]">
            From {formatPrice(tour.price)}
          </span>
        </div>

        {/* Quick Info Overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{formatDuration(tour.duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Max {tour.maxCapacity}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Rating */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
            <span className="font-medium text-[var(--color-text)]">{tour.rating}</span>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">({tour.reviewCount} reviews)</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-serif text-xl font-semibold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">
          {tour.title}
        </h3>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-[var(--color-text-muted)]">{tour.description}</p>

        {/* CTA */}
        <Link
          href={`/tours/${tour.id}`}
          className="inline-flex items-center gap-2 font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-dark)]"
        >
          View Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

export function FeaturedTours() {
  return (
    <section className="bg-[var(--color-background)] py-20 md:py-28" aria-label="Featured tours">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Popular Experiences
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            Featured Tours
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            Discover our most beloved heritage experiences, carefully crafted to reveal
            Stockholm&apos;s rich history and culture.
          </p>
        </div>

        {/* Tours Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredTours.map((tour, index) => (
            <TourCard key={tour.id} tour={tour} index={index} />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center md:mt-16">
          <Link href="/tours" className={getButtonClassName('outline-dark', 'lg')}>
            View All Tours
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
