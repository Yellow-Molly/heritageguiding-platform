---
phase: 2
title: "Image Blur Placeholders"
status: pending
priority: P1
effort: 3h
---

# Phase 2: Image Blur Placeholders

## Context
- [Plan overview](plan.md)
- 19 files use `<Image>` from next/image, 30+ instances
- 0 instances of `placeholder="blur"` or `blurDataURL`
- Users see blank space while images load → perceived slowness

## Overview
Add blur placeholders to all Image components. Two strategies:
- **Static Unsplash images**: Generate blurDataURL at build time using `plaiceholder`
- **CMS images**: Create utility that generates blur data URL from Payload image sizes

## Key Insights
- `next/image` supports `placeholder="blur"` with `blurDataURL` (base64 tiny image)
- For remote images, `blurDataURL` must be provided manually (not auto-generated like static imports)
- Payload already generates a `thumbnail` size (400×300) — can derive blur from that
- `sharp` is already installed (`^0.34.5`) — can generate blur without new dependencies

## Requirements

### Functional
- All 30+ Image instances show blur placeholder during load
- Blur placeholders are tiny (~20-40 bytes base64) for zero layout shift
- CMS images use thumbnail URL to derive blur
- Unsplash images have pre-generated blur data URLs

### Non-functional
- No additional runtime HTTP requests for blur generation
- Blur generation adds <1s to page render time
- No new npm dependencies (use existing `sharp`)

## Architecture

### Blur Generation Strategy

```
Unsplash images (hardcoded URLs)
  └─> Pre-computed base64 blur strings (const in source)
      └─> Applied as blurDataURL prop

CMS images (Payload media)
  └─> Server-side utility: fetchBlurDataUrl(imageUrl)
      └─> Uses sharp to resize to 8×8, base64 encode
      └─> Cached per URL (in-memory Map or Next.js cache)
      └─> Applied as blurDataURL prop in server components
```

### For client components with Unsplash URLs
Generate blur data URLs once using a script, store as constants:
```ts
// apps/web/lib/image-blur-constants.ts
export const BLUR_DATA = {
  HERO_GAMLA_STAN: 'data:image/jpeg;base64,/9j/4AAQ...',
  ABOUT_ARCHIPELAGO: 'data:image/jpeg;base64,/9j/4AAQ...',
  // ... etc
} as const
```

### For server components with CMS data
Utility function that generates blur on the server:
```ts
// apps/web/lib/image-blur-generator.ts
export async function generateBlurDataUrl(imageUrl: string): Promise<string>
```

## Related Code Files

### Files to create
- `apps/web/lib/image-blur-constants.ts` — pre-generated blur data for Unsplash URLs
- `apps/web/lib/image-blur-generator.ts` — server-side blur generation utility
- `scripts/generate-blur-constants.ts` — one-time script to generate Unsplash blur data

### Files to modify (add placeholder="blur" + blurDataURL)

**Home components (7 files):**
1. `apps/web/components/home/hero-section.tsx` — Unsplash hero (above-fold, priority)
2. `apps/web/components/home/featured-tours.tsx` — CMS tour images
3. `apps/web/components/home/guides-preview.tsx` — CMS guide photos
4. `apps/web/components/home/latest-posts.tsx` — Unsplash blog images
5. `apps/web/components/home/testimonials.tsx` — Unsplash avatars (small, low priority)
6. `apps/web/components/home/seasonal-cta.tsx` — CMS with Unsplash fallback
7. `apps/web/components/home/video-highlight.tsx` — Unsplash thumbnail

**Guide components (3 files):**
8. `apps/web/components/guide/guide-detail-header.tsx` — CMS guide photo
9. `apps/web/components/guide/guide-listing-card.tsx` — CMS guide photo
10. `apps/web/components/guide/guide-tours-section.tsx` — CMS tour images

**Tour components (4 files):**
11. `apps/web/components/tour/tour-hero.tsx` — CMS gallery hero
12. `apps/web/components/tour/tour-gallery.tsx` — CMS gallery (modal)
13. `apps/web/components/tour/tour-card.tsx` — CMS tour image
14. `apps/web/components/tour/guide-card.tsx` — CMS guide photo

