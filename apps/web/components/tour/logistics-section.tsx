import { getTranslations } from 'next-intl/server'
import { MapPin, Train, Flag } from 'lucide-react'
import { GoogleMapLink } from './google-map-link'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface LogisticsSectionProps {
  tour: TourDetail
}

/**
 * Meeting point & logistics section.
 * Desktop: alt bg card with map + 3-column label-value grid.
 * Mobile: map + icon rows.
 */
export async function LogisticsSection({ tour }: LogisticsSectionProps) {
  const t = await getTranslations('tourDetail.logistics')
  const { logistics } = tour

  if (!logistics) return null

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-[var(--color-primary)] lg:text-[22px]">
        {t('title')}
      </h2>

      <div className="mt-4 rounded-2xl bg-[var(--color-background-alt)] p-5 lg:p-6">
        {/* Map */}
        {logistics.coordinates && (
          <div className="mb-5 h-[140px] overflow-hidden rounded-lg lg:h-[180px]">
            <GoogleMapLink
              lat={logistics.coordinates.latitude}
              lng={logistics.coordinates.longitude}
              title={logistics.meetingPointName}
              googleMapsLink={logistics.googleMapsLink}
            />
          </div>
        )}

        {/* Desktop: Label-Value Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          <LabelValue
            label={t('meetingPoint')}
            value={logistics.meetingPointName}
            subValue={logistics.meetingPointAddress}
          />
          {logistics.publicTransportInfo && (
            <LabelValue label={t('publicTransport')} value={logistics.publicTransportInfo} />
          )}
          {logistics.endingPoint && (
            <LabelValue label={t('endingPoint')} value={logistics.endingPoint} />
          )}
        </div>

        {/* Mobile: Icon Rows */}
        <div className="flex flex-col gap-3 lg:hidden">
          <IconRow icon={<MapPin className="h-4 w-4" />} text={logistics.meetingPointName} />
          {logistics.publicTransportInfo && (
            <IconRow icon={<Train className="h-4 w-4" />} text={logistics.publicTransportInfo} />
          )}
          {logistics.endingPoint && (
            <IconRow icon={<Flag className="h-4 w-4" />} text={logistics.endingPoint} />
          )}
        </div>
      </div>
    </section>
  )
}

/** Desktop label-value pair */
function LabelValue({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-medium text-[var(--color-text)]">{value}</p>
      {subValue && (
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subValue}</p>
      )}
    </div>
  )
}

/** Mobile icon + text row */
function IconRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-[var(--color-text)]">
      <span className="text-[var(--color-primary)]">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
