import { getTranslations } from 'next-intl/server'
import { formatPrice } from '@/lib/utils'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourMobilePriceBarProps {
  tour: TourDetail
}

/**
 * Sticky mobile price bar — sits below header nav on scroll.
 * Shows flat group price + "Book Now" CTA. Hidden on desktop (lg+).
 */
export async function TourMobilePriceBar({ tour }: TourMobilePriceBarProps) {
  const t = await getTranslations('tourDetail.booking')

  return (
    <div className="sticky top-20 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/95 px-5 py-3 backdrop-blur-sm lg:hidden">
      <div className="flex items-baseline gap-1.5">
        <span className="font-serif text-lg font-bold text-[var(--color-primary)]">
          {formatPrice(tour.price)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {t('maxGroup', { count: tour.maxCapacity })}
        </span>
      </div>
      <a
        href="#booking"
        className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white"
      >
        {t('bookNow')}
      </a>
    </div>
  )
}
