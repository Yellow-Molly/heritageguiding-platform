'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * VideoHighlight — split layout: navy text left + thumbnail right (desktop).
 * Stacked layout on mobile. Play button opens YouTube modal.
 */
export function VideoHighlight() {
  const t = useTranslations('home.video')
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const openModal = useCallback(() => {
    setIsOpen(true)
    dialogRef.current?.showModal()
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    dialogRef.current?.close()
  }, [])

  // Sync state when native dialog closes via Escape key
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = () => setIsOpen(false)
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  return (
    <section className="bg-[var(--color-primary)]" aria-label="Video highlight">
      {/* Desktop: split layout | Mobile: stacked */}
      <div className="flex flex-col md:flex-row md:h-[500px]">
        {/* Left text panel */}
        <div className="flex flex-col justify-center gap-5 px-5 py-10 md:w-[480px] md:shrink-0 md:px-20 md:py-0">
          <span className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--color-secondary-light)] md:text-[11px]">
            {t('tag')}
          </span>
          <h2 className="font-serif text-[28px] font-bold leading-[1.1] text-white md:text-[42px]">
            {t('sectionTitle')}
          </h2>
          <p className="text-sm leading-[1.6] text-white/70 md:text-[15px]">
            {t('subtitle')}
          </p>
        </div>

        {/* Right thumbnail with play button */}
        <button
          onClick={openModal}
          className="group relative h-[220px] flex-1 cursor-pointer md:h-full"
          aria-label="Play video"
        >
          <Image
            src="https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1600&q=80"
            alt="Aerial view of Stockholm archipelago and historic cityscape"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 60vw"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />

          {/* Play button — coral circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-[72px] md:w-[72px]">
              <Play className="h-[22px] w-[22px] md:h-7 md:w-7" fill="currentColor" />
            </div>
          </div>
        </button>
      </div>

      {/* Video Modal (native dialog) */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[500] m-0 h-full w-full max-h-full max-w-full bg-black/90 backdrop:bg-black/90 open:flex open:items-center open:justify-center"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal()
        }}
      >
        <div className="relative mx-auto w-full max-w-5xl px-4">
          <button
            onClick={closeModal}
            className="absolute -top-12 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close video"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            {isOpen && (
              <iframe
                src="https://www.youtube-nocookie.com/embed/vaTnvqgBkt4?autoplay=1&rel=0"
                title="Stockholm Aerial Tour — Discover Sweden's Capital"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            )}
          </div>
        </div>
      </dialog>
    </section>
  )
}
