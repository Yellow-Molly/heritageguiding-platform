# Phase 03 — Page Composition

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: Phase 1 (components) + Phase 2 (i18n keys)
- Reference page: `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx`

## Overview
- **Priority:** High
- **Status:** Pending
- **Effort:** ~2-3h
- Restructure `privacy/page.tsx` to compose 9 new components, fetch all translations server-side, pass typed props.

## Key Insights
- All translation fetching happens at page level via `getTranslations({ locale, namespace: 'privacy' })`. Components stay dumb.
- Layout: `<Header variant="solid" />` → 9 sections → `<Footer />`. Match cancellation page wrapping pattern.
- Desktop layout: hero (full-bleed) → body grid `lg:grid-cols-[260px_1fr]` (TOC sidebar + content) → complaint callout → contact CTA.
- Mobile: hero → sticky TOC pill → body single column → callout → CTA.

## Requirements
- Page renders all 14 sections from i18n at all 3 locales
- All 9 components receive typed props from translations
- Layout matches Option A design at all 3 breakpoints
- Use existing `generatePageMetadata`, `WebPageSchema`, `LEGAL_DATES.privacy`, `CONTACT_EMAIL`

## Architecture

### Page Structure
```tsx
// apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx
export default async function PrivacyPage({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  // Build typed prop objects from t() calls
  const heroProps = {
    breadcrumb: [
      { label: t('hero.breadcrumbHome'), href: '/' },
      { label: t('hero.breadcrumbCurrent') },
    ],
    title: t('hero.title'),
    subtitle: t('hero.subtitle'),
    updatedChip: { label: t('hero.updatedLabel'), date: LEGAL_DATES.privacy },
  }

  const tocItems = TOC_KEYS.map((k, i) => ({
    id: k,
    numeral: String(i + 1).padStart(2, '0'),
    label: t(`toc.items.${k}`),
  }))

  const controllerProps = {
    heading: t('controller.heading'),
    controllerLabel: t('controller.controllerLabel'),
    contactLabel: t('controller.contactLabel'),
    controller: {
      legalName: t('controller.legalName'),
      orgNumber: t('controller.orgNumber'),
      address: t.raw('controller.address'),
      email: CONTACT_EMAIL,
    },
  }

  const processingRows = t.raw('purposes.rows') as ProcessingRow[]
  const subProcessorRows = t.raw('subProcessors.rows') as SubProcessorRow[]
  const rightsItems = t.raw('rights.items') as RightItem[]
  const proseSections = buildProseSections(t)

  return (
    <>
      <WebPageSchema name={t('meta.title')} description={t('meta.description')} url={`${baseUrl}/${locale}/privacy`} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <PrivacyHero {...heroProps} />
        <div className="container mx-auto px-4 py-16 lg:px-8 lg:py-20 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
          <PrivacyTableOfContents items={tocItems} title={t('toc.title')} closeLabel={t('toc.closeLabel')} />
          <div className="space-y-16">
            <PrivacyControllerCard {...controllerProps} id="controller" />
            <PrivacyProse sections={proseSections.before} />
            <PrivacyProcessingTable
              caption={t('purposes.caption')}
              columnHeaders={t.raw('purposes.columnHeaders')}
              rows={processingRows}
              id="purposes"
            />
            <PrivacySubProcessorTable
              caption={t('subProcessors.caption')}
              columnHeaders={t.raw('subProcessors.columnHeaders')}
              rows={subProcessorRows}
              id="subProcessors"
            />
            <PrivacyProse sections={proseSections.middle} />
            <PrivacyRightsAccordion
              heading={t('rights.heading')}
              items={rightsItems}
              slaCallout={t('rights.slaCallout')}
              contactEmail={CONTACT_EMAIL}
              id="rights"
            />
            <PrivacyProse sections={proseSections.after} />
          </div>
        </div>
        <PrivacyComplaintCallout
          heading={t('complaint.heading')}
          body={t('complaint.body')}
          primaryCta={{
            label: t('complaint.primaryCtaLabel'),
            mailto: `mailto:${CONTACT_EMAIL}`,
          }}
          secondaryCta={{
            label: t('complaint.secondaryCtaLabel'),
            href: 'https://www.imy.se',
            ariaLabel: t('complaint.secondaryCtaAriaLabel'),
          }}
          id="complaint"
        />
        <PrivacyContactCta
          heading={t('contactCta.heading')}
          email={CONTACT_EMAIL}
          emailDisplay={t('contactCta.emailDisplay')}
          responseSla={t('contactCta.responseSla')}
        />
      </main>
      <Footer />
    </>
  )
}
```

