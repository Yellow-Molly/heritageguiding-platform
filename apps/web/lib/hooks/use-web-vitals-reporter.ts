'use client'

/**
 * Web Vitals reporter hook for collecting Core Web Vitals metrics.
 * Reports LCP, FID, CLS, TTFB, and INP to /api/analytics/vitals.
 * Only reports in production to avoid noise during development.
 */

import { useReportWebVitals } from 'next/web-vitals'

/** Allowed metric names to report */
const VITAL_NAMES = new Set(['LCP', 'FID', 'CLS', 'TTFB', 'INP', 'FCP'])

export function useWebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!VITAL_NAMES.has(metric.name)) return

    // Only report in production
    if (process.env.NODE_ENV !== 'production') {
      // Log to console in development for debugging
      console.debug(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)}`)
      return
    }

    // Send metric to analytics endpoint via beacon API
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
    })

    // Use sendBeacon for reliability (doesn't block page unload)
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/analytics/vitals', body)
    } else {
      // Fallback to fetch with keepalive
      fetch('/api/analytics/vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics should not affect user experience
      })
    }
  })
}
