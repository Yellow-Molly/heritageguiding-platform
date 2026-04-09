'use client'

import { useTranslations } from 'next-intl'
import { Calendar, ChevronDown, Mail, ShieldCheck, Zap } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { BokunBookingWidget } from '@/components/bokun-booking-widget-with-fallback'
import { GroupInquiryModal } from '@/components/booking/group-inquiry-modal'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface BookingSectionProps {
  tour: TourDetail
}

/**
 * Sticky booking sidebar for tour detail page.
 * Design: price row, cancel badge, date/guest fields (or Bokun widget), CTA, total, inquiry.
 */
export function BookingSection({ tour }: BookingSectionProps) {
  const t = useTranslations('tourDetail.booking')
  const hasBokunIntegration = Boolean(tour.bokunExperienceId)

  return (
    <div className="sticky top-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_8px_32px_#00000012]">
      {/* Price Row */}
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-[28px] font-bold text-[var(--color-primary)]">
          {formatPrice(tour.price)}
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">{t('perPerson')}</span>
      </div>

      {/* Cancellation Badge */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#10B98110] px-3 py-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="text-xs font-bold text-emerald-700">{t('freeCancellation')}</span>
      </div>

      {/* Bokun Widget — replaces date/guest/CTA when active */}
      {hasBokunIntegration ? (
        <div className="mt-5">
          <BokunBookingWidget
            experienceId={tour.bokunExperienceId!}
            className="min-h-[300px]"
          />
        </div>
      ) : (
        /* Visual placeholder fields when no Bokun integration */
        <div className="mt-5 space-y-4">
          {/* Date Field */}
          <div>
            <label className="text-[13px] font-bold text-[var(--color-text)]">
              {t('selectDate')}
            </label>
            <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-text-muted)]">{t('chooseDatePlaceholder')}</span>
              <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Guest Field */}
          <div>
            <label className="text-[13px] font-bold text-[var(--color-text)]">
              {t('guests')}
            </label>
            <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-text)]">{t('defaultGuests')}</span>
              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* CTA Button — triggers email inquiry when no Bokun integration */}
          <a
            href={`mailto:info@privatetours.se?subject=${encodeURIComponent(`Booking: ${tour.title}`)}&body=${encodeURIComponent(`Hello,\n\nI would like to check availability for the "${tour.title}" tour.\n\nPreferred date: \nNumber of guests: 2\n\nThank you!`)}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white shadow-md transition-colors hover:opacity-90"
          >
            <Calendar className="h-4 w-4" />
            {t('checkAvailability')}
          </a>

          {/* Total Row */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-sm">
            <span className="text-[var(--color-text-muted)]">{t('totalForGuests', { count: 2 })}</span>
            <span className="font-bold text-[var(--color-text)]">{formatPrice(tour.price * 2)}</span>
          </div>
        </div>
      )}

      {/* Inquiry Button */}
      <div className="mt-4">
        <a
          href={`mailto:info@privatetours.se?subject=${encodeURIComponent(`Inquiry: ${tour.title}`)}&body=${encodeURIComponent(`Hello,\n\nI am interested in booking the "${tour.title}" tour.\n\nPlease let me know about available dates and pricing.\n\nThank you!`)}`}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--color-secondary)] px-6 py-2.5 text-sm font-medium text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-secondary)]/5"
        >
          <Mail className="h-4 w-4" />
          {t('inquireAboutTour')}
        </a>
      </div>

      {/* Group Booking */}
      <div className="mt-3">
        <GroupInquiryModal tourName={tour.title} />
      </div>

      {/* Instant Confirmation */}
      <p className="mt-4 flex items-center justify-center gap-1 text-xs text-[var(--color-text-muted)]">
        <Zap className="h-3 w-3" />
        {t('instantConfirmation')}
      </p>
    </div>
  )
}
