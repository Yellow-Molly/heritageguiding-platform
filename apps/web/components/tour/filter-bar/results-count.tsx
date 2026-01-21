'use client'

import { useTranslations } from 'next-intl'

interface ResultsCountProps {
  count: number
}

/**
 * Displays tour results count with proper pluralization.
 */
export function ResultsCount({ count }: ResultsCountProps) {
  const t = useTranslations('tours.filters')

  return (
    <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
      {t('resultsCount', { count })}
    </span>
  )
}
