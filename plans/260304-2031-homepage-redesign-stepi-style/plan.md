# Homepage Redesign — Stepi-Inspired Style

**Date:** 2026-03-04
**Status:** Complete ✓
**Reference:** https://stepi-128.webflow.io/home-2
**Screenshots:** `screenshots/desktop-home.png`, `screenshots/tablet-home.png`, `screenshots/mobile-home.png`

---

## Overview

Redesign the Heritage Guiding Platform homepage to match the clean, photo-forward, travel agency aesthetic of Stepi — while preserving our Swedish heritage brand identity and gold color palette.

## Current vs Target Section Map

| # | Current Section | Stepi Equivalent | Action |
|---|----------------|------------------|--------|
| 1 | HeroSection | Hero (mountain photo, white headline, CTA) | **Restyle** — cleaner, larger photo, minimal overlay |
| 2 | TrustSignals | "Why Travel with Stepi" (circle icons + stats) | **Restyle** — horizontal icon row with descriptions |
| 3 | — | "Watch Our Video" (aerial photo + embed) | **NEW** — VideoHighlight section |
| 4 | FeaturedTours | "Most Popular Tours" (card grid with pricing) | **Restyle** — match Stepi card style |
| 5 | FindTourCta | Orange seasonal strip | **Restyle** — gold accent full-width CTA band |
| 6 | CategoryNav | *(no equivalent)* | **REMOVE** — merge into tours page |
| 7 | WhyChooseUs | *(no equivalent in same form)* | **REPLACE** → Meet Our Guides section |
| 8 | Testimonials | Testimonials | **Keep** — restyle to match |
| 9 | — | "Latest Posts" blog section | **NEW** — LatestPosts section |
| 10 | Footer | Footer (dark, multi-col) | **Restyle** — darker, more content |

### New Section Order

```
Header (transparent → solid on scroll)
├── 1. HeroSection (full-screen photo, white headline, CTA)
├── 2. TrustSignals (horizontal icon + stat row)
├── 3. VideoHighlight (aerial/scenic video embed) — NEW
├── 4. FeaturedTours (3-col card grid, pricing)
├── 5. SeasonalCta (full-width gold accent band) — RENAMED
├── 6. GuidesPreview (guide photos + names) — NEW (replaces WhyChooseUs)
├── 7. Testimonials (review cards/carousel)
├── 8. LatestPosts (blog card grid) — NEW
└── Footer (dark, newsletter, multi-column)
```

---

## Design System Adaptations

### Color Palette (Logo-Based + Stepi-Inspired)

| Role | Current | New (Logo-Based) | Usage |
|------|---------|-------------------|-------|
| **Primary Dark** | #1E3A5F (navy) | **#252525** (charcoal) | Header, footer, text |
| **Primary Gold** | #C4A052 | **#DBC078** (wheat gold) | Headings accent, borders |
| **Gold Accent** | — | **#d0ad50** (rich gold) | CTAs, buttons, links |
| **Gold Light** | — | **#e6d3a0** (soft gold) | Hover states, badges |
| **Accent** | #E67E5A (coral) | **#E67E5A** (keep coral) | Secondary CTAs, seasonal band |
| **Background** | #FAFAF8 | **#FFFFFF** | Main bg (cleaner, Stepi-like) |
| **Background Alt** | #F5F5F3 | **#F7F7F5** | Alternating sections |
| **Text** | #2D3748 | **#252525** | Body text |
| **Text Muted** | #6B7280 | **#3e3e3e** | Subtitles |

### Typography (Keep Current)

- **Headings:** Playfair Display (serif) — matches heritage/premium feel
- **Body:** Inter (sans-serif) — clean readability
- No change needed; current fonts align with Stepi's professional aesthetic

### Key Visual Changes

1. **Cleaner hero** — less gradient overlay, more photo-forward
2. **White backgrounds** — reduce colored section backgrounds
3. **Card redesign** — rounded corners, clean pricing, subtle shadows
4. **Gold accent band** — replace navy sections with warm gold
5. **Dark footer** — #0b0b0b background with gold accents

---

## Phases

| Phase | File | Status |
|-------|------|--------|
| 1 | [phase-01-hero-section-redesign.md](./phase-01-hero-section-redesign.md) | Complete ✓ |
| 2 | [phase-02-trust-signals-redesign.md](./phase-02-trust-signals-redesign.md) | Complete ✓ |
| 3 | [phase-03-video-highlight-section.md](./phase-03-video-highlight-section.md) | Complete ✓ |
| 4 | [phase-04-featured-tours-redesign.md](./phase-04-featured-tours-redesign.md) | Complete ✓ |
| 5 | [phase-05-seasonal-cta-and-guides.md](./phase-05-seasonal-cta-and-guides.md) | Complete ✓ |
| 6 | [phase-06-testimonials-blog-footer.md](./phase-06-testimonials-blog-footer.md) | Complete ✓ |
| 7 | [phase-07-responsive-polish.md](./phase-07-responsive-polish.md) | Complete ✓ |

---

## Dependencies

- Payload CMS: Guides collection (exists), Blog/Posts collection (placeholder for now)
- Images: Need high-quality Swedish heritage photos for hero, video section (use Unsplash placeholders)
- Video: Placeholder thumbnail + play button (real video URL added later)
- i18n: All new sections need SV/EN/DE translations

---

## Validation Summary

**Validated:** 2026-03-04
**Questions asked:** 6

### Confirmed Decisions

1. **Removed features:** CategoryNav removed. WhyChooseUs → GuidesPreview. Ask AI **kept in header nav** (not removed).
2. **Color scope:** Homepage only. Other pages keep current navy palette until later migration.
3. **New section content:** Use placeholders for both VideoHighlight and LatestPosts. No CMS blog collection needed yet.
4. **Seasonal band color:** Gold gradient (`#d0ad50` → `#DBC078`), consistent with logo brand.
5. **Ask AI placement:** Keep in header navigation bar (already exists there). Remove from hero/FindTourCta only.
6. **Guide data:** Static placeholder data initially. CMS integration deferred.

### Action Items (Plan Adjustments)

- [ ] **Phase 01**: Hero section — single CTA only ("Explore Tours"). No "Ask AI" in hero (it stays in header).
- [ ] **Phase 05**: GuidesPreview uses hardcoded placeholder data, not CMS fetch.
- [ ] **Phase 05**: SeasonalCta uses gold gradient, NOT coral orange.
- [ ] **Phase 06**: LatestPosts uses placeholder blog cards, no CMS dependency.
- [ ] **Phase 06**: VideoHighlight uses placeholder thumbnail, no video URL required.
- [ ] **All phases**: Color changes scoped to homepage components only. Do NOT modify globals.css color tokens.
