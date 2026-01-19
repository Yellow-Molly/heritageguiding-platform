'use client'

import { useTranslations } from 'next-intl'
import {
  GraduationCap,
  Globe,
  Accessibility,
  Building,
  Users,
  Leaf,
  type LucideIcon,
} from 'lucide-react'

interface ValueItem {
  icon: LucideIcon
  key: string
}

const values: ValueItem[] = [
  { icon: GraduationCap, key: 'expertise' },
  { icon: Globe, key: 'multilingual' },
  { icon: Accessibility, key: 'accessibility' },
  { icon: Building, key: 'heritage' },
  { icon: Users, key: 'smallGroups' },
  { icon: Leaf, key: 'sustainable' },
]

/**
 * Values section showcasing what makes HeritageGuiding different.
 * Displays 6 core values with icons and descriptions.
 */
export function ValuesSection() {
  const t = useTranslations('about.values')

  return (
    <section className="bg-[var(--color-background-alt)] py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-serif text-3xl font-bold text-[var(--color-primary)]">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-text-muted)]">
          {t('subtitle')}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex gap-4 rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]/10">
                <Icon className="h-6 w-6 text-[var(--color-secondary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-primary)]">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t(`${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
