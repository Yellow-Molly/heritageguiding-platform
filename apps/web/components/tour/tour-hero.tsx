'use client'

import Image from 'next/image'
import { useState } from 'react'
import { TourGallery } from './tour-gallery'
import { TourFacts } from './tour-facts'
import { Badge } from '@/components/ui/badge'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourHeroProps {
  tour: TourDetail
}

/**
 * Hero section for tour detail page with gallery trigger.
 */
export function TourHero({ tour }: TourHeroProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)
  const heroImage = tour.gallery?.[0]?.image || tour.image

  // Guard against missing image — show placeholder instead of crashing Next.js Image
  if (!heroImage?.url) {
    return <section className="relative"><div className="h-[50vh] min-h-[400px] bg-[var(--color-surface)] lg:h-[60vh]" /></section>
  }

  return (
    <section className="relative">
      <div className="relative h-[50vh] min-h-[400px] lg:h-[60vh]">
        <Image
          src={heroImage.url}
          alt={heroImage.alt || tour.title}
          fill
          priority
          fetchPriority="high"
          placeholder={heroImage.blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={heroImage.blurDataUrl}
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Categories */}
        {tour.categories && tour.categories.length > 0 && (
          <div className="absolute left-4 top-4 flex flex-wrap gap-2 md:left-6 md:top-6">
            {tour.categories.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="bg-white/90 backdrop-blur-sm">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white md:p-6 lg:p-8">
          <div className="container">
            <h1 className="font-serif text-xl font-bold md:text-2xl lg:text-3xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>{tour.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/95 md:text-base" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>{tour.description}</p>
            {/* Desktop Quick Facts */}
            <div className="mt-4 hidden lg:block">
              <TourFacts tour={tour} variant="overlay" />
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip below hero — opens gallery at clicked image */}
      {tour.gallery && tour.gallery.length > 1 && (
        <div className="container relative z-10 mt-4">
          <div role="group" aria-label="Tour photo gallery" className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tour.gallery.filter(item => item.image?.url).slice(0, 6).map((item, i) => (
              <button
                key={i}
                onClick={() => { setGalleryStartIndex(i); setGalleryOpen(true) }}
                className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-white/50 transition-all hover:ring-white md:h-20 md:w-32"
              >
                <Image src={item.image.url} alt={item.image.alt || ''} fill className="object-cover" sizes="128px" />
                {i === 5 && tour.gallery!.length > 6 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
                    +{tour.gallery!.length - 6} more
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

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
