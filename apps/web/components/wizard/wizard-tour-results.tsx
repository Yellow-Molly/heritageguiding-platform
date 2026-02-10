import { useTranslations } from 'next-intl'
import { TourCard } from '@/components/tour/tour-card'
import { SkeletonCard } from '@/components/ui/skeleton'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

interface WizardTourResultsProps {
  tours: FeaturedTour[]
  loading: boolean
}

/** Displays recommended tour results or loading/empty states */
export function WizardTourResults({ tours, loading }: WizardTourResultsProps) {
  const t = useTranslations('wizard.results')

  if (loading) {
    return (
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (tours.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-lg text-[var(--color-text-muted)]">{t('noResults')}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-center text-[var(--color-primary)] md:text-3xl">
        {t('title')}
      </h2>
      <p className="mt-2 text-center text-[var(--color-text-muted)]">
        {t('subtitle', { count: tours.length })}
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  )
}
