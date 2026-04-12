/**
 * Bio section for guide detail page — heading + rich text only.
 * Credentials and specializations are now in the sidebar component.
 */

import { getTranslations } from 'next-intl/server'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { GuideDetail } from '@/lib/api/get-guide-by-slug'

interface GuideDetailBioProps {
  guide: GuideDetail
}

export async function GuideDetailBio({ guide }: GuideDetailBioProps) {
  const t = await getTranslations('guides')

  if (!guide.bio) return null

  return (
    <section>
      <h2 className="font-serif text-[22px] font-bold text-[var(--color-primary)] lg:text-[32px]">
        {t('about', { name: guide.name })}
      </h2>
      <div className="prose mt-4 max-w-none text-[14px] leading-[1.65] text-[var(--color-text-muted)] lg:text-[15px] lg:leading-[1.7]">
        <RichText data={guide.bio} />
      </div>
    </section>
  )
}
