import { getTranslations } from 'next-intl/server'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourContentProps {
  tour: TourDetail
}

/**
 * Experience section for tour detail page.
 * Displays emotional description and accessibility info.
 * Highlights are now in a separate TourHighlightsSection component.
 */
export async function TourContent({ tour }: TourContentProps) {
  const t = await getTranslations('tourDetail')

  return (
    <div className="space-y-8">
      {/* The Experience */}
      <section>
        <h2 className="font-serif text-[22px] font-semibold text-[var(--color-primary)] lg:text-[28px]">
          {t('sections.experience')}
        </h2>
        {/* Mobile: CSS-only Read More using checkbox hack (no client JS needed).
            ID uses tour.id for uniqueness — safe as long as only one TourContent per page. */}
        <div className="group/readmore mt-4 lg:contents">
          <input type="checkbox" id={`read-more-${tour.id}`} className="peer hidden" aria-hidden="true" />
          {tour.descriptionHtml ? (
            <div
              className="prose max-w-none text-sm leading-[1.7] text-[var(--color-text)] line-clamp-[8] peer-checked:line-clamp-none lg:line-clamp-none lg:text-base"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.descriptionHtml) }}
            />
          ) : (
            <p className="text-sm leading-[1.7] text-[var(--color-text)] line-clamp-[8] peer-checked:line-clamp-none lg:line-clamp-none lg:text-base">
              {tour.description}
            </p>
          )}
          {/* Read More — visible when collapsed */}
          <label
            htmlFor={`read-more-${tour.id}`}
            className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-accent)] peer-checked:hidden lg:hidden"
          >
            {t('readMore')}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </label>
          {/* Read Less — visible when expanded */}
          <label
            htmlFor={`read-more-${tour.id}`}
            className="mt-2 hidden cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-accent)] peer-checked:inline-flex lg:!hidden"
          >
            {t('readLess')}
            <svg className="h-4 w-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </label>
        </div>
      </section>

      {/* Accessibility Info */}
      {tour.accessibility && (
        <section>
          <h2 className="font-serif text-[22px] font-semibold text-[var(--color-primary)] lg:text-[28px]">
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
