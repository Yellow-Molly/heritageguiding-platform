'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { GuideListItem } from '@/lib/api/get-guides'

interface GuidesPreviewProps {
  guides: GuideListItem[]
}

/**
 * GuidesPreview — navy background section with circular guide headshots.
 */
export function GuidesPreview({ guides }: GuidesPreviewProps) {
  const t = useTranslations('home.guides')
  if (guides.length === 0) return null

  return (
    <section className="bg-[var(--color-primary)] py-10 md:py-20" aria-label="Meet our guides">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header: tag + title left, CTA right (desktop) */}
        <div className="mb-8 flex flex-col items-center gap-4 md:mb-12 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--color-secondary-light)] md:text-[11px]">
              {t('tag')}
            </span>
            <h2 className="font-serif text-[28px] font-bold text-white md:text-[42px]">
              {t('sectionTitle')}
            </h2>
          </div>

          {/* Desktop CTA */}
          <Link
            href="/guides"
            className="hidden rounded-none border border-[var(--color-secondary-light)] px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1px] text-[var(--color-secondary-light)] transition-colors hover:bg-[var(--color-secondary-light)] hover:text-white md:inline-block"
          >
            {t('meetAll')}
          </Link>
        </div>

        {/* Guides grid — 4-col desktop, 2x2 mobile */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col items-center gap-3 text-center md:gap-4"
            >
              {/* Circular headshot with gold border */}
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-[var(--color-secondary-light)] md:h-[140px] md:w-[140px]">
                <Image
                  src={guide.photo?.url ?? '/images/guide-placeholder.svg'}
                  alt={guide.name}
                  fill
                  className="object-cover"
                  sizes="140px"
                />
              </div>
              <h3 className="font-serif text-lg font-bold text-white md:text-[22px]">
                {guide.name}
              </h3>
              {guide.specializations[0]?.name && (
                <p className="text-sm font-medium text-[var(--color-secondary-light)]">
                  {guide.specializations[0].name}
                </p>
              )}
              {guide.languages && guide.languages.length > 0 && (
                <p className="text-[13px] text-white/60">
                  {guide.languages.join(', ')}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Mobile CTA — centered below grid */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/guides"
            className="inline-block border border-[var(--color-secondary-light)] px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1px] text-[var(--color-secondary-light)] transition-colors hover:bg-[var(--color-secondary-light)] hover:text-white"
          >
            {t('meetAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}
