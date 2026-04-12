import { Breadcrumb } from '@/components/shared/breadcrumb'

interface CancellationHeroProps {
  title: string
  subtitle: string
  breadcrumbHome: string
  breadcrumbCurrent: string
  locale: string
}

/**
 * Hero section with gradient background, breadcrumb, gold divider,
 * and decorative gold circles (desktop only).
 */
export function CancellationHero({
  title,
  subtitle,
  breadcrumbHome,
  breadcrumbCurrent,
  locale,
}: CancellationHeroProps) {
  return (
    <section aria-label="Cancellation policy" className="relative overflow-hidden bg-gradient-to-r from-[#FAFAF8] to-[#F5F0E8]">
      <div className="container mx-auto px-5 py-12 md:px-20 md:py-20">
        {/* Content — centered on mobile, left-aligned on desktop */}
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <Breadcrumb
            items={[
              { label: breadcrumbHome, href: `/${locale}` },
              { label: breadcrumbCurrent, href: `/${locale}/cancellation` },
            ]}
            className="mb-6 justify-center md:justify-start"
          />
          <h1 className="font-serif text-4xl font-bold leading-tight text-[var(--color-primary)] md:text-6xl">
            {title}
          </h1>
          <div className="mx-auto my-5 h-[3px] w-12 bg-[var(--color-secondary)] md:mx-0" />
          <p className="text-base text-[var(--color-text-muted)] md:text-lg">{subtitle}</p>
        </div>

        {/* Decorative gold circles — desktop only */}
        <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/3 lg:block">
          <div className="h-44 w-44 rounded-full bg-[var(--color-secondary-light)] opacity-20" />
          <div className="absolute -left-10 top-24 h-24 w-24 rounded-full bg-[var(--color-secondary-light)] opacity-15" />
        </div>
      </div>
    </section>
  )
}
