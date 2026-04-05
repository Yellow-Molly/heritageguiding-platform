'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
import { FocusScope } from '@radix-ui/react-focus-scope'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryImage {
  image: {
    url: string
    alt: string
    blurDataUrl?: string
  }
}

interface TourGalleryProps {
  images: GalleryImage[]
  open: boolean
  onClose: () => void
  startIndex?: number
}

/**
 * Fullscreen lightbox gallery with thumbnail strip navigation.
 */
export function TourGallery({ images, open, onClose, startIndex = 0 }: TourGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [prevOpen, setPrevOpen] = useState(open)

  // Reset index when gallery opens
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setCurrentIndex(Math.min(startIndex, images.length - 1))
    }
  }

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, next, prev, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Restore focus to trigger element when gallery closes
  const triggerRef = useRef<Element | null>(null)
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [open])

  if (!open || !images || images.length === 0) return null

  const currentImage = images[currentIndex]?.image

  return (
    <FocusScope trapped loop>
    <div className="fixed inset-0 z-[400] bg-black" role="dialog" aria-modal="true" aria-label="Image gallery">
      {/* Close button */}
      <button
        className="absolute right-4 top-4 z-50 rounded-full bg-white/30 p-3 text-white transition-colors hover:bg-white/50"
        onClick={onClose}
        aria-label="Close gallery"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Image counter */}
      <div className="absolute left-4 top-4 z-50 text-sm text-white/75">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main image */}
      <div className="flex h-full items-center justify-center px-4 pb-24 pt-14">
        {currentImage && (
          <div className="relative h-full w-full">
            <Image
              src={currentImage.url}
              alt={currentImage.alt || ''}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              placeholder={currentImage.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={currentImage.blurDataUrl}
            />
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/30 p-3 text-white transition-colors hover:bg-white/50"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/30 p-3 text-white transition-colors hover:bg-white/50"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 overflow-x-auto bg-black/80 p-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'relative h-14 w-20 flex-shrink-0 overflow-hidden rounded transition-all',
                i === currentIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-75'
              )}
              aria-label={`Go to image ${i + 1}`}
            >
              <Image src={img.image.url} alt="" width={80} height={56} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
    </FocusScope>
  )
}
