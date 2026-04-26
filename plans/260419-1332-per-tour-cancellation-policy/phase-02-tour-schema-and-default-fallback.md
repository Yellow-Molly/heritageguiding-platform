# Phase 02 — Tour Schema + Global Default Fallback

**Priority:** P1
**Status:** pending
**Effort:** 1-2h
**Depends on:** Phase 01 (schema must be confirmed before implementation)

## Context Links

- Phase 01 findings: `reports/researcher-01-bokun-cancellation-shape.md`
- Tour collection: `packages/cms/collections/tours.ts`

## Overview

Add structured `cancellationPolicy` group to Tour collection. Define resolvable global default for inquiry-only tours. No data yet — just schema + default constant.

## Key Insights

- Numbers are language-agnostic and render in any locale via i18n templates; no translation volume growth.
- Empty `rules[]` is the explicit fallback signal. Do NOT use `null` or a separate boolean flag.
- Global default lives as a TS constant (not CMS) to keep YAGNI — single platform-wide default, rarely changes, versioned in git.

## Requirements

### Functional
- New field group `cancellationPolicy` on Tour with: `rules[]`, `notes` (localized richText), `bokunSyncedAt` (read-only date).
- Global default policy constant importable from both CMS package (if needed for seeding) and web app (for rendering fallback).
- Admin UI: readable labels, helper text explaining Bokun sync overwrite behavior, visual warning if `bokunSyncedAt` stale (>30 days) — post-MVP acceptable.

### Non-functional
- Zero breaking changes to existing tours. Field optional, defaults to empty.
- No DB migration script needed (Payload handles additive field changes).

## Related Code Files

**Modify:**
- `packages/cms/collections/tours.ts` — add `cancellationPolicy` group near existing Bokun field

**Create:**
- `packages/cms/src/defaults/cancellation-policy-default.ts` (or `packages/types/src/cancellation-policy.ts` if shared) — exported constant `GLOBAL_DEFAULT_CANCELLATION_POLICY` with standard platform rules (e.g., 24h=100%, 2h=50%, <2h=0%). Include a `source: 'global-default'` discriminant so UI can label fallback tours.

**Read:**
- `packages/cms/collections/tours.ts` (current structure for field placement)
- `packages/types/` (see if a shared types package fits better than cms package)

## Architecture

```ts
// packages/cms/collections/tours.ts (appended to fields[])
{
  name: 'cancellationPolicy',
  type: 'group',
  admin: {
    description: 'Synced from Bokun. Leave rules empty to use platform default.',
    position: 'sidebar', // or main — align with existing groupings
  },
  fields: [
    {
      name: 'rules',
      type: 'array',
      minRows: 0,
      admin: { description: 'Cutoff tiers (hours before start → refund %).' },
      fields: [
        { name: 'hoursBeforeStart', type: 'number', required: true, min: 0 },
        { name: 'refundPercentage', type: 'number', required: true, min: 0, max: 100 },
      ],
    },
    {
      name: 'notes',
      type: 'richText',
      localized: true,
      required: false,
      admin: { description: 'Optional exceptions or clarifications (e.g., weather reschedule).' },
    },
    {
      name: 'bokunSyncedAt',
      type: 'date',
      admin: { readOnly: true, description: 'Last Bokun sync timestamp. Empty = never synced or manual-only.' },
    },
  ],
}
```

```ts
// packages/cms/src/defaults/cancellation-policy-default.ts
export const GLOBAL_DEFAULT_CANCELLATION_POLICY = {
  rules: [
    { hoursBeforeStart: 24, refundPercentage: 100 },
    { hoursBeforeStart: 2,  refundPercentage: 50  },
  ],
  source: 'global-default' as const,
} as const
```

## Implementation Steps

1. Review Phase 01 report; confirm schema still fits. If amended, update `Architecture` above.
2. Decide on package home for the default constant. Prefer `packages/types/` if it already exports shared types; otherwise `packages/cms/src/defaults/`.
3. Add field group to `tours.ts`.
4. Create default constant file with exported value.
5. Run `npm run build --workspace=@repo/cms` (or equivalent) — ensure types regenerate cleanly.
6. Start dev server, open Payload admin, open any tour, confirm new field group visible and editable. Save without values → should remain empty.
7. Spot-check existing tour still loads in frontend (`/tours/[slug]`) without errors (field is optional).

## Todo List

- [ ] Confirm Phase 01 schema is final
- [ ] Add `cancellationPolicy` group to `tours.ts`
- [ ] Create `GLOBAL_DEFAULT_CANCELLATION_POLICY` constant
- [ ] Regenerate CMS types, verify no TS errors
- [ ] Admin smoke test: field appears, saves, loads
- [ ] Frontend smoke test: existing tour page renders unchanged

## Success Criteria

- `cancellationPolicy` editable in Payload admin.
- Existing tours unaffected.
- Default constant importable and typed.
- No TS build errors in CMS or web packages.

## Risk Assessment

- **Payload field change causes admin UI quirk** → mitigate by positioning group after existing optional groups, not mid-required-fields.
- **Type regeneration conflicts** with `typescript.ignoreBuildErrors: true` masking errors → run `tsc --noEmit` explicitly in both packages.

## Security Considerations

- No PII. All fields are business data. No auth changes.

## Next Steps

Phase 03 populates the field via Bokun sync.
