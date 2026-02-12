import Image from 'next/image'
import { Clock, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { formatDuration, formatPrice } from '@/lib/utils'
import type { GuideDetail } from '@/lib/api/get-guide-by-slug'

interface GuideToursSectionProps {
  tours: GuideDetail['tours']
  guideName: string
}

/**
 * Section showing tours led by this guide on the detail page.
 * Renders a grid of simplified tour cards.
 */
export async function GuideToursSection({ tours, guideName }: GuideToursSectionProps) {
  const t = await getTranslations('guides')

  if (tours.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
          {t('toursBy', { name: guideName })}
        </h2>
        <p className="mt-4 text-[var(--color-text-muted)]">{t('noTours')}</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
        {t('toursBy', { name: guideName })}
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <Card key={tour.id} className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]">
            {/* Tour Image */}
            {tour.image && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={tour.image.url}
                  alt={tour.image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Price Badge */}
                <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    {formatPrice(tour.price)}
                  </span>
                </div>
              </div>
            )}
            <CardContent className="p-4">
              {/* Rating */}
              {tour.rating > 0 && (
                <div className="mb-2 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[var(--color-secondary)] text-[var(--color-secondary)]" />
                  <span className="text-sm font-medium">{tour.rating}</span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    ({tour.reviewCount})
                  </span>
                </div>
              )}
              {/* Title */}
              <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                <Link href={`/tours/${tour.slug}`} className="hover:underline">
                  {tour.title}
                </Link>
              </h3>
              {/* Duration */}
              {tour.duration > 0 && (
                <div className="mt-2 flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(tour.duration)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
