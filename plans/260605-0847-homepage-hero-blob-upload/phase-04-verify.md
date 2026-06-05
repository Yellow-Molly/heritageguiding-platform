---
phase: 4
title: Verify
status: completed
priority: P2
effort: 1h
dependencies:
  - 3
---

# Phase 4: Verify

## Overview

Confirm the pipeline end-to-end: optimized files + names look right, all 8 media exist in Blob/CMS with blur, the new hero renders correctly, and the LCP/Lighthouse budget is not regressed (the hero is the LCP element).

## Requirements

- **Functional:** validate Phases 1–3 outputs against success criteria; catch crop/quality/LCP regressions before merge.
- **Non-functional:** no fake data; real dev server + real Blob URLs.

## Implementation Steps

1. **Names (Phase 1):** re-run `convert-homepage-hero-images.ts --dry-run`; eyeball 8 slugs/alt; open 2–3 optimized files to confirm visual quality + that originals' EXIF/IPTC is stripped (`magick identify -verbose | grep -i iptc` → empty).
2. **Upload (Phase 2):** open `/admin/collections/media` on the target env — 8 new entries, each with alt + a populated `blurDataUrl`; open one Blob `url` in the browser (200, correct image). Re-run upload → confirms idempotent skip.
3. **Hero render (Phase 3):** `npm run dev`, load `/` in sv/en/de; hero = boats image; blur-up works; no CSP/`next/image` errors in console/network.
4. **Crop/aesthetics:** check the 5:3→full-bleed crop on desktop + mobile widths; tune `object-position` if masts/foreground clip.
5. **LCP / Lighthouse:** run Lighthouse (or `lighthouserc.js`) on `/`; confirm LCP element is the hero, served as AVIF/WebP, and score ≥ prior baseline. Sanity-check mobile (ref `plans/260517-0225-mobile-lcp-deepdive`).
6. **Cleanup:** confirm no dangling `HERO_GAMLA_STAN` ref (or intentionally kept); the transient `media/homepage-hero-optimized/` need not be committed (Blob is source of truth) — add to `.gitignore` if desired.

## Success Criteria

- [ ] 8 optimized files verified (quality OK, metadata stripped, ≤4.5 MB).
- [ ] 8 media docs in target env with alt + blur; Blob URLs return 200.
- [ ] Homepage hero shows the new boats image with working blur, all 3 locales.
- [ ] No CSP / remotePattern / hydration errors.
- [ ] Lighthouse LCP not regressed vs baseline; hero is the LCP element in AVIF/WebP.
- [ ] lint + type-check + relevant tests pass (`npm run lint && npm run type-check`).

## Risk Assessment

- **Promotion gap:** if uploaded to staging only, prod still serves Unsplash until Phase 2 is re-run against prod + URL updated — note explicitly at handoff.
- **LCP regression from heavy source** → if LCP worsens, lower `quality`, or hardcode the `sizes.hero.url` (smaller 1920×1080) instead of the original.
- **Locale alt:** component alt is a single English string (matches current pattern); if localized hero alt is wanted later, that's a follow-up (out of scope).
