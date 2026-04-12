import { getTranslations } from 'next-intl/server'
import { Star, Clock, Users } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { AccessibilityBadge } from '@/components/shared/accessibility-badge'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourTitleSectionProps {
  tour: TourDetail
}

/**
 * Title section below image grid: category pills, h1 title, subtitle, meta row.
 * Server component — no client-side interactivity needed.
 */
export async function TourTitleSection({ tour }: TourTitleSectionProps) {
  const t = await getTranslations('tourDetail.facts')

  return (
    <div className="px-5 pt-5 lg:px-20 lg:pt-8">
      {/* Category Pills */}
      {tour.categories && tour.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tour.categories.map((cat, i) => (
            <span
              key={cat.id}
              className={
                i === 0
                  ? 'rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white lg:text-sm'
                  : 'rounded-full border border-[var(--color-border)] bg-[var(--color-background-alt)] px-3 py-1 text-xs font-medium text-[var(--color-text)] lg:text-sm'
              }
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mt-3 font-serif text-2xl font-bold text-[var(--color-primary)] lg:text-4xl">
        {tour.title}
      </h1>

      {/* Subtitle */}
      {tour.description && (
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)] lg:text-base">
          {tour.description}
        </p>
      )}

      {/* Meta Row */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm lg:gap-5">
        {/* Rating — only shown when reviews exist */}
        {tour.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
            <span className="font-medium text-[var(--color-text)]">{tour.rating}</span>
            <span className="text-[var(--color-text-muted)]">
              ({tour.reviewCount} {t('reviews')})
            </span>
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(tour.duration)}</span>
        </div>

        {/* Group Size */}
        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
          <Users className="h-4 w-4" />
          <span>{t('maxGroup', { count: tour.maxCapacity })}</span>
        </div>

        {/* Accessibility (desktop only) */}
        <div className="hidden items-center gap-2 lg:flex">
          {tour.accessibility?.wheelchairAccessible && (
            <AccessibilityBadge type="wheelchair" size="sm" showLabel={false} />
          )}
          {tour.accessibility?.hearingAccessible && (
            <AccessibilityBadge type="hearing" size="sm" showLabel={false} />
          )}
          {tour.accessibility?.visualAccessible && (
            <AccessibilityBadge type="visual" size="sm" showLabel={false} />
          )}
        </div>
      </div>

    </div>
  )
}
