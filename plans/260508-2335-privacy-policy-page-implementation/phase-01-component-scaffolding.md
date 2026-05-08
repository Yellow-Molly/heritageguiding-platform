# Phase 01 — Component Scaffolding

## Context Links
- Plan: [plan.md](./plan.md)
- Design: `pencils/privacy.pen` frame `fsrNe` (Option A — Editorial Heritage)
- Pattern reference: `apps/web/components/cancellation/*.tsx`

## Overview
- **Priority:** High
- **Status:** Pending
- **Effort:** ~3-4h
- Create 9 server components (or client where required) + barrel export + types. No content yet — accept all strings via props.

## Key Insights
- Cancellation page is the visual + structural reference. Mirror its prop patterns.
- Server components by default. Client only where stateful interactivity required (TOC scroll-spy, accordion if not using `<details>`).
- Each component receives all text content as props — no `getTranslations` inside components. Page-level component fetches translations and passes down. Keeps components dumb + testable.

## Requirements

### Functional
- 9 components rendered without runtime errors
- All text content passed via typed props (no hardcoded copy)
- Components compose into a single page top-to-bottom
- Tailwind CSS classes only — no new CSS files
- Use existing tokens from `globals.css`: `--color-primary`, `--color-secondary`, `--color-secondary-light`, `--color-secondary-tint`, `--color-background`, `--color-background-alt`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`

### Non-Functional
- Each file <200 LOC
- Kebab-case file names with `privacy-` prefix
- TypeScript strict mode
- Server components where possible (default)

## Architecture

```
apps/web/components/privacy/
├── index.ts                          # barrel export
├── types.ts                          # shared types (ProcessingRow, SubProcessorRow, RightItem, etc.)
├── privacy-hero.tsx                  # server
├── privacy-table-of-contents.tsx     # client (scroll-spy)
├── privacy-controller-card.tsx       # server
├── privacy-processing-table.tsx      # server (responsive table → cards via Tailwind)
├── privacy-sub-processor-table.tsx   # server
├── privacy-rights-accordion.tsx      # server (uses native <details>/<summary>)
├── privacy-prose.tsx                 # server (renders sections 2,3,6,7,10,11,12,13,14)
├── privacy-complaint-callout.tsx     # server
└── privacy-contact-cta.tsx           # server
```

### Type Definitions (`types.ts`)

```ts
export interface BreadcrumbItem { label: string; href?: string }
export interface UpdatedChip { label: string; date: string }

export interface PrivacyHeroProps {
  breadcrumb: BreadcrumbItem[]
  title: string
  subtitle: string
  updatedChip: UpdatedChip
}

export interface TocItem { id: string; numeral: string; label: string }
export interface PrivacyTableOfContentsProps {
  items: TocItem[]
  title: string         // "Jump to section"
  closeLabel: string    // mobile drawer close
}

export interface ControllerInfo {
  legalName: string     // "Private Tours [COMPANY_LEGAL_NAME] AB"
  orgNumber: string     // placeholder for now
  address: string[]     // multi-line
  email: string         // info@privatetours.se
}
export interface PrivacyControllerCardProps {
  heading: string
  controllerLabel: string
  contactLabel: string
  controller: ControllerInfo
}

export interface ProcessingRow {
  activity: string
  dataCategories: string
  legalBasis: string    // "Art. 6(1)(b) — Contract"
  retention: string     // "7 years"
}
export interface PrivacyProcessingTableProps {
  caption: string
  columnHeaders: { activity: string; data: string; basis: string; retention: string }
  rows: ProcessingRow[]
}

export interface SubProcessorRow {
  provider: string
  monogram: string      // single letter for chip
  role: string
  location: string
  transfer: string      // "EU SCCs"
}
export interface PrivacySubProcessorTableProps {
  caption: string
  columnHeaders: { provider: string; role: string; location: string; transfer: string }
  rows: SubProcessorRow[]
}

