/**
 * Guide approach section — displays the guide's personal guiding style/methodology.
 * Returns null when guideStyle is not populated.
 */

import { Compass } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface GuideApproachSectionProps {
  guideStyle?: string | null
}

export async function GuideApproachSection({ guideStyle }: GuideApproachSectionProps) {
  const t = await getTranslations('guides')

  if (!guideStyle) return null

  return (
    <section aria-labelledby="guide-approach">
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-[var(--color-secondary)]" />
        <h2 id="guide-approach" className="font-serif text-[22px] font-bold text-[var(--color-primary)]">
          {t('approach.title')}
        </h2>
      </div>
      <p className="mt-4 text-[14px] leading-[1.65] text-[var(--color-text-muted)] lg:text-[15px] lg:leading-[1.7]">
        {guideStyle}
      </p>
    </section>
  )
}
