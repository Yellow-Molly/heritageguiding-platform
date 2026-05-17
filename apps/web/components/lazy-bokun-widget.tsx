'use client'

import { useEffect, useRef, useState } from 'react'
import { BokunBookingWidget } from './bokun-booking-widget-with-fallback'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyBokunWidgetProps {
  experienceId: string
  className?: string
}

/**
 * Defers Bokun widget script load until the booking sidebar is within ~400px
 * of the viewport. Bokun's loader pulls ~2.8s of main-thread work on mobile
 * (OnlineSalesRenderer, OnlineSalesContent, BokunWidgets, etc.) — eager load
 * spikes TBT to ~1.3s and Speed Index to ~7s per PSI on TourDetails. Deferring
 * until intent keeps the page interactive while still loading well before most
 * users scroll-reach the booking section (typically ~3-5 sections below
 * the fold on mobile, immediately visible in sticky sidebar on desktop).
 */
export function LazyBokunWidget({ experienceId, className }: LazyBokunWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Bail to eager load if IntersectionObserver isn't available (very old browser).
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