export interface RightItem {
  id: string
  numeral: string
  name: string
  description: string
  exerciseInstruction: string
  ctaLabel: string
  mailtoSubject: string
}
export interface PrivacyRightsAccordionProps {
  heading: string
  items: RightItem[]
  slaCallout: string    // "We respond within 30 days. Free of charge."
  contactEmail: string
}

export interface ProseSection {
  id: string
  heading: string
  intro?: string
  bullets?: string[]
  paragraphs?: string[]
}
export interface PrivacyProseProps {
  sections: ProseSection[]
}

export interface PrivacyComplaintCalloutProps {
  heading: string
  body: string
  primaryCta: { label: string; mailto: string }
  secondaryCta: { label: string; href: string; ariaLabel: string }
}

export interface PrivacyContactCtaProps {
  heading: string
  email: string
  emailDisplay: string  // for visible link text
  responseSla: string   // "We respond within 12 hours."
}
```

### Component Specs (concise)

**privacy-hero.tsx** (server, ~60 LOC)
- Section with `bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)]`
- Inner: gold divider line (1px, `bg-[var(--color-secondary-light)]/40` width 120px) → breadcrumb (gold, letter-spaced) → updated chip (rounded-full, `bg-[var(--color-secondary)]` navy text) → h1 Playfair → 2px gold accent line → subtitle (white/80%) → bottom gold divider
- Padding: `py-24 lg:py-24 md:py-20 py-12` (responsive via clamp pattern)
- `text-center` on inner column
- h1: `font-serif text-[clamp(2rem,5vw,4.5rem)] text-white font-bold leading-[1.1]`

**privacy-table-of-contents.tsx** (client, ~120 LOC — Phase 4 adds behavior; Phase 1 ships static skeleton with scroll-to anchor links)
- Two render modes via prop or media query: `desktop` (sticky sidebar) vs `mobile` (drawer trigger)
- Desktop sidebar: `lg:sticky lg:top-24 lg:h-fit lg:w-[260px]`
- Each item: numeral chip (gold circle, 24×24, navy text) + label (Inter 14px)
- Active state: gold left border 3px, bolder text — added in Phase 4
- Mobile: sticky pill button "Jump to section" expanding to overlay drawer with close button — Phase 4

**privacy-controller-card.tsx** (server, ~60 LOC)
- `<article>` with `bg-[var(--color-surface)] rounded-2xl shadow-card p-6 md:p-8 border-l-4 border-[var(--color-secondary)]`
- 2-column grid on desktop: `md:grid-cols-2 gap-8`
- Left: `controllerLabel` (text-muted, uppercase letter-spaced) + heading (Playfair) + legal name + org.nr
- Right: `contactLabel` + multi-line address + email mailto link

**privacy-processing-table.tsx** (server, ~120 LOC)
- Wrap in `<figure>` with `<figcaption>` (visually hidden on desktop, visible on mobile)
- Desktop ≥768px: `<table>` with `<thead><tr><th>` semantic HTML; zebra `even:bg-[var(--color-background-alt)]`; gold top border `border-t-2 border-[var(--color-secondary-light)]`; legal-basis cell uses `<span class="inline-block rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 text-xs">`
- Mobile <768px: hide table, render `<ul class="md:hidden">` of cards (`bg-[var(--color-surface)] rounded-lg shadow-sm p-4 space-y-2`) with key-value rows
- Use Tailwind `hidden md:table` + `md:hidden` for table/card swap

**privacy-sub-processor-table.tsx** (server, ~100 LOC)
- Same table/card responsive pattern as Processing table
- Provider cell: monogram chip (24×24 rounded-full bg gold, navy text, font-bold) + provider name
- Transfer cell: tooltip via `<abbr title="EU Standard Contractual Clauses">EU SCCs</abbr>`

**privacy-rights-accordion.tsx** (server, ~110 LOC)
- Use native `<details>` + `<summary>` (no client JS needed for expand)
- 8 rows, each row has gold numeral chip + name (Playfair h4) + chevron via CSS rotation on `[open]`
- Inside: description + "How to exercise" instruction + mailto button
- Below the 8 rows: callout banner (`bg-[var(--color-secondary-tint)] border-l-4 border-[var(--color-secondary-light)] p-4`) with SLA text

**privacy-prose.tsx** (server, ~80 LOC)
- Renders array of `ProseSection` as `<section id={id}>` with h2 (Playfair, navy, with 32px gold underline `after:content-[''] after:block after:w-8 after:h-[2px] after:bg-[var(--color-secondary-light)] after:mt-2`)
- Optional `intro`, `bullets` (semantic `<ul>`), and `paragraphs`
- Centered max-w-3xl content column

**privacy-complaint-callout.tsx** (server, ~70 LOC)
- Full-width band `bg-[var(--color-background-alt)] py-12 md:py-16`
- Centered icon (Lucide `Scale`), 48px, `text-[var(--color-primary)]`
- h2 Playfair + body
- Two CTAs: primary (`bg-[var(--color-accent)]`) and secondary outline navy
- External link with `rel="noopener noreferrer"` + new-tab icon (Lucide `ExternalLink`)

**privacy-contact-cta.tsx** (server, ~50 LOC)
- Slim band `bg-[var(--color-primary)] py-10 text-white text-center`
- Single-line layout on desktop, stacked on mobile
- Email rendered as coral underlined link

### Barrel Export (`index.ts`)
```ts
export * from './types'
export { PrivacyHero } from './privacy-hero'
export { PrivacyTableOfContents } from './privacy-table-of-contents'
export { PrivacyControllerCard } from './privacy-controller-card'
export { PrivacyProcessingTable } from './privacy-processing-table'
export { PrivacySubProcessorTable } from './privacy-sub-processor-table'
export { PrivacyRightsAccordion } from './privacy-rights-accordion'
export { PrivacyProse } from './privacy-prose'
export { PrivacyComplaintCallout } from './privacy-complaint-callout'
export { PrivacyContactCta } from './privacy-contact-cta'
```

## Implementation Steps
1. Create `apps/web/components/privacy/` directory
2. Write `types.ts` with all interfaces above
3. Write each of 9 component files using cancellation/* as visual reference
4. Write `index.ts` barrel
5. Verify each compiles in isolation: `npm run type-check`
6. No content/translation work in this phase — all text via props with placeholder values during dev

## Todo List
- [ ] Create directory `apps/web/components/privacy/`
- [ ] Write `types.ts`
- [ ] Write `privacy-hero.tsx`
- [ ] Write `privacy-table-of-contents.tsx` (static skeleton)
- [ ] Write `privacy-controller-card.tsx`
- [ ] Write `privacy-processing-table.tsx`
- [ ] Write `privacy-sub-processor-table.tsx`
- [ ] Write `privacy-rights-accordion.tsx`
- [ ] Write `privacy-prose.tsx`
- [ ] Write `privacy-complaint-callout.tsx`
- [ ] Write `privacy-contact-cta.tsx`
- [ ] Write `index.ts` barrel
- [ ] Run `npm run type-check` — zero errors
- [ ] Run `npm run lint` — zero new warnings

## Success Criteria
- All 10 files exist (9 components + index + types)
- Each component file <200 LOC
- TypeScript strict passes
- Lint passes
- Components render without runtime errors when imported with placeholder props

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Component split too granular → over-engineering | 9 components is design-driven (matches `/cancellation` modular pattern); if any pair tightly coupled, merge during implementation |
| Tailwind 4 syntax differences | Existing site uses Tailwind 4; reference cancellation components for current syntax |
| `<details>` accordion lacks animation | Acceptable for v1 — no client JS overhead; can enhance Phase 4 if needed |

## Security Considerations
- All href values from props — no XSS risk if values type-checked
- mailto links: properly encode subject via `encodeURIComponent()` at call site (Phase 3)
- External link to imy.se: `rel="noopener noreferrer"` mandatory

## Next Steps
- Phase 2 runs in parallel: write i18n content
- Phase 3 follows (page composition)
