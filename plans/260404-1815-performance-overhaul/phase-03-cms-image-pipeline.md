---
phase: 3
title: "CMS Image Pipeline Optimization"
status: pending
priority: P1
effort: 2h
---

# Phase 3: CMS Image Pipeline Optimization

## Context
- [Plan overview](plan.md)
- Payload Media collection: `packages/cms/collections/media.ts`
- Image sizes: thumbnail (400×300), card (768×512), hero (1920×1080)
- Mapper: `apps/web/lib/api/tour-payload-mapper.ts`
- Storage: Vercel Blob via `@payloadcms/storage-vercel-blob`

## Overview
Ensure CMS images serve correct size variants (not originals), add blur hash storage in Payload, and optimize the image data flow from CMS to frontend components.

## Key Findings
- `resolvePrimaryImage()` already prefers `card` size: `media.sizes?.card?.url || media.url`
- BUT gallery images in `mapPayloadTourToTourDetail()` use `media.url` (original) — not size variants
- Guide photos access `guide.photo.url` directly — no size variant selection
- No blur hash field exists on Media collection
- Payload hooks exist for slug + embedding, but none on Media collection

## Requirements

### Functional
- Gallery images use `hero` size variant (1920×1080) instead of original
- Guide photos use `thumbnail` size (400×300) for listings, `card` (768×512) for detail
- Blur hash stored in Media collection (generated on upload via afterChange hook)
- Frontend receives blur data URL from CMS data

### Non-functional
- No re-upload required for existing images
- Blur hash generation <500ms per image
- Backward compatible (old media without blur hash still works)

## Related Code Files

### Files to modify
- `packages/cms/collections/media.ts` — add `blurDataUrl` field
- `packages/cms/hooks/generate-blur-on-upload-hook.ts` — NEW: afterChange hook for blur generation
- `apps/web/lib/api/tour-payload-mapper.ts` — use size variants for gallery, pass blur data
- `apps/web/lib/api/get-guides.ts` — pass blur data + use size variants
- `apps/web/lib/api/get-guide-by-slug.ts` — pass blur data + use size variants
- `apps/web/lib/api/get-featured-tours.ts` — pass blur data through
- `apps/web/lib/api/get-tour-by-slug.ts` — pass blur data through

### Files to read for context
- `packages/cms/payload.config.ts` — plugin config, collections list
- `packages/cms/hooks/format-slug.ts` — example hook pattern
- `packages/cms/hooks/generate-tour-embedding-on-save-hook.ts` — example afterChange hook

## Implementation Steps

### Step 1: Add blurDataUrl field to Media collection
In `packages/cms/collections/media.ts`, add field:
```ts
{
  name: 'blurDataUrl',
  type: 'text',
  admin: {
    description: 'Auto-generated blur placeholder (base64)',
    readOnly: true,
    position: 'sidebar',
  },
}
```

### Step 2: Create blur generation hook
Create `packages/cms/hooks/generate-blur-on-upload-hook.ts`:
- `afterChange` hook on Media collection
- On image upload: fetch thumbnail URL → sharp resize to 8×6 → base64
- Store result in `blurDataUrl` field via `req.payload.update()`
- Skip if: not an image MIME type, blurDataUrl already set, or no thumbnail generated yet
- Use existing `sharp` dependency

Pattern (follow existing hook style from `generate-tour-embedding-on-save-hook.ts`):
```ts
import type { CollectionAfterChangeHook } from 'payload'
import sharp from 'sharp'

export const generateBlurOnUploadHook: CollectionAfterChangeHook = async ({
  doc, req, operation,
}) => {
  // Only on create or if blurDataUrl is missing
  if (doc.mimeType && !doc.mimeType.startsWith('image/')) return doc
  if (doc.blurDataUrl && operation === 'update') return doc

  const imageUrl = doc.sizes?.thumbnail?.url || doc.url
  if (!imageUrl) return doc

  try {
    const response = await fetch(imageUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    const blurBuffer = await sharp(buffer)
      .resize(8, 6)
      .jpeg({ quality: 20 })
      .toBuffer()
    const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`

    await req.payload.update({
      collection: 'media',
      id: doc.id,
      data: { blurDataUrl },
      req, // pass req to avoid triggering hooks recursively
    })
  } catch (error) {
    req.payload.logger.warn(`Blur generation failed for media ${doc.id}: ${error}`)
  }

  return doc
}
```

### Step 3: Register hook on Media collection
In `packages/cms/collections/media.ts`:
```ts
import { generateBlurOnUploadHook } from '../hooks/generate-blur-on-upload-hook'

export const Media: CollectionConfig = {
  // ...
  hooks: {
    afterChange: [generateBlurOnUploadHook],
  },
  // ...
}
```

### Step 4: Fix gallery image size variants
In `apps/web/lib/api/tour-payload-mapper.ts`, update gallery mapping to use `hero` size:
```ts
// Current (uses original):
url: (media as PayloadMedia).url ?? '',

// Fixed (prefer hero size for gallery):
url: (media as PayloadMedia).sizes?.hero?.url || (media as PayloadMedia).url ?? '',
```

Also extend `PayloadMedia` interface:
```ts
interface PayloadMedia {
  url?: string | null
  alt?: string
  blurDataUrl?: string | null
  sizes?: {
    card?: { url?: string | null } | null
    hero?: { url?: string | null } | null
    thumbnail?: { url?: string | null } | null
  }
}
```

### Step 5: Pass blur data through mappers
Update `resolvePrimaryImage()` return type to include `blurDataUrl`:
```ts
export function resolvePrimaryImage(
  images: TourImageRow[] | null | undefined,
  fallbackAlt = ''
): { url: string; alt: string; blurDataUrl?: string } {
  // ... existing logic ...
  const blurDataUrl = (media as PayloadMedia).blurDataUrl ?? undefined
  return { url, alt, blurDataUrl }
}
```

Update gallery mapping similarly to include `blurDataUrl`.

### Step 6: Update guide data fetchers
In `apps/web/lib/api/get-guides.ts` and `get-guide-by-slug.ts`:
- Extract `blurDataUrl` from guide photo
- Use `thumbnail` size for listing, `card` size for detail
- Pass blur data to components

### Step 7: Backfill existing media
Create one-time script `scripts/backfill-media-blur.ts`:
- Query all media documents without `blurDataUrl`
- For each: generate blur, update document
- Run via: `npx tsx scripts/backfill-media-blur.ts`

### Step 8: Compile check
Run `npm run build` to verify types and build pass.

## Todo List
- [ ] Add `blurDataUrl` field to Media collection
- [ ] Create `generate-blur-on-upload-hook.ts`
- [ ] Register hook on Media collection
- [ ] Extend PayloadMedia interface with sizes.hero, sizes.thumbnail, blurDataUrl
- [ ] Fix gallery mapping to use hero size variant
- [ ] Update resolvePrimaryImage to return blurDataUrl
- [ ] Update guide fetchers with size variants + blur
- [ ] Create backfill script for existing media
- [ ] Run backfill script
- [ ] Build check passes

## Success Criteria
- New image uploads auto-generate blurDataUrl
- Gallery images served at 1920×1080 (hero size) not original
- Guide listing photos served at 400×300 (thumbnail) not original
- Blur data flows from CMS → mappers → components
- Existing media backfilled with blur data

## Risk Assessment
- Hook recursion: `req.payload.update()` inside afterChange could re-trigger → pass same `req` to prevent
- Existing media without thumbnail size: fallback to original URL for blur generation
- Vercel Blob URLs may have CORS restrictions for server-side fetch → should work since same origin
- backfill script on large media libraries may timeout → batch with limit/offset
