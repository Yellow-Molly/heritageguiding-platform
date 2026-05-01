'use client'

import Image from 'next/image'
import { Globe, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { NavigationPending } from '@/components/shared/navigation-pending'
import type { GuideListItem } from '@/lib/api/get-guides'
import { languageDisplayNames } from '@/lib/language-display-names'

interface GuideListingCardProps {
  guide: GuideListItem
  /** Mark the photo as LCP candidate — eager + fetchpriority=high. Set true for first cards above the fold. */
  priority?: boolean
}

/**
 * Portrait gallery card for the guides listing page.
 * Circular photo, centered content, stats line with credential-first logic.
 */
export function GuideListingCard({ guide, priority = false }: GuideListingCardProps) {
  const allLanguages = [...guide.languages, ...(guide.additionalLanguages ?? [])]

  // Credential-first: first credential > yearsExperience > null
  const experienceStat = guide.credentials?.[0]?.credential
    ?? (guide.yearsExperience ? `${guide.yearsExperience}+ years` : null)

  return (
    <Link href={`/guides/${guide.slug}`} className="block">
      <NavigationPending>
      <Card className="group overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] lg:rounded-[20px]">
        <CardContent className="flex flex-col items-center px-4 pb-4 pt-7 lg:px-6 lg:pb-6 lg:pt-10">
          {/* Circular photo */}
          {guide.photo ? (
            <div className="relative h-[120px] w-[120px] shrink-0 lg:h-[160px] lg:w-[160px]">
              <Image
                src={guide.photo.url}
                alt={guide.photo.alt}
                fill
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                placeholder={guide.photo.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={guide.photo.blurDataUrl}
                className="rounded-full object-cover ring-2 ring-[var(--color-secondary-light)] lg:ring-[3px]"
                sizes="(min-width: 1024px) 160px, 120px"
              />
            </div>
          ) : (
            <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full bg-[var(--color-background-alt)] text-3xl font-bold text-[var(--color-text-muted)] ring-2 ring-[var(--color-secondary-light)] lg:h-[160px] lg:w-[160px] lg:text-4xl lg:ring-[3px]">
              {guide.name.charAt(0)}
            </div>
          )}

          {/* Name */}
          <h3 className="mt-4 text-center font-serif text-[20px] font-bold text-[var(--color-primary)] lg:text-[22px]">
            {guide.name}
          </h3>

          {/* Specialization tags (max 2) */}
          {guide.specializations.length > 0 && (
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {guide.specializations.slice(0, 2).map((spec) => (
                <span
                  key={spec.id}
                  className="rounded-[10px] bg-[var(--color-background-alt)] px-2 py-0.5 text-[10px] lg:rounded-xl lg:px-2.5 lg:py-1 lg:text-[11px]"
                >
                  {spec.name}
                </span>
              ))}
            </div>
          )}

          {/* Bio excerpt */}
          {guide.bioExcerpt && (
            <p className="mt-3 line-clamp-2 w-full text-center text-[12px] italic leading-[1.5] text-[var(--color-text-muted)] lg:text-[13px] lg:leading-[1.6]">
              &ldquo;{guide.bioExcerpt}&rdquo;
            </p>
          )}

          {/* Info section */}
          <div className="mt-3 w-full border-t border-[var(--color-border-light)] pt-2.5 lg:pt-3">
            {/* Languages */}
            {allLanguages.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--color-text-muted)] lg:text-[13px]">
                <Globe className="h-3 w-3 shrink-0 text-[var(--color-text-light)] lg:h-[13px] lg:w-[13px]" />
                <span className="line-clamp-1">
                  {allLanguages.map((l) => languageDisplayNames[l] ?? l).join(', ')}
                </span>
              </div>
            )}

            {/* Operating areas */}
            {guide.operatingAreas.length > 0 && (
              <div className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[var(--color-text-muted)] lg:text-[13px]">
                <MapPin className="h-3 w-3 shrink-0 text-[var(--color-text-light)] lg:h-[13px] lg:w-[13px]" />
                <span className="line-clamp-1">
                  {guide.operatingAreas.map((a) => a.name).join(', ')}
                </span>
              </div>
            )}

            {/* Stats line: credential or years experience */}
            {experienceStat && (
              <p className="mt-2 text-center text-[12px] text-[var(--color-text-muted)]">
                {experienceStat}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </NavigationPending>
    </Link>
  )
}
