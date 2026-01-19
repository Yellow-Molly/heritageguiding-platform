import { getTranslations } from 'next-intl/server'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourContentProps {
  tour: TourDetail
}

/**
 * Main content section for tour detail page.
 * Displays emotional description and highlights.
 */
export async function TourContent({ tour }: TourContentProps) {
  const t = await getTranslations('tourDetail')

  return (
    <div className="space-y-8">
      {/* Emotional Description */}
      <section>
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--color-primary)]">
          <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
          {t('sections.experience')}
        </h2>
        {tour.descriptionHtml ? (
          <div
            className="prose prose-lg mt-4 max-w-none text-[var(--color-text-muted)]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.descriptionHtml) }}
          />
        ) : (
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-muted)]">
            {tour.description}
          </p>
        )}
      </section>

      {/* Tour Highlights */}
      {tour.highlights && tour.highlights.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[var(--color-primary)]">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {t('sections.highlights')}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {tour.highlights.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span className="text-[var(--color-text)]">{item.highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Accessibility Info */}
      {tour.accessibility && (
        <section>
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
            {t('sections.accessibility')}
          </h2>
          <div className="mt-4 space-y-2 text-[var(--color-text-muted)]">
            {tour.accessibility.wheelchairAccessible && (
              <p className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {t('accessibility.wheelchair')}
              </p>
            )}
            {tour.accessibility.hearingAccessible && (
              <p className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {t('accessibility.hearing')}
              </p>
            )}
            {tour.accessibility.visualAccessible && (
              <p className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {t('accessibility.visual')}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
