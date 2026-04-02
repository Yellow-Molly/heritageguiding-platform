'use client'

import { useTranslations } from 'next-intl'
import {
  ShieldCheck,
  Star,
  Lock,
  Settings,
  Globe,
  type LucideIcon,
} from 'lucide-react'

interface ValueItem {
  icon: LucideIcon
  key: string
}

const values: ValueItem[] = [
  { icon: ShieldCheck, key: 'authorizedExperts' },
  { icon: Star, key: 'curated' },
  { icon: Lock, key: 'privateByDesign' },
  { icon: Settings, key: 'seamlessHosting' },
  { icon: Globe, key: 'multilingual' },
]

/**
 * Values section showcasing what makes Private Tours different.
 * 3+2 grid layout with bordered icon cards and gold divider accents.
 */
export function ValuesSection() {
  const t = useTranslations('about.values')

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[2px] text-[var(--color-secondary)]">
          {t('label')}
        </span>
        <h2 className="mt-3 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--color-text-muted)]">
          {t('subtitle')}
        </p>

        {/* Top row: 3 cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {values.slice(0, 3).map(({ icon: Icon, key }) => (
            <ValueCard key={key} icon={Icon} title={t(`${key}.title`)} description={t(`${key}.description`)} />
          ))}
        </div>

        {/* Bottom row: 2 centered cards */}
        <div className="mx-auto mt-6 grid max-w-[800px] gap-6 lg:grid-cols-2">
          {values.slice(3).map(({ icon: Icon, key }) => (
            <ValueCard key={key} icon={Icon} title={t(`${key}.title`)} description={t(`${key}.description`)} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] p-5 shadow-sm text-center md:p-8 md:text-left">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-primary)] md:mx-0">
        <Icon className="h-6 w-6 text-[var(--color-secondary)]" />
      </div>
      <div className="mx-auto mt-4 h-[3px] w-10 bg-[var(--color-secondary)] md:mx-0" />
      <h3 className="mt-4 font-serif text-xl font-semibold text-[var(--color-primary)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-[1.6] text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  )
}
