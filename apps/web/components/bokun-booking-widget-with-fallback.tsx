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

interface BokunBookingWidgetProps {
  /** Bokun experience/activity ID */
  experienceId: string
  /** Optional CSS class name */
  className?: string
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

/**
 * Bokun booking widget wrapper for React/Next.js.
 * Loads Bokun script dynamically and renders iframe-based booking calendar.
 * Shows loading skeleton while loading and error state on failure.
 */
export function BokunBookingWidget({
  experienceId,
  className = '',
  onError,
  onLoad,
}: BokunBookingWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get booking channel UUID from environment
  const bookingChannelUUID = process.env.NEXT_PUBLIC_BOKUN_UUID

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
      // Re-initialize widgets for dynamic content
      try {
        window.BokunWidgets.init()
        setLoading(false)
        onLoad?.()
      } catch {
        const errorMsg = 'Failed to initialize booking widget'
        setError(errorMsg)
        setLoading(false)
        onError?.(errorMsg)
      }
      return
    }

    // Load Bokun script
    const script = document.createElement('script')
    script.src = `${BOKUN_WIDGET_SCRIPT_URL}?bookingChannelUUID=${bookingChannelUUID}`
    script.async = true

    script.onload = () => {
      setLoading(false)
      onLoad?.()

      // Trigger manual init for dynamic content
      if (window.BokunWidgets) {
        try {
          window.BokunWidgets.init()
        } catch (err) {
          console.error('[BokunWidget] Init error:', err)
        }
      }
    }

    script.onerror = () => {
      const errorMsg = 'Failed to load booking widget'
      setError(errorMsg)
      setLoading(false)
      onError?.(errorMsg)
    }

    document.head.appendChild(script)
  }

  // Load widget on mount
  useEffect(() => {
    loadWidget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingChannelUUID, experienceId])

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
          variant="outline"
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

      {/* Bokun widget container */}
      <div
        ref={containerRef}
        className="bokunWidget"
        data-src={
          bookingChannelUUID
            ? `https://widgets.bokun.io/online-sales/${bookingChannelUUID}/experience-calendar/${experienceId}`
            : undefined
        }
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  )
}

// Default export for convenience
export default BokunBookingWidget
