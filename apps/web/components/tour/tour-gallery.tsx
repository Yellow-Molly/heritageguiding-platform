'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryImage {
  image: {
    url: string
    alt: string
  }
}

interface TourGalleryProps {
  images: GalleryImage[]
  open: boolean
  onClose: () => void
}

/**
 * Lightbox gallery component for tour images.
 */
export function TourGallery({ images, open, onClose }: TourGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

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

  // Reset index when gallery opens
  useEffect(() => {
    if (open) setCurrentIndex(0)
  }, [open])

  if (!images || images.length === 0) return null

  const currentImage = images[currentIndex]?.image

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl border-none bg-black/95 p-0">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-50 text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Main Image */}
        <div className="relative aspect-[16/10] w-full">
          {currentImage && (
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              className="object-contain"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={prev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={next}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-4">
            {images.map((_, i) => (
              <button
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i === currentIndex ? 'w-6 bg-white' : 'bg-white/50 hover:bg-white/75'
                )}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-4 text-sm text-white/75">
          {currentIndex + 1} / {images.length}
        </div>
      </DialogContent>
    </Dialog>
  )
}
