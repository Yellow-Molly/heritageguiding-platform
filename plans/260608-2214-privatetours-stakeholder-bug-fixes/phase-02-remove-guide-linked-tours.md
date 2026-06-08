---
phase: 2
title: "Remove Guide Linked Tours"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 2: Remove Guide Linked Tours (Bug #2)

## Overview

Guide detail/profile pages currently render a "Tours by {name}" section plus a mobile sticky "Book a tour with {name}" CTA that scrolls to it. Stakeholder wants linked tours gone. Per decision, the sticky CTA is **removed** too (its only function is to jump to the now-deleted tours anchor).

## Key Insight

The linked tours are a **reverse lookup**: `getGuideBySlug` runs a *second* Payload query for `tours` where `guides` contains this guide id (`get-guide-by-slug.ts:66-83`). Removing the section lets us delete that whole query, the `tours` field on the `GuideDetail` type, two components, and three i18n keys per locale — a clean, self-contained removal with no effect on the Tours collection or tour pages.

## Related Code Files

- **Modify:** `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx`
  - Remove tours section block (lines 87-92: the `{guide.tours.length > 0 && (...)}` with `<hr>` + `<GuideToursSection>`).
  - Remove sticky CTA (line 97: `{guide.tours.length > 0 && <GuideStickyCta .../>}`).
  - Remove imports `GuideToursSection` (line 9) and `GuideStickyCta` (line 14).
- **Modify:** `apps/web/lib/api/get-guide-by-slug.ts`
  - Remove the second Payload `tours` query (lines 66-83).
  - Remove `tours: FeaturedTour[]` from the `GuideDetail` interface (line 34).
  - Remove `tours,` from the returned object (line 109).
  - Drop the now-unused `mapPayloadTourToFeaturedTour` / `FeaturedTour` import if no longer referenced in the file (verify with grep).
- **Modify:** `apps/web/components/guide/index.ts` — remove exports at lines 10 and 15.
- **Delete:** `apps/web/components/guide/guide-tours-section.tsx`
- **Delete:** `apps/web/components/guide/guide-sticky-cta.tsx`
- **Modify:** `apps/web/messages/{en,sv,de}.json` — remove `guides.toursBy`, `guides.noTours`, `guides.bookTour`.
- **Modify:** `apps/web/lib/api/__tests__/get-guide-by-slug.test.ts` — remove/replace the 4 tours-related tests (the "returns tours array", "maps tours", "calls find twice", "handles guide with no tours" cases at lines ~96-163). The remaining guide-mapping tests must still pass.

## Implementation Steps

1. Edit `guides/[slug]/page.tsx`: delete the two conditional blocks (tours section + sticky CTA) and their two imports.
2. Edit `get-guide-by-slug.ts`: delete the tours query (66-83), the `tours` interface field (34), and the `tours,` return key (109). Run grep within the file for `FeaturedTour` / `mapPayloadTourToFeaturedTour`; remove imports only if fully unused.
3. Delete `guide-tours-section.tsx` and `guide-sticky-cta.tsx`; remove their two lines from `components/guide/index.ts`.
4. Remove the 3 i18n keys from each of `en.json`, `sv.json`, `de.json`.
5. Update `get-guide-by-slug.test.ts`: drop the tours-specific tests; ensure the mock no longer expects a second `payload.find` call. Keep the guide-fields tests.
6. Grep the whole `apps/web` for `GuideToursSection`, `GuideStickyCta`, `toursBy`, `bookTour`, `#tours`, `guide.tours` — expect zero remaining references.
7. Type-check, lint, run guide test suite + any guide-page e2e.

## Success Criteria

- [ ] Guide profile pages render with no tours list and no sticky "Book a tour" button (mobile + desktop).
- [ ] `getGuideBySlug` performs a single Payload query (guide only); no `tours` on `GuideDetail`.
- [ ] Both deleted components are gone and unexported; grep finds zero references to them or the 3 removed i18n keys.
- [ ] `npm run type-check` + `npm run lint` clean; `get-guide-by-slug` tests pass with the second-query expectations removed.
- [ ] No regression on tour pages or the Tours collection (the `tours.guides` relationship is untouched).

## Risk Assessment

- **Dangling `#tours` anchor links** → grep for `#tours` to catch any other component (e.g. header/nav) linking to the removed anchor.
- **Unused-import lint errors** → after deleting the query, `FeaturedTour`/mapper imports may become unused → remove them (eslint will flag).
- **Test mock drift** → the existing test asserts "calls find twice"; that assertion must be removed or the suite fails. Update mocks to a single `find`.
- **Empty guide page feels bare** → acceptable per stakeholder (CTA removed). If conversion concern arises later, a contact CTA can be added in a follow-up (out of scope here).
