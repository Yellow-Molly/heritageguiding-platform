import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { CircleCheck } from 'lucide-react'
import { BLUR_DATA } from '@/lib/image-blur-constants'

const ITEM_KEYS = ['item1', 'item2', 'item3', 'item4'] as const

/**
 * Responsible Tourism section with image left and checklist right.
 * Mobile: image top, content bottom.
 */
export function AboutResponsibleTourismSection() {
  const t = useTranslations('about')

  return (
    <section className="px-5 py-16 lg:px-[120px] lg:py-24">
      <div className="container mx-auto flex flex-col gap-8 md:flex-row md:gap-16">
        {/* Image */}
        <div className="relative h-[220px] w-full md:h-[400px] md:w-[480px]">
          <Image
            src="https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=960&q=70"
            alt={t('responsibleTourism.imageAlt')}
            fill
            placeholder="blur"
            blurDataURL={BLUR_DATA.NATURE_TOURISM}
            className="rounded-2xl object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-[2px] text-[var(--color-secondary)]">
            {t('responsibleTourism.label')}
          </span>
          <h2 className="mt-3 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-4xl">
            {t('responsibleTourism.title')}
          </h2>
          <p className="mt-6 text-[15px] leading-[1.7] text-[var(--color-text)] md:text-base">
            {t('responsibleTourism.paragraph1')}
          </p>
          <ul className="mt-6 space-y-3.5 md:space-y-4">
            {ITEM_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" />
                <span className="text-[15px] text-[var(--color-text)]">
                  {t(`responsibleTourism.items.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
