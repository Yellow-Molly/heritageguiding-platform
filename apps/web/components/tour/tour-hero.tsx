'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Camera } from 'lucide-react'
import { TourGallery } from './tour-gallery'
import { TourFacts } from './tour-facts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface TourHeroProps {
  tour: TourDetail
}

/**
 * Hero section for tour detail page with gallery trigger.
 */
export function TourHero({ tour }: TourHeroProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const heroImage = tour.gallery?.[0]?.image || tour.image

  return (
    <section className="relative">
      <div className="relative h-[50vh] min-h-[400px] lg:h-[60vh]">
        <Image
          src={heroImage.url}
          alt={heroImage.alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

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

        {/* Gallery Button */}
        {tour.gallery && tour.gallery.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 bg-white/90 backdrop-blur-sm md:right-6 md:top-6"
            onClick={() => setGalleryOpen(true)}
          >
            <Camera className="mr-2 h-4 w-4" />
            View Gallery ({tour.gallery.length})
          </Button>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white md:p-6 lg:p-8">
          <div className="container">
            <h1 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl">{tour.title}</h1>
            <p className="mt-2 max-w-2xl text-lg text-white/90 md:text-xl">{tour.description}</p>
            {/* Desktop Quick Facts */}
            <div className="mt-4 hidden lg:block">
              <TourFacts tour={tour} variant="overlay" />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {tour.gallery && tour.gallery.length > 0 && (
        <TourGallery
          images={tour.gallery}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </section>
  )
}
