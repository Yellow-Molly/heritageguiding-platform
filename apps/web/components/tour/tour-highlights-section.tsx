import { getTranslations } from 'next-intl/server'
import { CircleCheck } from 'lucide-react'

interface TourHighlightsSectionProps {
  highlights: Array<{ highlight: string }>
}

/**
 * Dedicated highlights section with checkmark items.
 * Desktop: 2-column grid. Mobile: single column with alt background.
 */
export async function TourHighlightsSection({ highlights }: TourHighlightsSectionProps) {
  if (!highlights || highlights.length === 0) return null

  const t = await getTranslations('tourDetail.sections')

  return (
    <section className="-mx-5 bg-[var(--color-background-alt)] px-5 py-6 lg:mx-0 lg:bg-transparent lg:p-0">
      <h2 className="font-serif text-xl font-semibold text-[var(--color-primary)] lg:text-2xl">
        {t('highlights')}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
        {highlights.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 lg:h-5 lg:w-5" />
            <span className="text-[13px] text-[var(--color-text)] lg:text-sm">{item.highlight}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
