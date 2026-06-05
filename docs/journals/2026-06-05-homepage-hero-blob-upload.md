# Homepage Hero Image Upload to Vercel Blob

**Date**: 2026-06-05 08:47
**Severity**: Low
**Component**: Homepage hero, image pipeline, Payload CMS media proxy
**Status**: Ready for staging/prod deployment

## What Happened

Built a new image upload pipeline to source homepage hero candidates from local files, apply SEO naming via embedded IPTC metadata, and upload to Vercel Blob. Swapped the hardcoded Unsplash hero URL to pull from Payload's media proxy instead. Validated against staging environment.

## The Brutal Truth

This was a smooth implementation because the *architecture was already solved* by the tour-photo pipeline. Copying that pattern + adding local blur generation felt almost mechanical — until three discoveries forced design corrections mid-flight. Nothing broke, but the detours cost 90 minutes of confusion per issue.

## Technical Details

**Pipeline**:
- `scripts/convert-homepage-hero-images.ts` — derives SEO slug + alt text from IPTC Headline (→ Caption → image keywords fallback); guards against junk captions with exact-match filters; downscales to ≤2560px / ≤4.5 MB (Vercel Blob cap) via ImageMagick; outputs JSON manifest.
- `scripts/import-homepage-hero-photos.ts` — uploads manifest images via Payload `/api/media` (Local storage driver, not direct Blob URL); idempotent by filename; generates blur locally using `sharp` (NOT via Payload hook, see discovery 1); backtracks doc with metadata.
- Tested upload of 8 candidate images to STAGING (media IDs 110–117).

**Hero component change**:
- `apps/web/components/home/hero-section.tsx` — replaced hardcoded `https://images.unsplash.com/...` with `/api/media/file/boats-in-front-of-stockholm.jpg`, `quality={75}`, new blur constant `BLUR_DATA.HERO_STOCKHOLM_BOATS`.
- Kept `HERO_GAMLA_STAN` blur constant for the about-page hero (no change there).

## What We Tried

1. **Payload responsive image generation**: Assumed `imageSizes` in `payload.config.ts` would auto-generate srcsets + blur (like Next.js default). Failed. ⟹ Pivot to local sharp blur + proxy route.
2. **Unsupported quality={60}**: Submitted `quality={60}` to Next.js 16 `/_next/image` optimizer; got HTTP 400 (only [75] allowed). ⟹ Swapped to `quality={75}` in hero; noted `tour-card.tsx` still uses 60 (works via Next.js clamp, but latent cleanup).
3. **False-alarm upload verification**: Used `curl -I` (HEAD request) to confirm blob upload; got 404 even when GET worked. ⟹ Realized `/api/media/file/<name>` is GET-only. Switched to GET verification.

## Root Cause Analysis

**Discovery 1: Payload `sharp` not wired**
- `packages/cms/payload.config.ts` omits `plugins: [sharp(...)]` in the media collection.
- Result: responsive `imageSizes` array is never processed, auto-blur hook no-ops, responsive srcsets not generated.
- Impact: NOT a deployment risk — Payload falls back to the original file via the proxied `/api/media/file/<name>` route, which is **env-portable** (works in local/staging/prod without URL rewrites).
- Root: The Payload setup prioritized simplicity (no separate image-processing service); that's fine for a brand-new homepaper hero, but subtle.

**Discovery 2: Next.js 16 strict quality validation**
- Next.js 16's `/_next/image` optimizer only allows `quality: [75]` for JPEG/WebP (not 60).
- Existing `quality={60}` components don't break because Next.js clamps unsupported quality in generated srcsets.
- Root: Quality clamp is a Next.js runtime fallback, not a build error. Hardcoded `quality={60}` still works, but breaks the constraint at higher quality tiers.
- Impact: Hero now uses 75. `tour-card.tsx:62` still uses 60 — it works, but is latent cleanup.

**Discovery 3: HEAD requests return 404 on GET-only route**
- Payload's `/api/media/file/<name>` is implemented as GET-only (no HEAD handler).
- Verification script tried `curl -I` (HEAD) → 404 falsely indicated upload failure.
- Root: Route implementation oversight (not a contract issue). GET works fine.
- Impact: Changed verification to use GET instead of HEAD.

## Lessons Learned

1. **Payload media proxy is env-portable magic**: The `/api/media/file/<name>` route abstracts away storage location. No need to rewrite hardcoded URLs at deploy time. This is a net win for maintainability.

2. **Payload hooks are only as good as their config**: The auto-blur hook works only if `sharp` is wired. Audit `packages/cms/payload.config.ts` before assuming image features are live.

3. **Quality clamps hide bugs**: `quality={60}` will work now, but Next.js 16 won't generate all srcset widths. Enforce the constraint in linting or peer review to prevent silent performance regressions.

4. **GET-only routes should document HEAD behavior**: Returning 404 on HEAD (instead of 405 Method Not Allowed) leads to false diagnostics. Not a blocker, but worth noting in route design.

## Next Steps

1. **Re-run upload against PROD**: Use the same script with PROD Payload creds. No hero component change needed (route is env-portable).
2. **Deploy hero component to staging branch**: Verify visual + Lighthouse LCP (low-hanging win if hero is above-fold).
3. **Cleanup tour-card quality**: Change `quality={60}` → `quality={75}` in `tour-card.tsx:62` (latent tech debt).
4. **Audit Payload media config**: If responsive srcsets become important, add `plugins: [sharp(...)]` to `payload.config.ts` and regenerate old media.

---

**Commit**: `26f92a2` (master, not yet pushed)  
**Files touched**: `scripts/convert-homepage-hero-images.ts`, `scripts/import-homepage-hero-photos.ts`, `apps/web/components/home/hero-section.tsx`, STAGING media (IDs 110–117)
