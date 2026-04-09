import { getTranslations } from 'next-intl/server'
import { getRelatedTours } from '@/lib/api/get-related-tours'
import { RelatedTourCard } from './related-tour-card'

interface RelatedToursProps {
  currentTourId: string
  categories?: Array<{ id: string; slug: string; name: string }>
}

/**
 * Related tours section with compact horizontal cards.
 * Alt background, 4 cards on desktop, 2 tablet, 1 mobile.
 */
export async function RelatedTours({ currentTourId, categories }: RelatedToursProps) {
  const t = await getTranslations('tourDetail')
  const tours = await getRelatedTours(currentTourId, categories, 4)

  if (tours.length === 0) return null

  return (
    <section className="bg-[var(--color-background-alt)] py-12 lg:px-20 lg:py-12">
      <div className="container lg:px-0">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--color-primary)] lg:text-[28px]">
          {t('relatedTours')}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tours.map((tour) => (
            <RelatedTourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  )
}
