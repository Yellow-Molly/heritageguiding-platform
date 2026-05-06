# Phase 06 — Page Composition

## Context Links
- Design file: `pencils/terms-and-conditions.pen` (frame `eQJgK` desktop reference)
- Phase 02 components
- Phase 03/04/05 i18n keys
- Existing file: `apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx`

## Overview
- **Priority:** P1
- **Status:** pending (depends on Phase 02 + at least one of 03/04/05)
- **Effort:** 2-3h
- **Description:** Restructure `terms/page.tsx` to use new components and 19-section content. Match design layout for desktop / tablet / mobile. **DO NOT touch Header/Footer.**

## Layout Structure

```tsx
<>
  <WebPageSchema ... />
  <Header />                          {/* untouched */}
  <main>
    <TermsHero />                     {/* existing pattern: navy bg, serif h1, "Last updated" subtitle, gold underline */}
    <div className="container ... grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      <TocSidebar items={tocItems} /> {/* sticky on lg, horizontal grid on md, accordion on sm */}
      <article className="prose-column">
        <Section1Parties /> ...        {/* §01 Parties */}
        ...                            {/* §02-§19 in order */}
      </article>
    </div>
    <HelpBand title=... />            {/* "Need help?" footer band */}
  </main>
  <Footer />                          {/* untouched */}
</>
```

## Section Wiring Pattern (server component, repeated 19 times)

```tsx
function Section({ id, number, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]">§ {number}</p>
      <h2 className="font-serif text-3xl text-[var(--color-primary)]">{title}</h2>
      <div className="mt-4 prose prose-lg">{children}</div>
    </section>
  )
}
```

Sections 01, 07, 08, 11, 16 inject specific components per design:
- §01: `<CompanyInfoCard />` after intro
- §07: `<InlineCrossLinkCard href="/cancellation" />` after intro
- §08: `<LegalCallout title=... >...</LegalCallout>`
- §11: bulleted list with check icons (use existing `prose` ul styling + custom list-style)
- §15: `<InlineCrossLinkCard href="/privacy" />`
- §16: two-column grid of `<DisputeBodyCard />` (or simpler: two `<InlineCrossLinkCard />` for ARN + EU ODR)

## ToC Items Construction

<!-- Updated: Validation Session 1 - confirmed RSC boundary pattern -->

**RSC pattern (validation S1):** Server `page.tsx` builds `tocItems` array using `getTranslations` synchronously, then passes as plain JSON-serializable prop to `<TocSidebar>` (client component). This avoids loading the i18n bundle on the client a second time.

```tsx
// page.tsx (server component)
const t = await getTranslations({ locale, namespace: 'terms' })
const tocItems = [
  { id: 'parties', number: '01', title: t('sections.parties.title') },
  { id: 'definitions', number: '02', title: t('sections.definitions.title') },
  // ... 17 more
  { id: 'acceptance', number: '19', title: t('sections.acceptance.title') },
]

return (
  <main className="terms-page" data-last-updated={LEGAL_DATES.terms}>
    {/* ... */}
    <TocSidebar items={tocItems} />
    {/* ... */}
  </main>
)
```

**className convention (for print CSS hooks added in Phase 02):**
- `<main className="terms-page" data-last-updated="2026-05-XX">` (root)
- `<section className="terms-hero">` (hero block)
- `<TocSidebar />` renders root `<aside className="terms-toc-sidebar">`
- `<HelpBand />` renders root `<section className="terms-help-band">`
- Site header + footer have stable classes `site-header` / `site-footer` (verify in Phase 06)

## Hero Adjustments

Current hero (lines 46–51 of `terms/page.tsx`) already matches design pattern. Add gold underline beneath h1:

```tsx
<h1 className="font-serif text-4xl font-bold">{t('title')}</h1>
<div className="mx-auto mt-4 h-0.5 w-16 bg-[var(--color-secondary)]" />
<p className="mt-2 text-[var(--color-text-on-primary-muted)]">
  {t('lastUpdated')}: {LEGAL_DATES.terms}
</p>
```

## File-Size Considerations

`page.tsx` will grow with 19 section calls. To stay near 200 LOC limit:
- Extract section JSX to `apps/web/components/terms/sections/` if file exceeds 250 LOC
- Each section file: small, props-based, takes translated strings
- Alternative (preferred for KISS): keep all 19 sections inline; allow up to ~280 LOC for this single page since it's mostly declarative

Decision: **inline all 19 sections in `page.tsx`**. The file becomes the page-level layout document; refactoring per-section into separate files only adds indirection for legal copy that won't change frequently.

## LEGAL_DATES bump

```ts
// apps/web/lib/legal-dates.ts
export const LEGAL_DATES = {
  terms: '2026-05-XX',     // Phase 07 sets this
  privacy: '2026-05-XX',   // Phase 07 sets this
}
```

## Related Code Files

### Modify
- `apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx` — full rewrite of body (hero kept, footer untouched)
- `apps/web/lib/legal-dates.ts` — bump in Phase 07

### Read (no change)
- `apps/web/components/layout/header.tsx` (Header — untouched)
- `apps/web/components/layout/footer.tsx` (Footer — untouched; link to /terms already present)

## Implementation Steps

1. Open `apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx`
2. Add imports for new components from `@/components/terms` and `@/components/shared/inline-cross-link-card`
3. Build `tocItems` array from `t()` calls
4. Restructure `<main>` body: hero + grid layout (sidebar + article) + help band
5. Implement 19 sections using local `<Section>` helper (inline in same file)
6. Inject specialized components in §01, §07, §08, §11, §15, §16
7. Add `id` anchor + `scroll-mt-24` to each section for ToC links
8. Verify Header/Footer remain untouched (top + bottom of JSX)
9. `npm run build` — verify zero errors
10. `npm run dev` — visual check at /en/terms, /sv/terms, /de/terms

## Todo List

- [ ] Add component imports
- [ ] Build tocItems array
- [ ] Restructure main layout with grid
- [ ] Implement Section helper
- [ ] Wire all 19 sections
- [ ] Inject specialized components in §01, §07, §08, §11, §15, §16
- [ ] Add gold-underline to hero h1
- [ ] Switch to `text-[var(--color-text-on-primary-muted)]` for "Last updated" subtitle
- [ ] Verify Header + Footer JSX positions unchanged
- [ ] `npm run build`
- [ ] Visual check: /en/terms, /sv/terms, /de/terms
- [ ] Verify ToC scrollspy highlights correct section on scroll
- [ ] Commit: `feat(terms): compose page layout per design spec`

## Success Criteria

- All 19 sections render in correct order
- ToC sidebar sticky on desktop, accordion on mobile
- Specialized components render correctly in §01/§07/§08/§11/§15/§16
- ToC scrollspy works (active section highlights as you scroll)
- ToC anchor clicks smooth-scroll to section
- Hero gold-underline visible below h1
- Header + Footer unchanged
- DE long-compound text doesn't overflow ToC item width
- All three locales render without missing key warnings

## Risks

- File grows beyond 280 LOC → consider extracting sections after the fact if needed
- ToC scrollspy double-fires during fast scroll → use `IntersectionObserver` `threshold: 0.5` + debounced state update
- Smooth-scroll respects `prefers-reduced-motion` → use CSS `scroll-behavior: smooth` on `html` only when motion not reduced
- DE compound text overflows ToC width 240 → add `text-wrap: pretty` and/or `hyphens: auto` on ToC item title

## Next Phase

Phase 07 — final review + publish.
