'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getButtonClassName } from '@/components/ui/button'
import { formatDuration, formatPrice } from '@/lib/utils'

export interface TourCardData {
  id: string
  title: string
  image: string
  duration: number
  maxCapacity: number
  rating: number
  reviewCount: number
  price: number
}

export function TourCard({ tour }: { tour: TourCardData }) {
  const t = useTranslations('home.featured')

  return (
    <div
      className="min-w-[280px] w-[85vw] md:w-[45vw] lg:w-auto lg:min-w-0 snap-start
        overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]
        transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="mb-2 font-serif text-lg font-semibold text-[var(--color-primary)]">
          {tour.title}
        </h3>

        {/* Rating */}
        <div className="mb-2 flex items-center gap-1">
          <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
          <span className="text-sm font-medium text-[var(--color-text)]">{tour.rating}</span>
          <span className="text-sm text-[var(--color-text-muted)]">
            ({tour.reviewCount} {t('reviews')})
          </span>
        </div>

        {/* Metadata */}
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {formatDuration(tour.duration)} · Walking · Max {tour.maxCapacity}
        </p>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-[var(--color-primary)]">
            {t('from')} {formatPrice(tour.price)} {t('perPerson')}
          </span>
          <Link href={`/tours/${tour.id}`} className={getButtonClassName('primary', 'sm')}>
            {t('bookNow')}
          </Link>
        </div>
      </div>
    </div>
  )
}
