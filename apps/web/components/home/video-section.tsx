'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'

// TODO: Replace with actual YouTube video URL from CMS or env var
const YOUTUBE_VIDEO_ID = 'dQw4w9WgXcQ'
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80'

export function VideoSection() {
  const t = useTranslations('home.video')
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-white py-20"
      aria-label="Video section"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div
          className={`grid gap-12 lg:grid-cols-2 lg:items-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Video */}
          <div className="aspect-video overflow-hidden rounded-2xl shadow-lg">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                title={t('title')}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <button
                onClick={() => setIsPlaying(true)}
                className="group relative h-full w-full"
                aria-label={t('title')}
              >
                <Image
                  src={PLACEHOLDER_IMAGE}
                  alt={t('title')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 text-[var(--color-accent)] ml-1" />
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <span className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              {t('label')}
            </span>
            <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
              {t('title')}
            </h2>
            <p className="mb-6 text-[var(--color-text-muted)]">
              {t('description')}
            </p>
            <div>
              <Link
                href="/about"
                className="inline-flex items-center font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-dark)]"
              >
                {t('cta')} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
