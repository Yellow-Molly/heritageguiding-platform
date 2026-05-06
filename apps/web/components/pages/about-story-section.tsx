import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { BLUR_DATA } from '@/lib/image-blur-constants'

/**
 * About page story section with side-by-side text and image layout.
 * Mobile: image first, text second. Desktop: text left, image right.
 */
export function AboutStorySection() {
  const t = useTranslations('about')

  return (
    <section className="px-5 py-16 lg:px-[120px] lg:py-24">
      <div className="container mx-auto flex flex-col gap-10 md:flex-row md:gap-16">
        {/* Text side */}
        <div className="order-2 flex-1 md:order-1">
          <span className="text-xs font-semibold uppercase tracking-[2px] text-[var(--color-secondary)]">
            {t('story.label')}
          </span>
          <h2 className="mt-3 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-4xl">
            {t('story.titleLine1')}
            <br />
            {t('story.titleLine2')}
          </h2>
          <p className="mt-6 font-serif text-lg italic leading-[1.7] text-[var(--color-text)] md:text-xl">
            {t('story.paragraph1')}
          </p>
          <p className="mt-4 text-base leading-[1.7] text-[var(--color-text)]">
            {t('story.paragraph2')}
          </p>
          <p className="mt-4 text-base leading-[1.7] text-[var(--color-text)]">
            {t('story.paragraph3')}
          </p>
          <p className="mt-4 text-base leading-[1.7] text-[var(--color-text)]">
            {t('story.paragraph4')}
          </p>
          <blockquote className="mt-6 border-l-4 border-[var(--color-secondary)] pl-6 font-serif text-lg italic text-[var(--color-text)] md:pl-8 md:text-[22px] md:leading-[1.6]">
            {t('story.paragraph5')}
          </blockquote>
        </div>

        {/* Image side */}
        <div className="relative order-1 h-[240px] w-full md:order-2 md:h-[500px] md:w-[480px]">
          <Image
            src="https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=960&q=70"
            alt={t('story.imageAlt')}
            fill
            placeholder="blur"
            blurDataURL={BLUR_DATA.ARCHIPELAGO}
            className="rounded-2xl object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        </div>
      </div>
    </section>
  )
}
