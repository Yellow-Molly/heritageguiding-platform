'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

interface Tour {
  id: string
  title: string
  image: string
  rating: number
  reviewCount: number
  price: number
}

const featuredTours: Tour[] = [
  {
    id: 'gamla-stan-walking',
    title: 'Gamla Stan Walking Tour',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 234,
    price: 495,
  },
  {
    id: 'royal-palace',
    title: 'Royal Palace Experience',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 189,
    price: 695,
  },
  {
    id: 'vasa-museum',
    title: 'Vasa Museum Deep Dive',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
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
        'group min-w-[260px] snap-start overflow-hidden rounded-xl border border-gray-100 bg-white transition-shadow duration-300',
        'shadow-sm hover:shadow-md',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Portrait image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
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
          <span className="text-sm font-bold text-[#d0ad50]">
            From {formatPrice(tour.price)}
          </span>
        </div>

        {/* Read More link */}
        <Link
          href={`/tours/${tour.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#d0ad50] transition-colors hover:underline"
        >
          Read More
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

export function FeaturedTours() {
  return (
    <section className="bg-white py-16 md:py-24" aria-label="Featured tours">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
            Most Popular Tours
          </h2>
          <p className="font-serif text-3xl font-bold text-[#252525] md:text-4xl">
            Discover our most loved Swedish experiences
          </p>
        </div>

        {/* Desktop: 3-col grid | Mobile: horizontal scroll */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {featuredTours.map((tour, index) => (
            <TourCard key={tour.id} tour={tour} index={index} />
          ))}
        </div>

        {/* View All Tours CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#d0ad50] px-8 py-3 font-medium text-[#d0ad50] transition-all hover:bg-[#d0ad50] hover:text-white"
          >
            View All Tours
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
