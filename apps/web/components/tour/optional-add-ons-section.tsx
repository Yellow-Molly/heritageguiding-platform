import { getTranslations } from 'next-intl/server'
import { PlusCircle } from 'lucide-react'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'
import { formatPrice } from '@/lib/utils'

interface OptionalAddOnsSectionProps {
  tour: TourDetail
}

/**
 * "Optional Add-ons" section — read-only marketing surface listing paid extras
 * that the customer can purchase inside the Bokun checkout widget.
 *
 * Mirrors the Bokun-side Extras config (`tour.optionalAddOns` is filtered by
 * the loader to only include rows with a non-empty `bokunExtraId`). Section
 * is hidden entirely when no wired add-ons exist — zero new UI on tours
 * that haven't enabled the feature.
 *
 * Server component — no interactivity here; checkout happens in BookingSection.
 *
 * @see plans/260519-2046-bokun-extras-add-ons-checkout/phase-03-tour-page-optional-addons-section.md
 */
export async function OptionalAddOnsSection({ tour }: OptionalAddOnsSectionProps) {
  if (!tour.optionalAddOns?.length) return null

  const t = await getTranslations('tourDetail.optionalAddOns')

  return (
    <section>
      <h2 className="font-serif text-[22px] font-semibold text-[var(--color-primary)] lg:text-[28px]">
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('subtitle')}</p>

      <ul className="mt-4 space-y-3">
        {tour.optionalAddOns.map((addon) => {
          const priceKey = addon.pricingType === 'perPerson' ? 'priceHintPerPerson' : 'priceHintPerBooking'
          const pillKey = addon.isRequired ? 'pillRequired' : 'pillOptional'
          return (
            <li
              key={addon.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 lg:rounded-xl lg:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] lg:text-base">
                    <PlusCircle className="h-4 w-4 shrink-0 text-[var(--color-secondary)]" />
                    {addon.name}
                  </h3>
                  {addon.description && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)] lg:text-sm">
                      {addon.description}
                    </p>
                  )}
                </div>
                <span
                  className={
                    addon.isRequired
                      ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800'
                      : 'rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700'
                  }
                >
                  {t(pillKey)}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text)] lg:text-sm">
                {t(priceKey, {
                  price: formatPrice(addon.adultPriceHint, addon.currency),
                })}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
