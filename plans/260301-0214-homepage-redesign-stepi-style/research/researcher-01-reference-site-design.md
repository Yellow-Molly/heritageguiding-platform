# Reference Site Design Analysis: Stepi (stepi-128.webflow.io/home-2)
**Date:** 2026-03-01 | **Purpose:** Homepage redesign reference for private tours platform

---

## 1. Section-by-Section Breakdown (Top → Bottom)

| # | Section | Key Content |
|---|---------|-------------|
| 1 | **Sticky Header/Nav** | Logo left, nav links center/right, cart icon, hamburger (mobile) |
| 2 | **Full-screen Hero** | Background image (Japan), script label "Enjoy incredible pleasure", H1 "Adventures in Japan", single CTA button |
| 3 | **Featured Tours Carousel** | 3 large featured destination cards (Japan, Madagascar, Colombia) with scroll |
| 4 | **Stats / Trust Bar** | 4 stats: 2000+ guides, 100% trusted, 12+ years, 98% happy — icon + number + label |
| 5 | **Video Section** | Embedded YouTube player left, text right — "Watch our video, take a tour" |
| 6 | **Popular Tours Grid** | 8 tour cards in carousel — image, title, rating, duration/category/age badges, price, CTA |
| 7 | **Testimonials Carousel** | Customer quotes with name, role, destination — carousel nav |
| 8 | **Seasonal Content Tabs** | "Let's travel all year round" — Winter/Spring/Summer/Autumn tabs with image + description |
| 9 | **Meet Our Guides** | 6 guide cards — circular photo, name, title, social icons |
| 10 | **Blog / Latest Posts** | 3 article cards — image, title, excerpt, "Read more" link |
| 11 | **Newsletter Signup** | Light background, email form "Subscribe for travel tips" |
| 12 | **Footer** | Logo, address/phone/email, nav links, blog preview, social icons, legal |

---

## 2. Color Palette

- **Orange accent**: ~`#FF6B35` (buttons, highlights) — warm coral-orange, NOT bright red-orange
- **Background**: `#FFFFFF` white, with `#F5F5F5` light gray for alternate sections
- **Text primary**: ~`#1A1A1A` dark charcoal
- **Text secondary**: ~`#6B6B6B` medium gray
- **Stats section bg**: Light/cream (not dark)
- **Header**: Transparent initially, likely solid white on scroll
- **Overall mood**: Clean, airy, warm — earthy travel photography dominant

---

## 3. Typography

| Element | Font | Weight | Notes |
|---------|------|--------|-------|
| Display/H1 | Poppins | 600 | Large hero headline |
| Script label | Allura | 400 | Decorative "Enjoy incredible..." above H1 |
| Section headings | Poppins / Open Sans | 600–700 | H2-H3 |
| Body | Lato | 300–400 | Readable, light feel |
| UI labels | Mukta | 500–600 | Buttons, metadata |
| Accent quotes | Bitter | 400 | Testimonials |

Font stack: Poppins (headings) + Lato (body) + Allura (decorative script labels only)

---

## 4. Layout Patterns

**Desktop:**
- Max-width container (likely ~1200–1440px) centered
- Stats: 4-column flex row
- Tours: 3–4 col grid carousel
- Blog: 3-column grid
- Guides: 3-column grid (2 rows = 6)
- Video: 2-column (video left, text right)

**Mobile:**
- Single column stacked for all sections
- Carousels become horizontal scroll (swipe)
- Stats: 2×2 grid
- Hamburger nav replaces top menu
- Section padding reduced

---

## 5. Component Patterns

**Tour Cards:**
- Image top (full width, fixed aspect ~16:9)
- Title + location text
- Star rating (e.g., 5.0)
- Metadata as inline text tags: "8 Days · Adventure · 16+ Age"
- Price: prominent, "$950 USD / Person"
- "Buy now" orange CTA button
- No pill/chip shape on badges — plain text with separators

**Buttons:**
- Primary: orange/coral bg, white text, slight rounding (4–8px radius)
- Secondary: outlined or ghost style
- Size: medium-large, generous padding

**Stats Cards:**
- Icon (SVG) + large number ("2000+") + descriptor text
- Light bg section, 4-up layout

**Guide Cards:**
- Circular profile photo
- Name + "Tourist Guide" label
- Facebook/Instagram/Twitter icon row

**Season Tabs:**
- Horizontal tab bar with text labels
- Content reveals: image left + text right (or stacked mobile)

---

## 6. Mobile-First Patterns

- Breakpoints: 992px (desktop), 768–991px (tablet), <768px (mobile)
- All multi-column grids collapse to 1-column
- Carousels enable horizontal touch-swipe
- Hamburger menu with accordion dropdowns
- Images scale responsively (srcset implied)
- No horizontal overflow — everything scrolls vertically

---

## 7. Animation / Interaction

- Hero: likely CSS keyframe fade-in or Webflow scroll trigger on entry
- Tour carousels: slide left/right on arrow click or touch swipe
- Season tabs: click to swap content (no page reload)
- Hover on buttons: color shift (darker orange)
- Hover on cards: possible elevation/shadow increase
- Cart: slide-in panel or modal on icon click
- Header: likely opacity/bg transition on scroll (transparent → white)
- Data attributes (`data-w-id`) = Webflow IX2 interaction system triggers

---

## 8. Key Design Decisions

1. **Script font label above H1** — sets aspirational/emotional tone before the functional headline
2. **No hero search bar** — friction-free entry; tours discovered by scrolling, not searching
3. **Stats row as trust signals** — immediately follows hero to convert curiosity → confidence
4. **Video section** — mid-page engagement anchor, breaks scroll monotony
5. **Seasonal tabs** — smart UX: one section covers 4 content blocks without extra page length
6. **Generous whitespace** — sections breathe, photography is the hero not UI chrome
7. **Minimal badge styling** — metadata as plain text (not colorful chips) keeps cards clean
8. **Orange accent used sparingly** — only CTAs and key highlights, everything else neutral
9. **Guide cards with social links** — humanizes the brand, builds trust
10. **Footer as full resource hub** — contact info, nav, blog preview all in one

---

## Unresolved Questions

- Exact hex for orange (visual inspection needed — could be `#FF6B35`, `#F97040`, or similar)
- Whether header transitions to solid on scroll (common Webflow pattern, not confirmed)
- Exact font sizes (px/rem values) for headings — no CSS extracted
- Whether tour carousel auto-plays or is manual-only
- Mobile nav: accordion expand or full-screen overlay?
