# Phase 02 — Frontend Types, Mapper, Tour Detail UI, Schema.org

## Overview
- **Priority**: P0
- **Status**: pending
- **Effort**: S (1-2h)
- **Description**: Update `TourDetail.guide` (single object) → `TourDetail.guides` (array). Update mapper, tour-detail page render (vertical stack of guide cards), and schema.org `provider` (array of Person). Update i18n strings for "Your Guide" / "Your Guides" pluralization.
- **Blocked by**: Phase 01 (schema + migration must be in place locally)

## Key Insights
- The Payload `populated` shape: with `depth:2`, `doc.guides` is an array of `PayloadGuide` objects (instead of a single object on `doc.guide`).
- `GuideCard` component is already ergonomic for reuse — accepts a single guide; we just `.map()` it.
- Schema.org allows `provider` to be an array of `Person` objects, so JSON-LD output simply becomes `[{...}, {...}]`.
- next-intl supports ICU `plural` for the heading; key becomes `tourDetail.guides.title` with `{count, plural, one {Your Guide} other {Your Guides}}`.

## Requirements

### Functional
- `TourDetail` exposes `guides: GuideSummary[]` (1-N entries, never undefined for a published tour)
- Tour detail page renders one `GuideCard` per guide, stacked with consistent spacing
- Section heading uses ICU plural: `Your Guide` / `Your Guides`
- Schema.org `provider` field is `Person | Person[]` — array when >1 guide, single object when 1 guide (Schema.org allows both; choosing array for consistency)

### Non-Functional
- No layout shift between 1-guide and N-guide rendering
- Existing `space-y-10` cadence on detail page preserved (gap between guides via `space-y-4` inside the section)

## Architecture

### TourDetail type change
```ts
// BEFORE (apps/web/lib/api/get-tour-by-slug.ts:48-60)
guide?: {
  id: string
  name: string
  slug: string
  photo?: { ... }
  bio: string
  credentials?: Array<{ credential: string }>
  languages?: string[]
}

// AFTER
guides: Array<{
  id: string
  name: string
  slug: string
  photo?: { ... }
  bio: string
  credentials?: Array<{ credential: string }>
  languages?: string[]
}>
```
Make `guides` non-optional (always an array; empty allowed only at type level — runtime invariant is min 1 enforced by CMS).

## Related Code Files

### Modify
- `apps/web/lib/api/get-tour-by-slug.ts` — rename `TourDetail.guide` → `guides: GuideSummary[]`
- `apps/web/lib/api/tour-payload-mapper.ts` — `mapPayloadTourToTourDetail`: read `doc.guides` (array), map each to `GuideSummary`
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — render `tour.guides.map(g => <GuideCard key={g.id} guide={g} />)` wrapped by section heading
- `apps/web/components/tour/guide-card.tsx` — split into:
  - `GuideCardsSection` (new): renders heading + iterates list
  - `GuideCard` (existing): kept as the per-guide card body. Move section heading out of `GuideCard`.
- `apps/web/components/tour/tour-schema.tsx` — `provider` becomes array of Person; iterate `tour.guides`
- `apps/web/messages/en.json`, `sv.json`, `de.json` — `tourDetail.guide.title` → `tourDetail.guides.title` with ICU plural

### Read for Context
- `apps/web/components/tour/guide-card.tsx` (current render is heading + card)
- `apps/web/components/tour/index.ts` (export list)
- `apps/web/lib/payload-rich-text-to-plain.ts` (used elsewhere — confirm no guide-specific logic to update)

## Implementation Steps

### Step 1 — Update `TourDetail` interface (`apps/web/lib/api/get-tour-by-slug.ts`)

```ts
// Replace lines 47-60
/** Guides leading this tour (≥1, ordered as set in CMS) */
guides: Array<{
  id: string
  name: string
  slug: string
  photo?: {
    url: string
    alt: string
    blurDataUrl?: string
  }
  bio: string
  credentials?: Array<{ credential: string }>
  languages?: string[]
}>
```

### Step 2 — Update mapper (`apps/web/lib/api/tour-payload-mapper.ts`)

Replace lines 280-301 (single guide block):

```ts
// ── Guides (hasMany) ──
const rawGuides = doc.guides as Array<PayloadGuide | number> | null | undefined
const guides: TourDetail['guides'] = (rawGuides ?? [])
  .filter((g): g is PayloadGuide => typeof g !== 'number')
  .map((rawGuide) => {
    const guidePhoto = rawGuide.photo as PayloadMedia | number | null | undefined
    return {
      id: String(rawGuide.id),
      name: rawGuide.name ?? '',
      slug: rawGuide.slug ?? '',
      photo:
        guidePhoto && typeof guidePhoto !== 'number' && guidePhoto.url
          ? {
              url: (guidePhoto as PayloadMedia).sizes?.thumbnail?.url || guidePhoto.url,
              alt: guidePhoto.alt ?? rawGuide.name ?? '',
              blurDataUrl: (guidePhoto as PayloadMedia).blurDataUrl ?? undefined,
            }
          : undefined,
      bio: lexicalToPlainText(rawGuide.bio),
      credentials: rawGuide.credentials?.length ? rawGuide.credentials : undefined,
      languages: rawGuide.languages ?? [],
    }
  })
```

Update the return object: replace `guide,` with `guides,`.

### Step 3 — Refactor `GuideCard` into list + card (`apps/web/components/tour/guide-card.tsx`)

