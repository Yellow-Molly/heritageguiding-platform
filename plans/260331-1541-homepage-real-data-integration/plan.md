---
title: "Homepage: Replace Placeholder Data with Real CMS Data"
description: "Swap hardcoded placeholder tours, guides, and stats on the homepage with real data fetched from Payload CMS"
status: ready
priority: P1
effort: 4.5h
branch: feat/homepage-real-data
tags: [homepage, cms-integration, tours, guides, data]
created: 2026-03-31
blockedBy: []
blocks: []
---

# Homepage: Replace Placeholder Data with Real CMS Data

## Context

The homepage (`apps/web/app/(site)/[locale]/(frontend)/page.tsx`) renders 8 sections. Three sections use hardcoded placeholder data that should now come from Payload CMS — tours and guides data has been imported (plans `260328-2112` and `260329-2258`).

## Placeholder Audit

| Section | File | Current State | Action |
|---------|------|---------------|--------|
| **FeaturedTours** | `components/home/featured-tours.tsx` | 3 hardcoded tours with Unsplash images | **Replace** → `getFeaturedTours(locale, 3)` |
| **GuidesPreview** | `components/home/guides-preview.tsx` | 4 fake guides (Anna S., Erik L., etc.) | **Replace** → `getGuides({limit:'4'}, locale)` |
| **TrustSignals** | `components/home/trust-signals.tsx` | Hardcoded "25+ Expert Local Guides" | **Update** → dynamic guide count from CMS |
| **HeroSection** | `components/home/hero-section.tsx` | Unsplash Stockholm image | **Replace** → primary image from first featured tour |
| **SeasonalCta** | `components/home/seasonal-cta.tsx` | Unsplash seasonal images | **Replace** → real tour images from CMS |
| **VideoHighlight** | `components/home/video-highlight.tsx` | Placeholder YouTube rickroll | **Update** → replace with generic Stockholm video |
| **Testimonials** | `components/home/testimonials.tsx` | 4 fake testimonials | **Remove** — no CMS collection, add back later |
| **LatestPosts** | `components/home/latest-posts.tsx` | 3 fake blog posts | **Remove** — no CMS collection, add back later |

## Architecture

**Pattern**: Server component (page.tsx) fetches data → passes as serializable props → client components render with animations intact.

```
page.tsx (server)
├── getFeaturedTours(locale, 3)  ──→ FeaturedTours props
├── getGuides({limit:'4'}, locale) ──→ GuidesPreview props
└── getGuideCount(locale)         ──→ TrustSignals props
```

All existing APIs (`getFeaturedTours`, `getGuides`) already exist and are cached. No new API functions needed.

## Phases

| # | Phase | File | Status | Est |
|---|-------|------|--------|-----|
| 1 | [Fetch data in page.tsx](phase-01-fetch-data-in-page.md) | `page.tsx` | Todo | 30m |
| 2 | [FeaturedTours real data](phase-02-featured-tours-real-data.md) | `featured-tours.tsx` | Todo | 45m |
| 3 | [GuidesPreview real data](phase-03-guides-preview-real-data.md) | `guides-preview.tsx` | Todo | 45m |
| 4 | [TrustSignals dynamic count](phase-04-trust-signals-dynamic-count.md) | `trust-signals.tsx` | Todo | 30m |
| 5 | [Hero + SeasonalCta real images](phase-05-hero-seasonal-real-images.md) | `hero-section.tsx`, `seasonal-cta.tsx` | Todo | 30m |
| 6 | [Remove Testimonials + LatestPosts](phase-06-remove-placeholder-sections.md) | `testimonials.tsx`, `latest-posts.tsx`, `page.tsx` | Todo | 15m |
| 7 | [VideoHighlight real video](phase-07-video-highlight-update.md) | `video-highlight.tsx` | Todo | 15m |
| 8 | [Verify and test](phase-08-verify-and-test.md) | — | Todo | 30m |

## Dependencies
- Phase 1 must complete first (provides data to phases 2-5)
- Phases 2, 3, 4, 5, 6, 7 are independent of each other
- Phase 8 depends on all previous phases

## Key Decisions
- **Keep client components**: FeaturedTours and GuidesPreview use IntersectionObserver/animations — stay `'use client'`, receive data as props
- **No new API functions**: Existing `getFeaturedTours()` and `getGuides()` cover all needs
- **Fallback to empty**: If CMS returns no data, sections hide entirely (no placeholder fallback)
- **i18n**: Pass locale from page params to all CMS queries
- **Guide subtitle**: Show operating area (e.g. "Stockholm"), not specialization
- **Featured tours**: Show 3 tours (clean 3-column grid)
- **Hero image**: Use primary image from first featured tour (hero size)
- **SeasonalCta**: Use real tour images from CMS for season cards
- **Video**: Replace rickroll with generic Stockholm drone/travel video
- **Remove sections**: Testimonials + LatestPosts removed until CMS collections exist

## Validation Summary

**Validated:** 2026-03-31
**Questions asked:** 8

### Confirmed Decisions
- Scope: Address ALL placeholder sections, not just tours/guides/stats
- Featured tours count: 3 (clean 3-col grid)
- Guide subtitle: Operating area (e.g. "Stockholm")
- Empty state: Hide section entirely
- Hero image: Use primary image from first featured tour
- Testimonials + LatestPosts: Remove entirely (no CMS collection)
- SeasonalCta: Use real tour images from CMS
- VideoHighlight: Replace with generic Stockholm video

### Action Items
- [ ] Add phases 5-7 for Hero/SeasonalCta, section removal, video update
- [ ] Update phase-01 to fetch additional data for Hero/SeasonalCta
- [ ] Rename phase-05 verify → phase-08
