# Phase 07: Tour Details

## Context Links

- [MVP Project Plan v1.2](../../docs/MVP-PROJECT-PLAN-v1.2-ENHANCED-SCHEMA.md)
- [Data Models](./phase-03-data-models-cms-schema.md)
- [Tour Catalog](./phase-06-tour-catalog.md)
- [Rezdy Research](./research/researcher-02-rezdy-api-integration.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 32-36h |

Build tour detail pages with emotional + factual content layers, image gallery, guide bio, reviews, **logistics section with interactive map**, **inclusions/exclusions display**, accessibility info, and booking CTA integrated with Rezdy.

## Key Insights

- Dual content: emotional storytelling + factual details (AI-first)
- Schema.org TouristAttraction markup for discoverability
- Gallery with lightbox for immersive visuals
- Rezdy booking widget embed or custom date picker
- Reviews section with aggregate rating display
- **Meeting point with Google Maps integration (coordinates)**
- **Structured inclusions/exclusions for transparency**
- **Audience tags for related tour recommendations**

## Requirements

### Functional
- Hero image/gallery with lightbox
- Emotional description (storytelling layer)
- Factual details (duration, price, capacity)
- **Logistics section with:** *(Validated: Link only, no embed)*
  - Meeting point name and address
  - "Open in Google Maps" link (no embed - zero API cost)
  - Meeting instructions ("Look for guide with red umbrella")
  - Parking and public transport info
  - Ending point (if different)
- **Inclusions/Exclusions section:**
  - What's included (checklist with green checks)
  - What's NOT included (checklist with X marks)
  - What to bring (recommendations)
- Guide bio with credentials
- Customer reviews with ratings
- Accessibility information
- Booking CTA with availability check
- Related tours suggestions (using audience tags)

### Non-Functional
- Schema.org TouristAttraction + Person markup
- Open Graph meta tags for sharing
- Mobile-optimized gallery
- Print-friendly layout (optional)
- **Google Maps loads lazily for performance**

## Architecture

### Page Structure

```
Tour Detail
├── Header (breadcrumb navigation)
├── Hero Section
│   ├── Image gallery
│   └── Quick facts (price, duration, difficulty)
├── Content Section
│   ├── Emotional description
│   ├── Factual highlights
│   └── Tour highlights (bullet points)
├── Logistics Section (NEW)
│   ├── Meeting point name + address
│   ├── Interactive Google Maps embed
│   ├── Meeting instructions
│   ├── Public transport info
│   └── Parking info
├── Inclusions Section (NEW)
│   ├── What's included (green checkmarks)
│   ├── What's NOT included (red X)
│   └── What to bring (recommendations)
├── Guide Section
│   ├── Photo
│   ├── Name + credentials
│   └── Bio
├── Booking Section
│   ├── Price display
│   ├── Date picker
│   ├── Capacity indicator
│   └── Book Now CTA
├── Reviews Section
│   ├── Aggregate rating
│   └── Individual reviews
├── Accessibility Info
├── Related Tours (using audience tags)
└── Footer
```

## Related Code Files

### Create
- `apps/web/app/[locale]/tours/[slug]/page.tsx` - Tour detail page
- `apps/web/components/tour/tour-hero.tsx` - Hero with gallery
- `apps/web/components/tour/tour-gallery.tsx` - Image gallery
- `apps/web/components/tour/tour-content.tsx` - Description sections
- `apps/web/components/tour/tour-facts.tsx` - Quick facts
- `apps/web/components/tour/logistics-section.tsx` - Meeting point + map (NEW)
- `apps/web/components/tour/inclusions-section.tsx` - Included/excluded (NEW)
- `apps/web/components/tour/google-map-embed.tsx` - Map component (NEW)
- `apps/web/components/tour/guide-card.tsx` - Guide bio
- `apps/web/components/tour/reviews-section.tsx` - Reviews
- `apps/web/components/tour/booking-section.tsx` - Booking CTA
- `apps/web/components/tour/related-tours.tsx` - Related suggestions (uses audience tags)
- `apps/web/components/tour/tour-schema.tsx` - Schema.org
- `apps/web/lib/api/get-tour-by-slug.ts` - Single tour API
- `apps/web/lib/api/get-tour-reviews.ts` - Reviews API
- `apps/web/lib/api/get-related-tours.ts` - Related tours by audience tags

### Modify
- `messages/*.json` - Tour detail translations

## Implementation Steps

1. **Create Tour Detail Page**
   ```typescript
   // apps/web/app/[locale]/tours/[slug]/page.tsx
   import { notFound } from 'next/navigation'
   import { getTranslations } from 'next-intl/server'
   import { getTourBySlug } from '@/lib/api/get-tour-by-slug'
   import { getTourReviews } from '@/lib/api/get-tour-reviews'
   import { TourHero } from '@/components/tour/tour-hero'
   import { TourContent } from '@/components/tour/tour-content'
   import { GuideCard } from '@/components/tour/guide-card'
   import { BookingSection } from '@/components/tour/booking-section'
   import { ReviewsSection } from '@/components/tour/reviews-section'
   import { RelatedTours } from '@/components/tour/related-tours'
   import { TourSchema } from '@/components/tour/tour-schema'

   export default async function TourPage({
     params: { locale, slug }
   }) {
     const tour = await getTourBySlug(slug, locale)

     if (!tour) {
       notFound()
     }

     const reviews = await getTourReviews(tour.id)

     return (
       <>
         <TourSchema tour={tour} reviews={reviews} />
         <main>
           <TourHero tour={tour} />
           <div className="container py-12">
             <div className="grid gap-12 lg:grid-cols-3">
               <div className="lg:col-span-2">
                 <TourContent tour={tour} />
                 <GuideCard guide={tour.guide} />
                 <ReviewsSection reviews={reviews} />
               </div>
               <div className="lg:col-span-1">
                 <BookingSection tour={tour} />
               </div>
             </div>
           </div>
           <RelatedTours currentTourId={tour.id} categories={tour.categories} />
         </main>
       </>
     )
   }

   export async function generateMetadata({ params: { locale, slug } }) {
     const tour = await getTourBySlug(slug, locale)
     if (!tour) return {}

     return {
       title: tour.seo?.metaTitle || tour.title,
       description: tour.seo?.metaDescription || tour.description?.substring(0, 160),
       openGraph: {
         title: tour.title,
         description: tour.description,
         images: [tour.gallery?.[0]?.image?.url]
       }
     }
   }

   export async function generateStaticParams() {
     const tours = await getAllTourSlugs()
     return tours.flatMap(({ slug }) =>
       ['sv', 'en', 'de'].map((locale) => ({ locale, slug }))
     )
   }
   ```

2. **Build Tour Hero Component**
   ```typescript
   // apps/web/components/tour/tour-hero.tsx
   'use client'

   import Image from 'next/image'
   import { useState } from 'react'
   import { TourGallery } from './tour-gallery'
   import { TourFacts } from './tour-facts'
   import { Badge } from '@/components/ui/badge'

   export function TourHero({ tour }) {
     const [galleryOpen, setGalleryOpen] = useState(false)
     const heroImage = tour.gallery?.[0]?.image

     return (
       <section className="relative">
         <div className="relative h-[50vh] min-h-[400px]">
           <Image
             src={heroImage?.url}
             alt={heroImage?.alt}
             fill
             priority
             className="object-cover cursor-pointer"
             onClick={() => setGalleryOpen(true)}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

           {/* Categories */}
           <div className="absolute left-4 top-4 flex gap-2">
             {tour.categories?.map((cat) => (
               <Badge key={cat.id} variant="secondary">
                 {cat.name}
               </Badge>
             ))}
           </div>

           {/* Title overlay */}
           <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
             <div className="container">
               <h1 className="text-4xl font-bold">{tour.title}</h1>
               <TourFacts tour={tour} variant="overlay" />
             </div>
           </div>
         </div>

         <TourGallery
           images={tour.gallery}
           open={galleryOpen}
           onClose={() => setGalleryOpen(false)}
         />
       </section>
     )
   }
   ```

3. **Create Image Gallery with Lightbox**
   ```typescript
   // apps/web/components/tour/tour-gallery.tsx
   'use client'

   import Image from 'next/image'
   import { Dialog, DialogContent } from '@/components/ui/dialog'
   import { Button } from '@/components/ui/button'
   import { ChevronLeft, ChevronRight, X } from 'lucide-react'
   import { useState } from 'react'

   export function TourGallery({ images, open, onClose }) {
     const [currentIndex, setCurrentIndex] = useState(0)

     const next = () => setCurrentIndex((i) => (i + 1) % images.length)
     const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length)

     return (
       <Dialog open={open} onOpenChange={onClose}>
         <DialogContent className="max-w-4xl p-0">
           <div className="relative aspect-[16/10]">
             <Image
               src={images[currentIndex]?.image?.url}
               alt={images[currentIndex]?.image?.alt}
               fill
               className="object-contain"
             />
             <Button
               variant="ghost"
               size="icon"
               className="absolute left-2 top-1/2 -translate-y-1/2"
               onClick={prev}
               aria-label="Previous image"
             >
               <ChevronLeft />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="absolute right-2 top-1/2 -translate-y-1/2"
               onClick={next}
               aria-label="Next image"
             >
               <ChevronRight />
             </Button>
           </div>
           <div className="flex justify-center gap-2 p-4">
             {images.map((_, i) => (
               <button
                 key={i}
                 className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-primary' : 'bg-muted'}`}
                 onClick={() => setCurrentIndex(i)}
                 aria-label={`Go to image ${i + 1}`}
               />
             ))}
           </div>
         </DialogContent>
       </Dialog>
     )
   }
   ```

4. **Build Tour Content Component**
   ```typescript
   // apps/web/components/tour/tour-content.tsx
   import { useTranslations } from 'next-intl'

   export function TourContent({ tour }) {
     const t = useTranslations('tourDetail')

     return (
       <div className="space-y-8">
         {/* Emotional Description */}
         <section>
           <h2 className="text-2xl font-semibold">{t('experience')}</h2>
           <div
             className="prose mt-4"
             dangerouslySetInnerHTML={{ __html: tour.description }}
           />
         </section>

         {/* Tour Highlights */}
         {tour.highlights?.length > 0 && (
           <section>
             <h2 className="text-2xl font-semibold">{t('highlights')}</h2>
             <ul className="mt-4 space-y-2 list-disc list-inside">
               {tour.highlights.map((item, i) => (
                 <li key={i}>{item.highlight}</li>
               ))}
             </ul>
           </section>
         )}

         {/* Accessibility */}
         {tour.accessibility && (
           <section>
             <h2 className="text-2xl font-semibold">{t('accessibility')}</h2>
             <div className="mt-4 space-y-2">
               {tour.accessibility.wheelchairAccessible && (
                 <p>Wheelchair accessible</p>
               )}
               {tour.accessibility.mobilityNotes && (
                 <p>{tour.accessibility.mobilityNotes}</p>
               )}
             </div>
           </section>
         )}
       </div>
     )
   }
   ```

4.5. **Build Logistics Section (NEW)**
   ```typescript
   // apps/web/components/tour/logistics-section.tsx
   import { useTranslations } from 'next-intl'
   import { MapPin, Car, Train, Clock } from 'lucide-react'
   import { GoogleMapEmbed } from './google-map-embed'
   import { Card, CardContent } from '@/components/ui/card'

   export function LogisticsSection({ tour }) {
     const t = useTranslations('tourDetail.logistics')
     const { logistics } = tour

     if (!logistics) return null

     return (
       <section className="mt-12">
         <h2 className="text-2xl font-semibold">{t('title')}</h2>
         <Card className="mt-4">
           <CardContent className="p-6 grid gap-6 lg:grid-cols-2">
             {/* Meeting Point Info */}
             <div className="space-y-4">
               <div className="flex gap-3">
                 <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                 <div>
                   <p className="font-semibold">{t('meetingPoint')}</p>
                   <p>{logistics.meetingPointName}</p>
                   {logistics.meetingPointAddress && (
                     <p className="text-sm text-muted-foreground">
                       {logistics.meetingPointAddress}
                     </p>
                   )}
                 </div>
               </div>

               {logistics.meetingPointInstructions && (
                 <div className="flex gap-3">
                   <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                   <div>
                     <p className="font-semibold">{t('instructions')}</p>
                     <p className="text-sm">{logistics.meetingPointInstructions}</p>
                   </div>
                 </div>
               )}

               {logistics.publicTransportInfo && (
                 <div className="flex gap-3">
                   <Train className="h-5 w-5 text-primary flex-shrink-0" />
                   <div>
                     <p className="font-semibold">{t('publicTransport')}</p>
                     <p className="text-sm">{logistics.publicTransportInfo}</p>
                   </div>
                 </div>
               )}

               {logistics.parkingInfo && (
                 <div className="flex gap-3">
                   <Car className="h-5 w-5 text-primary flex-shrink-0" />
                   <div>
                     <p className="font-semibold">{t('parking')}</p>
                     <p className="text-sm">{logistics.parkingInfo}</p>
                   </div>
                 </div>
               )}

               {logistics.endingPoint && (
                 <p className="text-sm">
                   <span className="font-semibold">{t('endingPoint')}: </span>
                   {logistics.endingPoint}
                 </p>
               )}
             </div>

             {/* Google Maps Embed */}
             {logistics.coordinates && (
               <GoogleMapEmbed
                 lat={logistics.coordinates.latitude}
                 lng={logistics.coordinates.longitude}
                 title={logistics.meetingPointName}
                 googleMapsLink={logistics.googleMapsLink}
               />
             )}
           </CardContent>
         </Card>
       </section>
     )
   }
   ```

4.6. **Build Google Map Embed Component (NEW)**
   ```typescript
   // apps/web/components/tour/google-map-embed.tsx
   'use client'

   import { useState } from 'react'
   import { Button } from '@/components/ui/button'
   import { ExternalLink } from 'lucide-react'

   interface Props {
     lat: number
     lng: number
     title: string
     googleMapsLink?: string
   }

   export function GoogleMapEmbed({ lat, lng, title, googleMapsLink }: Props) {
     const [loaded, setLoaded] = useState(false)
     const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${lat},${lng}&zoom=16`

     return (
       <div className="space-y-2">
         <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
           {!loaded ? (
             <button
               onClick={() => setLoaded(true)}
               className="absolute inset-0 flex items-center justify-center hover:bg-muted/80 transition"
             >
               <span className="text-sm">Click to load map</span>
             </button>
           ) : (
             <iframe
               src={embedUrl}
               width="100%"
               height="100%"
               style={{ border: 0 }}
               allowFullScreen
               loading="lazy"
               referrerPolicy="no-referrer-when-downgrade"
               title={`Map showing ${title}`}
             />
           )}
         </div>
         {googleMapsLink && (
           <Button variant="outline" size="sm" asChild className="w-full">
             <a href={googleMapsLink} target="_blank" rel="noopener noreferrer">
               <ExternalLink className="h-4 w-4 mr-2" />
               Open in Google Maps
             </a>
           </Button>
         )}
       </div>
     )
   }
   ```

4.7. **Build Inclusions Section (NEW)**
   ```typescript
   // apps/web/components/tour/inclusions-section.tsx
   import { useTranslations } from 'next-intl'
   import { Check, X, Lightbulb } from 'lucide-react'

   export function InclusionsSection({ tour }) {
     const t = useTranslations('tourDetail.inclusions')

     const hasContent = tour.included?.length || tour.notIncluded?.length || tour.whatToBring?.length
     if (!hasContent) return null

     return (
       <section className="mt-12">
         <h2 className="text-2xl font-semibold">{t('title')}</h2>

         <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {/* What's Included */}
           {tour.included?.length > 0 && (
             <div>
               <h3 className="font-semibold text-green-700 mb-3">{t('included')}</h3>
               <ul className="space-y-2">
                 {tour.included.map((item, i) => (
                   <li key={i} className="flex items-start gap-2">
                     <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                     <span>{item.item}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}

           {/* What's NOT Included */}
           {tour.notIncluded?.length > 0 && (
             <div>
               <h3 className="font-semibold text-red-700 mb-3">{t('notIncluded')}</h3>
               <ul className="space-y-2">
                 {tour.notIncluded.map((item, i) => (
                   <li key={i} className="flex items-start gap-2">
                     <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                     <span>{item.item}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}

           {/* What to Bring */}
           {tour.whatToBring?.length > 0 && (
             <div>
               <h3 className="font-semibold text-amber-700 mb-3">{t('whatToBring')}</h3>
               <ul className="space-y-2">
                 {tour.whatToBring.map((item, i) => (
                   <li key={i} className="flex items-start gap-2">
                     <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <span>{item.item}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}
         </div>
       </section>
     )
   }
   ```

5. **Create Guide Card Component**
   ```typescript
   // apps/web/components/tour/guide-card.tsx
   import Image from 'next/image'
   import { useTranslations } from 'next-intl'
   import { Card, CardContent } from '@/components/ui/card'
   import { Badge } from '@/components/ui/badge'

   export function GuideCard({ guide }) {
     const t = useTranslations('tourDetail.guide')

     return (
       <section className="mt-12">
         <h2 className="text-2xl font-semibold">{t('title')}</h2>
         <Card className="mt-4">
           <CardContent className="flex gap-6 p-6">
             <div className="relative h-24 w-24 flex-shrink-0">
               <Image
                 src={guide.photo?.url}
                 alt={guide.name}
                 fill
                 className="rounded-full object-cover"
               />
             </div>
             <div>
               <h3 className="text-xl font-semibold">{guide.name}</h3>
               <div className="mt-2 flex flex-wrap gap-2">
                 {guide.credentials?.map((cred, i) => (
                   <Badge key={i} variant="outline">{cred.credential}</Badge>
                 ))}
               </div>
               <div
                 className="prose prose-sm mt-4"
                 dangerouslySetInnerHTML={{ __html: guide.bio }}
               />
             </div>
           </CardContent>
         </Card>
       </section>
     )
   }
   ```

6. **Build Booking Section**
   ```typescript
   // apps/web/components/tour/booking-section.tsx
   'use client'

   import { useTranslations } from 'next-intl'
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
   import { Button } from '@/components/ui/button'
   import { Clock, Users, MapPin } from 'lucide-react'

   export function BookingSection({ tour }) {
     const t = useTranslations('tourDetail.booking')

     return (
       <Card className="sticky top-24">
         <CardHeader>
           <CardTitle className="flex items-center justify-between">
             <span>{t('bookNow')}</span>
             <span className="text-3xl font-bold">{tour.price} SEK</span>
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2 text-sm">
             <div className="flex items-center gap-2">
               <Clock className="h-4 w-4" />
               <span>{tour.duration} {t('minutes')}</span>
             </div>
             <div className="flex items-center gap-2">
               <Users className="h-4 w-4" />
               <span>{t('maxGroup', { count: tour.maxCapacity })}</span>
             </div>
             <div className="flex items-center gap-2">
               <MapPin className="h-4 w-4" />
               <span>{tour.meetingPoint}</span>
             </div>
           </div>

           {/* Rezdy widget will be embedded here */}
           <div id="rezdy-booking-widget" data-product={tour.rezdyProductCode}>
             {/* Placeholder for Rezdy integration */}
           </div>

           <Button className="w-full" size="lg">
             {t('checkAvailability')}
           </Button>

           <p className="text-center text-xs text-muted-foreground">
             {t('freeCancellation')}
           </p>
         </CardContent>
       </Card>
     )
   }
   ```

7. **Create Reviews Section**
   ```typescript
   // apps/web/components/tour/reviews-section.tsx
   import { useTranslations } from 'next-intl'
   import { RatingStars } from '@/components/shared/rating-stars'
   import { formatDate } from '@/lib/i18n/date-format'
   import { useLocale } from 'next-intl'

   export function ReviewsSection({ reviews }) {
     const t = useTranslations('tourDetail.reviews')
     const locale = useLocale()

     const averageRating = reviews.length
       ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
       : 0

     return (
       <section className="mt-12">
         <div className="flex items-center justify-between">
           <h2 className="text-2xl font-semibold">{t('title')}</h2>
           <div className="flex items-center gap-2">
             <RatingStars rating={Math.round(averageRating)} />
             <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
             <span className="text-muted-foreground">
               ({reviews.length} {t('reviewCount')})
             </span>
           </div>
         </div>

         <div className="mt-6 space-y-6">
           {reviews.map((review) => (
             <div key={review.id} className="border-b pb-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="font-semibold">{review.authorName}</p>
                   <p className="text-sm text-muted-foreground">
                     {review.authorCountry}
                   </p>
                 </div>
                 <div className="text-right">
                   <RatingStars rating={review.rating} />
                   <p className="text-sm text-muted-foreground">
                     {formatDate(new Date(review.date), locale)}
                   </p>
                 </div>
               </div>
               <p className="mt-3">{review.text}</p>
             </div>
           ))}
         </div>
       </section>
     )
   }
   ```

8. **Add Schema.org Markup**
   ```typescript
   // apps/web/components/tour/tour-schema.tsx
   export function TourSchema({ tour, reviews }) {
     const averageRating = reviews.length
       ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
       : null

     const schema = {
       '@context': 'https://schema.org',
       '@type': 'TouristAttraction',
       name: tour.title,
       description: tour.description,
       image: tour.gallery?.[0]?.image?.url,
       touristType: tour.categories?.map((c) => c.name),
       isAccessibleForFree: false,
       publicAccess: true,
       ...(averageRating && {
         aggregateRating: {
           '@type': 'AggregateRating',
           ratingValue: averageRating.toFixed(1),
           reviewCount: reviews.length
         }
       }),
       offers: {
         '@type': 'Offer',
         price: tour.price,
         priceCurrency: 'SEK',
         availability: 'https://schema.org/InStock'
       }
     }

     return (
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
       />
     )
   }
   ```

9. **Create Related Tours Component**
   ```typescript
   // apps/web/components/tour/related-tours.tsx
   import { getRelatedTours } from '@/lib/api/get-related-tours'
   import { TourCard } from './tour-card'
   import { useTranslations } from 'next-intl'

   export async function RelatedTours({ currentTourId, categories }) {
     const t = await getTranslations('tourDetail')
     const tours = await getRelatedTours(currentTourId, categories)

     if (tours.length === 0) return null

     return (
       <section className="bg-muted py-12">
         <div className="container">
           <h2 className="text-2xl font-semibold">{t('relatedTours')}</h2>
           <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {tours.map((tour) => (
               <TourCard key={tour.id} tour={tour} />
             ))}
           </div>
         </div>
       </section>
     )
   }
   ```

10. **Implement API Functions**
    ```typescript
    // apps/web/lib/api/get-tour-by-slug.ts
    export async function getTourBySlug(slug: string, locale: string) {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'tours',
        where: { slug: { equals: slug }, status: { equals: 'published' } },
        locale,
        depth: 3
      })
      return docs[0] || null
    }

    // apps/web/lib/api/get-tour-reviews.ts
    export async function getTourReviews(tourId: string) {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'reviews',
        where: { tour: { equals: tourId }, verified: { equals: true } },
        sort: '-date',
        limit: 10
      })
      return docs
    }
    ```

## Todo List

- [ ] Create tour detail page with SSG
- [ ] Build TourHero with gallery trigger
- [ ] Create TourGallery lightbox
- [ ] Build TourContent sections
- [ ] Create TourFacts component
- [ ] Build LogisticsSection with map (NEW)
- [ ] Create GoogleMapEmbed component (NEW)
- [ ] Build InclusionsSection (NEW)
- [ ] Build GuideCard component
- [ ] Create BookingSection (placeholder for Rezdy)
- [ ] Build ReviewsSection with ratings
- [ ] Add TourSchema (Schema.org)
- [ ] Create RelatedTours component (uses audience tags)
- [ ] Implement getTourBySlug API
- [ ] Implement getTourReviews API
- [ ] Implement getRelatedTours API (by audience tags)
- [ ] Generate Open Graph metadata
- [ ] Add translations (SV/EN/DE)
- [ ] Add logistics translations
- [ ] Add inclusions translations
- [ ] Configure Google Maps API key
- [ ] Test static generation
- [ ] Verify Schema.org validates

## Success Criteria

- [ ] Tour pages render with all content
- [ ] Gallery lightbox works on mobile
- [ ] Logistics section shows meeting point + map
- [ ] Google Maps loads lazily (performance)
- [ ] Inclusions/Exclusions display correctly
- [ ] Guide information displays correctly
- [ ] Reviews show with ratings
- [ ] Schema.org validates without errors
- [ ] Open Graph preview works
- [ ] Static pages generated at build
- [ ] All 3 locales work correctly

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missing tour data | High | Medium | Handle null states gracefully |
| Large gallery images | Medium | Medium | Optimize images, lazy load |
| Rezdy widget conflicts | Medium | Low | Isolate widget in iframe if needed |

## Security Considerations

- Sanitize rich text HTML before rendering
- Validate tour slug parameter
- Limit review content length display

## Next Steps

After completion:
1. Proceed to [Phase 08: Rezdy Integration](./phase-08-rezdy-integration.md)
2. Implement booking flow
3. Connect availability API
