# Phase 4: Import 3 New Guides + Refresh Photos for Existing 7

## Context Links
- Import script: `scripts/import-guide-data.ts`
- v2 helpers: `scripts/lib/guide-v2-helpers.ts`
- Input: `data/translated-guides-v3.json` (Phase 2)
- Photo map: `data/guide-photo-media-mapping.json` (Phase 3)
- CMS collection: `packages/cms/collections/guides.ts`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phases 2 + 3

Run the existing v2-aware import script with v3 input. Three new guides created from scratch; seven existing guides receive photo-only refresh via a small companion script (since `import-guide-data.ts --update` rewrites bio + relations and v3 has no bio changes for them).

## Key Insights
- **Existing import script can handle the 3 new guides** as-is — same shape as v2, just a smaller input. Use `--input=data/translated-guides-v3.json --update --status=active`.
- For the **7 existing-guide photo refreshes** (asa, svante, tommy, jack, sophie, anders, annika), running the full guide import would rewrite bio and re-derive specializations from v2 text, causing churn. **Better path**: a tiny `update-guide-photos.ts` script that only patches the `photo` field on those 7 guides using the updated mapping JSON.
- Meänkieli handling for Leo: confirmed in dry-run. If Payload's `additionalLanguages` enum lacks `meänkieli`, surface as credentials line `"Auktoriserad guide på meänkieli"` (the guides collection already supports a `credentials` array of strings).

## Requirements

### Functional

**Step A — Import 3 new guides:**
- Run `npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-data.ts --input=data/translated-guides-v3.json --dry-run` first.
- Confirm: 3 new guides, 0 errors, photo IDs resolved (no `_placeholder` for any of the 3).
- Live: drop `--dry-run`, add `--update --status=active`.
- Result: 3 new guide records, each with 3 locales (sv/en/de) and bio/specializations/credentials populated.

**Step B — Refresh photos on existing 7:**
- Create `scripts/update-guide-photos-v3.ts` (~80 lines).
- Reads `data/guide-photo-media-mapping.json`.
- For each slug in `["asa-ovrelid","svante-bergqvist","tommy-nilsson","jack-voldstad","sophie-sahlin","anders-boysen","annika-bernholm"]`:
  - `payload.find({ collection: 'guides', where: { slug: { equals: <slug> } }, limit: 1 })`
  - `payload.update({ collection: 'guides', id, data: { photo: <newMediaId> } })` (locale-agnostic — `photo` is shared field).
- Print `slug, oldPhotoId, newPhotoId` table.
- Dry-run flag.

**Defaults for new guides:**
- `email: ''`, `phone: ''`
- `operatingAreas`: derived from docx header (Anette: Stockholm + Göteborg; Leo: Stockholm + Uppsala + Sigtuna; Mats: Stockholm). Resolve city slugs to IDs; create cities if missing? — **Decision: only Stockholm exists today. For Anette/Göteborg and Leo/Uppsala+Sigtuna, fall back to Stockholm and flag in report so PO can add cities + reassign.**
- `credentials`: `[{ credential: 'Auktoriserad Stockholmsguide (FSAG)' }]` per `NEW_GUIDE_CREDENTIALS` constant in v2 helpers. For Leo, append `'Auktoriserad guide på meänkieli'` if Meänkieli not in enum.
- `yearsExperience`: leave null (PO fills later).

### Non-Functional
- Step B script ≤ 100 lines.
- No new helper module — extend or reuse existing `guide-v2-helpers.ts`.

## Architecture

### Data Flow
```
translated-guides-v3.json (3 guides)
guide-photo-media-mapping.json (15 slugs)
        │
        ├─→ import-guide-data.ts (Step A, creates 3)
        │     └─→ Payload: 3 new guides × 3 locales
        │
        └─→ update-guide-photos-v3.ts (Step B, patches 7)
              └─→ Payload: 7 photo field updates
```

### Operating Areas Resolution

```ts
// Pseudocode in guide-v2-helpers extension
const OPERATING_AREAS_MAP: Record<string, string[]> = {
  'anette-gustafsson': ['stockholm'],         // Göteborg flagged in report
  'leo-eriksson':      ['stockholm'],         // Uppsala/Sigtuna flagged
  'mats-quist':        ['stockholm'],
}
// Report: "PO action: add Cities for Göteborg, Uppsala, Sigtuna; reassign Anette + Leo."
```

## Related Code Files

### To Create
- `scripts/update-guide-photos-v3.ts`

### To Read for Context
- `scripts/import-guide-data.ts`
- `scripts/lib/guide-v2-helpers.ts`
- `packages/cms/collections/guides.ts` (verify `additionalLanguages` enum, `photo` field name)

### To Modify
- `scripts/lib/guide-v2-helpers.ts` — append v3 operating-areas constant + (optional) meänkieli credential string. Only if extension is non-trivial; otherwise inline in import-guide-data.

## Implementation Steps

1. Read `packages/cms/collections/guides.ts`; confirm `additionalLanguages` enum values + `photo` field name.
2. Decide Meänkieli path (enum vs credential); update v3 input or helpers accordingly.
3. Dry-run import: `--input=data/translated-guides-v3.json --dry-run`. Verify 3 guides + photo IDs.
4. Live import: `--input=... --update --status=active`. Confirm 3 records created.
5. Write `scripts/update-guide-photos-v3.ts`.
6. Dry-run photo updater. Verify 7 slugs found, photo IDs would change.
7. Live photo updater. Capture before/after IDs.
8. Optional: re-run `verify-guide-import.ts` (Phase 5).

## Todo List

- [ ] Confirm `additionalLanguages` enum + `photo` field in guides collection
- [ ] Decide Meänkieli path
- [ ] Dry-run guide import (Step A)
- [ ] Live guide import (Step A)
- [ ] Write `scripts/update-guide-photos-v3.ts`
- [ ] Dry-run photo updater (Step B)
- [ ] Live photo updater (Step B)
- [ ] Capture orphan media IDs for cleanup ticket

## Success Criteria

- 3 new guides exist in CMS admin (sv/en/de tabs all populated).
- 7 existing guides have updated `photo` references; bio/specs untouched.
- Total guides in CMS: 15.
- No placeholder media (id 86) referenced by any active guide.

## Risk Assessment

- **Bio churn from accidental full re-import on existing guides**: Step A only processes the 3 entries in v3 JSON; existing 12 are not in input → not touched. Step B only writes `photo` field. Confirmed safe.
- **Meänkieli enum missing**: fallback to credential string; documented above.
- **City missing for Göteborg/Uppsala/Sigtuna**: hardcoded fallback to Stockholm + report flag. PO follow-up.
- **Photo ID race if upload+import run too close**: mapping JSON commit is the source of truth; photo updater reads from disk.

## Security Considerations

- Import runs against local Payload (or staging admin) with full write access — restrict to dev/staging unless production import explicitly requested.

## Next Steps

- Phase 5 verifies on dev server + browser.
