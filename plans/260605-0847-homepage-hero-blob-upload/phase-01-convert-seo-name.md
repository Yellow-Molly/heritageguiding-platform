---
phase: 1
title: Convert & SEO-Name
status: completed
priority: P1
effort: 1.5h
dependencies: []
---

# Phase 1: Convert & SEO-Name

## Overview

Build a script that reads the 8 raw iStock photos, derives an SEO filename + alt text from each image's embedded **IPTC** metadata, and produces web-optimized JPEGs (≤2560 px, stripped, ≤4.5 MB) plus a manifest the upload phase consumes. No DB / no network here — pure local conversion.

## Requirements

- **Functional:**
  - Scan `media/New image for the homepage before release/*.jpg` (8 files).
  - For each: extract IPTC `Headline`, `Caption`, `Keyword[]` via `magick identify -verbose`.
  - Derive a kebab-case SEO slug with fallback chain **Headline → Caption → first 3–4 keywords → original basename**; skip junk captions matching `/file_thumbview|\.php/i` (covers `iStock-503977946.jpg`).
  - Derive `alt` text (Caption if clean, else Headline), title-trimmed to ≤125 chars.
  - Convert to `media/homepage-hero-optimized/<slug>.jpg`: `-auto-orient -resize 2560x2560\> -strip -interlace Plane -quality 82`; if output > 4.5 MB, re-encode at q78/q72 until under cap.
  - Flag the hero source (`iStock-2200820707.jpg`) as `isHero: true` in the manifest.
  - Write `data/homepage-hero-image-manifest.json`.
  - `--dry-run`: print derived slug/alt/dimensions per image, no file writes.
- **Non-functional:** KISS, ≤200 lines, descriptive comments, idempotent (re-run overwrites optimized files + manifest deterministically).

## Architecture

- **New script:** `scripts/convert-homepage-hero-images.ts` (tsx). Shells out to ImageMagick 7 (`magick`, confirmed at `C:/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick`) via `child_process.execFileSync` for both metadata read and conversion — avoids new Python/IPTC deps and keeps the pipeline TS-only.
- **Reuse:** copy the `slugifyFilename` / `filenameToAltText` spirit from `scripts/import-tour-photos.ts:31-46` (DRY), adapted to IPTC input.
- **Why ImageMagick not sharp:** sharp's IPTC (Headline/Keywords) reads are unreliable; `magick identify -verbose` already returns them cleanly (verified during planning).

### Manifest shape
```jsonc
[
  {
    "source": "iStock-2200820707.jpg",
    "slug": "boats-in-front-of-stockholm-skeppsholmen",
    "filename": "boats-in-front-of-stockholm-skeppsholmen.jpg",
    "alt": "Boats in front of Stockholm, Sweden",
    "caption": "Boats in front of Stockholm. Sweden",
    "keywords": ["skeppsholmen", "quay", "bridge"],
    "isHero": true,
    "width": 2560, "height": 1534, "bytes": 612345
  }
]
```

## Related Code Files

- Create: `scripts/convert-homepage-hero-images.ts`
- Create (output): `media/homepage-hero-optimized/*.jpg`, `data/homepage-hero-image-manifest.json`
- Read for context: `scripts/import-tour-photos.ts` (slugify/alt helpers), `scripts/convert-guide-photos-for-web.py` (prior conversion precedent)

## Implementation Steps

1. Scaffold script + `--dry-run` flag; define `INPUT_DIR`, `OUTPUT_DIR`, `MANIFEST_PATH`, `HERO_SOURCE='iStock-2200820707.jpg'`, `MAX_BYTES=4.5*1024*1024`.
2. `parseIptc(file)`: run `magick identify -verbose`, regex out `Headline[…]:`, `Caption[…]:`, all `Keyword[…]:` lines.
3. `deriveSlug()` + `deriveAlt()` with the fallback + junk-caption guard.
4. Collision guard: if two images slugify the same, append `-2`, `-3`.
5. `convert()`: build the optimized JPEG; loop quality down if over `MAX_BYTES`; capture out width/height/bytes via `magick identify -format`.
6. Assemble + write manifest (sorted, 2-space, trailing newline). On `--dry-run`, print a table and exit before any write.
7. Console summary: converted / skipped / hero slug.

## Success Criteria

- [ ] `--dry-run` prints 8 sensible slugs + alt (hero shows `isHero`), incl. a non-junk slug for `iStock-503977946.jpg`.
- [ ] Live run writes 8 files to `media/homepage-hero-optimized/`, each ≤4.5 MB, ≥1920 px wide, EXIF/IPTC stripped.
- [ ] `data/homepage-hero-image-manifest.json` has 8 entries; exactly one `isHero: true` (the boats image).
- [ ] No two slugs collide.

## Risk Assessment

- **Junk/empty IPTC** → fallback chain + basename safety net; verify the City-Hall image (`iStock-503977946`) names cleanly.
- **Swedish chars (å/ä/ö) in keywords** → transliterate/ASCII-fold during slugify (`å→a`, `ä→a`, `ö→o`).
- **ImageMagick path on Windows** → call `magick` (on PATH per planning check); fail fast with a clear message if missing.
