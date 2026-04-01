---
phase: 8
title: "Verify Build and Test"
status: todo
priority: high
effort: 30m
---

# Phase 8: Verify and Test

## Overview

Ensure the homepage builds, renders correctly with all real CMS data, and removed sections are gone.

## Steps

1. Run `npm run build` — verify no TypeScript or build errors
2. Run `npm run dev` and check homepage at `localhost:3000`
3. Verify each section:
   - **HeroSection**: Real tour photo as background
   - **FeaturedTours**: Real tour images, prices, ratings, working links
   - **GuidesPreview**: Real guide photos, names, operating areas, working links
   - **TrustSignals**: Dynamic guide count with animation
   - **SeasonalCta**: Real tour images for season cards
   - **VideoHighlight**: Real Stockholm video (not rickroll)
   - **Testimonials**: REMOVED — should not appear
   - **LatestPosts**: REMOVED — should not appear
4. Test locale switching (sv/en/de) — content should change per locale
5. Run existing tests: `npm test`
6. Check for console errors / hydration mismatches

## Success Criteria
- [ ] Build succeeds
- [ ] All updated sections render real CMS data
- [ ] Testimonials + LatestPosts no longer on page
- [ ] No hydration errors
- [ ] Locale switching works
- [ ] Existing tests pass
- [ ] Images load from Vercel Blob (not Unsplash)
