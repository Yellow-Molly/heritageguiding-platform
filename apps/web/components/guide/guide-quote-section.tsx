/**
 * Guide quote section — decorative blockquote card with optional body text.
 * Uses gold border and serif typography to highlight the guide's signature quote.
 * Returns null when no quote is provided.
 */

import { getTranslations } from 'next-intl/server'

interface GuideQuoteSectionProps {
  quote?: string | null
  body?: string | null
  guideName: string
}

export async function GuideQuoteSection({ quote, body, guideName }: GuideQuoteSectionProps) {
  const t = await getTranslations('guides')

  if (!quote) return null

  return (
    <section aria-label={t('quote.attribution', { name: guideName })} className="rounded-2xl border-[1.5px] border-[var(--color-secondary)] bg-[var(--color-surface)] p-6 lg:p-8">
      {/* Large decorative quote mark */}
      <span className="select-none font-serif text-[64px] leading-[0.5] text-[var(--color-secondary)]">
        &ldquo;
      </span>
      <blockquote className="mt-2 font-serif text-[18px] font-medium italic leading-[1.5] text-[var(--color-primary)] lg:text-[20px]">
        {quote}
      </blockquote>
      {/* Gold divider */}
      <div className="my-4 h-0.5 w-10 bg-[var(--color-secondary)]" />
      {body && (
        <p className="text-[14px] leading-[1.7] text-[var(--color-text-muted)] lg:text-[15px]">
          {body}
        </p>
      )}
      <p className="mt-3 text-[13px] font-semibold text-[var(--color-secondary)]">
        {t('quote.attribution', { name: guideName })}
      </p>
    </section>
  )
}
