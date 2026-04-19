import { getTranslations } from 'next-intl/server'
import { TourCard } from '@/components/tour/tour-card'
import type { GuideDetail } from '@/lib/api/get-guide-by-slug'

interface GuideToursSectionProps {
  tours: GuideDetail['tours']
  guideName: string
}

/**
 * Tours grid for guide detail page.
 * Reuses TourCard from tours listing — 3-col desktop, 2-col tablet, 1-col mobile.
 */
export async function GuideToursSection({ tours, guideName }: GuideToursSectionProps) {
  const t = await getTranslations('guides')

  if (tours.length === 0) {
    return (
      <section id="tours">
        <h2 className="font-serif text-[28px] font-bold text-[var(--color-primary)]">
          {t('toursBy', { name: guideName })}
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">{t('noTours')}</p>
      </section>
    )
  }

  return (
    <section id="tours">
      <h2 className="font-serif text-[28px] font-bold text-[var(--color-primary)]">
        {t('toursBy', { name: guideName })}
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  )
}
