'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getButtonClassName } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

/** YouTube video ID -- replace with real video before launch */
const VIDEO_ID = 'dQw4w9WgXcQ'

export function VideoSection() {
  const [showVideo, setShowVideo] = useState(false)
  const t = useTranslations('home.video')

  return (
    <section className="bg-[var(--color-background-alt)] py-16 md:py-24" aria-label={t('title')}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Video Column */}
          <div className="relative aspect-video overflow-hidden rounded-2xl shadow-[var(--shadow-lg)]">
            {showVideo ? (
              <iframe
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
                title={t('iframeTitle')}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="group relative h-full w-full"
                aria-label={t('playButton')}
              >
                <Image
                  src="https://images.unsplash.com/photo-1575505586569-646b2ca898fc?auto=format&fit=crop&w=1200&q=80"
                  alt={t('thumbnailAlt')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary-dark)] shadow-xl transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 fill-current" />
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Text Column */}
          <div>
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
              {t('tagline')}
            </span>
            <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
              {t('title')}
            </h2>
            <p className="mb-6 leading-relaxed text-[var(--color-text-muted)]">
              {t('description')}
            </p>
            <Link href="/tours" className={getButtonClassName('primary', 'lg')}>
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
