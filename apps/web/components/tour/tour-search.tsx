'use client'

import { useTransition } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebouncedCallback } from '@/lib/hooks/use-debounce'

/**
 * Search input component for tour catalog.
 * Debounces input to avoid excessive URL updates.
 */
export function TourSearch() {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    // Reset to page 1 when search changes
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, 300)

  return (
    <div className="relative">
      <Input
        type="search"
        defaultValue={searchParams.get('q') || ''}
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
