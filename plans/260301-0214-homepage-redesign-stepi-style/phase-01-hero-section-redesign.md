# Phase 01 - Hero Section Redesign

## Context Links
- [Research Report](research/researcher-01-reference-site-design.md)
- [Current Hero](../../apps/web/components/home/hero-section.tsx) (~190 LOC)
- [Fonts](../../apps/web/lib/fonts.ts)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
- **Priority:** P1
- **Status:** complete
- **Effort:** 1h
- **Description:** Simplify hero from heavy TripFreak style (floating images, dual CTA, trust badge, parallax SVGs) to clean Stepi style (single background image, decorative script label, H1, single CTA).

## Key Insights
- Stepi hero is minimal: background image + gradient + script label + H1 + single CTA button
- No floating image elements, no trust badge row, no parallax SVG decorations
- Script font (Allura) used for aspirational label above headline
- Single CTA drives users to scroll/explore, not search

## Requirements

### Functional
- Full-screen hero with single high-quality background image
- Decorative script label above H1 (e.g., "Discover the magic of")
- H1: "Stockholm's Hidden Heritage" (i18n)
- Single CTA button: "Explore Our Tours" linking to `/tours`
- Scroll-down indicator at bottom
- Gradient overlay: simpler, lighter than current

### Non-Functional
- Mobile-first responsive
- Image uses `priority` and `sizes="100vw"`
- Animation: simple fade-in-up, no parallax
- Respect `prefers-reduced-motion`

## Architecture

### Font Addition
Add Allura to `apps/web/lib/fonts.ts`:
```tsx
import { Inter, Playfair_Display, Allura } from 'next/font/google'

export const allura = Allura({
  variable: '--font-allura',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})
```

Add to layout body class in `apps/web/app/(site)/[locale]/layout.tsx`:
```tsx
<body className={`${inter.variable} ${playfairDisplay.variable} ${allura.variable} antialiased`}>
```

### Simplified Hero Structure
```
<section> (min-h-screen, flex center)
  <Image> (background, priority, fill)
  <div> (gradient overlay - lighter)
  <div> (content container, z-20, text-center)
    <span> (script label, font-allura)
    <h1> (Playfair, white, large)
    <p> (subtitle, white/90)
    <Link> (single CTA, primary button, xl)
  <button> (scroll indicator, bottom)
```

## Related Code Files

### MODIFY
- `apps/web/components/home/hero-section.tsx` - complete rewrite (simpler)
- `apps/web/lib/fonts.ts` - add Allura font
- `apps/web/app/(site)/[locale]/layout.tsx` - add allura variable to body
- `apps/web/messages/en.json` - add `home.hero.scriptLabel`
- `apps/web/messages/sv.json` - add `home.hero.scriptLabel`
- `apps/web/messages/de.json` - add `home.hero.scriptLabel`

### REMOVE (from hero-section.tsx)
- Floating image elements (Royal Palace, City Hall)
- Parallax scroll effect and `data-parallax` attributes
- Decorative SVG circles/triangles
- Trust badge row (Licensed, Award-Winning, 5-Star)
- Dual CTA (Ask AI + View Tours) - keep only View Tours
- `useAiChat` import and dependency

## Brand Base Colors (MUST apply)
Source: `apps/web/public/base-color-logo.md`
- `#0b0b0b` near black | `#252525` dark charcoal | `#3e3e3e` dark gray
- `#d0ad50` medium gold | `#DBC078` warm gold | `#e6d3a0` light gold

**Action:** Update `globals.css` CSS custom properties:
```css
--color-primary: #252525       /* was #1E3A5F navy → now dark charcoal */
--color-primary-light: #3e3e3e /* was #2A4A75 → now dark gray */
--color-primary-dark: #0b0b0b  /* was #152B47 → now near black */
--color-secondary: #DBC078     /* was #C4A052 → now warm gold */
--color-secondary-light: #e6d3a0 /* was #D4B462 → now light gold */
--color-secondary-dark: #d0ad50  /* was #B49042 → now medium gold */
```
Keep accent (#E67E5A) and neutral colors unchanged.

## Implementation Steps

1. **Update brand colors in `globals.css`** - change CSS custom properties to match base-color-logo.md (see above)

2. **Add Allura font** to `apps/web/lib/fonts.ts`
   - Import `Allura` from `next/font/google`
   - Export `allura` with `variable: '--font-allura'`, weight 400, subset latin

2. **Update layout** `apps/web/app/(site)/[locale]/layout.tsx`
   - Import `allura` from `@/lib/fonts`
   - Add `${allura.variable}` to body className

3. **Add i18n keys** to all 3 message files:
   ```json
   "hero": {
     "scriptLabel": "Discover the magic of",
     "title": "Stockholm's Hidden Heritage",
     "subtitle": "Expert-led tours revealing centuries of Swedish history",
     "cta": "Explore Our Tours"
   }
   ```

4. **Rewrite `hero-section.tsx`** (~80 LOC target):
   - Remove all parallax logic, floating images, SVG decorations, trust indicators
   - Remove `useAiChat` import
   - Keep: `'use client'`, `useTranslations`, `Image`, `Link`, `ChevronDown`
   - Single background image with lighter gradient: `from-black/50 via-black/30 to-black/60`
   - Script label: `<span className="font-[family-name:var(--font-allura)] text-2xl md:text-3xl text-[var(--color-secondary)]">`
   - H1: keep `font-serif` (Playfair), reduce to `text-4xl md:text-6xl`
   - Single CTA: `<Link href="/tours" className={getButtonClassName('primary', 'xl')}>`
   - Keep scroll indicator button

5. **Verify build** compiles without errors

## Todo List
- [x] Update CSS custom properties in `globals.css` with brand base colors
- [x] Add Allura font export to `lib/fonts.ts`
- [x] Update layout to include allura CSS variable
- [x] Add `home.hero.scriptLabel` to en/sv/de message files
- [x] Rewrite hero-section.tsx (remove floating images, parallax, SVGs, dual CTA)
- [x] Verify component under 200 LOC
- [x] Verify build compiles

## Success Criteria
- Hero renders full-screen with single background image
- Script label visible above H1 in Allura font
- Single CTA links to `/tours`
- No floating images or parallax behavior
- Mobile: stacks cleanly, text readable
- All 3 locales render correctly

## Risk Assessment
- **Low:** Removing `useAiChat` from hero - AI chat still accessible via header/floating button
- **Low:** Allura font adds ~15KB, acceptable for decorative use
- **Medium:** Existing hero tests (if any) will break - covered in Phase 6

## Security Considerations
- No new data inputs or API calls
- External font loaded via next/font (self-hosted, no CORS issues)

## Next Steps
- Phase 02: Trust Signals restyle + Video Section