### Helper Constants

```ts
const TOC_KEYS = [
  'controller', 'scope', 'dataCollected', 'purposes', 'subProcessors',
  'transfers', 'retention', 'rights', 'complaint', 'cookies',
  'children', 'automated', 'security', 'changes',
] as const

function buildProseSections(t: ReturnType<typeof getTranslations>) {
  return {
    before: [
      { id: 'scope', heading: t('scope.heading'), paragraphs: t.raw('scope.paragraphs') },
      { id: 'dataCollected', heading: t('dataCollected.heading'), intro: t('dataCollected.intro'), bullets: t.raw('dataCollected.bullets') },
    ],
    middle: [
      { id: 'transfers', heading: t('transfers.heading'), paragraphs: t.raw('transfers.paragraphs') },
      { id: 'retention', heading: t('retention.heading'), intro: t('retention.intro'), bullets: t.raw('retention.bullets') },
    ],
    after: [
      { id: 'cookies', heading: t('cookies.heading'), intro: t('cookies.intro'), bullets: t.raw('cookies.bullets'), paragraphs: [t('cookies.trailing')] },
      { id: 'children', heading: t('children.heading'), paragraphs: [t('children.body')] },
      { id: 'automated', heading: t('automated.heading'), paragraphs: [t('automated.body')] },
      { id: 'security', heading: t('security.heading'), paragraphs: [t('security.body')] },
      { id: 'changes', heading: t('changes.heading'), paragraphs: [t('changes.body')] },
    ],
  }
}
```

### Section Anchor IDs (for TOC scroll-spy)
- `#controller`
- `#scope`
- `#dataCollected`
- `#purposes`
- `#subProcessors`
- `#transfers`
- `#retention`
- `#rights`
- `#complaint`
- `#cookies`
- `#children`
- `#automated`
- `#security`
- `#changes`

## Implementation Steps
1. Read existing `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx` for current pattern
2. Replace entire body with new composition above
3. Remove all inline JSX prose (it now lives in components + i18n)
4. Add `id` prop support to applicable components (Phase 1 components must accept optional `id?: string`)
5. Verify metadata still uses `generatePageMetadata` correctly
6. Verify `<Header variant="solid" />` matches cancellation page convention
7. Run `npm run dev` and visit `/sv/privacy`, `/en/privacy`, `/de/privacy`
8. Inspect with browser DevTools at 1440 / 768 / 375

## Todo List
- [ ] Restructure `privacy/page.tsx` body to compose 9 components
- [ ] Add `TOC_KEYS` + `buildProseSections` helpers
- [ ] Pass typed props from `t.raw()` for arrays/objects
- [ ] Add anchor IDs to all section components (extend Phase 1 types if needed)
- [ ] Verify SSR works (no client-side errors in console)
- [ ] Visual check at all 3 breakpoints in browser
- [ ] Run `npm run type-check` + `npm run lint` — clean

## Success Criteria
- `/{sv,en,de}/privacy` route renders without runtime errors
- All 14 sections present with correct anchor IDs
- Mobile + tablet + desktop layouts match Option A design
- Header solid variant active (not transparent overlay)
- Metadata + WebPageSchema correct per locale

## Risk Assessment
| Risk | Mitigation |
|---|---|
| `t.raw()` returns wrong type | Cast with `as` after fetching, validate with one runtime sample log during dev |
| Container alignment between hero (full-bleed) and body (constrained) | Use `<section>` with explicit `w-full` for hero; body uses `container mx-auto` |
| TOC desktop sticky breaks if header height changes | Use `lg:top-[calc(var(--header-height)+1rem)]` instead of hardcoded `top-24` |
| Complaint callout + Contact CTA bleed below container | Render outside container as full-bleed bands (matches design) |

## Security Considerations
- IMY external link: `target="_blank" rel="noopener noreferrer"` — handled in PrivacyComplaintCallout
- Mailto with subject: encode subject via `encodeURIComponent` at component level
- No user input rendered — all content from i18n keys (controlled)

## Next Steps
- Phase 4 adds interactive behavior (TOC scroll-spy, mobile drawer)
