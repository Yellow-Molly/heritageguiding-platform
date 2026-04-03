import { useTranslations } from 'next-intl'
import { Zap, Globe, ShieldCheck, Star } from 'lucide-react'

const trustItems = [
  { icon: Zap, titleKey: 'trust.fastResponse', subKey: 'trust.fastResponseSub' },
  { icon: Globe, titleKey: 'trust.multilingual', subKey: 'trust.multilingualSub' },
  { icon: ShieldCheck, titleKey: 'trust.privacy', subKey: 'trust.privacySub' },
  { icon: Star, titleKey: 'trust.fiveStar', subKey: 'trust.fiveStarSub' },
] as const

/**
 * Trust strip with 4 items.
 * Desktop: horizontal row with dividers on navy background.
 * Mobile: 2x2 grid.
 */
export function ContactTrustStrip() {
  const t = useTranslations('contact')

  return (
    <section className="bg-[#1E3A5F] px-5 py-8 md:px-[120px]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:flex md:items-center md:justify-between md:gap-0">
        {trustItems.map(({ icon: Icon, titleKey, subKey }, index) => (
          <div
            key={titleKey}
            className={`flex items-center gap-3 ${
              index > 0 ? 'md:border-l md:border-white/15 md:pl-8' : ''
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Icon className="h-5 w-5 text-[var(--color-secondary-light)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t(titleKey)}</p>
              <p className="text-xs text-white/60">{t(subKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
