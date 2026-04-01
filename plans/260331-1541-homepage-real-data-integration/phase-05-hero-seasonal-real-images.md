---
phase: 5
title: "Hero + SeasonalCta: Real Tour Images from CMS"
status: todo
priority: high
effort: 30m
---

# Phase 5: Hero + SeasonalCta — Real Tour Images

## Overview

Replace Unsplash images in HeroSection and SeasonalCta with real tour photos from CMS.

## Related Files
- **Modify**: `apps/web/components/home/hero-section.tsx`
- **Modify**: `apps/web/components/home/seasonal-cta.tsx`

## HeroSection

The hero background should use the hero-size image from the first featured tour.

1. Add props: `{ heroImage?: { url: string; alt: string } }`
2. Replace Unsplash URL with `heroImage.url`
3. Fallback: keep current Unsplash URL if no image provided
4. In page.tsx: extract `featuredTours[0]?.image` and pass hero-size URL

**Note**: The `FeaturedTour.image` returns card-size (768x512). For hero, we need the full/hero-size URL. May need to pass a separate hero image from the tour's media data, or use the card URL as-is (still better than Unsplash).

## SeasonalCta

Replace Unsplash season card images with real tour photos.

1. Add props: `{ tourImages?: { winter?: string; summer?: string } }`
2. In page.tsx: pick 2 tour images from featured tours for winter/summer cards
3. Fallback: keep current Unsplash URLs if no images provided

## Success Criteria
- [ ] Hero shows real tour photo from CMS
- [ ] SeasonalCta shows real tour photos
- [ ] Fallback to Unsplash if no CMS images available
- [ ] Images load properly (check Next.js image domains config)
