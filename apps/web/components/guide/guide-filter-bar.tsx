'use client'

import { useTransition } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Loader2, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebouncedCallback } from '@/lib/hooks/use-debounce'
import { languageDisplayNames } from '@/lib/language-display-names'
import { GuideFilterDrawerMobile } from './guide-filter-drawer-mobile'

interface GuideFilterBarProps {
  totalGuides: number
  languages: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  areas: Array<{ id: string; name: string; slug: string }>
}

/**
 * Filter bar for guides listing: search input + desktop dropdowns + mobile filter button.
 * Syncs all filter state to URL search params for shareable, SSR-compatible URLs.
 */
export function GuideFilterBar({ totalGuides, languages, specializations, areas }: GuideFilterBarProps) {
  const t = useTranslations('guides.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleSearch = useDebouncedCallback((term: string) => {
    updateParam('q', term.trim())
  }, 300)

  return (
    <div className="space-y-3">
      {/* Search row: input + mobile filter button beside it */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="search"
            defaultValue={searchParams.get('q') || ''}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('search')}
            leftIcon={
              isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />
            }
            aria-label={t('search')}
          />
        </div>

        {/* Mobile-only: filter button next to search */}
        <div className="shrink-0 lg:hidden">
          <GuideFilterDrawerMobile
            languages={languages}
            specializations={specializations}
            areas={areas}
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2.5 text-sm font-medium text-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('showFilters')}
              </button>
            }
          />
        </div>
      </div>

      {/* Desktop dropdowns + count */}
      <div className="hidden items-center gap-3 lg:flex">
        <select
          value={searchParams.get('language') || ''}
          onChange={(e) => updateParam('language', e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          aria-label={t('language')}
        >
          <option value="">{t('language')}</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{languageDisplayNames[lang] ?? lang}</option>
          ))}
        </select>

        <select
          value={searchParams.get('specialization') || ''}
          onChange={(e) => updateParam('specialization', e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          aria-label={t('specialization')}
        >
          <option value="">{t('specialization')}</option>
          {specializations.map((spec) => (
            <option key={spec.id} value={spec.slug}>{spec.name}</option>
          ))}
        </select>

        <select
          value={searchParams.get('area') || ''}
          onChange={(e) => updateParam('area', e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          aria-label={t('area')}
        >
          <option value="">{t('area')}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.slug}>{area.name}</option>
          ))}
        </select>

        <span className="ml-auto text-sm text-[var(--color-text-muted)]">
          {t('count', { count: totalGuides })}
        </span>
      </div>

      {/* Mobile count */}
      <p className="text-sm text-[var(--color-text-muted)] lg:hidden">
        {t('count', { count: totalGuides })}
      </p>
    </div>
  )
}
