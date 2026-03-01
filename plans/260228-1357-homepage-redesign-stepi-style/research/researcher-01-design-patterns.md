# Design Patterns Research: Travel Homepage Redesign (Stepi-Style)
> Date: 2026-02-28 | Ref: https://stepi-128.webflow.io/home-2

---

## 1. Mobile-First Travel Homepage Section Order (Conversion-Optimized)

**Best-converting section sequence (2026 consensus):**
1. Hero — full-bleed image/video + headline + primary CTA
2. Trust signals strip — 4 stats, dark bg, immediate credibility
3. Featured tours grid — top 3-4 cards, star ratings + price
4. Mid-page CTA / "Find your tour" — full-width, contrasting bg
5. Video section — social proof via storytelling
6. Why choose us — 3-4 icon+text benefit blocks
7. Seasonal tabs — contextual content, reduces scroll depth
8. Team/guide cards — humanizes the brand
9. Testimonials carousel — reinforces trust before footer
10. Newsletter / footer CTA

**Mobile-first rule:** Every section must be single-column stacked on mobile. Avoid sidebars. Thumb-zone CTAs (bottom 2/3 of screen).

---

## 2. Hero Section Patterns

**Stepi pattern:** Full-bleed carousel with dark overlay + centered white text + "Read More" CTA.

**Best practice for this project:**
- `min-h-screen` / `100svh` (safe viewport height for mobile browsers)
- `object-cover` Next.js `<Image fill priority>` for LCP optimization
- Gradient overlay: `bg-gradient-to-b from-primary-dark/70 via-primary/50 to-primary-dark/80`
- Text: serif heading (Playfair Display) centered, `text-4xl md:text-6xl lg:text-7xl`
- Two CTAs: primary (coral, solid) + secondary (outline-white), stacked on mobile / row on md+
- Scroll-down chevron indicator anchoring to next section
- Optional: parallax on scroll via `transform: translateY()` (already implemented)

**Mobile adaptation:**
- Reduce heading size: `text-3xl sm:text-5xl`
- Full-width CTA buttons: `w-full sm:w-auto`
- Reduce vertical padding: `py-16 sm:py-24 lg:py-32`

**Stepi adds:** badge/pill above headline ("Trusted by 2000+ travelers") — high conversion signal.

---

## 3. Tour Card Grid Patterns

**Responsive column progression:**
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
gap-4 sm:gap-6 lg:gap-8
```

**Card anatomy (Stepi-style):**
- Image top, aspect-video or aspect-[4/3]
- Category badge overlay (top-left, pill)
- Hover: scale-105 + shadow-lg transition
- Bottom: destination, rating stars, duration tag, price
- CTA button visible on hover (desktop) / always visible (mobile)

**Card best practices:**
- `rounded-2xl overflow-hidden` for consistent radius
- `group` class on wrapper → `group-hover:scale-105` on image
- Show max 6 cards on homepage (3×2 desktop, 2×3 tablet, scroll on mobile)
- "View All Tours" link below grid — drives catalog traffic

**Existing code note:** `featured-tours.tsx` already implements this pattern. Stepi enhancement = add category badge overlay + hover reveal CTA.

---

## 4. Trust Signals Design

**Stepi pattern:** 4-column grid, icon (color) + large bold number + label below.

**Tailwind v4 implementation:**
```html
<!-- Dark navy bg strip, full-width -->
<section class="bg-[var(--color-primary)] py-12 sm:py-16">
  <div class="container mx-auto grid grid-cols-2 gap-8 sm:grid-cols-4">
    <!-- Stat item -->
    <div class="flex flex-col items-center text-center text-white">
      <div class="mb-3 rounded-full bg-white/10 p-3">
        <!-- Icon 24x24 -->
      </div>
      <span class="font-playfair text-4xl font-bold">5000+</span>
      <span class="mt-1 text-sm text-white/70">Happy Travelers</span>
    </div>
  </div>
</section>
```

**Mobile:** 2×2 grid (2 cols on mobile, 4 cols on sm+). Never 1-col — wastes vertical space.
**Animation:** count-up on IntersectionObserver enter (already in `trust-signals.tsx`).

---

## 5. Video Embed Section (YouTube/Vimeo)

**Stepi layout:** 2-col (text left, video right) on desktop → stacked on mobile.

**Best practice — lazy load iframe:**
```tsx
// Intersection Observer triggers iframe injection
// Before load: show thumbnail + play button overlay
// aspect-video = 16:9 ratio maintained responsively
<div class="relative aspect-video w-full overflow-hidden rounded-2xl">
  {!playing ? (
    <button onClick={() => setPlaying(true)} aria-label="Play video">
      <img src={youtubeThumbnail} class="w-full h-full object-cover" />
      <PlayIcon class="absolute inset-0 m-auto h-16 w-16 text-white" />
    </button>
  ) : (
    <iframe src={`https://www.youtube.com/embed/${id}?autoplay=1`}
      allow="autoplay" class="absolute inset-0 h-full w-full" />
  )}
