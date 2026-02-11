'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, MapPin, Shield, AlertCircle, Mail } from 'lucide-react'
import { formatDuration, formatPrice } from '@/lib/utils'
import { BokunBookingWidget } from '@/components/bokun-booking-widget-with-fallback'
import { GroupInquiryModal } from '@/components/booking/group-inquiry-modal'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface BookingSectionProps {
  tour: TourDetail
}

/**
 * Sticky booking sidebar for tour detail page.
 * Integrates Bokun widget for booking calendar and checkout.
 * Falls back to email inquiry form when no booking integration.
 */
export function BookingSection({ tour }: BookingSectionProps) {
  const t = useTranslations('tourDetail.booking')

  // Check if tour has Bokun integration configured
  const hasBokunIntegration = Boolean(tour.bokunExperienceId)

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

        {/* Bokun Widget - Primary booking method */}
        {hasBokunIntegration && (
          <BokunBookingWidget
            experienceId={tour.bokunExperienceId!}
            className="min-h-[300px]"
          />
        )}

        {/* Email Inquiry Fallback - when no Bokun integration */}
        {!hasBokunIntegration && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p className="font-medium">{t('inquireAboutTour')}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t('contactUsForAvailability')}
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="outline" asChild>
              <a
                href={`mailto:info@heritageguiding.com?subject=${encodeURIComponent(`Inquiry: ${tour.title}`)}&body=${encodeURIComponent(`Hello,\n\nI am interested in booking the "${tour.title}" tour.\n\nPlease let me know about available dates and pricing.\n\nThank you!`)}`}
              >
                <Mail className="mr-2 h-4 w-4" />
                {t('sendInquiry')}
              </a>
            </Button>
          </div>
        )}

        {/* Group Booking Inquiry - for groups of 20+ */}
        <GroupInquiryModal tourName={tour.title} />

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
