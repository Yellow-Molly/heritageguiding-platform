import { getTranslations } from 'next-intl/server'
import { MapPin, Clock, Train, Car, Navigation } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GoogleMapLink } from './google-map-link'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface LogisticsSectionProps {
  tour: TourDetail
}

/**
 * Logistics section displaying meeting point, transport info, and map link.
 */
export async function LogisticsSection({ tour }: LogisticsSectionProps) {
  const t = await getTranslations('tourDetail.logistics')

  const { logistics } = tour

  if (!logistics) return null

  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
        {t('title')}
      </h2>
      <Card className="mt-4">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
          {/* Meeting Point Info */}
          <div className="space-y-4">
            {/* Meeting Point */}
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold text-[var(--color-text)]">{t('meetingPoint')}</p>
                <p className="text-[var(--color-text)]">{logistics.meetingPointName}</p>
                {logistics.meetingPointAddress && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {logistics.meetingPointAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Meeting Instructions */}
            {logistics.meetingPointInstructions && (
              <div className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{t('instructions')}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {logistics.meetingPointInstructions}
                  </p>
                </div>
              </div>
            )}

            {/* Public Transport */}
            {logistics.publicTransportInfo && (
              <div className="flex gap-3">
                <Train className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{t('publicTransport')}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {logistics.publicTransportInfo}
                  </p>
                </div>
              </div>
            )}

            {/* Parking */}
            {logistics.parkingInfo && (
              <div className="flex gap-3">
                <Car className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{t('parking')}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{logistics.parkingInfo}</p>
                </div>
              </div>
            )}

            {/* Ending Point */}
            {logistics.endingPoint && (
              <div className="flex gap-3">
                <Navigation className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{t('endingPoint')}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{logistics.endingPoint}</p>
                </div>
              </div>
            )}
          </div>

          {/* Google Maps Link (no embed - zero API cost) */}
          {logistics.coordinates && (
            <GoogleMapLink
              lat={logistics.coordinates.latitude}
              lng={logistics.coordinates.longitude}
              title={logistics.meetingPointName}
              googleMapsLink={logistics.googleMapsLink}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