**Page components (3 files):**
15. `apps/web/components/pages/about-hero-section.tsx` — Unsplash hero
16. `apps/web/components/pages/about-story-section.tsx` — Unsplash
17. `apps/web/components/pages/about-responsible-tourism-section.tsx` — Unsplash
18. `apps/web/components/contact/contact-hero-section.tsx` — Unsplash hero

**Skip:**
- `apps/web/components/layout/header.tsx` — SVG logo, `unoptimized=true`, no blur needed

## Implementation Steps

### Step 1: Create blur generation utility
Create `apps/web/lib/image-blur-generator.ts`:
- `generateBlurDataUrl(imageUrl: string): Promise<string>`
- Fetch image → sharp resize to 8×6 pixels → JPEG quality 20 → base64 encode
- Add in-memory cache (Map<string, string>) to avoid re-fetching
- Handle errors gracefully (return empty string, image still loads without blur)

### Step 2: Generate Unsplash blur constants
Create script `scripts/generate-blur-constants.ts`:
- List all hardcoded Unsplash URLs from components
- For each: fetch → sharp → base64
- Output `apps/web/lib/image-blur-constants.ts` with named exports

Run once: `npx tsx scripts/generate-blur-constants.ts`

Unique Unsplash URLs to process (7):
1. `photo-1508189860359-777d945909ef` — Gamla Stan sunset (hero, about-hero)
2. `photo-1509356843151-3e7d96241e11` — Archipelago (video, about-story, seasonal-summer, blog)
3. `photo-1548777123-e216912df7d8` — Winter scene (seasonal-winter, blog)
4. `photo-1513635269975-59663e0ac1ad` — City (blog)
5. `photo-1560969184-10fe8719e047` — Nature (about-tourism)
6. `photo-1511635697257-11edf94574d3` — Cityscape (contact-hero)
7. 4 avatar photos (200px) — testimonials

### Step 3: Add blur to Unsplash Image components
For each component using hardcoded Unsplash URLs:
```tsx
import { BLUR_DATA } from '@/lib/image-blur-constants'

<Image
  src="https://images.unsplash.com/..."
  placeholder="blur"
  blurDataURL={BLUR_DATA.HERO_GAMLA_STAN}
  // ... other props unchanged
/>
```

### Step 4: Add blur to CMS Image components
For server components rendering CMS images:
```tsx
import { generateBlurDataUrl } from '@/lib/image-blur-generator'

// In server component or data fetch:
const blurDataUrl = await generateBlurDataUrl(tour.image.url)

<Image
  src={tour.image.url}
  placeholder="blur"
  blurDataURL={blurDataUrl}
  // ... other props unchanged
/>
```

For client components: pass blurDataUrl as prop from parent server component.

### Step 5: Update data flow for CMS images
Extend `FeaturedTour` and `TourDetail` interfaces to include optional `blurDataUrl` field.
In `tour-payload-mapper.ts` `resolvePrimaryImage()`: add blur generation call.
In guide fetchers: add blur generation for guide photos.

### Step 6: Compile check
Run `npm run build` locally to verify no type errors or build failures.

## Todo List
- [ ] Create `apps/web/lib/image-blur-generator.ts`
- [ ] Create `scripts/generate-blur-constants.ts`
- [ ] Run script → generate `apps/web/lib/image-blur-constants.ts`
- [ ] Add blur to 7 Unsplash-based components (hero, about, contact, video, blog, testimonials, seasonal)
- [ ] Add blur to 11 CMS-based components (tours, guides, gallery)
- [ ] Extend FeaturedTour/TourDetail interfaces with blurDataUrl
- [ ] Update tour-payload-mapper.ts with blur generation
- [ ] Update guide fetchers with blur generation
- [ ] Run build check — no type errors
- [ ] Visual check: blur placeholders visible in dev

## Success Criteria
- Every `<Image>` component (except SVG logo) has `placeholder="blur"`
- Unsplash images use pre-generated constants
- CMS images use server-side generated blur
- Build passes with no errors
- Visual: grey/blurred preview visible before image loads

## Risk Assessment
- `sharp` may not be available in Vercel serverless functions → sharp IS already in deps and Vercel supports it
- Blur generation adds latency to server component render → mitigated by caching and tiny 8×6 resize
- Some CMS images may be missing/broken URLs → graceful fallback (no blur, image still loads)
