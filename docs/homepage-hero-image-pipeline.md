# Homepage Hero & Media Image Pipeline

How to convert raw photos to web-optimized, SEO-named images, upload them to Vercel Blob via Payload Media, and use one as the homepage hero. Mirrors the tour-photo pipeline (`scripts/import-tour-photos.ts`).

Built 2026-06-05 (`plans/260605-0847-homepage-hero-blob-upload/`).

## TL;DR

```bash
# 1) Convert raw images → optimized + SEO names (local, no DB/network)
npx tsx scripts/convert-homepage-hero-images.ts --dry-run   # preview names
npx tsx scripts/convert-homepage-hero-images.ts             # write files + manifest

# 2) Upload to a SPECIFIC environment's Blob + DB (see creds pattern below)
set -a; . scripts/.env.<env>.upload; set +a
npx tsx --require ./scripts/patch-next-env.cjs scripts/import-homepage-hero-photos.ts

# 3) Wire the hero (one-time): hardcode the printed src + blur in
#    apps/web/components/home/hero-section.tsx + apps/web/lib/image-blur-constants.ts
```

## Scripts

| Script | What it does | Inputs → Outputs |
|---|---|---|
| `scripts/convert-homepage-hero-images.ts` | Reads embedded **IPTC** (`magick identify -verbose`) to derive an SEO slug + alt (fallback Headline→Caption→keywords; skips junk captions). Downscales to ≤2560px / ≤4.5 MB, strips metadata. `--dry-run` previews names. | `media/New image for the homepage before release/*.jpg` → `media/homepage-hero-optimized/<slug>.jpg` + `data/homepage-hero-image-manifest.json` |
| `scripts/import-homepage-hero-photos.ts` | Creates Payload `media` docs via Local API → `@payloadcms/storage-vercel-blob` uploads to Blob. Idempotent **by filename**. Generates an 8×6 blur locally (sharp) and backfills the doc. `--dry-run` / `--allow-local`. | manifest + optimized files → Blob + Media docs + `data/homepage-hero-media-mapping.json` |

Requires **ImageMagick 7** on PATH (`magick`; or set `MAGICK_BIN`). `sharp` is already a dep.

## Targeting an environment (staging / prod)

The upload script writes to whatever `DATABASE_URL` (Media doc) + `BLOB_READ_WRITE_TOKEN` (Blob store) are live at runtime. `patch-next-env.cjs` loads `apps/web/.env*`, **but shell-set vars win**. Recommended pattern — a gitignored creds file:

```bash
# scripts/.env.staging.upload  (gitignored via .env*; DELETE after use)
DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB?sslmode=require'
BLOB_READ_WRITE_TOKEN='vercel_blob_rw_xxx'
PAYLOAD_SECRET=''   # optional; blank uses local for init (no encrypted media fields)
```

```bash
set -a; . scripts/.env.staging.upload; set +a
npx tsx --require ./scripts/patch-next-env.cjs scripts/import-homepage-hero-photos.ts
rm scripts/.env.staging.upload   # cleanup
```

The script **refuses** to run if `BLOB_READ_WRITE_TOKEN` is missing or `DATABASE_URL` is empty/local (prevents docs↔files split-brain) unless `--allow-local`.

## Important behaviors (this repo)

- **No `sharp` in `packages/cms/payload.config.ts`** → Payload's `imageSizes` are **not** generated and the auto-blur hook no-ops on the relative URL. All media serves the **original** via the proxied path **`/api/media/file/<filename>`**; `next/image` does all resizing. Blur is generated locally by the upload script.
- **`/api/media/file/<name>` is env-portable** — the same hero `src` resolves on staging and prod once the file is uploaded to each env. No per-store URL to swap.
- **Next.js 16 rejects `quality={60}`** at the optimizer (only `[75]`). Use **`quality={75}`** on `<Image>`. (`next/image` clamps unsupported values in srcsets, so existing q=60 components still render.)
- The Payload file route is **GET-only** (a `HEAD`/`curl -I` returns 404 even when the file is fine).
- Blob server-upload cap is **4.5 MB** → originals must be downscaled first (Phase 1 handles this).

## Promotion to production

1. Re-run step 2 with **prod** creds (`scripts/.env.prod.upload`).
2. The hero `src` in `hero-section.tsx` needs **no change** (env-portable path).
3. Deploy the `hero-section.tsx` change (push to the branch Vercel builds for the target env), then run Lighthouse — the hero is the LCP element.

## Related

- Memory: `nextjs16-image-quality-and-media-serving`, `homepage-hero-and-media-upload-scripts`
- Tour-photo equivalents: `scripts/import-tour-photos.ts`, `scripts/import-tour-data.ts`
