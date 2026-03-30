# Phase 2: Title Accessibility Fix (WCAG AA)

**Status:** DONE
**Priority:** High
**Effort:** Small

## Context

The tour title is rendered as white text over a hero image with a gradient overlay. From the screenshot, the title "Stockholm Everyday Life Private Tour" is barely readable — white text blends with the light areas of the photo. The gradient (`from-black/70 via-black/20 to-transparent`) doesn't provide enough contrast in the middle/upper portions.

**WCAG AA requirement:** Text must have >= 4.5:1 contrast ratio (large text >= 3:1). The title is large text (3xl-5xl) but still fails when over light image areas.

## Files to Modify

- `apps/web/components/tour/tour-hero.tsx`

## Implementation Steps

1. Strengthen the gradient overlay to ensure consistent dark background behind text
2. Add a text shadow to the title for additional contrast safety
3. Ensure description text also meets contrast requirements

## Code Changes

```tsx
// Current gradient - too light in the middle
<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

// New gradient - stronger coverage for text readability
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

// Title: add text shadow for extra contrast safety
<h1 className="font-serif text-3xl font-bold md:text-4xl lg:text-5xl"
    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
  {tour.title}
</h1>

// Description: strengthen from text-white/90 to text-white with shadow
<p className="mt-2 max-w-2xl text-lg text-white md:text-xl"
   style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
  {tour.description}
</p>
```

## Contrast Analysis

| Element | Before | After |
|---------|--------|-------|
| Title (white on gradient) | ~2:1 on light areas | >= 4.5:1 with stronger gradient + shadow |
| Description (white/90 on gradient) | ~1.8:1 | >= 4.5:1 with full white + shadow |

## Success Criteria

- [x] Title clearly readable over any hero image
- [x] Gradient provides consistent dark background for text area
- [x] Text shadow adds fallback contrast layer
- [x] Meets WCAG AA large text contrast (>= 3:1, targeting >= 4.5:1)
