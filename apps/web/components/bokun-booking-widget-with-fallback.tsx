'use client'

/**
 * Bokun booking widget component for embedding checkout calendar
 * Loads Bokun script and renders iframe-based booking interface
 * Includes loading skeleton and error fallback UI
 */

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBokunWidgetUrl } from '@/lib/bokun'

interface BokunBookingWidgetProps {
  /** Bokun experience/activity ID */
  experienceId: string
  /** Optional CSS class name */
  className?: string
  /**
   * ISO 639-1 language code passed to Bokun's data-src as `?lang=`.
   * Required when site is multi-language — Bokun otherwise falls back to the
   * booking channel's dashboard default (English), ignoring <html lang>.
   */
  locale?: string
  /** Callback when widget fails to load */
  onError?: (error: string) => void
  /** Callback when widget loads successfully */
  onLoad?: () => void
}

// Declare global Bokun widget types
declare global {
  interface Window {
    BokunWidgets?: {
      init: () => void
    }
  }
}

// Bokun widget script URL
const BOKUN_WIDGET_SCRIPT_URL =
  'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js'

// UUID v4 format validation (prevents accidental API key exposure)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// How long to wait for Bokun to inject the iframe before declaring failure.
// Bokun's own iFrameSizer warningTimeout is 5s; we add headroom for slow
// networks and re-init races on locale switch / tour navigation.
const IFRAME_LOAD_TIMEOUT_MS = 12_000

/**
 * Bokun booking widget wrapper for React/Next.js.
 * Loads Bokun script dynamically and renders iframe-based booking calendar.
 * Shows loading skeleton while loading and error state on failure.
 */
export function BokunBookingWidget({
  experienceId,
  className = '',
  locale,
  onError,
  onLoad,
}: BokunBookingWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track async iframe verification so locale switches / unmounts can cancel it.
  const verifyTimerRef = useRef<number | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  // Get booking channel UUID from environment
  const bookingChannelUUID = process.env.NEXT_PUBLIC_BOKUN_UUID

  const cancelPendingVerification = () => {
    if (verifyTimerRef.current !== null) {
      window.clearTimeout(verifyTimerRef.current)
      verifyTimerRef.current = null
    }
    observerRef.current?.disconnect()
    observerRef.current = null
  }

  /**
   * Watch the widget container for an iframe to appear. Bokun's loader injects
   * the iframe inside the `.bokunWidget` div on init — its presence is the
   * honest signal of success. Only flips to error if no iframe appears within
   * IFRAME_LOAD_TIMEOUT_MS, which avoids false positives from transient
   * `init()` throws (locale switch, tour navigation re-init).
   */
  const verifyIframeLoaded = () => {
    const container = containerRef.current
    if (!container) return
    cancelPendingVerification()

    if (container.querySelector('iframe')) return

    const observer = new MutationObserver(() => {
      if (containerRef.current?.querySelector('iframe')) {
        cancelPendingVerification()
      }
    })
    observer.observe(container, { childList: true, subtree: true })
    observerRef.current = observer

    verifyTimerRef.current = window.setTimeout(() => {
      if (!containerRef.current?.querySelector('iframe')) {
        cancelPendingVerification()
        const errorMsg = 'Failed to initialize booking widget'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }, IFRAME_LOAD_TIMEOUT_MS)
  }

  /**
   * Invoke Bokun's DOM scan on the next animation frame. Deferring past the
   * current React cycle lets the freshly-keyed widget div commit before
   * Bokun's loader walks the DOM — without it, locale switches and tour
   * navigation hit a transient throw that the existing-script path previously
   * surfaced as a fatal error.
   */
  const initializeBokunWidget = () => {
    requestAnimationFrame(() => {
      try {
        window.BokunWidgets?.init()
      } catch (err) {
        // init() throws transiently on re-init (duplicate channel, stale node);
        // the iframe usually still mounts. verifyIframeLoaded() is the source
        // of truth for whether we surface a user-facing error.
        console.warn('[BokunWidget] init() threw; verifying iframe presence:', err)
      }
      verifyIframeLoaded()
    })
  }

  /**
   * Load Bokun widget script
   */
  const loadWidget = () => {
    setLoading(true)
    setError(null)

    // Check for configuration
    if (!bookingChannelUUID) {
      const errorMsg = 'Bokun booking channel not configured'
      setError(errorMsg)
      setLoading(false)
      onError?.(errorMsg)
      return
    }

    // Validate UUID format to prevent accidental credential exposure
    if (!UUID_REGEX.test(bookingChannelUUID)) {
      const errorMsg = 'Invalid booking channel configuration'
      console.error('[BokunWidget] NEXT_PUBLIC_BOKUN_UUID is not a valid UUID format')
      setError(errorMsg)
      setLoading(false)
      onError?.(errorMsg)
      return
    }

    // Check if script already loaded
    const existingScript = document.querySelector(
      `script[src*="BokunWidgetsLoader.js"]`
    ) as HTMLScriptElement | null

    if (existingScript && window.BokunWidgets) {
      setLoading(false)
      onLoad?.()
      initializeBokunWidget()
      return
    }

    // Load Bokun script
    const script = document.createElement('script')
    script.src = `${BOKUN_WIDGET_SCRIPT_URL}?bookingChannelUUID=${bookingChannelUUID}`
    script.async = true

    script.onload = () => {
      setLoading(false)
      onLoad?.()
      initializeBokunWidget()
    }

    script.onerror = () => {
      const errorMsg = 'Failed to load booking widget'
      setError(errorMsg)
      setLoading(false)
      onError?.(errorMsg)
    }

    document.head.appendChild(script)
  }

  // Load widget on mount. Includes `locale` so language switches re-init the
  // iframe with a fresh data-src. Cleanup cancels any pending iframe-presence
  // verification so a remount doesn't surface the previous cycle's timeout.
  useEffect(() => {
    loadWidget()
    return cancelPendingVerification
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingChannelUUID, experienceId, locale])

  // Error state with retry option
  if (error) {
    return (
      <div
        className={`rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center ${className}`}
      >
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="font-medium text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again or contact us for assistance.
        </p>
        <Button
          variant="outline-dark"
          size="sm"
          className="mt-4"
          onClick={loadWidget}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {/* Bokun widget container.
          `key` forces React to remount the div on locale change so Bokun's
          loader picks up the new data-src instead of reusing the cached iframe. */}
      <div
        key={locale}
        ref={containerRef}
        className="bokunWidget"
        data-src={
          bookingChannelUUID
            ? getBokunWidgetUrl(bookingChannelUUID, experienceId, locale)
            : undefined
        }
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  )
}

// Default export for convenience
export default BokunBookingWidget
