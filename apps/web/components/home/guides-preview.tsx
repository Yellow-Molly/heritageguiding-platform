'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { GuideListItem } from '@/lib/api/get-guides'

interface GuidesPreviewProps {
  guides: GuideListItem[]
}

/**
 * GuidesPreview — circular headshots of top guides with real CMS data.
 */
export function GuidesPreview({ guides }: GuidesPreviewProps) {
  const t = useTranslations('home.guides')
  if (guides.length === 0) return null

  return (
    <section className="bg-white py-16 md:py-24" aria-label="Meet our guides">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section heading */}
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
          {t('sectionTitle')}
        </h2>

        {/* Guides grid — 4-col desktop, 2x2 mobile */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="flex flex-col items-center text-center group"
            >
              {/* Circular headshot */}
              <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-[#DBC078] md:h-32 md:w-32">
                <Image
                  src={guide.photo?.url ?? '/images/guide-placeholder.svg'}
                  alt={guide.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#252525]">{guide.name}</h3>
              {(guide.operatingAreas[0]?.name || guide.specializations[0]?.name) && (
                <p className="text-sm text-[#3e3e3e]">
                  {guide.operatingAreas[0]?.name ?? guide.specializations[0]?.name}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#d0ad50] px-8 py-3 font-medium text-[#d0ad50] transition-all hover:bg-[#d0ad50] hover:text-white"
          >
            {t('meetAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
