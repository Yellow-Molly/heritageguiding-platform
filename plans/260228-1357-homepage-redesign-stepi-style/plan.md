---
title: "Homepage Redesign - Stepi Travel Style"
description: "Redesign homepage with Stepi template style: dark+gold palette, mobile-first, new video/seasonal/guides sections"
status: complete
priority: P1
effort: 16h
branch: master
tags: [homepage, redesign, ui, mobile-first, stepi]
created: 2026-02-28
---

# Homepage Redesign - Stepi Travel Style

## Overview

Redesign the heritage tourism homepage to match the Stepi travel template aesthetic. Replace navy/gold palette with dark+warm gold (#252525/#DBC078). Mobile-first priority throughout. Add 3 new sections, modify 4 existing, remove 3 deprecated.

## New Color Palette

| Token | Old | New |
|-------|-----|-----|
| primary | #1E3A5F | #252525 |
| primary-light | #2A4A75 | #3e3e3e |
| primary-dark | #152B47 | #0b0b0b |
| secondary | #C4A052 | #DBC078 |
| secondary-light | #D4B462 | #e6d3a0 |
| secondary-dark | #B49042 | #d0ad50 |

## Section Order (After Redesign)

1. Header (updated colors)
2. HeroSection (simplified, Stepi-style)
3. TrustSignals (horizontal icon row)
4. VideoSection (NEW)
5. FeaturedTours (Stepi-style cards + grid)
6. Testimonials (polished)
7. SeasonalTabs (NEW)
8. MeetOurGuides (NEW)
9. Footer (updated colors)

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 01 | [Color System Migration](./phase-01-color-system-migration.md) | complete | 1h |
| 02 | [Hero Section Redesign](./phase-02-hero-section-redesign.md) | complete | 1.5h |
| 03 | [Trust Signals Redesign](./phase-03-trust-signals-redesign.md) | complete | 1h |
| 04 | [Video Section (New)](./phase-04-video-section-new.md) | complete | 1.5h |
| 05 | [Featured Tours Redesign](./phase-05-featured-tours-redesign.md) | complete | 2h |
| 06 | [Testimonials Polish](./phase-06-testimonials-polish.md) | complete | 1h |
| 07 | [Seasonal Tabs (New)](./phase-07-seasonal-tabs-new.md) | complete | 2h |
| 08 | [Meet Our Guides (New)](./phase-08-meet-our-guides-new.md) | complete | 1.5h |
| 09 | [Page Assembly + Cleanup](./phase-09-page-assembly-and-cleanup.md) | complete | 1h |
| 10 | [Header & Footer Colors](./phase-10-header-footer-color-update.md) | complete | 1.5h |
| 11 | [i18n + Testing](./phase-11-i18n-translations-and-testing.md) | complete | 2h |

## Key Dependencies

- Phase 01 (colors) must complete first -- all other phases depend on it
- Phases 02-08 can run in parallel after Phase 01
- Phase 09 (assembly) depends on 02-08
- Phase 10 can run parallel with 02-08
- Phase 11 (i18n/testing) runs last

## Removed Sections

- `FindTourCta` -- replaced by VideoSection + SeasonalTabs
- `CategoryNav` -- replaced by SeasonalTabs
- `WhyChooseUs` -- trust signals cover this; simplifies page

## Validation Summary

**Validated:** 2026-02-28
**Questions asked:** 7

### Confirmed Decisions
- **Color scope:** Site-wide migration (all pages get new dark+gold palette)
- **Ask AI CTA:** Header only; removed from hero section
- **Section removals:** All three confirmed (FindTourCta, CategoryNav, WhyChooseUs)
- **Guide data:** Hybrid approach -- hardcoded fallback + optional CMS fetch via fetchGuides()
- **Accent color:** Keep coral (#E67E5A) unchanged
- **Image assets:** Unsplash placeholders for now; replace with real assets before launch
- **File cleanup:** Delete removed files entirely (no deprecation comments)

### Action Items
- [x] Phase 09: Delete find-tour-cta.tsx, category-nav.tsx, why-choose-us.tsx + their tests
- [ ] Phase 08: Update MeetOurGuides to hybrid data (hardcoded fallback + CMS fetch)
- [x] Phase 10: Footer i18n (replace hardcoded English strings with translation keys)
- [x] Phase 11: Write unit tests for VideoSection, SeasonalTabs, MeetOurGuides
- [ ] Replace placeholder YouTube video ID with real video
- [ ] Replace placeholder guide social links with real profiles
- [ ] Browser QA: verify Tailwind v4 opacity modifier on CSS vars (e.g. `bg-[var(--color-secondary)]/10`)
