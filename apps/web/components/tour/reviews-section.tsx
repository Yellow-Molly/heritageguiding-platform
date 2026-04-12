'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Star } from 'lucide-react'
import { formatDate } from '@/lib/i18n/date-format'
import { calculateAverageRating, type TourReview } from '@/lib/api/get-tour-reviews'

interface ReviewsSectionProps {
  reviews: TourReview[]
}

/**
 * Reviews section with header score badge and cleaner review cards.
 * Card: "Author — rating", italic body, date right.
 */
export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const t = useTranslations('tourDetail.reviews')
  const locale = useLocale()

  const averageRating = calculateAverageRating(reviews)

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-xl font-semibold text-[var(--color-primary)] lg:text-2xl">
          {t('title')}
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">{t('noReviews')}</p>
      </section>
    )
  }

  return (
    <section>
      {/* Header: title left + score badge right */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-[var(--color-primary)] lg:text-2xl">
          {t('title')}
        </h2>
        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--color-surface)] px-3 py-1.5">
          <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
          <span className="text-sm font-bold text-[var(--color-text)]">
            {averageRating.toFixed(1)} / 5
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">({reviews.length})</span>
        </div>
      </div>

      {/* Review Cards */}
      <div className="mt-5 flex flex-col gap-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-[var(--color-border)] p-5"
          >
            {/* Card header: author — rating left, date right */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[var(--color-text)]">
                {review.authorName} — {review.rating}/5
              </p>
              <span className="text-xs text-[var(--color-text-light)]">
                {formatDate(new Date(review.date), locale)}
              </span>
            </div>
            {/* Card body: italic review text */}
            <p className="mt-3 text-sm italic leading-relaxed text-[var(--color-text-muted)]">
              {review.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
