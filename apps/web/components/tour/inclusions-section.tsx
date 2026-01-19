import { getTranslations } from 'next-intl/server'
import { Check, X, Lightbulb } from 'lucide-react'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface InclusionsSectionProps {
  tour: TourDetail
}

/**
 * Inclusions section displaying what is/isn't included and what to bring.
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
      <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
        {t('title')}
      </h2>

      <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* What is Included */}
        {tour.included && tour.included.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-800">
              <Check className="h-5 w-5" />
              {t('included')}
            </h3>
            <ul className="space-y-2">
              {tour.included.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What is NOT Included */}
        {tour.notIncluded && tour.notIncluded.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-800">
              <X className="h-5 w-5" />
              {t('notIncluded')}
            </h3>
            <ul className="space-y-2">
              {tour.notIncluded.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What to Bring */}
        {tour.whatToBring && tour.whatToBring.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-800">
              <Lightbulb className="h-5 w-5" />
              {t('whatToBring')}
            </h3>
            <ul className="space-y-2">
              {tour.whatToBring.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
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
