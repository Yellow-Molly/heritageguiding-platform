import { getTranslations } from 'next-intl/server'
import { getRelatedTours } from '@/lib/api/get-related-tours'
import { TourCard } from './tour-card'

interface RelatedToursProps {
  currentTourId: string
  categories?: Array<{ id: string; slug: string; name: string }>
}

/**
 * Related tours section using category matching.
 */
export async function RelatedTours({ currentTourId, categories }: RelatedToursProps) {
  const t = await getTranslations('tourDetail')
  const tours = await getRelatedTours(currentTourId, categories, 3)

  if (tours.length === 0) return null

  return (
    <section className="bg-[var(--color-surface)] py-12">
      <div className="container">
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
          {t('relatedTours')}
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  )
}
