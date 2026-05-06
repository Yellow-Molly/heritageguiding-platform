# Phase 02 — Component Scaffolding

## Context Links
- Design file: `pencils/terms-and-conditions.pen`
- Component spec sheet (in design): node `Pswpz`
- Verification report: `plans/reports/verification-260503-1752-tc-design.md`
- Existing pattern: `apps/web/components/cancellation/` (similar component-set built for /cancellation page)

## Overview
- **Priority:** P1
- **Status:** pending (parallel with Phase 03+ once Phase 01 closes)
- **Effort:** 3-4h
- **Description:** Build 6 new components matching design spec. Promote 3 new color tokens to globals.css.

## Components to Build

| File | LOC est. | Client/Server | Purpose |
|------|----------|---------------|---------|
| `apps/web/components/terms/legal-callout.tsx` | ~40 | Server | Gold-tint bg + 4px gold left border + alert icon. Used in §08 (withdrawal exclusion) and any critical clause. Props: `title`, `children`. |
| `apps/web/components/terms/company-info-card.tsx` | ~50 | Server | White surface card, two-column key/value grid. Props: `entries: { label, value }[]` or named props (legalName, orgNr, vat, address, ...). |
| `apps/web/components/terms/toc-sidebar.tsx` | ~120 | **Client** | Sticky on lg+, horizontal grid on md, collapsible accordion on sm. Scrollspy via IntersectionObserver. Props: `items: { id, number, title }[]`. |
| `apps/web/components/terms/toc-item.tsx` | ~30 | Client (inside toc-sidebar) | Single ToC entry; renders default/hover/active states. Number prefix in gold + title in `--color-text`. |
| `apps/web/components/terms/help-band.tsx` | ~50 | Server | "Need help?" footer band on `--color-background-alt`. Two-column desktop, stacked mobile. Props: `title`, `subtitle`, `primaryCta`, `secondaryLink`. |
| `apps/web/components/shared/inline-cross-link-card.tsx` | ~40 | Server | Generic inline cross-link card (used in §07 → /cancellation, §15 → /privacy). Props: `icon`, `title`, `description`, `href`. |
| `apps/web/components/terms/index.ts` | ~10 | n/a | Barrel exports |

All under 200 LOC per CLAUDE.md modularization rule. All Tailwind utilities only, referencing CSS var tokens (no hardcoded hex).

## Design Token Promotion

Update `apps/web/app/globals.css` `:root` block — add three new tokens used by design:

```css
--color-secondary-tint: #C4A05219;        /* gold @ 10% opacity, legal-callout bg */
--color-text-on-primary: #FFFFFF;
--color-text-on-primary-muted: #FFFFFFCC; /* white @ 80% opacity, hero subtitle */
```

Also update the corresponding `@theme inline` block to expose them as Tailwind utilities.

<!-- Updated: Validation Session 1 - print CSS added to Phase 02 scope -->

## Print Stylesheet (NEW — added by validation Session 1)

Add `@media print` block to `apps/web/app/globals.css` scoped to `.terms-page` class. Page composition (Phase 06) will add `className="terms-page"` to the `<main>` element.

Per design A4 mockup, print mode must:
- Hide ToC sidebar
- Hide hero color block; replace with simple bordered title (single line)
- Hide help band
- Hide site Header + Footer
- Show all 19 sections inline with `§ XX` numbering visible
- Show running header: "PRIVATE TOURS · TERMS & CONDITIONS" left, "Last updated YYYY-MM-DD" right
- Show running footer: contact email + phone + page numbers
- Single-column body, max-width unrestricted, color-blocks stripped

Approximate ~30-40 LOC, e.g.:

```css
@media print {
  .terms-page header.site-header,
  .terms-page footer.site-footer,
  .terms-page .terms-toc-sidebar,
  .terms-page .terms-help-band {
    display: none !important;
  }
  .terms-page .terms-hero {
    background: none !important;
    color: var(--color-text);
    border: 1px solid var(--color-border);
    padding: 1rem;
  }
  .terms-page .terms-hero h1 {
    color: var(--color-text);
  }
  .terms-page main {
    max-width: none;
    padding: 0;
  }
  .terms-page section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  @page {
    margin: 2cm;
    @top-left { content: "PRIVATE TOURS · TERMS & CONDITIONS"; }
    @top-right { content: "Last updated " attr(data-last-updated); }
    @bottom-center { content: "Page " counter(page) " / " counter(pages); }
  }
}
```

**Note:** `@page` margin boxes have limited browser support outside print preview; use the running headers as best-effort. Some browsers will fall back to default print headers.

Exact selectors (`.site-header`, `.site-footer`, `.terms-toc-sidebar`, `.terms-help-band`, `.terms-hero`) require Phase 06 to apply matching className conventions. Coordinate.

## Component Specifications (from design)

