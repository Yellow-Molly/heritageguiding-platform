'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface GoogleMapLinkProps {
  lat: number
  lng: number
  title: string
  googleMapsLink?: string
}

/**
 * Google Maps link component (no embed - zero API cost).
 * Shows a static preview with link to open in Google Maps.
 * Uses Intersection Observer for deferred loading.
 */
export function GoogleMapLink({ lat, lng, title, googleMapsLink }: GoogleMapLinkProps) {
  const t = useTranslations('tourDetail.logistics')
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Generate Google Maps link if not provided
  const mapsUrl = googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  // Static map preview using OpenStreetMap tiles (free, no API key)
  const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.003}%2C${lng + 0.005}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`

  // Lazy load iframe when container enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-3">
      {/* Static Map Preview */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--color-surface)]"
      >
        {isVisible ? (
          <iframe
            title={`Map showing ${title}`}
            src={staticMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="pointer-events-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="h-8 w-8 animate-pulse text-[var(--color-text-muted)]" />
          </div>
        )}
        {/* Overlay for click interception */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/10"
          aria-label={`Open ${title} in Google Maps`}
        >
          <span className="sr-only">{t('openInMaps')}</span>
        </a>
        {/* Map Pin Icon */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin className="h-8 w-8 fill-red-500 text-red-600 drop-shadow-lg" />
        </div>
      </div>

      {/* Open in Google Maps Button */}
      <Button variant="outline" className="w-full" asChild>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          {t('openInMaps')}
        </a>
      </Button>
    </div>
  )
}
