'use client'

import { Clock, Users, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn, formatDuration, formatPrice } from '@/lib/utils'
import { AccessibilityBadge } from '@/components/shared/accessibility-badge'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourFactsProps {
  tour: TourDetail
  /** Display variant */
  variant?: 'default' | 'overlay' | 'card'
}

/**
 * Quick facts display component for tour details.
 */
export function TourFacts({ tour, variant = 'default' }: TourFactsProps) {
  const t = useTranslations('tourDetail.facts')

  const isOverlay = variant === 'overlay'
  const isCard = variant === 'card'

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4',
        isOverlay && 'text-white',
        isCard && 'rounded-lg border bg-card p-4'
      )}
    >
      {/* Duration */}
      <div className="flex items-center gap-1.5">
        <Clock className={cn('h-4 w-4', isOverlay ? 'text-white/80' : 'text-muted-foreground')} />
        <span className={cn('text-sm', isOverlay ? 'text-white' : 'text-foreground')}>
          {formatDuration(tour.duration)}
        </span>
      </div>

      {/* Max Capacity */}
      <div className="flex items-center gap-1.5">
        <Users className={cn('h-4 w-4', isOverlay ? 'text-white/80' : 'text-muted-foreground')} />
        <span className={cn('text-sm', isOverlay ? 'text-white' : 'text-foreground')}>
          {t('maxGroup', { count: tour.maxCapacity })}
        </span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <Star
          className={cn(
            'h-4 w-4',
            isOverlay
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-[var(--color-secondary)] text-[var(--color-secondary)]'
          )}
        />
        <span className={cn('text-sm font-medium', isOverlay ? 'text-white' : 'text-foreground')}>
          {tour.rating}
        </span>
        <span className={cn('text-sm', isOverlay ? 'text-white/80' : 'text-muted-foreground')}>
          ({tour.reviewCount} {t('reviews')})
        </span>
      </div>

      {/* Price */}
      <div
        className={cn(
          'rounded-lg px-3 py-1',
          isOverlay ? 'bg-white/20 backdrop-blur-sm' : 'bg-primary/10'
        )}
      >
        <span
          className={cn('text-sm font-bold', isOverlay ? 'text-white' : 'text-[var(--color-primary)]')}
        >
          {formatPrice(tour.price)}
        </span>
      </div>

      {/* Accessibility */}
      {tour.accessibility?.wheelchairAccessible && (
        <AccessibilityBadge
          type="wheelchair"
          size="sm"
          showLabel={false}
          className={isOverlay ? 'text-white' : undefined}
        />
      )}
      {tour.accessibility?.hearingAccessible && (
        <AccessibilityBadge
          type="hearing"
          size="sm"
          showLabel={false}
          className={isOverlay ? 'text-white' : undefined}
        />
      )}
      {tour.accessibility?.visualAccessible && (
        <AccessibilityBadge
          type="visual"
          size="sm"
          showLabel={false}
          className={isOverlay ? 'text-white' : undefined}
        />
      )}
    </div>
  )
}
