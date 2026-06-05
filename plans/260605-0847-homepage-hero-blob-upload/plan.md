---
title: Homepage Hero Blob Upload & SEO Image Pipeline
description: >-
  Convert 8 raw iStock photos to web-optimized + SEO-named files, upload to
  Vercel Blob via Payload Media (like tour photos), and swap the homepage hero
  to one of them (hardcoded Blob URL).
status: completed
priority: P2
branch: master
tags:
  - media
  - vercel-blob
  - homepage
  - hero
  - seo
  - images
blockedBy: []
blocks: []
created: '2026-06-05T07:05:25.292Z'
createdBy: 'ck:plan'
source: skill
---

# Homepage Hero Blob Upload & SEO Image Pipeline

## Overview

Take 8 raw iStock photos in `media/New image for the homepage before release/`, (1) convert each to a web-optimized, SEO-named JPEG using ImageMagick + embedded IPTC metadata, (2) upload all 8 into the Payload **Media** collection — the same Local-API path used for tour photos, so the `@payloadcms/storage-vercel-blob` plugin pushes them to Vercel Blob and the `afterChange` hook auto-generates blur placeholders, then (3) swap the homepage hero (`hero-section.tsx`) from its hardcoded Unsplash URL to the chosen Blob image (**`iStock-2200820707.jpg`** — "Boats in front of Stockholm").

## Data Flow

```
media/New image for the homepage before release/*.jpg  (8 files, 3.6–32 MB)
   │  Phase 1: magick identify -verbose → IPTC (Headline/Caption/Keywords)
   │           magick convert  → ≤2560px, -strip, q82, ≤4.5 MB
   ▼
media/homepage-hero-optimized/<seo-slug>.jpg  +  data/homepage-hero-image-manifest.json
   │  Phase 2: payload.create({collection:'media', file, data:{alt,caption}})
   │           storage-vercel-blob uploads → blob URL + sizes; afterChange → blurDataUrl
   ▼
Vercel Blob + Media docs  +  data/homepage-hero-media-mapping.json {slug→{mediaId,url,blurDataUrl}}
   │  Phase 3: hardcode hero slug's Blob URL + blur into the component
   ▼
apps/web/components/home/hero-section.tsx  +  apps/web/lib/image-blur-constants.ts
   │  Phase 4: admin + render + LCP/Lighthouse verification
```

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Convert & SEO-Name](./phase-01-convert-seo-name.md) | Completed |
| 2 | [Upload to Blob](./phase-02-upload-to-blob.md) | Completed |
| 3 | [Wire Hero](./phase-03-wire-hero.md) | Completed |
| 4 | [Verify](./phase-04-verify.md) | Completed |

## Confirmed Decisions (user, 2026-06-05)

- **Hero wiring:** hardcode the Blob URL in `hero-section.tsx` (NOT CMS-managed).
- **Scope:** upload **all 8** images into the Media library; set one as hero.
- **Hero image:** `iStock-2200820707.jpg` ("Boats in front of Stockholm", 3367×2017).
- **SEO naming:** derive slug + alt from IPTC (Headline → Caption → keywords fallback).

## Key Facts (verified)

- `next.config.ts:38` already allowlists `*.blob.vercel-storage.com` (remotePatterns) and CSP `img-src` (`:150`) → **no config change needed**.
- Blob server-upload cap is **4.5 MB** → originals (up to 32 MB) must be downscaled first.
- `Media` (`packages/cms/collections/media.ts`) generates `hero` 1920×1080 + auto blur via `generateBlurOnUploadHook`; `alt` is required+localized.
- Storage plugin only activates when `BLOB_READ_WRITE_TOKEN` is set (`payload.config.ts:96-101`); scripts target an env via runtime `DATABASE_URL` + `BLOB_READ_WRITE_TOKEN` (see Phase 2).
- `iStock-503977946.jpg` has a corrupt IPTC caption (`file_thumbview_approve.php…`) → naming must fall back to Headline.

## Dependencies

No blocking cross-plan dependencies. Builds on the established tour-photo pipeline (`scripts/import-tour-photos.ts`) and the homepage redesign that introduced `hero-section.tsx`.

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Hardcoded Blob URL is env-specific (staging vs prod = different stores) | Document promotion step; upload to the target env's Blob, hardcode that URL (Phase 3). |
| Hero is LCP element — regression risk | next/image serves AVIF/WebP; keep `priority`/`fetchPriority`; re-check mobile LCP (Phase 4). |
| New AI-slop / wrong crop on 5:3 source vs 16:9 hero | `object-cover` + centre crop; visual QA in Phase 4. |

## Implementation Outcome (2026-06-05)

Shipped working against **staging** (DB `…supabase…`, Blob store `kgst8vgykw2omhst`). Media docs 110–117; all 8 in CMS + Blob with blur. A few realities differed from the original plan — recorded here so the plan matches what shipped:

- **Hero `src` is the proxied path `/api/media/file/boats-in-front-of-stockholm.jpg`, NOT a direct `*.blob.vercel-storage.com` URL.** That `/api/media/file/<name>` form is how *all* media on this site is served, and it is **env-portable** — the same string resolves on prod once the file is uploaded there. This **removes the env-specific-URL promotion footgun** in Key Risks above.
- **No Payload responsive sizes / no auto-blur.** `payload.config.ts` does not pass `sharp`, so the Media `imageSizes` (thumbnail/card/hero) are never generated and the `generateBlurOnUploadHook` no-ops on the relative URL (its SSRF guard skips non-http URLs). `next/image` does all resizing from the original. Blur is therefore generated **locally in `import-homepage-hero-photos.ts` (sharp 8×6)** and backfilled onto the docs + written to the mapping.
- **`quality={75}`, not 60.** Next.js 16 here rejects `quality={60}` at the optimizer (HTTP 400; only `[75]` allowed). Other components set 60 but `next/image` clamps them in srcset. `tour-card.tsx:62` still hardcodes `quality={60}` (works via clamp) — a latent cleanup, out of scope.
- **Idempotency is by filename** (not alt) after code review — avoids false matches on unrelated media sharing a title.

### Pending / promotion
- **Prod:** re-run `scripts/import-homepage-hero-photos.ts` against prod `DATABASE_URL` + `BLOB_READ_WRITE_TOKEN`; the hero `src` needs no change (env-portable).
- **Deploy to see it live:** the `hero-section.tsx` change is local on `master`; push to the staging branch for Vercel to deploy, then do the visual + Lighthouse/LCP check (Phase 4's deploy-gated items).
- **Cleanup:** delete `scripts/.env.staging.upload` (gitignored staging creds).
