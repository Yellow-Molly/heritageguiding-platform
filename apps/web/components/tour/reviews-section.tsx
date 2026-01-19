'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Star, Quote } from 'lucide-react'
import { RatingStars } from '@/components/shared/rating-stars'
import { formatDate } from '@/lib/i18n/date-format'
import { calculateAverageRating, type TourReview } from '@/lib/api/get-tour-reviews'

interface ReviewsSectionProps {
  reviews: TourReview[]
}

/**
 * Reviews section with aggregate rating and individual reviews.
 */
export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const t = useTranslations('tourDetail.reviews')
  const locale = useLocale()

  const averageRating = calculateAverageRating(reviews)

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
          {t('title')}
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">{t('noReviews')}</p>
      </section>
    )
  }

  return (
    <section>
      {/* Header with Aggregate Rating */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
          {t('title')}
        </h2>
        <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface)] px-4 py-2">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
            <span className="text-xl font-bold text-[var(--color-text)]">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">
            {t('basedOn', { count: reviews.length })}
          </span>
        </div>
      </div>

      {/* Review List */}
      <div className="mt-6 space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-[var(--color-border)] p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              {/* Author Info */}
              <div>
                <p className="font-semibold text-[var(--color-text)]">{review.authorName}</p>
                {review.authorCountry && (
                  <p className="text-sm text-[var(--color-text-muted)]">{review.authorCountry}</p>
                )}
              </div>
              {/* Rating and Date */}
              <div className="flex items-center gap-3 sm:text-right">
                <RatingStars rating={review.rating} size="sm" />
                <span className="text-sm text-[var(--color-text-muted)]">
                  {formatDate(new Date(review.date), locale)}
                </span>
              </div>
            </div>
            {/* Review Text */}
            <div className="mt-3">
              <Quote className="mb-1 h-4 w-4 text-[var(--color-text-muted)] opacity-50" />
              <p className="text-[var(--color-text-muted)]">{review.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
