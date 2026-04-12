'use server'

import { getGuides, type GuideListItem } from '@/lib/api/get-guides'

/**
 * Server action to fetch the next page of guides for load-more.
 * Parses URL search params string to reconstruct filters.
 */
export async function fetchMoreGuides(
  filterString: string,
  page: number
): Promise<GuideListItem[]> {
  const params = new URLSearchParams(filterString)
  const result = await getGuides(
    {
      q: params.get('q') || undefined,
      language: params.get('language') || undefined,
      specialization: params.get('specialization') || undefined,
      area: params.get('area') || undefined,
      page: String(page),
      limit: '9',
    },
    params.get('locale') || 'en'
  )
  return result.guides
}
