'use client'

import { useState } from 'react'
import { TourImageGrid } from './tour-image-grid'
import { TourGallery } from './tour-gallery'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourHeroProps {
  tour: TourDetail
}

/**
 * Tour hero section: image grid + fullscreen gallery.
 * Client component for gallery open/close state.
 * Title section is rendered separately as a server component.
 */
export function TourHero({ tour }: TourHeroProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)

  const handleImageClick = (index: number) => {
    setGalleryStartIndex(index)
    setGalleryOpen(true)
  }

  return (
    <section>
      <TourImageGrid
        gallery={tour.gallery || []}
        title={tour.title}
        onImageClick={handleImageClick}
      />

      {/* Fullscreen Gallery */}
      {tour.gallery && tour.gallery.length > 0 && (
        <TourGallery
          images={tour.gallery}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          startIndex={galleryStartIndex}
        />
      )}
    </section>
  )
}
