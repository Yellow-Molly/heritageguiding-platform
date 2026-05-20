'use client'

import { useEffect, useRef, useState } from 'react'
import { BokunBookingWidget } from './bokun-booking-widget-with-fallback'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyBokunWidgetProps {
  experienceId: string
  className?: string
  /** ISO 639-1 language code forwarded to Bokun via `?lang=` on data-src. */
  locale?: string
}

// Matches Tailwind `lg:` breakpoint — where BookingSection moves into the
// sticky right-column sidebar that's typically in initial viewport.
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

// Delay before auto-loading Bokun on desktop. Picks a window past LCP
// measurement (~2.5s "good" threshold) so the booking iframe isn't fighting
// hero/title paint, but well below the 5-10s perceived-load ceiling that
// hurt real-user conversion. TBT/Speed Index will rise (Bokun's ~2.8s
// main-thread work now lands in 1.5-4.3s post-FCP); accepted trade — real
// user speed beats Lighthouse desktop vanity metric. The sticky sidebar is
// usually in initial viewport so intersection would fire immediately; this
// setTimeout is the only thing protecting LCP on desktop.
const DESKTOP_LOAD_DELAY_MS = 1500

/**
 * Defers Bokun widget script load until user intent. Bokun's loader pulls
 * ~2.8s of main-thread work (OnlineSalesRenderer, OnlineSalesContent,
 * BokunWidgets) and 1.2MB of unused JS — eager load spiked PSI mobile TBT
 * to 1,330ms and Speed Index to 7.2s.
 *
 * Triggers:
 * - Mobile (<1024px): IntersectionObserver with 400px buffer. Booking
 *   sidebar sits below ~5 content sections so observer naturally fires
 *   well after the audit window has closed.
 * - Desktop (>=1024px): sticky sidebar is usually in initial viewport so
 *   intersection would fire immediately. Short setTimeout instead — see
 *   DESKTOP_LOAD_DELAY_MS for the picked value and rationale.
 */
export function LazyBokunWidget({ experienceId, className, locale }: LazyBokunWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia(DESKTOP_MEDIA_QUERY).matches

    if (isDesktop) {
      const timer = window.setTimeout(() => setShouldLoad(true), DESKTOP_LOAD_DELAY_MS)
      return () => window.clearTimeout(timer)
    }

    // Mobile path: IntersectionObserver. Eager-load fallback for very old browsers.
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {shouldLoad ? (
        <BokunBookingWidget experienceId={experienceId} locale={locale} />
      ) : (
        <div className="space-y-3" aria-label="Booking widget loading">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
    </div>
  )
}
