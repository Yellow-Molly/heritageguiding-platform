'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GuideListItem } from '@/lib/api/get-guides'
import { fetchMoreGuides } from './guide-load-more-action'

interface GuideLoadMoreButtonProps {
  nextPage: number
  filters: string
  onLoaded: (guides: GuideListItem[]) => void
}

/**
 * Load more button that fetches the next page of guides via server action.
 */
export function GuideLoadMoreButton({ nextPage, filters, onLoaded }: GuideLoadMoreButtonProps) {
  const t = useTranslations('guides')
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await fetchMoreGuides(filters, nextPage)
      onLoaded(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline-dark" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {t('loadMore')}
    </Button>
  )
}
