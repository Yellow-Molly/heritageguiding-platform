# Phase 2: Update CMS Schema

## Context Links
- Current schema: `packages/cms/collections/guides.ts` (188 lines)
- v2 data shape: `scripts/lib/guide-v2-helpers.ts` — `V2LocaleBlock` interface
- Payload type generation: `npx payload generate:types`
- API layer: `apps/web/lib/api/get-guide-by-slug.ts`

## Overview
- **Priority:** P1 (blocks Phase 3)
- **Status:** Pending
- **Effort:** 1.5h

Add 5 new localized fields to the guides CMS collection to store structured profile data that is currently merged into the single `bio` richText field. These fields enable the frontend to render each section independently with distinct styling.

## Key Insights
- Current approach: `buildV2BioMarkdown()` merges guideStyle, whatGuestsAppreciate, uniqueAspectsQuote, uniqueAspectsBody, and specialization descriptions into a single Lexical richText `bio` field. The new design needs them as separate rendered sections.
- **Additive change only** — existing `bio` field is NOT removed or altered in schema. It continues to hold the composed richText until Phase 3 import rewrites it to plain bio only.
- All new fields are `textarea` (plain text) or `text`, NOT richText. The frontend renders them with Tailwind typography — no need for Lexical complexity.
- `specializations` relationship field already exists (links to categories). The new `specialtyDescriptions` field stores the free-text bullet descriptions from DOCX (different from category names).

## Requirements

### Functional
1. Add `guideStyle` — textarea, localized (sv/en/de)
2. Add `whatGuestsAppreciate` — textarea, localized
3. Add `uniqueAspectsQuote` — text, localized (single line pull quote)
4. Add `uniqueAspectsBody` — textarea, localized (quote context paragraph)
5. Add `specialtyDescriptions` — array of text, localized (free-text bullet items)
6. Regenerate Payload TypeScript types
7. Update `GuideDetail` interface in API layer to include new fields

### Non-Functional
- Backward compatible: all new fields optional (no `required: true`)
- Existing guides with only `bio` field still render correctly
- CMS admin groups new fields under a collapsible "Profile Sections" group

## Architecture

### Field Placement in CMS Admin
```
guides collection fields:
  name, slug, status (existing)
  bio (existing richText — will contain ONLY main bio after Phase 3)
  ── Profile Sections (collapsible group) ──
    guideStyle (textarea, localized)
    whatGuestsAppreciate (textarea, localized)
    uniqueAspectsQuote (text, localized)
    uniqueAspectsBody (textarea, localized)
    specialtyDescriptions (array > text, localized)
  ── end group ──
  credentials (existing)
  photo, email, phone (existing)
  languages, additionalLanguages (existing)
  specializations, operatingAreas, yearsExperience (existing)
```

### Data Flow
```
Phase 2 adds empty fields to schema
    ↓
Phase 3 import populates them with translated content
    ↓
Phase 4 frontend reads them via API and renders separately
```

## Related Code Files
- **Modify:** `packages/cms/collections/guides.ts` — add 5 new fields in collapsible group
- **Modify:** `apps/web/lib/api/get-guide-by-slug.ts` — extend `GuideDetail` interface + mapping
- **Run:** `npx payload generate:types` — regenerate types after schema change
- **Verify:** `packages/cms/payload-types.ts` (auto-generated) — confirm new fields present

## Implementation Steps

1. Open `packages/cms/collections/guides.ts`
2. After the `bio` field (line 76), add a collapsible group `profileSections`:
   ```ts
   {
     type: 'collapsibleGroup', // Payload uses 'group' with admin.condition or 'collapsible'
     label: 'Profile Sections',
     admin: { initCollapsed: true },
     fields: [
       { name: 'guideStyle', type: 'textarea', localized: true, admin: { description: 'Guiding approach/style description' } },
       { name: 'whatGuestsAppreciate', type: 'textarea', localized: true, admin: { description: 'What guests appreciate about this guide' } },
       { name: 'uniqueAspectsQuote', type: 'text', localized: true, maxLength: 500, admin: { description: 'Pull quote from guide' } },
       { name: 'uniqueAspectsBody', type: 'textarea', localized: true, admin: { description: 'Context/body text for the pull quote' } },
       {
         name: 'specialtyDescriptions',
         type: 'array',
         label: 'Specialty Descriptions',
         maxRows: 15,
         fields: [{ name: 'description', type: 'text', localized: true, required: true, maxLength: 300 }],
       },
     ],
   }
   ```
   Note: Payload 3.x uses `type: 'collapsible'` with `label` and `fields` for collapsible UI groups. These are layout-only and don't create a nested data path — fields are stored at root level of the document.

3. Run type generation: `npx payload generate:types`
4. Update `apps/web/lib/api/get-guide-by-slug.ts`:
   - Add to `GuideDetail` interface:
     ```ts
     guideStyle?: string | null
     whatGuestsAppreciate?: string | null
     uniqueAspectsQuote?: string | null
     uniqueAspectsBody?: string | null
     specialtyDescriptions?: Array<{ description: string }>
     ```
   - Add to the return mapping in `getGuideBySlug()`:
     ```ts
     guideStyle: (doc.guideStyle as string) ?? null,
     whatGuestsAppreciate: (doc.whatGuestsAppreciate as string) ?? null,
     uniqueAspectsQuote: (doc.uniqueAspectsQuote as string) ?? null,
     uniqueAspectsBody: (doc.uniqueAspectsBody as string) ?? null,
     specialtyDescriptions: (doc.specialtyDescriptions ?? []) as Array<{ description: string }>,
     ```
5. Run `npx tsc --noEmit` from `apps/web` to verify type safety
6. Verify CMS admin UI shows new fields (start dev server, check /admin/collections/guides)

## Todo

- [ ] Add collapsible group with 5 new fields to `packages/cms/collections/guides.ts`
- [ ] Run `npx payload generate:types`
- [ ] Extend `GuideDetail` interface in `apps/web/lib/api/get-guide-by-slug.ts`
- [ ] Extend return mapping in `getGuideBySlug()` function
- [ ] Run TypeScript check (`npx tsc --noEmit`)
- [ ] Verify guides.ts stays under 200 LOC (currently 188 + ~25 new = ~213 — may need extraction)
- [ ] If over 200 LOC: extract profile-section fields into `packages/cms/collections/fields/guide-profile-fields.ts`

## Success Criteria
- `npx payload generate:types` succeeds
- `GuideDetail` interface includes all 5 new optional fields
- `npx tsc --noEmit` passes in `apps/web`
- CMS admin shows "Profile Sections" collapsible with new fields
- Existing guide records load without errors (all new fields null/empty)
- `guides.ts` stays at or under 200 LOC (extract if needed)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Payload `collapsible` type creates nested data path | Medium | Medium | Use Payload 3.x `collapsible` row type (layout-only); verify generated types have flat paths |
| guides.ts exceeds 200 LOC | High | Low | Extract profile fields to separate file; import into collection config |
| Type generation breaks other collections | Low | Low | Generated types are collection-scoped; run full tsc check |

## Security Considerations
- New fields are public read (same access as bio) — no PII
- No auth changes needed

## Rollback
- Remove the collapsible group from `guides.ts`
- Regenerate types
- Revert `get-guide-by-slug.ts` changes
- No data migration needed (fields were never populated)

## Next Steps
- Phase 3 uses these new fields to store structured data during import
