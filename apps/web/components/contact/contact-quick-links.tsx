import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Compass, Users, HelpCircle, ArrowRight, ChevronRight } from 'lucide-react'

interface QuickLinkCard {
  icon: typeof Compass
  titleKey: string
  descriptionKey: string
  linkKey: string
  href: string
}

const cards: QuickLinkCard[] = [
  {
    icon: Compass,
    titleKey: 'quickLinks.bookTour.title',
    descriptionKey: 'quickLinks.bookTour.description',
    linkKey: 'quickLinks.bookTour.link',
    href: '/tours',
  },
  {
    icon: Users,
    titleKey: 'quickLinks.forGuides.title',
    descriptionKey: 'quickLinks.forGuides.description',
    linkKey: 'quickLinks.forGuides.link',
    href: '/contact?subject=partnership',
  },
  {
    icon: HelpCircle,
    titleKey: 'quickLinks.faq.title',
    descriptionKey: 'quickLinks.faq.description',
    linkKey: 'quickLinks.faq.link',
    href: '/faq',
  },
]

/**
 * Quick links section with 3 CTA cards — Book Tour, For Guides, FAQ.
 * Desktop: 3-column card layout. Mobile: compact horizontal rows.
 */
export function ContactQuickLinks() {
  const t = useTranslations('contact')

  return (
    <section className="bg-[#F5F5F3] px-5 py-16 md:px-[120px] md:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
            {t('quickLinks.label')}
          </span>
          <h2 className="mt-2 font-serif !text-3xl font-bold text-[#1E3A5F] md:!text-4xl">
            {t('quickLinks.title')}
          </h2>
          <p className="mt-2 text-[var(--color-text-muted)]">{t('quickLinks.subtitle')}</p>
        </div>

        {/* Desktop cards */}
        <div className="mt-12 hidden gap-6 md:grid md:grid-cols-3">
          {cards.map(({ icon: Icon, titleKey, descriptionKey, linkKey, href }) => (
            <div
              key={titleKey}
              className="rounded-3xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1E3A5F]">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="mt-4 h-[3px] w-10 rounded-full bg-[var(--color-secondary)]" />
              <h3 className="mt-4 font-serif !text-[22px] font-bold text-[#1E3A5F]">
                {t(titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{t(descriptionKey)}</p>
              <Link
                href={href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                {t(linkKey)} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile compact cards */}
        <div className="mt-8 flex flex-col gap-3 md:hidden">
          {cards.map(({ icon: Icon, titleKey, linkKey, href }) => (
            <Link
              key={titleKey}
              href={href}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-base font-semibold text-[#1E3A5F]">{t(titleKey)}</p>
                <p className="text-xs text-[var(--color-accent)]">{t(linkKey)}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
