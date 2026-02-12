import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuideDetail } from '@/lib/api/get-guide-by-slug'

interface GuideDetailContentProps {
  guide: GuideDetail
}

/**
 * Content section for guide detail page.
 * Shows bio (rich text), credentials, and specialization badges.
 */
export async function GuideDetailContent({ guide }: GuideDetailContentProps) {
  const t = await getTranslations('guides')

  return (
    <div className="space-y-10">
      {/* Bio Section */}
      {guide.bio ? (
        <section>
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
            {t('about', { name: guide.name })}
          </h2>
          <div className="prose mt-4 max-w-none text-[var(--color-text-muted)]">
            <RichText data={guide.bio} />
          </div>
        </section>
      ) : null}

      {/* Credentials */}
      {guide.credentials && guide.credentials.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
            {t('credentials')}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.credentials.map((cred, i) => (
              <Badge key={i} variant="outline" size="lg">
                {cred.credential}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Specializations */}
      {guide.specializations.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-primary)]">
            {t('specializations')}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {guide.specializations.map((spec) => (
              <Badge key={spec.id} variant="secondary" size="lg">
                {spec.name}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
