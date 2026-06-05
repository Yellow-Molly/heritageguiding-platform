---
phase: 2
title: Upload to Blob
status: completed
priority: P1
effort: 1.5h
dependencies:
  - 1
---

# Phase 2: Upload to Blob

## Overview

Upload the 8 optimized images into the Payload **Media** collection via the Local API — identical mechanism to tour photos. The `storage-vercel-blob` plugin pushes each file to Vercel Blob and the `afterChange` hook auto-generates `blurDataUrl`. Output a mapping JSON so Phase 3 can hardcode the hero's Blob URL + blur.

## Requirements

- **Functional:**
  - Read `data/homepage-hero-image-manifest.json` + files in `media/homepage-hero-optimized/`.
  - For each: `payload.create({ collection:'media', data:{ alt, caption }, file:{ data, mimetype:'image/jpeg', name:filename, size } })`.
  - Idempotent: pre-fetch existing media, skip-by-`alt` (same guard as `import-tour-photos.ts:113-142`), capturing the existing id/url on skip.
  - After create, re-`find` the doc (depth 0) to capture `url`, `sizes.hero.url`, `blurDataUrl`.
  - Write `data/homepage-hero-media-mapping.json`: `{ [slug]: { mediaId, url, heroUrl, blurDataUrl, isHero } }`.
  - Print the **hero entry** prominently (the values Phase 3 hardcodes).
  - `--dry-run`: list what would upload, no DB writes.
- **Non-functional:** ≤200 lines; reuse the bootstrap + batch-delay pattern; never log the Blob token.

## Architecture

- **New script:** `scripts/import-homepage-hero-photos.ts` (tsx), modeled on `scripts/import-tour-photos.ts`.
- **Run command:** `npx tsx --require ./scripts/patch-next-env.cjs scripts/import-homepage-hero-photos.ts [--dry-run]`.
- **Env / target selection (critical):** the script writes to whichever env's `DATABASE_URL` (Media doc) + `BLOB_READ_WRITE_TOKEN` (Blob store) are live at runtime. `patch-next-env.cjs` loads `apps/web/.env*`, but **shell-set vars win**. To target staging:
  ```powershell
  $env:DATABASE_URL="<staging-postgres-url>"
  $env:BLOB_READ_WRITE_TOKEN="<staging-blob-token>"
  $env:PAYLOAD_SECRET="<staging-secret>"
  npx tsx --require ./scripts/patch-next-env.cjs scripts/import-homepage-hero-photos.ts
  ```
  Prefer `vercel env pull` from the target project over hand-pasting secrets.
- **Blur is automatic:** `generateBlurOnUploadHook` (`packages/cms/hooks/generate-blur-on-upload-hook.ts`) populates `blurDataUrl` on the doc — no separate blur step. (`scripts/backfill-media-blur.ts` is only a fallback for legacy docs.)

## Related Code Files

- Create: `scripts/import-homepage-hero-photos.ts`
- Create (output): `data/homepage-hero-media-mapping.json`
- Read for context: `scripts/import-tour-photos.ts`, `scripts/payload-bootstrap.ts`, `packages/cms/collections/media.ts`, `packages/cms/payload.config.ts:94-105`

## Implementation Steps

1. Copy structure from `import-tour-photos.ts`; swap source to the manifest + optimized dir.
2. Guard: if `BLOB_READ_WRITE_TOKEN` unset, warn loudly (files would land on local disk, not Blob) and require `--allow-local` to proceed.
3. `getPayload({ config })`; pre-fetch existing media (`select:{ alt:true }`) for idempotency map.
4. Loop create (alt+caption from manifest); batch delay 200 ms / 10 uploads.
5. Re-fetch each created/looked-up doc; assemble mapping incl. `sizes.hero.url` and `blurDataUrl`.
6. Write mapping JSON; print summary + a clearly-boxed **HERO** block: `slug`, `url`, `heroUrl`, `blurDataUrl`.

## Success Criteria

- [ ] `--dry-run` lists 8 uploads (hero flagged).
- [ ] Live run creates 8 media docs in target env; visible at `/admin/collections/media` with alt + auto-generated blur.
- [ ] 8 objects exist in the target Vercel Blob store (original + `-hero`/`-card`/`-thumbnail` variants).
- [ ] `data/homepage-hero-media-mapping.json` written; hero entry has non-empty `url` + `blurDataUrl`.
- [ ] Re-run skips all 8 (idempotent), mapping unchanged.

## Risk Assessment

- **Token missing → silent local write** → explicit env guard (step 2).
- **Per-DB media IDs** → mapping is env-specific; that's fine here because Phase 3 hardcodes the **URL**, not the id (but the URL is still store-specific — see Phase 3 promotion note).
- **Blob 4.5 MB limit** → already enforced in Phase 1; assert each file ≤ cap before create.
