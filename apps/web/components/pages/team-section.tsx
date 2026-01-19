'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

interface TeamMember {
  id: string
  image: string
  credentials: string[]
}

/**
 * Team member data - images use placeholder until real photos available
 */
const teamMembers: TeamMember[] = [
  {
    id: 'founder',
    image: 'https://placehold.co/400x400/1a365d/ffffff?text=EL',
    credentials: ['PhD Medieval History', 'Uppsala University'],
  },
  {
    id: 'leadGuide',
    image: 'https://placehold.co/400x400/2d4a6f/ffffff?text=AB',
    credentials: ['MA Art History', 'Licensed Tour Guide'],
  },
  {
    id: 'historian',
    image: 'https://placehold.co/400x400/3d5a7f/ffffff?text=MO',
    credentials: ['PhD Archaeology', 'Museum Curator'],
  },
]

/**
 * Team section displaying founder and key team members.
 * Uses placeholder images that can be replaced with real photos.
 */
export function TeamSection() {
  const t = useTranslations('about.team')

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-serif text-3xl font-bold text-[var(--color-primary)]">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-text-muted)]">
          {t('subtitle')}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <div className="relative aspect-square bg-[var(--color-background-alt)]">
                <Image
                  src={member.image}
                  alt={t(`${member.id}.name`)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-[var(--color-primary)]">
                  {t(`${member.id}.name`)}
                </h3>
                <p className="text-[var(--color-secondary)]">{t(`${member.id}.role`)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.credentials.map((credential) => (
                    <span
                      key={credential}
                      className="rounded-full bg-[var(--color-background-alt)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
                    >
                      {credential}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                  {t(`${member.id}.bio`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
