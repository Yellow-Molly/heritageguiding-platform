import { getTranslations } from 'next-intl/server'

/**
 * Centered hero section for the guides listing page.
 * Server component — purely presentational with i18n text.
 */
export async function GuideListingHero() {
  const t = await getTranslations('guides.hero')

  return (
    <section className="bg-[var(--color-surface)] py-12 text-center lg:py-16">
      <div className="container mx-auto px-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
          {t('tag')}
        </span>
        <h1 className="mt-3 font-serif text-3xl font-bold text-[var(--color-primary)] lg:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-muted)]">
          {t('subtitle')}
        </p>
      </div>
    </section>
  )
}
