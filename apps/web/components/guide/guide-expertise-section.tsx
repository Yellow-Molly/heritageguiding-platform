/**
 * Guide expertise section — bullet list of specialty descriptions.
 * Displayed in right column of guide detail page below bio.
 * Returns null when no specialtyDescriptions are provided.
 */

import { Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface GuideExpertiseSectionProps {
  specialtyDescriptions?: Array<{ description: string }>
}

export async function GuideExpertiseSection({ specialtyDescriptions }: GuideExpertiseSectionProps) {
  const t = await getTranslations('guides')

  if (!specialtyDescriptions || specialtyDescriptions.length === 0) return null

  return (
    <section aria-labelledby="guide-expertise">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--color-secondary)]" />
        <h2 id="guide-expertise" className="font-serif text-[22px] font-bold text-[var(--color-primary)]">
          {t('expertise.title')}
        </h2>
      </div>
      <ul className="mt-4 space-y-2 pl-[18px]">
        {specialtyDescriptions.map((item, i) => (
          <li
            key={i}
            className="list-disc text-[14px] leading-[1.65] text-[var(--color-text-muted)] marker:text-[var(--color-secondary)] lg:text-[15px]"
          >
            {item.description}
          </li>
        ))}
      </ul>
    </section>
  )
}