</div>
```

**Why:** Avoids YouTube loading 500KB+ on page load. Click-to-play reduces initial LCP impact.
**Layout Tailwind:** `grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center`

---

## 6. Seasonal / Tabbed CTA Sections

**Stepi pattern:** Tab buttons (Winter/Spring/Summer/Autumn) → content swap with image + description + "Book Now".

**Implementation:**
```tsx
const seasons = ['Winter', 'Spring', 'Summer', 'Autumn']
const [active, setActive] = useState('Summer')
```

**Tailwind v4:**
```html
<!-- Tab nav -->
<div class="flex gap-2 overflow-x-auto pb-2 sm:justify-center">
  <button class="rounded-full px-5 py-2 text-sm font-medium
    data-[active=true]:bg-primary data-[active=true]:text-white
    data-[active=false]:bg-white/10 data-[active=false]:text-white/70">
    Summer
  </button>
</div>
<!-- Content area: image-left + text-right or stacked -->
<div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
```

**Mobile:** tabs scroll horizontally (`overflow-x-auto`), content stacks vertically.
**Animation:** `transition-opacity duration-300` on content swap — no layout shift.

---

## 7. Team/Guide Cards

**Stepi pattern:** 6-col grid of square image cards + name + role + social links below.

**Best practice:**
```html
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
  <article class="group text-center">
    <!-- Circular avatar -->
    <div class="mx-auto mb-3 size-24 sm:size-32 overflow-hidden rounded-full
                ring-2 ring-transparent group-hover:ring-secondary transition-all">
      <img class="h-full w-full object-cover group-hover:scale-105 transition-transform" />
    </div>
    <h3 class="text-sm font-semibold text-text">Anna Lindqvist</h3>
    <p class="text-xs text-muted">Heritage Guide</p>
    <!-- Social links row -->
    <div class="mt-2 flex justify-center gap-2">
      <a href="#" class="text-muted hover:text-primary transition-colors" aria-label="Facebook">
        <!-- 16x16 icon -->
      </a>
    </div>
  </article>
</div>
```

**Mobile:** 2 cols on mobile (size-24 avatar), 3 on sm, 4-6 on lg+.

---

## 8. Tailwind CSS v4 Key Patterns

**v4 changes relevant here:**
- `bg-[var(--color-primary)]` → can now use `bg-primary` if token registered via `@theme`
- Container queries: `@container` + `@sm:grid-cols-2` for card components
- `size-{n}` shorthand: `size-24` = `w-24 h-24` (use for avatars, icons)
- `aspect-video` / `aspect-square` — still works, no change
- `data-[active=true]:` — attribute-based state styling (replaces JS class toggling)
- No JIT config needed — all classes tree-shaken by default in v4

**Mobile-first reminder:** Unprefixed = all sizes. `sm:` = 640px+. `lg:` = 1024px+.

**Responsive grid cheatsheet:**
```
Cards:   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
Stats:   grid-cols-2 sm:grid-cols-4
Guides:  grid-cols-2 sm:grid-cols-3 lg:grid-cols-6
Video:   grid-cols-1 lg:grid-cols-2
Seasons: grid-cols-1 lg:grid-cols-2
```

---

## Current Codebase State (Gap Analysis)

| Section | Exists? | Stepi Enhancement Needed |
|---|---|---|
| Hero | Yes (`hero-section.tsx`) | Add trust badge/pill above headline |
| Trust signals | Yes (`trust-signals.tsx`) | Change to 2×2 mobile grid, add icon bg circles |
| Tour cards | Yes (`featured-tours.tsx`) | Add category badge overlay, hover reveal CTA |
| Video section | No | New component needed |
| Seasonal tabs | No | New component needed |
| Team/guide cards | No | New component (use existing guide data) |
| Testimonials | Yes (`testimonials.tsx`) | Minor style polish |
| Why choose us | Yes (`why-choose-us.tsx`) | Stepi uses 4-col icon grid, current is 2-col |

---

## Unresolved Questions

1. Is there real video content available (YouTube/Vimeo URL) or should component accept a placeholder?
2. Should seasonal tabs link to filtered tour catalog routes, or just be static content sections?
3. Guide card data — does Payload CMS `guides` collection have photos suitable for circular avatars?
4. Should the homepage pull live tour data from CMS/Bokun or remain static placeholder data?
5. Stepi uses a carousel for tours — does client prefer carousel or static grid?
