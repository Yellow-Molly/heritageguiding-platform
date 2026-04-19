/**
 * Guide guest feedback section — displays what guests appreciate about this guide.
 * Rendered in a warm background card to visually distinguish testimonial content.
 * Returns null when whatGuestsAppreciate is not populated.
 */

import { Heart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface GuideGuestFeedbackSectionProps {
  whatGuestsAppreciate?: string | null
}

export async function GuideGuestFeedbackSection({ whatGuestsAppreciate }: GuideGuestFeedbackSectionProps) {
  const t = await getTranslations('guides')

  if (!whatGuestsAppreciate) return null

  return (
    <section aria-labelledby="guide-guest-feedback" className="rounded-2xl bg-[var(--color-background-alt)] p-6 lg:p-7">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-[var(--color-secondary)]" />
        <h2 id="guide-guest-feedback" className="font-serif text-[22px] font-bold text-[var(--color-primary)]">
          {t('guestFeedback.title')}
        </h2>
      </div>
      <p className="mt-4 text-[14px] leading-[1.65] text-[var(--color-text-muted)] lg:text-[15px] lg:leading-[1.7]">
        {whatGuestsAppreciate}
      </p>
    </section>
  )
}
