---
phase: 3
title: Wire Hero
status: completed
priority: P1
effort: 0.5h
dependencies:
  - 2
---

# Phase 3: Wire Hero

## Overview

Swap the homepage hero from its hardcoded Unsplash URL to the chosen Blob image (`iStock-2200820707.jpg` → its SEO slug). Two small edits: add a blur constant, repoint the `<Image>`. No `next.config` change (Blob host already allowlisted).

## Requirements

- **Functional:**
  - Add the hero's `blurDataUrl` (from `data/homepage-hero-media-mapping.json`) as a new `BLUR_DATA` key in `apps/web/lib/image-blur-constants.ts`, e.g. `HERO_STOCKHOLM_BOATS`.
  - In `apps/web/components/home/hero-section.tsx` replace the Unsplash `src` with the hero's Blob `url`, update `alt`, and switch `blurDataURL` to the new constant.
  - Keep all LCP attributes: `priority`, `fetchPriority="high"`, `placeholder="blur"`, `sizes="100vw"`, `quality`, `object-cover`, `data-parallax`.
- **Non-functional:** minimal diff; preserve parallax + a11y; comment why the source is a Blob URL.

## Architecture

- **Hardcoded approach (per user decision):** the hero stays a self-contained component; we hardcode the Blob `url` (original optimized image — let `next/image` derive responsive AVIF/WebP at deviceSizes ≤1920). Alternative `sizes.hero.url` (pre-cropped 1920×1080) is fine too; original keeps `object-cover` framing flexible.
- **Dimensions:** keep `width={1600} height={900}` (16:9 layout box) — `object-cover` handles the 5:3 source. Optionally set to true intrinsic ratio; not required.
- **No config edits:** `next.config.ts:38` (remotePatterns) + `:150` (CSP `img-src`) already cover `*.blob.vercel-storage.com` (verified).

### Edit sketch
```tsx
// hero-section.tsx
src="https://<store>.public.blob.vercel-storage.com/boats-in-front-of-stockholm-skeppsholmen-<hash>.jpg"
alt="Wooden boats moored in front of Stockholm's Skeppsholmen waterfront, Sweden"
blurDataURL={BLUR_DATA.HERO_STOCKHOLM_BOATS}
```

## Related Code Files

- Modify: `apps/web/components/home/hero-section.tsx` (`:46-59`)
- Modify: `apps/web/lib/image-blur-constants.ts` (add key)
- Read for context: `data/homepage-hero-media-mapping.json` (Phase 2 output)
- Verify-only (do NOT edit): `apps/web/next.config.ts` (already allows Blob)

## Implementation Steps

1. From the mapping JSON, copy the hero entry's `url` + `blurDataUrl`.
2. Add `HERO_STOCKHOLM_BOATS: '<blurDataUrl>'` to `BLUR_DATA`; update the doc comment.
3. Repoint `<Image>` `src`, `alt`, `blurDataURL` in `hero-section.tsx`.
4. Before deleting the old `HERO_GAMLA_STAN` constant: `grep` for other usages (comment claims "about-hero") — **keep it if referenced elsewhere**; only remove if truly orphaned.
5. `npm run lint && npm run type-check`.

## Success Criteria

- [ ] `npm run dev` → homepage hero shows the boats image; blur placeholder renders before load.
- [ ] No console/CSP/`next/image` 400 errors for the Blob URL.
- [ ] lint + type-check pass; diff limited to the two files.
- [ ] `HERO_GAMLA_STAN` either still used elsewhere or removed with no dangling refs.

## Risk Assessment

- **Env-specific URL (hardcoded):** the Blob `url` belongs to the store Phase 2 targeted. **Promotion:** to go live on prod, run Phase 2 against the prod Blob and update this URL (or confirm staging/prod share a Blob store). Document the chosen env in the PR.
- **LCP regression:** keep `priority`/`fetchPriority`; full check in Phase 4.
- **Wrong crop:** boats image is 5:3; centre `object-cover` may clip masts/foreground — visual QA in Phase 4, adjust `object-position` if needed.
