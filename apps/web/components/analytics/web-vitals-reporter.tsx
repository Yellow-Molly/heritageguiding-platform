'use client'

/**
 * Client component that reports Core Web Vitals metrics.
 * Renders nothing — only activates the reporting hook.
 */

import { useWebVitalsReporter } from '@/lib/hooks/use-web-vitals-reporter'

export function WebVitalsReporter() {
  useWebVitalsReporter()
  return null
}
