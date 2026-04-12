'use client'

import { useState, type ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { languageDisplayNames } from '@/lib/language-display-names'

interface GuideFilterDrawerMobileProps {
  languages: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  areas: Array<{ id: string; name: string; slug: string }>
  trigger: ReactNode
}

/**
 * Mobile filter drawer for guide listing.
 * Opens from the left with language, specialization, and area selects.
 */
export function GuideFilterDrawerMobile({
  languages,
  specializations,
  areas,
  trigger,
}: GuideFilterDrawerMobileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('guides.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Local state mirrors URL params while drawer is open
  const [lang, setLang] = useState(searchParams.get('language') || '')
  const [spec, setSpec] = useState(searchParams.get('specialization') || '')
  const [area, setArea] = useState(searchParams.get('area') || '')

  const handleOpen = () => {
    setLang(searchParams.get('language') || '')
    setSpec(searchParams.get('specialization') || '')
    setArea(searchParams.get('area') || '')
    setIsOpen(true)
  }

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    lang ? params.set('language', lang) : params.delete('language')
    spec ? params.set('specialization', spec) : params.delete('specialization')
    area ? params.set('area', area) : params.delete('area')
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    setIsOpen(false)
  }

  const handleClear = () => {
    router.replace(pathname, { scroll: false })
    setIsOpen(false)
  }

  const selectClass = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm'

  return (
    <>
      <div onClick={handleOpen}>{trigger}</div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 bg-[var(--color-surface)] shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
              <select value={lang} onChange={(e) => setLang(e.target.value)} className={selectClass}>
                <option value="">{t('language')}</option>
                {languages.map((l) => <option key={l} value={l}>{languageDisplayNames[l] ?? l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('specialization')}</label>
              <select value={spec} onChange={(e) => setSpec(e.target.value)} className={selectClass}>
                <option value="">{t('specialization')}</option>
                {specializations.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('area')}</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
                <option value="">{t('area')}</option>
                {areas.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[var(--color-border)] p-4">
            <div className="flex gap-3">
              <Button variant="outline-dark" onClick={handleClear} className="flex-1">{t('clearAll')}</Button>
              <Button onClick={handleApply} className="flex-1">{t('apply')}</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
