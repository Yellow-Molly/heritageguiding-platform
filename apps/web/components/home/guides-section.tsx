'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getButtonClassName } from '@/components/ui/button'
import { GuideCard } from './guide-card'

// TODO: Replace with CMS data via getGuides() API
const guides = [
  { name: 'Anna Lindström', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', role: '' },
  { name: 'Erik Johansson', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', role: '' },
  { name: 'Maria Bergman', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', role: '' },
  { name: 'Lars Andersson', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', role: '' },
  { name: 'Sofia Nilsson', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', role: '' },
  { name: 'Karl Eriksson', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', role: '' },
]

export function GuidesSection() {
  const t = useTranslations('home.guidesSection')
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Fill in role from i18n
  const guidesWithRole = guides.map((g) => ({ ...g, role: g.role || t('role') }))

  return (
    <section
      ref={sectionRef}
      className="bg-white py-20"
      aria-label="Our guides"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div
          className={`mb-12 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {t('label')}
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            {t('subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {guidesWithRole.map((guide) => (
            <GuideCard key={guide.name} {...guide} />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <Link href="/guides" className={getButtonClassName('outline-dark', 'lg')}>
            {t('viewAll')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
