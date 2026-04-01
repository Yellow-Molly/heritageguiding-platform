import Image from 'next/image'
import { useTranslations } from 'next-intl'

/**
 * Contact page hero section with full-width background image, dark overlay,
 * centered heading and subtitle.
 * Design: 350px desktop, 280px mobile. Content padded 200px horizontal on desktop.
 */
export function ContactHeroSection() {
  const t = useTranslations('contact')

  return (
    <section className="relative flex h-[320px] items-end justify-center overflow-hidden pb-10 md:h-[350px] md:items-center md:pb-0">
      {/* Background image — Stockholm cityscape (design: pzumk/unsplash) */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1511635697257-11edf94574d3?auto=format&fit=crop&w=2070&q=80"
          alt="Stockholm cityscape with historic buildings"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
      {/* Dark navy overlay — #1E3A5FCC per design */}
      <div className="absolute inset-0 bg-[#1E3A5F]/80" />

      <div className="relative z-10 w-full px-5 text-center md:px-[200px]">
        <h1 className="font-serif !text-[32px] font-bold leading-tight !text-white md:!text-5xl">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-[680px] text-[15px] leading-[1.6] text-white/80 md:text-lg">
          {t('hero.subtitle')}
        </p>
      </div>
    </section>
  )
}
