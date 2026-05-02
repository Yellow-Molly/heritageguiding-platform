'use client'

import { useTranslations } from 'next-intl'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebouncedCallback } from '@/lib/hooks/use-debounce'
import { useFilterState } from './filter-state-provider'

/**
 * Search input for tour catalog.
 * 500ms debounce, uses replace (no history pollution).
 * Read initial value from optimistic params via FilterStateProvider.
 */
export function TourSearch() {
  const t = useTranslations('tours.filters')
  const { params, isPending, setParam } = useFilterState()

  const handleSearch = useDebouncedCallback((term: string) => {
    setParam('q', term.trim() || null, { replace: true })
  }, 500)

  return (
    <div className="relative">
      <Input
        type="search"
        defaultValue={params.get('q') || ''}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        leftIcon={
          isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )
        }
        aria-label={t('searchLabel')}
      />
    </div>
  )
}
