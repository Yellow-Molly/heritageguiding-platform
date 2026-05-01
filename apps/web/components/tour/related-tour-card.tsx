import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { formatDuration, formatPrice } from '@/lib/utils'
import { NavigationPending } from '@/components/shared/navigation-pending'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

interface RelatedTourCardProps {
  tour: FeaturedTour
}

/**
 * Compact horizontal card for related tours section.
 * 100x80 thumbnail left + title/meta right.
 */
export function RelatedTourCard({ tour }: RelatedTourCardProps) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="rounded-xl bg-[var(--color-surface)] p-4 shadow-[0_2px_12px_#0000000A] transition-shadow hover:shadow-md block"
    >
      <NavigationPending className="flex gap-4">
      {/* Thumbnail */}
      {tour.image?.url && (
        <div className="relative h-20 w-[100px] shrink-0 overflow-hidden rounded-lg">
          <Image
            src={tour.image.url}
            alt={tour.image.alt || tour.title}
            fill
            placeholder={tour.image.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={tour.image.blurDataUrl}
            className="object-cover"
            sizes="100px"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="line-clamp-2 font-serif text-[15px] font-medium text-[var(--color-primary)]">
          {tour.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {tour.rating > 0 && <>{tour.rating}★ · </>}{formatDuration(tour.duration)} · {formatPrice(tour.price)}
        </p>
      </div>
      </NavigationPending>
    </Link>
  )
}