### LegalCallout
- bg: `var(--color-secondary-tint)`
- left border: `4px solid var(--color-secondary)`
- corner radius: `8px`
- padding: `24px`
- icon: `lucide-react` `AlertTriangle` in muted gold (`var(--color-secondary)`), 20×20
- title: Inter 14/600, `var(--color-text)`
- body: Inter 14, line-height 1.55, `var(--color-text)`

### CompanyInfoCard
- bg: `var(--color-surface)`
- border: `1px solid var(--color-border)`
- corner radius: `12px`
- padding: `24px`
- two-column grid (desktop), single-column (mobile)
- key: Inter 11/600 uppercase, letterspacing 1.5, `var(--color-text-muted)`
- value: Inter 14, `var(--color-text)`

### TocSidebar (CLIENT COMPONENT)
- bg: `var(--color-background-alt)`
- corner radius: `12px`
- padding: `24px`
- width: `260px` desktop sticky
- "ON THIS PAGE" eyebrow: Inter 11/600, letterspacing 2, `var(--color-text-muted)`
- 32×2px gold spacer below eyebrow
- vertical layout, gap 2px between items
- Tablet (md): switches to 2-column horizontal grid layout
- Mobile (sm): collapses to accordion with "Jump to section" trigger
- Scrollspy: `IntersectionObserver` with threshold 0.5; updates `aria-current="location"` on active item

### TocItem
- corner radius: `6px`
- padding: `[10, 12]`
- gap: `10px`
- number prefix: Inter 12/600, `var(--color-secondary)`, letterspacing 1
- title: Inter 14, `var(--color-text)`
- **active state:** bg `var(--color-background)`, 3px gold left border, `var(--color-primary)` text
- **hover state:** bg `var(--color-background)` only

### HelpBand
- bg: `var(--color-background-alt)`
- padding: `py-16 px-4`
- two-column desktop (CTA left, link right), stacks on mobile
- title: Playfair 24, `var(--color-primary)`
- subtitle: Inter 14, `var(--color-text-muted)`
- primary CTA: existing button style (primary, navy)
- secondary link: text link with arrow icon

### InlineCrossLinkCard
- bg: `var(--color-background-alt)`
- corner radius: `8px`
- padding: `[18, 20]`
- horizontal layout: icon (left) + title/description (center) + chevron (right)
- hover: bg → `var(--color-surface)` + subtle shadow
- icon: lucide-react, 20×20, `var(--color-secondary)`

## Implementation Steps

1. Update `apps/web/app/globals.css` — add 3 new tokens
2. Create `apps/web/components/terms/` directory
3. Implement components in this order (top-down dependency): `legal-callout.tsx` → `company-info-card.tsx` → `help-band.tsx` → `toc-item.tsx` → `toc-sidebar.tsx` (depends on toc-item)
4. Implement `apps/web/components/shared/inline-cross-link-card.tsx`
5. Create barrel `apps/web/components/terms/index.ts`
6. Run `npm run build` (apps/web) to verify TS/typecheck and Tailwind classes resolve

## Related Code Files

### Create
- `apps/web/components/terms/legal-callout.tsx`
- `apps/web/components/terms/company-info-card.tsx`
- `apps/web/components/terms/toc-sidebar.tsx`
- `apps/web/components/terms/toc-item.tsx`
- `apps/web/components/terms/help-band.tsx`
- `apps/web/components/terms/index.ts`
- `apps/web/components/shared/inline-cross-link-card.tsx`

### Modify
- `apps/web/app/globals.css` (add 3 tokens to `:root` and `@theme inline`)

## Todo List

- [ ] Add 3 new tokens to globals.css :root + @theme
- [ ] Add @media print block to globals.css (validation S1)
- [ ] Create components/terms/ directory
- [ ] Implement LegalCallout
- [ ] Implement CompanyInfoCard
- [ ] Implement HelpBand
- [ ] Implement TocItem
- [ ] Implement TocSidebar with scrollspy
- [ ] Implement InlineCrossLinkCard (shared)
- [ ] Create barrel index.ts
- [ ] Visual sanity check: render each component in isolation via Storybook or quick sandbox route
- [ ] `npm run build` — verify zero TS/lint errors
- [ ] Print preview sanity check (Ctrl+P) on a fixture route

## Success Criteria

- All 6 components compile, no TS errors
- Each file under 200 LOC
- All colors via CSS vars (grep ensures no hardcoded `#` hex in component files)
- ToC scrollspy works on long fixture page (no SSR hydration warnings)
- Visual match to design spec sheet (compare via screenshots side-by-side)

## Risks

- ToC scrollspy SSR hydration mismatch → use `'use client'` boundary correctly, defer IntersectionObserver to `useEffect`
- Tailwind not picking up CSS vars → verify `@theme inline` is exposing them
- Lucide icon size mismatch → standardize at 20×20 with explicit `width`/`height` props

## Next Phase

Phase 06 (page composition) consumes these components. Phases 03–05 (content drafting) run in parallel.
