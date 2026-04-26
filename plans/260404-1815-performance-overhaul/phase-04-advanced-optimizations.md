---
phase: 4
title: "Advanced Optimizations"
status: pending
priority: P2
effort: 1.5h
---

# Phase 4: Advanced Optimizations

## Context
- [Plan overview](plan.md)
- Depends on Phase 2 (blur placeholders) and Phase 3 (CMS pipeline)
- Targets: LCP hero preload, YouTube facade, Unsplash URL optimization, sizes audit

## Overview
Fine-tune performance with hero image preloading, YouTube lite embed, Unsplash URL parameter optimization, and accurate `sizes` props on all Image components.

## Implementation Steps

### Step 1: Hero image preload for LCP
The hero image is the Largest Contentful Paint element on homepage, about, and contact pages.

In `apps/web/app/(site)/[locale]/layout.tsx`, add dynamic preload based on route:
- This is complex for a layout. Simpler approach: use `fetchPriority="high"` on hero Images.

In hero components (`hero-section.tsx`, `about-hero-section.tsx`, `contact-hero-section.tsx`):
```tsx
<Image
  // ... existing props
  priority  // already set on most heroes
  fetchPriority="high"  // explicit browser hint
/>
```

Verify `priority` is set on ALL hero images (some may be missing).

### Step 2: YouTube lite facade
Replace eager YouTube iframe in `apps/web/components/home/video-highlight.tsx`.

Current behavior: thumbnail image + play button → opens modal with iframe. This is already a facade pattern — iframe only loads on click (`{isOpen && <iframe>}`). **No change needed** — already optimized.

**Optional improvement**: Add `loading="lazy"` to the thumbnail Image (currently no priority, but also no lazy):
```tsx
<Image
  // ... existing props
  loading="lazy"  // explicit lazy since below hero fold
/>
```

### Step 3: Optimize Unsplash URL parameters
Reduce quality and size for non-hero Unsplash images:

| Component | Current | Optimized | Reason |
|-----------|---------|-----------|--------|
| hero-section.tsx | w=2070&q=80 | w=1920&q=75 | Match hero size config |
| about-hero-section.tsx | w=2070&q=80 | w=1920&q=75 | Match hero size |
| contact-hero-section.tsx | w=2070&q=80 | w=1920&q=75 | Match hero size |
| video-highlight.tsx | w=1600&q=80 | w=1200&q=70 | Thumbnail only, half viewport |
| about-story-section.tsx | w=960&q=80 | w=960&q=70 | Reduce quality |
| about-responsible-tourism.tsx | w=960&q=80 | w=960&q=70 | Reduce quality |
| latest-posts.tsx | w=800&q=80 | w=800&q=70 | Reduce quality |
| seasonal-cta.tsx | w=600&q=80 | w=600&q=70 | Reduce quality |
| testimonials.tsx | q=80&w=200 | q=60&w=200 | Small avatars, quality unnoticeable |

### Step 4: Audit and fix `sizes` props
Review all Image components for accurate `sizes` values:

**Issues found:**
- `tour-hero.tsx` main image: `sizes="100vw"` — correct (full bleed)
- `tour-gallery.tsx` main: `sizes="100vw"` — correct (fullscreen lightbox)
- `tour-gallery.tsx` thumbnails: uses width/height props (80×56) — no sizes needed
- `guides-preview.tsx`: `sizes="(max-width: 768px) 100px, 140px"` — correct
- All others appear correctly sized

**No changes needed** — sizes audit passes.

### Step 5: Add preconnect for Vercel Blob
In `apps/web/app/(site)/[locale]/layout.tsx`, add preconnect for Vercel Blob storage:
```tsx
<link rel="preconnect" href="https://*.blob.vercel-storage.com" />
```

Note: wildcard may not work in preconnect. Check actual Blob hostname from CMS data and use specific subdomain if needed. If hostname varies, skip this optimization.

### Step 6: Compile check
Run `npm run build` to verify all changes.

## Related Code Files

### Files to modify
- `apps/web/components/home/hero-section.tsx` — fetchPriority, Unsplash URL params
- `apps/web/components/pages/about-hero-section.tsx` — fetchPriority, URL params
- `apps/web/components/contact/contact-hero-section.tsx` — fetchPriority, URL params
- `apps/web/components/home/video-highlight.tsx` — loading="lazy", URL params
- `apps/web/components/home/latest-posts.tsx` — URL params
- `apps/web/components/home/testimonials.tsx` — URL params
- `apps/web/components/home/seasonal-cta.tsx` — URL params
- `apps/web/components/pages/about-story-section.tsx` — URL params
- `apps/web/components/pages/about-responsible-tourism-section.tsx` — URL params
- `apps/web/app/(site)/[locale]/layout.tsx` — optional preconnect

## Todo List
- [ ] Add `fetchPriority="high"` to all hero Image components
- [ ] Verify `priority` is set on all hero Images
- [ ] Optimize Unsplash URL params (reduce w/q values)
- [ ] Add `loading="lazy"` to video thumbnail Image
- [ ] Evaluate Vercel Blob preconnect feasibility
- [ ] Build check passes

## Success Criteria
- Hero images have both `priority` and `fetchPriority="high"`
- Unsplash image transfer sizes reduced by ~15-25%
- No layout shifts introduced
- Build passes cleanly
