# Phase 3: Fullscreen Gallery

**Status:** DONE
**Priority:** Medium
**Effort:** Medium

## Context

Current gallery uses a `Dialog` with `max-w-5xl` — it renders as a constrained modal. User wants a bigger, fullscreen experience. The gallery button ("View Gallery") is also small and easy to miss.

## Files to Modify

- `apps/web/components/tour/tour-gallery.tsx` — fullscreen lightbox
- `apps/web/components/tour/tour-hero.tsx` — better gallery trigger button

## Implementation Steps

### 1. Fullscreen Gallery (`tour-gallery.tsx`)

Replace Dialog-based modal with a fullscreen overlay:

- Use a portal-based fullscreen overlay (`fixed inset-0 z-50`) instead of `DialogContent max-w-5xl`
- Image fills viewport with `object-contain` for proper aspect ratio
- Dark background (`bg-black`)
- Larger navigation arrows
- Thumbnail strip at bottom instead of dots
- Image counter stays
- Keyboard nav stays (already implemented)
- Smooth transitions between images

```tsx
// Replace Dialog wrapper with direct portal-style overlay
return open ? (
  <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal="true">
    {/* Close button - top right */}
    <button className="absolute right-4 top-4 z-50 ..." onClick={onClose}>
      <X className="h-8 w-8" />
    </button>

    {/* Main image - fills screen */}
    <div className="flex h-full items-center justify-center p-4 pb-24">
      <div className="relative h-full w-full max-h-[calc(100vh-120px)]">
        <Image src={...} alt={...} fill className="object-contain" sizes="100vw" />
      </div>
    </div>

    {/* Navigation arrows - larger */}
    <button className="absolute left-4 top-1/2 -translate-y-1/2 ...">
      <ChevronLeft className="h-10 w-10" />
    </button>
    <button className="absolute right-4 top-1/2 -translate-y-1/2 ...">
      <ChevronRight className="h-10 w-10" />
    </button>

    {/* Thumbnail strip at bottom */}
    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 p-4 bg-black/80">
      {images.map((img, i) => (
        <button key={i} onClick={() => setCurrentIndex(i)} className="...">
          <Image src={img.image.url} alt="" width={80} height={56} className="object-cover rounded" />
        </button>
      ))}
    </div>

    {/* Counter */}
    <div className="absolute top-4 left-4 text-white/75 text-sm">
      {currentIndex + 1} / {images.length}
    </div>
  </div>
) : null
```

### 2. Thumbnail Strip Below Hero (`tour-hero.tsx`)

Replace the small "View Gallery" button with a row of clickable thumbnail previews below the hero image. Clicking any thumbnail opens the fullscreen gallery at that image index.

```tsx
{/* Remove the old Button from inside the hero overlay */}

{/* Add thumbnail strip AFTER the hero image container */}
{tour.gallery && tour.gallery.length > 1 && (
  <div className="container -mt-8 relative z-10">
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tour.gallery.slice(0, 6).map((item, i) => (
        <button
          key={i}
          onClick={() => { setGalleryOpen(true); setGalleryStartIndex(i) }}
          className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-white/50 hover:ring-white transition-all md:h-20 md:w-32"
        >
          <Image src={item.image.url} alt={item.image.alt} fill className="object-cover" sizes="128px" />
          {/* Show "+N more" on last visible thumbnail if more images exist */}
          {i === 5 && tour.gallery.length > 6 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
              +{tour.gallery.length - 6} more
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
)}
```

**Changes needed:**
- Add `galleryStartIndex` state to pass initial index to gallery
- Remove the old `Button` with `Camera` icon from inside the hero overlay
- `TourGallery` needs to accept optional `startIndex` prop

### 3. Body Scroll Lock

When gallery is open, prevent background scrolling:

```tsx
useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => { document.body.style.overflow = '' }
}, [open])
```

## Success Criteria

- [x] Gallery opens fullscreen (covers entire viewport)
- [x] Images display large with proper aspect ratio
- [x] Thumbnail strip at bottom for quick navigation
- [x] Arrow key + click navigation works
- [x] Escape closes gallery
- [x] Background scroll locked when gallery open
- [x] Smooth, polished feel
