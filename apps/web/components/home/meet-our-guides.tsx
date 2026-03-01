'use client'

import Image from 'next/image'
import { Instagram, Linkedin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getButtonClassName } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

const featuredGuides = [
  {
    id: 'johan',
    name: 'Johan Lindberg',
    role: 'History Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
    instagram: '#',
    linkedin: '#',
  },
  {
    id: 'anna',
    name: 'Anna Eriksson',
    role: 'Architecture Expert',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
    instagram: '#',
    linkedin: '#',
  },
  {
    id: 'erik',
    name: 'Erik Johansson',
    role: 'Cultural Guide',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
    instagram: '#',
    linkedin: '#',
  },
  {
    id: 'maria',
    name: 'Maria Svensson',
    role: 'Food & Heritage',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400',
    instagram: '#',
    linkedin: '#',
  },
]

export function MeetOurGuides() {
  const t = useTranslations('home.guides')

  return (
    <section className="bg-[var(--color-background-alt)] py-16 md:py-24" aria-label={t('ariaLabel')}>
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
            {t('tagline')}
          </span>
          <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
            {t('title')}
          </h2>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {featuredGuides.map((guide) => (
            <div key={guide.id} className="text-center">
              {/* Avatar */}
              <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-[var(--color-secondary)]/20 transition-transform duration-300 hover:scale-105 md:h-40 md:w-40">
                <Image
                  src={guide.avatar}
                  alt={guide.name}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Info */}
              <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)]">{guide.name}</h3>
              <p className="mb-3 text-sm text-[var(--color-text-muted)]">{guide.role}</p>
              {/* Social */}
              <div className="flex justify-center gap-3">
                <a href={guide.instagram} target="_blank" rel="noopener noreferrer"
                  aria-label={`${guide.name} Instagram`}
                  className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-secondary)]">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href={guide.linkedin} target="_blank" rel="noopener noreferrer"
                  aria-label={`${guide.name} LinkedIn`}
                  className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-secondary)]">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/guides" className={getButtonClassName('outline-dark', 'lg')}>
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}
