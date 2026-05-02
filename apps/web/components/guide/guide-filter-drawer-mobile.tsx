'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { languageDisplayNames } from '@/lib/language-display-names'
import { useFilterState } from '@/components/tour/filter-state-provider'

interface GuideFilterDrawerMobileProps {
  languages: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  areas: Array<{ id: string; name: string; slug: string }>
  trigger: ReactNode
}

/**
 * Mobile filter drawer for guide listing.
 * Per-change commit — selecting an option fires `setParam` immediately;
 * the close/apply button only dismisses the drawer.
 */
export function GuideFilterDrawerMobile({
  languages,
  specializations,
  areas,
  trigger,
}: GuideFilterDrawerMobileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('guides.filters')
  const { params, setParam, clearAll } = useFilterState()

  const handleClear = () => {
    clearAll()
    setIsOpen(false)
  }

  const selectClass =
    'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm'

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 bg-[var(--color-surface)] shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('showFilters')}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] p-4">
            <h2 className="text-lg font-semibold text-[var(--color-primary)]">{t('showFilters')}</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('language')}</label>
              <select
                value={params.get('language') || ''}
                onChange={(e) => setParam('language', e.target.value || null)}
                className={selectClass}
              >
                <option value="">{t('language')}</option>
                {languages.map((l) => (
                  <option key={l} value={l}>{languageDisplayNames[l] ?? l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('specialization')}</label>
              <select
                value={params.get('specialization') || ''}
                onChange={(e) => setParam('specialization', e.target.value || null)}
                className={selectClass}
              >
                <option value="">{t('specialization')}</option>
                {specializations.map((s) => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('area')}</label>
              <select
                value={params.get('area') || ''}
                onChange={(e) => setParam('area', e.target.value || null)}
                className={selectClass}
              >
                <option value="">{t('area')}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.slug}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[var(--color-border)] p-4">
            <div className="flex gap-3">
              <Button variant="outline-dark" onClick={handleClear} className="flex-1">{t('clearAll')}</Button>
              <Button onClick={() => setIsOpen(false)} className="flex-1">{t('apply')}</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
