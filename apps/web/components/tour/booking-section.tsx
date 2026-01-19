'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, MapPin, Shield, Calendar } from 'lucide-react'
import { formatDuration, formatPrice } from '@/lib/utils'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface BookingSectionProps {
  tour: TourDetail
}

/**
 * Sticky booking sidebar for tour detail page.
 * Will integrate with Rezdy booking widget in future phase.
 */
export function BookingSection({ tour }: BookingSectionProps) {
  const t = useTranslations('tourDetail.booking')

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{t('bookNow')}</span>
        </CardTitle>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[var(--color-primary)]">
            {formatPrice(tour.price)}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">{t('perPerson')}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tour Quick Info */}
        <div className="space-y-3 rounded-lg bg-[var(--color-surface)] p-4 text-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-[var(--color-primary)]" />
            <span>
              {t('duration')}: {formatDuration(tour.duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{t('maxGroup', { count: tour.maxCapacity })}</span>
          </div>
          {tour.logistics?.meetingPointName && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              <span className="line-clamp-1">{tour.logistics.meetingPointName}</span>
            </div>
          )}
        </div>

        {/* Rezdy Widget Placeholder */}
        <div
          id="rezdy-booking-widget"
          data-product-code={tour.rezdyProductCode}
          className="rounded-lg border-2 border-dashed border-[var(--color-border)] p-4 text-center text-sm text-[var(--color-text-muted)]"
        >
          <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>{t('selectDate')}</p>
        </div>

        {/* Book Now Button */}
        <Button className="w-full" size="lg">
          {t('checkAvailability')}
        </Button>

        {/* Trust Signals */}
        <div className="space-y-2 pt-2 text-center text-xs text-[var(--color-text-muted)]">
          <p className="flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            {t('freeCancellation')}
          </p>
          <p>{t('instantConfirmation')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
