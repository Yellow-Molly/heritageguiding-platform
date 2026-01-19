'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Users, Star, MapPin } from 'lucide-react'
import { cn, formatDuration, formatPrice } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AccessibilityBadge } from '@/components/shared/accessibility-badge'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

interface TourCardProps {
  tour: FeaturedTour
  /** Display mode: grid (default) or list */
  variant?: 'grid' | 'list'
}

/**
 * Tour card component for catalog display.
 * Supports both grid and list view layouts.
 */
export function TourCard({ tour, variant = 'grid' }: TourCardProps) {
  const isListView = variant === 'list'

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-300',
        'hover:shadow-[var(--shadow-card-hover)]',
        isListView && 'flex flex-col sm:flex-row'
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          'relative overflow-hidden',
          isListView ? 'aspect-[4/3] sm:aspect-auto sm:w-72 sm:shrink-0' : 'aspect-[4/3]'
        )}
      >
        <Image
          src={tour.image.url}
          alt={tour.image.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={
            isListView
              ? '(max-width: 640px) 100vw, 288px'
              : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
          }
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Featured Badge */}
        {tour.featured && (
          <Badge className="absolute left-3 top-3" variant="secondary">
            Featured
          </Badge>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {formatPrice(tour.price)}
          </span>
        </div>

        {/* Quick Info Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(tour.duration)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className={cn('flex flex-1 flex-col p-4', isListView && 'sm:p-5')}>
        {/* Rating */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
            <span className="font-medium text-[var(--color-text)]">{tour.rating}</span>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">
            ({tour.reviewCount} reviews)
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 font-serif text-lg font-semibold text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-accent)]">
          <Link href={`/tours/${tour.slug}`} className="hover:underline">
            {tour.title}
          </Link>
        </h3>

        {/* Description */}
        <p
          className={cn(
            'mb-3 text-sm text-[var(--color-text-muted)]',
            isListView ? 'line-clamp-3' : 'line-clamp-2'
          )}
        >
          {tour.description}
        </p>

        {/* Meta Info */}
        <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Max {tour.maxCapacity}</span>
          </div>
          {tour.accessibility?.wheelchairAccessible && (
            <AccessibilityBadge type="wheelchair" size="sm" showLabel={false} />
          )}
          {tour.accessibility?.hearingAccessible && (
            <AccessibilityBadge type="hearing" size="sm" showLabel={false} />
          )}
        </div>

        {/* CTA for list view */}
        {isListView && (
          <Link
            href={`/tours/${tour.slug}`}
            className="mt-4 inline-flex items-center gap-1 font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-dark)]"
          >
            View Details
            <MapPin className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
