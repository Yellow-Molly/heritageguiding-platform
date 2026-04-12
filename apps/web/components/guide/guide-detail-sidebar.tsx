/**
 * Guide detail sidebar — left panel on desktop, centered header on mobile.
 * Contains avatar, name, gold divider, language/area pills, credentials, specializations.
 * No CTA button, no tagline (per design validation).
 */

import Image from 'next/image'
import { Globe, MapPin, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import type { GuideDetail } from '@/lib/api/get-guide-by-slug'
import { languageDisplayNames } from '@/lib/language-display-names'
import { getCredentialIcon } from '@/lib/get-credential-icon'

interface GuideDetailSidebarProps {
  guide: GuideDetail
}

export async function GuideDetailSidebar({ guide }: GuideDetailSidebarProps) {
  const t = await getTranslations('guides')
  const allLanguages = [...new Set([...guide.languages, ...(guide.additionalLanguages ?? [])])]

  return (
    <aside className="shrink-0 bg-[var(--color-surface)] px-5 py-8 text-center lg:w-[450px] lg:border-r lg:border-[var(--color-border)] lg:px-12 lg:py-12">
      {/* Avatar */}
      <div className="flex justify-center">
        {guide.photo ? (
          <div className="relative h-[120px] w-[120px] lg:h-[160px] lg:w-[160px]">
            <Image
              src={guide.photo.url}
              alt={guide.photo.alt}
              fill
              className="rounded-full object-cover"
              sizes="(max-width: 1024px) 120px, 160px"
              priority
              placeholder={guide.photo.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={guide.photo.blurDataUrl}
            />
          </div>
        ) : (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white text-4xl font-bold text-[var(--color-text-muted)] lg:h-[160px] lg:w-[160px]">
            {guide.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name + on-leave badge */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <h1 className="font-serif text-[24px] font-bold text-[var(--color-primary)] lg:text-[28px]">
          {guide.name}
        </h1>
        {guide.status === 'on-leave' && (
          <Badge variant="warning" size="md">{t('onLeave')}</Badge>
        )}
      </div>

      {/* Years experience */}
      {guide.yearsExperience != null && guide.yearsExperience > 0 && (
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t('sidebar.yearsExperience', { years: guide.yearsExperience })}
        </p>
      )}

      {/* Gold divider */}
      <div className="mx-auto mt-4 h-0.5 w-15 bg-[var(--color-secondary)]" />

      {/* Sections below divider: left-aligned on all breakpoints */}
      <div className="text-left">
      {/* Languages */}
      {allLanguages.length > 0 && (
        <SidebarSection icon={<Globe className="h-4 w-4" />} label={t('sidebar.languages')}>
          <div className="flex flex-wrap gap-2">
            {allLanguages.map((lang) => (
              <span key={lang} className="rounded-full bg-[var(--color-background-alt)] px-3 py-1 text-[13px]">
                {languageDisplayNames[lang] ?? lang}
              </span>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Operating Areas */}
      {guide.operatingAreas.length > 0 && (
        <SidebarSection icon={<MapPin className="h-4 w-4" />} label={t('sidebar.areasOfExpertise')}>
          <div className="flex flex-wrap gap-2">
            {guide.operatingAreas.map((area) => (
              <span key={area.id} className="rounded-full bg-[var(--color-background-alt)] px-3 py-1 text-[13px]">
                {area.name}
              </span>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Credentials */}
      {guide.credentials && guide.credentials.length > 0 && (
        <>
          <hr className="my-5 border-[var(--color-border)]" />
          <SidebarSection label={t('sidebar.credentials')}>
            <ul className="space-y-2.5">
              {guide.credentials.map((cred) => {
                const { icon: Icon, colorVar } = getCredentialIcon(cred.credential)
                return (
                  <li key={cred.credential} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: `var(${colorVar})` }} />
                    <span>{cred.credential}</span>
                  </li>
                )
              })}
            </ul>
          </SidebarSection>
        </>
      )}

      {/* Specializations */}
      {guide.specializations.length > 0 && (
        <>
          <hr className="my-5 border-[var(--color-border)]" />
          <SidebarSection label={t('sidebar.specializations')}>
            <div className="flex flex-wrap gap-2">
              {guide.specializations.map((spec) => (
                <span
                  key={spec.id}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#8B6914]"
                >
                  <Star className="h-3 w-3" />
                  {spec.name}
                </span>
              ))}
            </div>
          </SidebarSection>
        </>
      )}
      </div>
    </aside>
  )
}

/** Reusable sidebar section with optional icon + uppercase label */
function SidebarSection({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-6">
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}
