'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, X } from 'lucide-react'

/**
 * VideoHighlight — scenic photo with play button that opens a video lightbox.
 * Placeholder thumbnail; real video URL added later.
 */
export function VideoHighlight() {
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

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, closeModal])

  return (
    <section className="bg-[#F7F7F5] py-16 md:py-24" aria-label="Video highlight">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section title */}
        <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
          Watch Our Video
        </h2>

        {/* Video thumbnail container */}
        <button
          onClick={openModal}
          className="group relative mx-auto block w-full max-w-4xl cursor-pointer overflow-hidden rounded-2xl"
          aria-label="Play video"
        >
          <div className="relative aspect-video">
            <Image
              src="https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1600&q=80"
              alt="Aerial view of Stockholm archipelago and historic cityscape"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 896px"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#DBC078] bg-white text-[#252525] shadow-lg transition-all duration-300 group-hover:bg-[#DBC078] group-hover:text-white md:h-20 md:w-20">
                <Play className="h-6 w-6 md:h-8 md:w-8" fill="currentColor" />
              </div>
            </div>
          </div>
        </button>

        {/* Video Modal (native dialog) */}
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-[500] m-0 h-full w-full max-h-full max-w-full bg-black/90 backdrop:bg-black/90 open:flex open:items-center open:justify-center"
          onClick={(e) => {
            if (e.target === dialogRef.current) closeModal()
          }}
        >
          <div className="relative mx-auto w-full max-w-5xl px-4">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close video"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Lazy-loaded iframe — only renders when modal is open */}
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              {isOpen && (
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                  title="Heritage Tour Highlight Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              )}
            </div>
          </div>
        </dialog>
      </div>
    </section>
  )
}
