import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Compass, MapPin } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { NotFoundSearchBar } from '@/components/pages/not-found-search-bar'

const locationTags = [
  { key: 'stockholm' as const, city: 'stockholm' },
  { key: 'gothenburg' as const, city: 'gothenburg' },
  { key: 'visby' as const, city: 'visby' },
]

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <>
      <Header variant="solid" />

      <title>{t('title')}</title>

      <main
        aria-label={t('title')}
        className="relative min-h-[calc(100vh-var(--header-height))] flex items-center justify-center bg-[var(--color-background)] pt-[var(--header-height)] overflow-hidden"
      >
        {/* Background image — full viewport behind content */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/404-background.webp"
            alt=""
            role="presentation"
            fill
            sizes="100vw"
            className="object-cover"
          />
          {/* Transparent overlay — let background image show through fully */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(250, 250, 248, 0)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-10 md:py-16 w-full max-w-[600px]">
          {/* 4 🧭 4 display — desktop only */}
          <div className="hidden md:flex items-center gap-0 mb-6">
            <span className="font-[family-name:var(--font-heading)] text-[144px] font-bold leading-none text-[var(--color-primary)]">
              4
            </span>
            <div className="flex items-center justify-center w-[130px] h-[160px]">
              <Compass className="w-[108px] h-[108px] text-[var(--color-secondary)]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="font-[family-name:var(--font-heading)] text-[144px] font-bold leading-none text-[var(--color-primary)]">
              4
            </span>
          </div>

          {/* Illustration — responsive */}
          <div className="w-[340px] h-[220px] md:w-[500px] md:h-[180px] relative rounded-2xl md:rounded-xl overflow-hidden shadow-lg md:shadow-none mb-5 md:mb-0 border-2 border-[var(--color-secondary)]/20 md:border-0">
            {/* Mobile illustration */}
            <Image
              src="/images/404-illustration-mobile.webp"
              alt={t('imageAlt')}
              fill
              className="object-cover md:hidden"
            />
            {/* Desktop illustration */}
            <Image
              src="/images/404-illustration-desktop.webp"
              alt={t('imageAlt')}
              fill
              className="object-cover hidden md:block"
            />
          </div>

          {/* Speech bubble — compact pill, w-fit prevents flex stretch */}
          <div className="w-fit bg-white rounded-xl px-5 py-2.5 shadow-sm mt-4 mb-4">
            <p className="text-[var(--color-primary)] text-[14px] md:text-[15px] italic font-medium !mb-0">
              {t('speechBubble')}
            </p>
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-heading)] text-[26px] md:text-4xl font-bold text-[var(--color-primary)] leading-tight mb-3">
            {t('heading')}
          </h1>

          {/* Subtext */}
          <p className="text-[var(--color-text-muted)] text-[15px] md:text-base leading-relaxed max-w-[560px] mb-6">
            {t('subtext')}
          </p>

          {/* CTA Buttons — full-width stacked on mobile, inline on desktop */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto mb-6">
            <Link
              href="/"
              className="flex items-center justify-center bg-[var(--color-accent)] text-white font-semibold text-base md:text-[15px] rounded-full h-[52px] md:h-auto px-8 md:py-3.5 shadow-md hover:opacity-90 transition-opacity w-full md:w-auto"
            >
              <span aria-hidden="true" className="mr-2">🏠</span>{t('homeButton')}
            </Link>
            <Link
              href="/tours"
              className="flex items-center justify-center bg-white text-[var(--color-primary)] font-semibold text-base md:text-[15px] rounded-full h-[52px] md:h-auto px-8 md:py-3.5 border-2 border-[var(--color-secondary)] shadow-sm hover:bg-gray-50 transition-colors w-full md:w-auto"
            >
              <span aria-hidden="true" className="mr-2">🗺️</span>{t('toursButton')}
            </Link>
          </div>

          {/* Search bar */}
          <NotFoundSearchBar placeholder={t('searchPlaceholder')} />

          {/* Help text */}
          <p className="text-[var(--color-text-muted)] text-[13px] font-medium mt-3 mb-3">
            {t('helpText')}
          </p>

          {/* Location tags — mobile only */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-4">
            {locationTags.map((tag) => (
              <Link
                key={tag.key}
                href={`/tours?city=${tag.city}`}
                className="flex items-center gap-1.5 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[var(--color-secondary)]" aria-hidden="true" />
                <span className="text-gray-700 text-[13px] font-medium">
                  {t(`cities.${tag.key}`)}
                </span>
              </Link>
            ))}
          </div>

          {/* Fun fact */}
          <p className="text-[var(--color-text-light)] text-xs md:text-[13px] italic">
            {t('funFact')}
          </p>
        </div>
      </main>

      <Footer />
    </>
  )
}
