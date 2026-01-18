import React from 'react'
import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RatingStarsProps {
  /** Rating value (0-5) */
  rating: number
  /** Maximum stars to display */
  max?: number
  /** Size of stars */
  size?: 'sm' | 'md' | 'lg'
  /** Show numeric rating alongside stars */
  showValue?: boolean
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

/**
 * Star rating display component with accessibility support.
 * Supports full, half, and empty stars with WCAG-compliant aria labels.
 */
export function RatingStars({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  className,
}: RatingStarsProps) {
  const clampedRating = Math.min(Math.max(0, rating), max)
  const fullStars = Math.floor(clampedRating)
  const hasHalfStar = clampedRating % 1 >= 0.5
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`Rating: ${clampedRating.toFixed(1)} out of ${max} stars`}
    >
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(
            sizeClasses[size],
            'fill-[var(--color-secondary)] text-[var(--color-secondary)]'
          )}
          aria-hidden="true"
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative" aria-hidden="true">
          <Star className={cn(sizeClasses[size], 'text-[var(--color-border)]')} />
          <StarHalf
            className={cn(
              sizeClasses[size],
              'absolute left-0 top-0 fill-[var(--color-secondary)] text-[var(--color-secondary)]'
            )}
          />
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(sizeClasses[size], 'text-[var(--color-border)]')}
          aria-hidden="true"
        />
      ))}

      {/* Numeric value */}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
