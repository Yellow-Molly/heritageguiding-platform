'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Award, Shield, MapPin, type LucideIcon } from 'lucide-react'

interface CertItem {
  icon: LucideIcon
  labelKey: string
  subKey: string
}

const CERTS: CertItem[] = [
  { icon: Award, labelKey: 'licensed', subKey: 'licensedSub' },
  { icon: Shield, labelKey: 'insured', subKey: 'insuredSub' },
  { icon: MapPin, labelKey: 'local', subKey: 'localSub' },
]

/**
 * Certifications bar on dark primary background with icon badges and dividers.
 */
export function AboutCertificationsSection() {
  const t = useTranslations('about.certifications')

  return (
    <section className="bg-[var(--color-primary)] py-16 text-white">
      <div className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 md:flex-row md:gap-16">
        {CERTS.map((cert, i) => {
          const Icon = cert.icon
          return (
            <Fragment key={cert.labelKey}>
              {/* Divider between items */}
              {i > 0 && (
                <>
                  <div className="hidden h-[60px] w-px bg-white/20 md:block" />
                  <div className="h-px w-[60px] bg-white/20 md:hidden" />
                </>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 md:h-16 md:w-16">
                  <Icon className="h-7 w-7 text-[var(--color-secondary)]" />
                </div>
                <span className="mt-3 text-[15px] font-bold text-white md:text-base">
                  {t(cert.labelKey)}
                </span>
                <span className="mt-1 text-[13px] text-white/67">
                  {t(cert.subKey)}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}
