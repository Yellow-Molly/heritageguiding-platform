# Phase 02 — Guide Detail Sidebar Component

## Context
- [Design spec](research/researcher-01-design-spec.md) — Left Sidebar section
- [guide-detail-header.tsx](../../apps/web/components/guide/guide-detail-header.tsx) (will be replaced)
- [guide-card.tsx](../../apps/web/components/guide/guide-card.tsx) (avatar pattern reference)

## Overview
- **Priority:** P1 (core visual piece)
- **Status:** Pending
- **Effort:** 1.5h
- **Blocked by:** Phase 1 (data layer), Phase 6 (i18n keys + icon mapping)

New `guide-detail-sidebar.tsx` component — the 450px left panel on desktop, centered header on mobile. Contains avatar, name, tagline, gold divider, language pills, area pills, credentials with colored icons, specialization pills, and desktop CTA button.

## Key Insights
- This replaces `guide-detail-header.tsx` entirely — old component gets deleted
- Server component (async) using `getTranslations` — same pattern as existing header
- Avatar pattern: copy from `guide-card.tsx` (relative container + fill Image + rounded-full)
- Credential icon mapping is a utility function (defined in Phase 6), consumed here
- Desktop CTA = "Contact {name}" with mail icon; mobile has no sidebar CTA (sticky bar instead)

## Requirements

**Functional:**
- 160px avatar (desktop), 120px (mobile), rounded-full, blur placeholder
- Fallback avatar: initial letter circle (existing pattern)
- Name: Playfair 28px/24px bold, `--color-primary`
- Tagline: first specialization name or empty, Inter 14px, `--color-text-muted`
- Gold divider: 60px wide, 2px, `--color-secondary`
- Languages section: globe icon + "LANGUAGES" label + pill badges
- Areas section: map-pin icon + "AREAS OF EXPERTISE" label + pill badges
- Credentials section: colored icon list items (icon mapping from Phase 6)
- Specializations section: amber-bg pill badges with star icon
- CTA button: desktop-only, full-width, `--color-accent` bg, mail icon + "Contact {name}"

**Non-functional:**
- File under 200 LOC — if exceeded, extract pill/badge sub-components
- All text via i18n keys from `guides` namespace

## Architecture

```
guide-detail-sidebar.tsx (server component, ~180 LOC)
├── Avatar (Image or fallback initial)
├── Identity block (name + tagline + gold divider)
├── SidebarSection: Languages (pills)
├── SidebarSection: Areas (pills)
├── <hr> divider
├── SidebarSection: Credentials (icon list)
├── <hr> divider
├── SidebarSection: Specializations (amber pills)
└── CTA button (hidden on mobile via `hidden lg:block`)
```

If LOC exceeds 200, extract:
- `guide-sidebar-credentials.tsx` — credentials list with icon mapping
- `guide-sidebar-pills.tsx` — reusable pill section (languages, areas, specializations)

## Data Flow
```
page.tsx (fetches GuideDetail) 
  → passes `guide` prop to GuideDetailSidebar
    → calls getTranslations('guides') for labels
    → calls getCredentialIcon(credential) for icon mapping
    → renders server HTML
```

## Related Code Files
| Action | File |
|--------|------|
| Create | `apps/web/components/guide/guide-detail-sidebar.tsx` |
| Delete | `apps/web/components/guide/guide-detail-header.tsx` |
| Modify | `apps/web/components/guide/index.ts` (swap exports) |

## Implementation Steps

1. Create `guide-detail-sidebar.tsx`:
   - Props: `{ guide: GuideDetail }`
   - Async server component with `getTranslations('guides')`
   - Merge `guide.languages` + `guide.additionalLanguages` into single array
   - Use `languageDisplayNames` mapping (existing import from `@/lib/language-display-names`)

2. **Avatar section:**
   - Desktop: `h-40 w-40`, Mobile: `h-30 w-30` (120px), centered
   - `priority` loading, `sizes="(max-width: 1024px) 120px, 160px"`
   - Fallback: bg-white circle with initial

3. **Identity block:**
   - `<h1>` name, serif font, primary color
   - Tagline: `guide.specializations[0]?.name` or hide if empty
   - Gold divider: `<div className="mx-auto h-0.5 w-15 bg-[var(--color-secondary)] lg:mx-0" />`

4. **Section pattern** (repeat for languages, areas):
   - Label row: icon + uppercase text, tracking-wide, text-xs, font-semibold, text-muted
   - Pill container: flex-wrap gap-2
   - Pill: `rounded-full bg-[var(--color-background-alt)] px-3 py-1 text-[13px]`

5. **Credentials section:**
   - Import `getCredentialIcon` from Phase 6 utility
   - Each item: `<li className="flex items-center gap-2">` + colored icon + text

6. **Specializations section:**
   - Pill: `rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[var(--color-secondary-dark)]`
   - Optional star icon prefix

7. **CTA button (desktop only):**
   - `<a>` or `<button>` with `className="hidden lg:flex ..."` 
   - Full width, `--color-accent` bg, white text, mail icon
   - Text: `t('contactGuide', { name: guide.name })`

8. **Responsive wrapper:**
   - Desktop: `w-[450px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-10 lg:p-12`
   - Mobile: `bg-[var(--color-surface)] px-5 py-8 text-center`
   - Use `lg:` breakpoint to switch between stacked-centered and sidebar layouts

9. Delete `guide-detail-header.tsx`

10. Update `index.ts`: remove `GuideDetailHeader` export, add `GuideDetailSidebar`

## Todo
- [ ] Create `guide-detail-sidebar.tsx` with avatar, identity, gold divider
- [ ] Add languages pill section
- [ ] Add areas pill section
- [ ] Add credentials icon list
- [ ] Add specializations amber pills
- [ ] Add desktop CTA button
- [ ] Handle responsive (centered mobile vs sidebar desktop)
- [ ] Delete `guide-detail-header.tsx`
- [ ] Update barrel exports in `index.ts`
- [ ] Verify file stays under 200 LOC; extract sub-components if needed

## Success Criteria
- Sidebar renders all guide profile data with correct typography and colors
- Desktop: fixed 450px left panel with right border
- Mobile: centered header section, no CTA button visible
- Avatar has blur placeholder and fallback initial
- All text uses i18n keys (no hardcoded English)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| File exceeds 200 LOC | Medium | Low | Pre-planned extraction: credentials + pills as sub-components |
| Credential icon mapping misses keywords | Medium | Low | Fallback icon (award/circle) for unmatched credentials |
| Gold divider color contrast | Low | Low | Uses established `--color-secondary` token |

## Security Considerations
None — display-only component, no user input.

## Next Steps
Unblocks Phase 3 (page layout) which imports this component.
