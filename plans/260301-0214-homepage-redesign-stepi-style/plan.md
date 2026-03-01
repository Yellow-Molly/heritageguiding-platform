---
title: "Homepage Redesign - Stepi Style"
description: "Redesign homepage with Stepi-inspired layout: mobile-first, clean sections, video, seasonal tabs, guides, blog"
status: complete
priority: P1
effort: 8h
branch: master
tags: [frontend, design, homepage, mobile-first]
created: 2026-03-01
---

# Homepage Redesign - Stepi Style

## Goal
Transform the existing homepage from a TripFreak-inspired heavy design into a clean, airy, Stepi-style layout. Mobile-first. Keep existing design system colors, fonts, i18n, and CMS integrations.

## Section Order (New)
1. Header (KEEP - minor scroll behavior already exists)
2. Hero (MODIFY - simplify heavily)
3. Trust Signals / Stats Bar (MODIFY - lighter design)
4. Video Section (NEW)
5. Popular Tours Carousel (MODIFY - horizontal scroll mobile)
6. Testimonials (MODIFY - restyle)
7. Seasonal Content Tabs (NEW)
8. Meet Our Guides (NEW)
9. Blog / Latest Posts (NEW)
10. Newsletter Signup (NEW)
11. Footer (KEEP - minor updates)

## Sections REMOVED
- `FindTourCta` - replaced by single hero CTA + video section
- `CategoryNav` - replaced by seasonal tabs
- `WhyChooseUs` - consolidated into trust signals + guides section

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Hero Section Redesign](phase-01-hero-section-redesign.md) | complete | 1h |
| 2 | [Trust Signals + Video Section](phase-02-trust-signals-and-video-section.md) | complete | 1.5h |
| 3 | [Tours Carousel Redesign](phase-03-tours-carousel-redesign.md) | complete | 1.5h |
| 4 | [Seasonal Tabs + Guides](phase-04-seasonal-tabs-and-guides-section.md) | complete | 1.5h |
| 5 | [Blog, Newsletter, Footer](phase-05-blog-newsletter-and-footer.md) | complete | 1.5h |
| 6 | [Responsive Polish + Testing](phase-06-responsive-polish-and-testing.md) | complete | 1h |

## Brand Base Colors (from `apps/web/public/base-color-logo.md`)
| Hex | Role |
|-----|------|
| `#0b0b0b` | Near black (deepest) |
| `#252525` | Dark charcoal (primary dark) |
| `#3e3e3e` | Dark gray (text/accents) |
| `#d0ad50` | Medium gold (brand gold) |
| `#DBC078` | Warm gold (primary gold) |
| `#e6d3a0` | Light gold/cream |

**Color mapping update**: Replace current navy primary (#1E3A5F) with charcoal (#252525). Replace current gold (#C4A052) with warm gold (#DBC078). Keep coral accent (#E67E5A) for CTAs. Update CSS variables in `globals.css` as part of Phase 1.

## Key Dependencies
- Brand color CSS variables must be updated in `globals.css` (Phase 1)
- Allura font must be added to `apps/web/lib/fonts.ts` and layout (Phase 1)
- `page.tsx` section order updates after all components ready (Phase 6)
- i18n keys added incrementally per phase
- Existing tests updated in Phase 6

## Validation Summary

**Validated:** 2026-03-01
**Questions asked:** 7

### Confirmed Decisions
- **Hero CTA:** Remove Ask AI from hero; single "Explore Our Tours" CTA. AI chat stays in header/floating button.
- **Color scope:** Global update — change CSS variables in `globals.css` to brand base colors. Affects all pages.
- **Data source:** Hardcoded with TODO comments for new sections (Video, Seasons, Blog, Newsletter). CMS integration deferred.
- **Script font:** Add Allura (~15KB, self-hosted via next/font) for decorative hero label.
- **Video source:** User will provide YouTube URL at implementation time. Build lazy-load embed pattern.
- **Section removal:** Clean removal of FindTourCta, CategoryNav, WhyChooseUs. Delete files + tests.
- **Carousel:** CSS scroll-snap only. No library, no auto-play, no dots. Touch swipe + optional arrows.

### Action Items
- [ ] Phase 2: video-section.tsx needs YouTube URL from user — use placeholder until provided
- [ ] Post-implementation: audit other pages (tours, guides, about) for visual consistency with new charcoal palette

## Key Files
- Page: `apps/web/app/(site)/[locale]/(frontend)/page.tsx`
- Components: `apps/web/components/home/`
- Fonts: `apps/web/lib/fonts.ts`
- Styles: `apps/web/app/globals.css`
- Messages: `apps/web/messages/{en,sv,de}.json`
- API: `apps/web/lib/api/`
- Barrel: `apps/web/components/home/index.ts`