Split the current component:

```tsx
// guide-card.tsx — KEEP this as the per-guide card body
interface GuideCardProps {
  guide: NonNullable<TourDetail['guides'][number]>
}
export function GuideCard({ guide }: GuideCardProps) {
  // Existing card body (Link wrapper + avatar + info)
  // REMOVE the <h2> heading from this component
}

// guides-section.tsx — NEW server component, wraps the list with heading
import { getTranslations } from 'next-intl/server'
import { GuideCard } from './guide-card'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

export async function GuidesSection({ guides }: { guides: TourDetail['guides'] }) {
  if (guides.length === 0) return null
  const t = await getTranslations('tourDetail.guides')
  return (
    <section>
      <h2 className="font-serif text-xl font-semibold text-[var(--color-primary)] lg:text-[22px]">
        {t('title', { count: guides.length })}
      </h2>
      <div className="mt-4 space-y-4">
        {guides.map((g) => (
          <GuideCard key={g.id} guide={g} />
        ))}
      </div>
    </section>
  )
}
```

Export `GuidesSection` from `apps/web/components/tour/index.ts`.

### Step 4 — Update tour detail page (`apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`)

```tsx
// Replace line 13 import
import { GuidesSection } from '@/components/tour/guides-section'

// Replace line 82
{tour.guides.length > 0 && <GuidesSection guides={tour.guides} />}
```

### Step 5 — Update schema.org (`apps/web/components/tour/tour-schema.tsx`)

Replace lines 42-49:

```tsx
...(tour.guides.length > 0 && {
  provider: tour.guides.length === 1
    ? {
        '@type': 'Person',
        name: tour.guides[0].name,
        description: tour.guides[0].bio,
        image: tour.guides[0].photo?.url,
      }
    : tour.guides.map((g) => ({
        '@type': 'Person',
        name: g.name,
        description: g.bio,
        image: g.photo?.url,
      })),
}),
```

### Step 6 — Update i18n messages

Edit `apps/web/messages/{en,sv,de}.json` (line 635 each):

```jsonc
// Replace
"guide": {
  "title": "Your Guide",
  "speaks": "Speaks"
}
// With
"guides": {
  "title": "{count, plural, one {Your Guide} other {Your Guides}}",
  "speaks": "Speaks"
}
```

Swedish:
```jsonc
"guides": {
  "title": "{count, plural, one {Din guide} other {Dina guider}}",
  "speaks": "Talar"
}
```

German:
```jsonc
"guides": {
  "title": "{count, plural, one {Ihr Guide} other {Ihre Guides}}",
  "speaks": "Spricht"
}
```

(Note: original SV/DE values for `speaks` should be preserved verbatim from existing JSON; verify before commit.)

### Step 7 — Search & replace lingering `tour.guide` references

```bash
grep -rn "tour\.guide[^s]" apps/web --include="*.ts" --include="*.tsx"
grep -rn "tourDetail\.guide\." apps/web --include="*.ts" --include="*.tsx"
```

Each hit must be addressed (test files handled in Phase 04).

### Step 8 — Type-check

```bash
npm run type-check
```

Should pass once mapper, types, components, and consumers are aligned.

## Todo List
- [ ] Update `TourDetail` type in `get-tour-by-slug.ts` (rename to `guides`, type as array, non-optional)
- [ ] Update `mapPayloadTourToTourDetail` in `tour-payload-mapper.ts`
- [ ] Strip section heading out of `GuideCard`; keep card body only
- [ ] Create `apps/web/components/tour/guides-section.tsx` (heading + list)
- [ ] Export `GuidesSection` from `apps/web/components/tour/index.ts`
- [ ] Update tour detail page import + render call
- [ ] Update `tour-schema.tsx` — `provider` array vs single object
- [ ] Update `apps/web/messages/en.json` (`tourDetail.guides.title` ICU plural)
- [ ] Update `apps/web/messages/sv.json` (Swedish plural)
- [ ] Update `apps/web/messages/de.json` (German plural)
- [ ] Grep for `tour.guide` references (excluding tests) — handle each
- [ ] `npm run type-check` clean

## Success Criteria
- Tour with 1 guide: heading reads "Your Guide" / "Din guide" / "Ihr Guide"; one card rendered
- Tour with 3 guides: heading reads "Your Guides"; three cards stacked with `space-y-4` gap
- Schema.org JSON-LD validates in Google Rich Results Test for both 1-guide and N-guide tours
- No type errors; no console warnings for missing translation keys
- No visual regression on existing 1-guide tours (compared via screenshot before/after)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mapper receives `guide` instead of `guides` (e.g., unmigrated cached doc) | Low | Medium | Mapper defaults to `[]` and tour detail page hides section if empty |
| i18n plural key mismatch (e.g., `de.json` missing key) | Medium | Low | All 3 locales updated together; CI checks for missing keys via existing test |
| Breaks server component nesting (GuidesSection becomes async server component) | Low | Low | Pattern matches existing `GuideCard` (already async server component) |

## Security Considerations
- Guide bio/credentials already pass through `lexicalToPlainText` — no new XSS surface
- Schema.org `image` URL is user-uploaded media — already trusted via Payload media collection
- No new public field exposure; email/phone still filtered out by `get-guide-by-slug` mapper

## Next Steps
- Phase 03 (backend pipelines + raw SQL rewrite) can run in parallel after Phase 01 lands
- Phase 04 (tests + docs) runs last
