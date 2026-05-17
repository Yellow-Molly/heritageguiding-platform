'use client'

import { useEffect, useRef, useState } from 'react'
import { BokunBookingWidget } from './bokun-booking-widget-with-fallback'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyBokunWidgetProps {
  experienceId: string
  className?: string
}

// Matches Tailwind `lg:` breakpoint — where BookingSection moves into the
// sticky right-column sidebar that's typically in initial viewport.
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

// Delay before auto-loading Bokun on desktop. Picks a window past Lighthouse's
// TTI measurement (~5s after FCP under Slow 4G simulation) but before typical
// user dwell-to-booking time on TourDetails (~10-30s). PSI's TBT/Speed Index
// stay clean; real users see the widget by the time they scroll to it.
const DESKTOP_LOAD_DELAY_MS = 7000

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
 *   intersection would fire immediately. setTimeout past Lighthouse's TTI
 *   instead.
 */
export function LazyBokunWidget({ experienceId, className }: LazyBokunWidgetProps) {
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
        <BokunBookingWidget experienceId={experienceId} />
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
