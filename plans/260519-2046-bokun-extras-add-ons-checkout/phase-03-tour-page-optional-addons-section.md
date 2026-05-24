---
phase: 03
title: "Tour Page — Optional Add-ons Section UI"
status: complete
priority: P1
effort: 2-3h
blockedBy: [02]
completed: 2026-05-24
---

# Phase 03 — Tour Page Optional Add-ons Section

## Context Links

- Existing inclusion section: `apps/web/components/tour/inclusions-section.tsx`
- Tour page composition: `apps/web/app/(site)/[locale]/tours/[slug]/page.tsx` (or wherever sections are stitched)
- Tour API loader: `apps/web/lib/api/get-tour-by-slug.ts`
- i18n message files: `apps/web/messages/{sv,en,de}.json`
- Branding tokens used elsewhere: `[var(--color-primary)]`, `[var(--color-accent)]`, etc.

## Overview

**Priority:** P1
**Status:** complete (2026-05-24) — section renders between InclusionsSection and LogisticsSection; 10/10 unit tests passing; user verified admin UI + tour page

New "Optional Add-ons" section between `InclusionsSection` and any subsequent sections (or right above `InclusionsSection` if it reads better in design review). Each row: title, description, price hint, required/optional pill. Section hidden when `optionalAddOns` is empty so existing tours show zero new UI.

## Key Insights

- This is a **read-only marketing section** — no client interactivity. Server component, no `'use client'`.
- Bokun widget already lives in `BookingSection` — section purely informs customer *before* they reach checkout
- Sorted by `displayOrder` asc, then array order
- Skip rows missing `bokunExtraId`? **No** — show them with a subtle "coming soon" badge, OR filter in the loader. **v1 decision:** filter out unwired rows in the API loader so the public never sees half-configured items
- Price hint copy localized: `from {price} {currency} per person` / `{price} {currency} per booking`

## Requirements

**Functional:**
- Render section iff at least one wired add-on exists
- Show title, description (if present), price hint, required pill
- Required badge visually distinct (amber) from optional badge (slate)
- Locale-correct currency formatting (reuse `formatPrice` util)

**Non-functional:**
- Zero CLS regression on tours without add-ons
- No layout shift between locales (badges flexbox, multi-line OK)

## Architecture

### API loader update

`apps/web/lib/api/get-tour-by-slug.ts`:
- Include `optionalAddOns` in the fields fetched
- Filter rows where `bokunExtraId` is empty or missing
- Sort by `displayOrder` asc
- Return as `TourDetail.optionalAddOns: OptionalAddOn[]`

### Component

`apps/web/components/tour/optional-add-ons-section.tsx` — server component, mirrors `inclusions-section.tsx` style:

```tsx
interface OptionalAddOn {
  id: string
  name: string
  description?: string
  pricingType: 'perPerson' | 'perBooking'
  adultPriceHint: number
  currency: string
  isRequired: boolean
}

export async function OptionalAddOnsSection({ tour }: { tour: TourDetail }) {
  const t = await getTranslations('tourDetail.optionalAddOns')
  if (!tour.optionalAddOns?.length) return null

  return (
    <section>
      <h2 className="font-serif ...">{t('title')}</h2>
      <p className="text-sm text-[var(--color-text-muted)]">{t('subtitle')}</p>
      <ul className="mt-4 space-y-3">
        {tour.optionalAddOns.map((a) => (
          <li key={a.id} className="rounded-lg border border-[var(--color-border)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{a.name}</h3>
                {a.description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.description}</p>}
              </div>
              <span className={a.isRequired ? 'pill-amber' : 'pill-slate'}>
                {t(a.isRequired ? 'pillRequired' : 'pillOptional')}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text)]">
              {t(a.pricingType === 'perPerson' ? 'priceHintPerPerson' : 'priceHintPerBooking',
                 { price: formatPrice(a.adultPriceHint), currency: a.currency })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

### Tour page composition

Insert `<OptionalAddOnsSection tour={tour} />` after `<InclusionsSection tour={tour} />` (or wherever design review lands — confirm during implementation).

### i18n messages

`apps/web/messages/en.json` (mirror for sv + de):
```json
"tourDetail": {
  "optionalAddOns": {
    "title": "Optional Add-ons",
    "subtitle": "Available to purchase during checkout.",
    "pillRequired": "Required — added at checkout",
    "pillOptional": "Optional — add at checkout",
    "priceHintPerPerson": "from {price} {currency} per person",
    "priceHintPerBooking": "{price} {currency} per booking"
  }
}
```

## Related Code Files

**Create:**
- `apps/web/components/tour/optional-add-ons-section.tsx`
- `apps/web/components/tour/__tests__/optional-add-ons-section.test.tsx`

**Modify:**
- `apps/web/lib/api/get-tour-by-slug.ts` — fetch + filter + sort `optionalAddOns`
- Tour detail page (likely `apps/web/app/(site)/[locale]/tours/[slug]/page.tsx`) — insert new section
- `apps/web/messages/en.json`, `sv.json`, `de.json` — add `tourDetail.optionalAddOns.*` keys

## Implementation Steps

1. Update `get-tour-by-slug.ts`: include `optionalAddOns` in select, filter empty `bokunExtraId`, sort by `displayOrder`, export `OptionalAddOn` type on `TourDetail`
2. Add i18n keys to all three locale files
3. Create `optional-add-ons-section.tsx` server component
4. Insert into tour detail page after `InclusionsSection`
5. Write unit test: section renders nothing when array empty; renders all rows; required vs optional pill; price hint format per type
6. Manual QA: open one tour with 2 add-ons in sv/en/de, verify copy, badges, no layout shift
7. Manual QA: open one tour without add-ons, verify no section renders
8. Typecheck + lint green

## Todo List

- [x] Loader fetches + filters + sorts add-ons (filter empty `bokunExtraId`, sort by `displayOrder` asc with ties by CMS authoring order)
- [x] i18n keys added (sv/en/de)
- [x] Component created (`optional-add-ons-section.tsx`)
- [x] Inserted into tour detail page (between Inclusions and Logistics)
- [x] Unit test passes (10/10)
- [x] Manual QA in 3 locales (user verified)
- [x] Manual QA on tour without add-ons (no regression)
- [x] Typecheck green

**Iteration during Phase 03:**
- [x] Renamed section title `"Optional Add-ons"` → `"Add-ons"` (some rows are Required for some tours)
- [x] Per-row Required/Optional pills retained (amber/slate)

## Success Criteria

- Tour with add-ons shows new section with rows, badges, price hints — in all 3 locales
- Tour without add-ons shows zero new UI (DOM diff = 0)
- Unwired add-on rows (empty `bokunExtraId`) never reach the page
- Price hint copy reads naturally per locale

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Operator forgets to paste `bokunExtraId` → row hidden silently | Phase 02 admin warning row makes empty IDs visible inside CMS. Phase 06 SOP reinforces. |
| Price hint diverges from Bokun price | Subtitle copy makes "final price at checkout" implicit. Could add explicit disclaimer if QA flags confusion. |
| Mobile layout cramped with long add-on names | Use `flex-wrap` on title/pill row; cap name at maxLength 100 already |

## Security Considerations

- No auth surface; public read
- `description` rendered as plain text (no HTML) — safe from injection

## Next Steps

- This phase has no downstream blockers; ship independently as soon as Phase 02 lands
- Designer review optional before merge (not blocking)

## Unresolved Questions

- Should `description` support light markup (bold/italic) in v1? **Default: no** (textarea, plain text). Add later if requested.
- Should section live above or below `InclusionsSection`? Confirm with designer; defaulting to **below** for v1.
