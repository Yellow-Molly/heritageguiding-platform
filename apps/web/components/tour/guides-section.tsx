import { getTranslations } from 'next-intl/server'
import { GuideCard } from './guide-card'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface GuidesSectionProps {
  guides: TourDetail['guides']
}

/**
 * Wraps one or more GuideCards with a pluralized section heading.
 * Renders nothing if guides array is empty (defensive; CMS requires >=1).
 */
export async function GuidesSection({ guides }: GuidesSectionProps) {
  if (guides.length === 0) return null
  const t = await getTranslations('tourDetail.guides')

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-[var(--color-primary)] lg:text-[22px]">
        {t('title', { count: guides.length })}
      </h2>
      <div className="mt-4 space-y-4">
        {guides.map((g) => (
          <GuideCard key={g.id} guide={g} />
        ))}
      </div>
    </section>
  )
}
