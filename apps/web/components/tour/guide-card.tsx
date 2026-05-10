import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface GuideCardProps {
  guide: TourDetail['guides'][number]
}

/**
 * Guide bio card body — horizontal layout: avatar (80px circle) + name/meta/bio.
 * Credentials and languages merged into a single " · " separated line.
 * Section heading is owned by GuidesSection (parent) to support pluralization.
 */
export function GuideCard({ guide }: GuideCardProps) {
  // Merge credentials + languages into one meta line
  const metaParts: string[] = []
  if (guide.credentials) {
    metaParts.push(...guide.credentials.map((c) => c.credential))
  }
  if (guide.languages && guide.languages.length > 0) {
    metaParts.push(guide.languages.join(', '))
  }

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] lg:p-6"
    >
      {/* Avatar */}
      {guide.photo?.url && (
        <div className="relative h-20 w-20 shrink-0">
          <Image
            src={guide.photo.url}
            alt={guide.photo.alt || guide.name}
            fill
            placeholder={guide.photo.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={guide.photo.blurDataUrl}
            className="rounded-full object-cover"
            sizes="80px"
          />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)] underline-offset-2 group-hover:underline lg:text-[22px]">
          {guide.name}
        </h3>

        {metaParts.length > 0 && (
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            {metaParts.join(' · ')}
          </p>
        )}

        {guide.bio && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text)]">
            {guide.bio}
          </p>
        )}
      </div>
    </Link>
  )
}
