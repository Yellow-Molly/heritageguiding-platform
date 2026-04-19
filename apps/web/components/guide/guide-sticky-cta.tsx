'use client'

/**
 * Guide sticky CTA — fixed bottom bar on mobile only (hidden on lg+).
 * Scrolls to the #tours anchor on the guide detail page.
 * Uses plain next/link to avoid locale-prefixing the hash-only href.
 */

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface GuideStickyCTAProps {
  guideName: string
}

export function GuideStickyCta({ guideName }: GuideStickyCTAProps) {
  const t = useTranslations('guides')

  return (
    <nav aria-label={t('bookTour', { name: guideName })} className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
      <Link
        href="#tours"
        className="block w-full rounded-lg bg-[var(--color-primary)] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        {t('bookTour', { name: guideName })}
      </Link>
    </nav>
  )
}
