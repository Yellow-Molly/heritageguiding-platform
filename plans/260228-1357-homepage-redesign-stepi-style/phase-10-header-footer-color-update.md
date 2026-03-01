# Phase 10: Header & Footer Color Update

## Context Links
- [Plan Overview](./plan.md)
- [Current header.tsx](../../apps/web/components/layout/header.tsx) (229 lines)
- [Current footer.tsx](../../apps/web/components/layout/footer.tsx) (188 lines)

## Overview
- **Priority:** P2
- **Status:** complete
- **Description:** Update header and footer to align with new dark+gold palette. Most colors auto-update via CSS vars (Phase 01), but some hardcoded values need manual fixes. Also add i18n for footer text.

## Key Insights
- Header has hardcoded colors: `text-[#2D3748]` (line 98, 113), `text-[#1E3A5F]` (line 162)
- These bypass CSS vars and won't auto-update from Phase 01
- Footer uses `bg-[var(--color-primary-dark)]` which auto-updates to #0b0b0b
- Footer has hardcoded English text that needs i18n keys
- Header logo: `showSolidStyle ? '/logo-black.svg' : '/logo.svg'` -- may need update if logo colors change
- Header is 229 lines (over 200 limit) -- consider minor trimming

## Requirements

### Functional

#### Header
- Replace `text-[#2D3748]` with `text-[var(--color-text)]` (3 occurrences)
- Replace `text-[#1E3A5F]` with `text-[var(--color-primary)]` (1 occurrence)
- Scrolled state bg: `bg-white/95` stays (neutral, palette-independent)
- Mobile menu: update to use CSS var references consistently
- Verify logo SVGs work with new palette (dark logo on white header, light logo on transparent)

#### Footer
- Background auto-updates via `--color-primary-dark` -> #0b0b0b (darker, richer)
- Newsletter section: text stays white (good contrast on darker bg)
- Social link hover: `hover:bg-[var(--color-secondary)]` auto-updates to new gold
- Footer column headers: `text-[var(--color-secondary)]` auto-updates
- Replace hardcoded English strings with i18n keys:
  - "Stay Updated", "Subscribe to receive...", "Subscribe"
  - Column titles: "Tours", "Support", "Company", "Legal"
  - All link text
  - Contact info labels
  - Copyright text
  - "Language:" label

### Non-Functional
- Header: trim to ~200 lines if possible
- Footer: stays under 200 lines
- Maintain all accessibility (aria-labels, focus states)
- Maintain responsive behavior

## Architecture
In-place modification of both files. No structural changes.

## Related Code Files
- **Modify:** `apps/web/components/layout/header.tsx`
- **Modify:** `apps/web/components/layout/footer.tsx`

## Implementation Steps

### Header Updates
1. Replace hardcoded text colors (grep for `#2D3748` and `#1E3A5F`):
   ```
   Line 98:  text-[#2D3748] -> text-[var(--color-text)]
   Line 113: text-[#2D3748] -> text-[var(--color-text)]
   Line 162: text-[#1E3A5F] -> text-[var(--color-primary)]
   ```
2. Verify mobile menu text uses var refs
3. Check logo SVGs render correctly against new backgrounds
4. Minor whitespace trimming to reduce line count

### Footer Updates
5. Add `useTranslations('footer')` hook (requires `'use client'` -- already present)
6. Replace hardcoded strings with t() calls:
   ```tsx
   // Newsletter
   t('newsletter.title')       // "Stay Updated"
   t('newsletter.subtitle')    // "Subscribe to receive..."
   t('newsletter.placeholder') // "Enter your email"
   t('newsletter.button')      // "Subscribe"

   // Columns - use dynamic keys
   t(`columns.${column.key}.title`)
   t(`columns.${column.key}.links.${link.key}`)

   // Contact
   t('contact.address')
   t('contact.phone')
   t('contact.email')
   t('contact.hours')

   // Bottom
   t('copyright', { year: currentYear })
   t('language')
   ```
7. Restructure footer link data to use translation keys instead of hardcoded names
8. Verify social links still have correct aria-labels
9. Run build + lint

## Todo List

### Header
- [x] Replace `#2D3748` with `var(--color-text)` (3 places)
- [x] Replace `#1E3A5F` with `var(--color-primary)` (1 place)
- [x] Verify logo rendering on new palette
- [x] Trim whitespace for line count

### Footer
- [x] Add `useTranslations('footer')` hook
- [x] Replace newsletter section text with i18n
- [x] Replace column titles with i18n
- [x] Replace link names with i18n
- [x] Replace contact info labels with i18n
- [x] Replace copyright with i18n (parameterized year)
- [x] Verify social link accessibility
- [x] Build + lint pass

## Success Criteria
- No hardcoded hex colors in header (all use CSS vars)
- Footer text fully i18n-ready
- Visual consistency with new dark+gold palette
- All accessibility maintained
- Both files under ~200 lines

## Risk Assessment
- **Low:** Mostly find-and-replace for header colors
- **Medium:** Footer i18n restructuring requires careful key design
- **Mitigation:** Define footer i18n keys in Phase 11 translation files simultaneously
- **Note:** Logo SVGs may need color updates if they reference old navy (#1E3A5F)

## Security Considerations
None.

## Next Steps
Phase 11 adds all i18n translations and tests.
