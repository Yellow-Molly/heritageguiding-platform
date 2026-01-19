import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Languages } from 'lucide-react'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface GuideCardProps {
  guide: NonNullable<TourDetail['guide']>
}

/**
 * Guide bio card component for tour detail page.
 */
export async function GuideCard({ guide }: GuideCardProps) {
  const t = await getTranslations('tourDetail.guide')

  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
        {t('title')}
      </h2>
      <Card className="mt-4">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
          {/* Guide Photo */}
          {guide.photo && (
            <div className="relative h-24 w-24 shrink-0 self-center sm:self-start">
              <Image
                src={guide.photo.url}
                alt={guide.photo.alt || guide.name}
                fill
                className="rounded-full object-cover"
                sizes="96px"
              />
            </div>
          )}

          {/* Guide Info */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[var(--color-primary)]">{guide.name}</h3>

            {/* Credentials */}
            {guide.credentials && guide.credentials.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {guide.credentials.map((cred, i) => (
                  <Badge key={i} variant="outline">
                    {cred.credential}
                  </Badge>
                ))}
              </div>
            )}

            {/* Languages */}
            {guide.languages && guide.languages.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Languages className="h-4 w-4" />
                <span>
                  {t('speaks')}: {guide.languages.join(', ')}
                </span>
              </div>
            )}

            {/* Bio */}
            <p className="mt-4 text-[var(--color-text-muted)]">{guide.bio}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
