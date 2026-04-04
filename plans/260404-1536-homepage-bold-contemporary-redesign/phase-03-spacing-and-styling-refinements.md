# Phase 3: Spacing & Styling Refinements

## Context Links
- [Design Specs](research/researcher-01-design-specs.md)
- [Plan Overview](plan.md)
- Phase 1 must complete first (video translation keys required)

## Overview
- **Priority**: P2
- **Status**: Complete
- **Effort**: 1.5h
- **Description**: Apply spacing/padding refinements to Trust, Guides, Video sections. Add gold separator line between Video and Footer.

## Key Insights
- Most changes are padding/spacing tweaks, not structural
- Trust section: mainly padding standardization, most values already correct
- Guides section: mobile photo size 112px->100px, border 3px->2px, name 18px, abbreviated languages
- Video section: add tag and subtitle translation usage (keys added in Phase 1)
- Gold separator: simple 4px/3px `<hr>` with gold background, placed in page.tsx between Video and Footer
- Hero section: already matches design specs per research report, no changes needed

## Requirements

### Functional
- Trust section: 80px padding all sides desktop, consistent spacing
- Guides mobile: 100px photos, 2px border, 18px name, abbreviated languages
- Video section: use `tag` and `subtitle` translation keys
- Gold separator: full-width 4px (desktop) / 3px (mobile) gold line before footer

### Non-functional
- No layout shifts from spacing changes
- WCAG: `white/60` text on navy needs review (borderline for body text)
- Maintain reduced-motion support in all animated sections

## Architecture

### Gold Separator Placement
```
page.tsx render order:
  <VideoHighlight />
  <div className="h-1 bg-[var(--color-secondary-light)] md:h-[4px]" 
       role="separator" aria-hidden="true" />
  <Footer />
```

Simple `div` with `role="separator"`. Uses `--color-secondary-light` (#C4A052) which is decorative only (no text contrast concern).

## Related Code Files

### Modify
- `apps/web/components/home/trust-signals.tsx` — padding refinements
- `apps/web/components/home/guides-preview.tsx` — mobile sizing adjustments
- `apps/web/components/home/video-highlight.tsx` — use new translation keys
- `apps/web/app/(site)/[locale]/(frontend)/page.tsx` — add gold separator div

### Do NOT Modify
- `apps/web/components/home/hero-section.tsx` — already matches design
- `apps/web/components/home/featured-tours.tsx` — handled in Phase 2
- `apps/web/app/globals.css` — no CSS var changes needed

## Implementation Steps

### 1. Trust Signals — Padding Refinement
File: `apps/web/components/home/trust-signals.tsx`

Changes:
- Section padding: `py-10 md:py-20` -> `py-10 px-4 md:py-20 md:px-20` (add horizontal padding at section level)
- Consider removing container's `lg:px-8` since section now owns padding
- Mobile stat grid gap: already `gap-3`, research says change to `gap-2` but diff is 4px. Keep `gap-3` unless pixel-perfect required.
- Description text `text-white/60`: This is decorative stat descriptions on navy. Large enough text contrast for supplementary info. Keep as-is but note in Phase 4 for WCAG review.

Minimal diff — mostly the section-level `md:px-20` addition.

### 2. Guides Preview — Mobile Sizing
File: `apps/web/components/home/guides-preview.tsx`

Changes:
- Mobile photo container: `h-28 w-28` (112px) -> `h-[100px] w-[100px]`
- Mobile photo border: `border-[3px]` -> `border-2` (desktop keeps 3px via responsive)
  - Update to: `border-2 md:border-[3px]`
- Mobile guide name: `text-lg` (18px) -> already 18px, no change needed
- Languages: abbreviate on mobile. Current code: `guide.languages.join(', ')` outputs "Swedish, English, German"
  - New: Create abbreviation map and use on mobile
  - Approach: Add CSS-based responsive or compute abbreviated string
  - Simplest: replace full language names with short codes on mobile using a helper
  - Better: use `text-[13px]` already set, just shorten via translation or mapping

Language abbreviation approach:
```tsx
// Helper inside component
const formatLanguages = (langs: string[]) => {
  const abbrev: Record<string, string> = {
    'Swedish': 'SE', 'English': 'EN', 'German': 'DE',
    'Svenska': 'SE', 'Engelska': 'EN', 'Tyska': 'DE',
    'Schwedisch': 'SE', 'Englisch': 'EN', 'Deutsch': 'DE',
  }
  return langs.map(l => abbrev[l] || l)
}

// In render — show abbreviated on mobile, full on desktop
<p className="text-[13px] text-white/60">
  <span className="md:hidden">{formatLanguages(guide.languages).join(' · ')}</span>
  <span className="hidden md:inline">{guide.languages.join(', ')}</span>
</p>
```

### 3. Video Highlight — Translation Keys
File: `apps/web/components/home/video-highlight.tsx`

Changes:
- The `tag` span already renders `{t('tag')}` — verify this won't break (currently `home.video` namespace only has `sectionTitle`). Phase 1 adds `tag` and `subtitle` keys, so this will work.
- Current code already uses `{t('tag')}`, `{t('sectionTitle')}`, `{t('subtitle')}` — wait, let me check...

Looking at current code (lines 42-50):
- `{t('tag')}` — currently rendered but key doesn't exist yet! Will show "tag" as fallback
- `{t('sectionTitle')}` — exists
- `{t('subtitle')}` — currently rendered but key doesn't exist yet!

So Phase 1's translation additions will make existing `t()` calls work. No code change needed in video-highlight.tsx for translations. Just verify after Phase 1.

Actual changes to video-highlight.tsx: None required. The component already uses the translation keys that Phase 1 adds.

### 4. Gold Separator Line
File: `apps/web/app/(site)/[locale]/(frontend)/page.tsx`

Add between `<VideoHighlight />` and `<Footer />`:
```tsx
{/* Gold separator line */}
<div
  className="h-[3px] w-full bg-[var(--color-secondary-light)] md:h-1"
  role="separator"
  aria-hidden="true"
/>
```

Note: `h-1` = 4px in Tailwind, `h-[3px]` for mobile.

### 5. Verify
- `npm run lint`
- `npm run test`
- Visual check: spacing consistency, gold line visibility, mobile guide photos smaller

## Todo List
- [x] Update trust-signals.tsx section padding (add md:px-20)
- [x] Update guides-preview.tsx mobile photo size (100px, 2px border)
- [x] Add language abbreviation for mobile in guides-preview.tsx
- [x] Verify video-highlight.tsx translation keys work (after Phase 1)
- [x] Add gold separator div to page.tsx
- [x] Run lint
- [x] Run tests
- [x] Visual verification (desktop + mobile)

## Success Criteria
- Trust section has consistent 80px padding on desktop
- Guide photos are 100px with 2px border on mobile
- Languages show as "SE . EN . DE" on mobile, full names on desktop
- Gold line visible between video section and footer
- No layout shifts or broken spacing
- Lint passes

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Language abbreviation map misses a language | Medium | Low | Fallback: return original string if not in map |
| Padding changes cause container width issues | Low | Medium | Test on multiple viewport widths |
| Gold line invisible on certain screens | Low | Low | 4px height + high-contrast gold color |

## Security Considerations
- No user input changes
- No API changes

## Next Steps
- Phase 4 (WCAG Audit) runs after this phase completes
