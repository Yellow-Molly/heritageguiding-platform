'use client'

import Image from 'next/image'
import { Languages, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/navigation'
import type { GuideListItem } from '@/lib/api/get-guides'
import { languageDisplayNames } from '@/lib/language-display-names'

interface GuideListingCardProps {
  guide: GuideListItem
}

/**
 * Guide card for the listing page.
 * Shows photo, name, specializations, languages, operating areas.
 */
export function GuideListingCard({ guide }: GuideListingCardProps) {
  const allLanguages = [...guide.languages, ...(guide.additionalLanguages ?? [])]

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]">
      <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        {/* Guide Photo */}
        {guide.photo ? (
          <div className="relative h-24 w-24 shrink-0">
            <Image
              src={guide.photo.url}
              alt={guide.photo.alt}
              fill
              className="rounded-full object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-alt)] text-2xl font-bold text-[var(--color-text-muted)]">
            {guide.name.charAt(0)}
          </div>
        )}

        {/* Guide Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-accent)]">
            <Link href={`/guides/${guide.slug}`} className="hover:underline">
              {guide.name}
            </Link>
          </h3>

          {/* Specializations */}
          {guide.specializations.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {guide.specializations.slice(0, 3).map((spec) => (
                <Badge key={spec.id} variant="outline" size="sm">
                  {spec.name}
                </Badge>
              ))}
              {guide.specializations.length > 3 && (
                <Badge variant="outline" size="sm">+{guide.specializations.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Languages */}
          {allLanguages.length > 0 && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-muted)] sm:justify-start">
              <Languages className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">
                {allLanguages.map((l) => languageDisplayNames[l] ?? l).join(', ')}
              </span>
            </div>
          )}

          {/* Operating Areas */}
          {guide.operatingAreas.length > 0 && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-muted)] sm:justify-start">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">
                {guide.operatingAreas.map((a) => a.name).join(', ')}
              </span>
            </div>
          )}

          {/* Bio Excerpt */}
          {guide.bioExcerpt && (
            <p className="mt-2.5 line-clamp-2 text-sm text-[var(--color-text-muted)]">
              {guide.bioExcerpt}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
