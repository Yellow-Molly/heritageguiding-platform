'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatPrice, cn } from '@/lib/utils'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourMobilePriceBarProps {
  tour: TourDetail
}

// Header h-20 (80px) + sticky bar content height (~50px). Trigger fires when
// #booking top crosses the bar's bottom edge — matches the scroll-to landing
// position set by `scroll-mt-24` on the booking wrapper in the page layout.
const TRIGGER_PX = 130

/**
 * Sticky mobile price bar — sits below header nav on scroll.
 * Shows flat group price + "Book Now" CTA. Hidden on desktop (lg+).
 * Auto-hides once #booking section reaches the trigger line so it stops
 * competing with the Bokun widget's own "Check out" CTA below.
 */
export function TourMobilePriceBar({ tour }: TourMobilePriceBarProps) {
  const t = useTranslations('tourDetail.booking')
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const booking = document.getElementById('booking')
    if (!booking) return

    // Inject a near-zero-height sentinel at top of #booking. A point target
    // (vs the tall booking element) makes IO callbacks fire exactly when the
    // booking section's TOP crosses the trigger line. Observing the section
    // itself only fires on full-enter / full-exit — not at the precise
    // top-edge crossing we need for "hide when widget reaches view".
    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    sentinel.style.width = '0'
    sentinel.setAttribute('aria-hidden', 'true')
    booking.prepend(sentinel)

    const io = new IntersectionObserver(
      ([entry]) => setHidden(entry.boundingClientRect.top <= TRIGGER_PX),
      { rootMargin: `-${TRIGGER_PX}px 0px 0px 0px` }
    )
    io.observe(sentinel)
    return () => {
      io.disconnect()
      sentinel.remove()
    }
  }, [])

  return (
    <div
      aria-hidden={hidden}
      className={cn(
        'sticky top-20 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/95 px-5 py-3 backdrop-blur-sm lg:hidden',
        'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out',
        hidden && 'pointer-events-none -translate-y-full opacity-0'
      )}
    >
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
        tabIndex={hidden ? -1 : undefined}
        className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white"
      >
        {t('bookNow')}
      </a>
    </div>
  )
}
