import { getTranslations } from 'next-intl/server'
import { Check, X, Lightbulb } from 'lucide-react'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface InclusionsSectionProps {
  tour: TourDetail
}

/**
 * Inclusions section with colored cards: Included (green), Not Included (red), What to Bring (neutral).
 * Desktop: 3 side-by-side cards. Mobile: stacked.
 */
export async function InclusionsSection({ tour }: InclusionsSectionProps) {
  const t = await getTranslations('tourDetail.inclusions')

  const hasContent =
    (tour.included && tour.included.length > 0) ||
    (tour.notIncluded && tour.notIncluded.length > 0) ||
    (tour.whatToBring && tour.whatToBring.length > 0)

  if (!hasContent) return null

  return (
    <section>
      <h2 className="font-serif text-[22px] font-semibold text-[var(--color-primary)] lg:text-[28px]">
        {t('title')}
      </h2>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:gap-5">
        {/* Included */}
        {tour.included && tour.included.length > 0 && (
          <div className="flex-1 rounded-lg border border-[#10B98130] bg-[#10B98110] p-4 lg:rounded-xl lg:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-emerald-700 lg:text-sm">
              <Check className="h-4 w-4" />
              {t('included')}
            </h3>
            <ul className="space-y-2">
              {tour.included.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-emerald-700 lg:text-[13px]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" />
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Not Included */}
        {tour.notIncluded && tour.notIncluded.length > 0 && (
          <div className="flex-1 rounded-lg border border-[#EF444430] bg-[#EF444410] p-4 lg:rounded-xl lg:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-red-700 lg:text-sm">
              <X className="h-4 w-4" />
              {t('notIncluded')}
            </h3>
            <ul className="space-y-2">
              {tour.notIncluded.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-700 lg:text-[13px]">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" />
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What to Bring */}
        {tour.whatToBring && tour.whatToBring.length > 0 && (
          <div className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 lg:rounded-xl lg:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--color-text)] lg:text-sm">
              <Lightbulb className="h-4 w-4 text-[var(--color-secondary)]" />
              {t('whatToBring')}
            </h3>
            <ul className="space-y-2">
              {tour.whatToBring.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)] lg:text-[13px]">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-secondary)] lg:h-4 lg:w-4" />
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
