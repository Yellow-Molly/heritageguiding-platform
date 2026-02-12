import Image from 'next/image'
import { Languages, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTranslations } from 'next-intl/server'
import type { GuideDetail } from '@/lib/api/get-guide-by-slug'
import { languageDisplayNames } from '@/lib/language-display-names'

interface GuideDetailHeaderProps {
  guide: GuideDetail
}

/**
 * Header section for guide detail page.
 * Shows large photo, name, status (on-leave only), languages, operating areas.
 */
export async function GuideDetailHeader({ guide }: GuideDetailHeaderProps) {
  const t = await getTranslations('guides')
  const allLanguages = [...guide.languages, ...(guide.additionalLanguages ?? [])]

  return (
    <section className="bg-[var(--color-background-alt)] py-10 lg:py-14">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 md:flex-row md:items-start md:gap-10">
        {/* Guide Photo */}
        {guide.photo ? (
          <div className="relative h-32 w-32 shrink-0 md:h-40 md:w-40">
            <Image
              src={guide.photo.url}
              alt={guide.photo.alt}
              fill
              className="rounded-full object-cover"
              sizes="(max-width: 768px) 128px, 160px"
              priority
            />
          </div>
        ) : (
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white text-4xl font-bold text-[var(--color-text-muted)] md:h-40 md:w-40">
            {guide.name.charAt(0)}
          </div>
        )}

        {/* Guide Info */}
        <div className="text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <h1 className="font-serif text-3xl font-bold text-[var(--color-primary)] lg:text-4xl">
              {guide.name}
            </h1>
            {guide.status === 'on-leave' && (
              <Badge variant="warning" size="md">{t('onLeave')}</Badge>
            )}
          </div>

          {/* Languages */}
          {allLanguages.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[var(--color-text-muted)] md:justify-start">
              <Languages className="h-5 w-5 shrink-0" />
              <span>{allLanguages.map((l) => languageDisplayNames[l] ?? l).join(', ')}</span>
            </div>
          )}

          {/* Operating Areas */}
          {guide.operatingAreas.length > 0 && (
            <div className="mt-2 flex items-center justify-center gap-2 text-[var(--color-text-muted)] md:justify-start">
              <MapPin className="h-5 w-5 shrink-0" />
              <span>{guide.operatingAreas.map((a) => a.name).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
