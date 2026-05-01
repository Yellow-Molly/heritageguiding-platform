import { useTranslations } from 'next-intl'
import { Compass, Eye } from 'lucide-react'

/**
 * Mission & Vision section with two icon cards on alt background.
 */
export function AboutMissionVisionSection() {
  const t = useTranslations('about')

  return (
    <section className="bg-[var(--color-background-alt)] py-12 lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[2px] text-[var(--color-secondary)]">
          {t('mission.label')}
        </span>
        <h2 className="mt-3 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
          {t('mission.title')} & {t('vision.title')}
        </h2>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2 md:gap-8">
          {/* Mission card */}
          <div className="rounded-2xl bg-[var(--color-surface)] p-7 shadow-sm md:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-primary)]">
              <Compass className="h-7 w-7 text-[var(--color-secondary)]" />
            </div>
            <h3 className="mt-5 font-serif text-xl font-bold text-[var(--color-primary)] md:text-2xl">
              {t('mission.title')}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.7] text-[var(--color-text-muted)]">
              {t('mission.description')}
            </p>
          </div>

          {/* Vision card */}
          <div className="rounded-2xl bg-[var(--color-surface)] p-7 shadow-sm md:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-primary)]">
              <Eye className="h-7 w-7 text-[var(--color-secondary)]" />
            </div>
            <h3 className="mt-5 font-serif text-xl font-bold text-[var(--color-primary)] md:text-2xl">
              {t('vision.title')}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.7] text-[var(--color-text-muted)]">
              {t('vision.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
