'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Users, Star } from 'lucide-react'
import { cn, formatDuration, formatPrice } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AccessibilityBadge } from '@/components/shared/accessibility-badge'
import { NavigationPending } from '@/components/shared/navigation-pending'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

interface TourCardProps {
  tour: FeaturedTour
  /** Display mode: grid (default) or list */
  variant?: 'grid' | 'list'
  /** Mark the image as LCP candidate — eager + fetchpriority=high. Set true for first cards above the fold. */
  priority?: boolean
}

/**
 * Tour card for catalog display.
 * Desktop: vertical card with 180px image, duration pill, price in body.
 * Mobile: horizontal 130px card with 130px image left, compact info right.
 * Responsive behavior via Tailwind breakpoints — no JS variant switching for mobile.
 */
export function TourCard({ tour, variant = 'grid', priority = false }: TourCardProps) {
  const t = useTranslations('tours.filters')
  const isListView = variant === 'list'

  return (
    <Link href={`/tours/${tour.slug}`} className={cn('block', !isListView && 'max-w-[400px] w-full')}>
      <NavigationPending>
      <Card
        className={cn(
          'group overflow-hidden transition-all duration-300',
          'hover:shadow-[var(--shadow-card-hover)]',
          'flex flex-row h-[160px] md:flex-col md:h-auto',
          isListView && 'md:flex-row md:h-auto'
        )}
      >
        {/* Image Container */}
        <div
          className={cn(
            'relative overflow-hidden shrink-0',
            'w-[160px] md:w-full md:h-[290px]',
            isListView && 'md:w-72 md:h-auto md:aspect-[4/3]'
          )}
        >
          {tour.image.url ? (
            <Image
              src={tour.image.url}
              alt={tour.image.alt}
              fill
              priority={priority}
              fetchPriority={priority ? 'high' : 'auto'}
              placeholder={tour.image.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={tour.image.blurDataUrl}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 160px, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--color-background-alt)] text-[var(--color-text-muted)]">
              {tour.title.charAt(0)}
            </div>
          )}

          {/* Featured Badge — gold pill */}
          {tour.featured && (
            <Badge className="absolute left-2 top-2 md:left-3 md:top-3" variant="secondary" size="sm">
              {t('featured')}
            </Badge>
          )}

          {/* Duration pill — desktop only, translucent black on image */}
          <div className="hidden md:flex absolute bottom-3 left-3 items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
            {formatDuration(tour.duration)}
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          'flex flex-1 flex-col min-w-0',
          'p-2.5 gap-1 md:p-3 md:gap-1.5',
          isListView && 'md:p-5'
        )}>
          {/* Rating + Price row — hidden for MVP, re-enable later */}
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 md:h-4 md:w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
              <span className="text-xs md:text-sm font-medium text-[var(--color-secondary)]">
                {tour.rating}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({tour.reviewCount})
              </span>
            </div>
            <span className="text-sm font-bold text-[var(--color-primary)]">
              {formatPrice(tour.price)}
            </span>
          </div> */}

          {/* Title */}
          <h3 className={cn(
            'font-serif font-semibold text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-accent)]',
            'text-base md:text-[20px]'
          )}>
            {tour.title}
          </h3>

          {/* Description — desktop only */}
          <p className="hidden md:block text-xs leading-[1.4] text-[var(--color-text-muted)] line-clamp-2">
            {tour.description}
          </p>

          {/* Mobile: duration + capacity inline text */}
          <span className="md:hidden text-xs text-[var(--color-text-muted)] truncate">
            {t('durationAndCapacity', { duration: formatDuration(tour.duration), count: tour.maxCapacity })}
          </span>

          {/* Desktop meta */}
          <div className="hidden md:flex mt-auto flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{t('maxCapacity', { count: tour.maxCapacity })}</span>
            </div>
            {tour.accessibility?.wheelchairAccessible && (
              <AccessibilityBadge type="wheelchair" size="sm" showLabel={false} />
            )}
            {tour.accessibility?.hearingAccessible && (
              <AccessibilityBadge type="hearing" size="sm" showLabel={false} />
            )}
          </div>
        </div>
      </Card>
      </NavigationPending>
    </Link>
  )
}
