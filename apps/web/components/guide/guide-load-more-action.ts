'use server'

import { getCachedGuides, type GuideListItem } from '@/lib/api/get-guides'

const VALID_LOCALES = ['sv', 'en', 'de'] as const

/**
 * Server action for infinite scroll — fetches next page of guides.
 * Returns guides array + hasMore flag (same pattern as tour-actions.ts).
 */
export async function fetchMoreGuides(
  filterString: string,
  page: number,
  locale: string,
): Promise<{ guides: GuideListItem[]; hasMore: boolean }> {
  if (!VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])) {
    return { guides: [], hasMore: false }
  }
  const params = new URLSearchParams(filterString)
  const result = await getCachedGuides(
    {
      q: params.get('q') || undefined,
      language: params.get('language') || undefined,
      specialization: params.get('specialization') || undefined,
      area: params.get('area') || undefined,
      page: String(page),
      limit: '9',
    },
    locale,
  )
  return {
    guides: result.guides,
    hasMore: result.page < result.totalPages,
  }
}
