# Phase 3: Update Tours in Database

## Context Links
- [import-tour-data.ts](../../scripts/import-tour-data.ts) — existing import script with `--update` mode
- [translated-tours-v2.json](../../data/translated-tours-v2.json) — Phase 2 output

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1h
- **Depends on:** Phase 2
- **Description:** Update existing 10 tours in Payload CMS using the existing `import-tour-data.ts` script with `--update` flag, pointed at v2 translated data.

## Key Insights

1. **`import-tour-data.ts` already supports `--update`**: Lines 327-348 handle existing slugs — updates all 3 locales via `payload.update()`.
2. **Minimal script changes needed**: Point the script at `translated-tours-v2.json` instead of `translated-tours.json`, or add a `--input=` flag.
3. **Status preservation**: The `--update` mode calls `buildLocaleData()` which includes `status` field. Need to ensure we don't reset status to 'draft' if tours are already published.
4. **Images unchanged**: Photo-media-mapping.json is still valid — no photo changes in v2.
5. **Parser update needed**: `import-tour-data.ts` uses `parseSemicolonList` for list fields internally but it reads from JSON (already parsed). The parsing happens in Phase 1. However, `buildLocaleData()` needs the same list format — and v2 data is already parsed in Phase 1/2.

## Requirements

### Functional
- Modify `import-tour-data.ts` to accept `--input=` flag for alternate translated JSON path
- OR create thin wrapper script `update-tour-data-v2.ts` that sets the path
- Run with `--update --status=published` to update existing tours
- Update all 3 locales (sv, en, de) for each tour
- Preserve images (photo-media-mapping still valid)
- Featured flag updates applied from pass-through data

### Non-Functional
- `--dry-run` first to verify changes
- Detailed logging: which fields updated per tour per locale
- No data loss: non-changed fields should remain intact

## Architecture

### Option A: Add `--input=` flag to existing script (preferred)
```typescript
const TRANSLATED_JSON = process.argv.find(a => a.startsWith('--input='))?.split('=')[1]
  || path.resolve(__dirname, '../data/translated-tours.json')
```

Single-line change. Then run:
```bash
npx tsx --require ./scripts/patch-next-env.cjs scripts/import-tour-data.ts \
  --update --status=published --input=data/translated-tours-v2.json
```

### Option B: Separate wrapper script
Not needed — Option A is simpler.

## Related Code Files

### Files to Modify
- `scripts/import-tour-data.ts` — add `--input=` flag (1 line change)

### Input Files
- `data/translated-tours-v2.json` (Phase 2)
- `data/photo-media-mapping.json` (unchanged from v1)

## Implementation Steps

1. Add `--input=` CLI flag to `import-tour-data.ts`
   - Default to `data/translated-tours.json` for backward compatibility

2. Dry-run test
   ```bash
   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-tour-data.ts \
     --dry-run --update --input=data/translated-tours-v2.json
   ```
   - Verify 10 tours detected, all marked for update

3. Set cache-flush env vars (REQUIRED for staging / prod runs)
   - The import script runs outside Next.js, so Payload `afterChange` hooks
     cannot invalidate the front-site `unstable_cache` tags. Instead the
     script POSTs to the deployed `/api/revalidate` endpoint after success.
   - Export before running:
     ```bash
     export REVALIDATE_URL=https://<staging-or-prod-domain>
     export REVALIDATION_SECRET=<secret>   # falls back to PAYLOAD_SECRET
     ```
   - If both are missing, the script logs a skip notice and exits cleanly,
     but the front site will keep serving stale data until a manual
     `POST /api/revalidate?tag=all&secret=…` is made.

4. Run actual update
   ```bash
   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-tour-data.ts \
     --update --status=published --input=data/translated-tours-v2.json
   ```
   - Watch for `[revalidate] OK — invalidated tags: …` near the end of the
     output. A `[revalidate] Failed` or `[revalidate] Skipped` line means
     the front-site cache was not flushed.

5. Verify in Payload admin
   - Spot-check 3-4 tours across all locales
   - Confirm titles updated (no more "Privat" prefix)
   - Confirm descriptions condensed
   - Confirm featured flags match v2

6. Verify front-site reflects changes
   - Hit the tour detail page on the target environment with a hard reload.
   - If still stale, re-run: `curl -X POST "$REVALIDATE_URL/api/revalidate?tag=all&secret=$REVALIDATION_SECRET"`

## Todo List

- [ ] Add `--input=` flag to `import-tour-data.ts`
- [ ] Dry-run with v2 data
- [ ] Export `REVALIDATE_URL` and `REVALIDATION_SECRET` for target env
- [ ] Run actual update
- [ ] Confirm `[revalidate] OK` line in script output
- [ ] Verify in Payload CMS admin
- [ ] Verify front-site pages show updated data

## Success Criteria

- All 10 tours updated in Payload CMS
- Titles reflect v2 (shorter, no "Privat" prefix)
- Descriptions condensed per v2
- Highlights in new format
- Included/NotIncluded lists updated (museum tickets added)
- Featured flags match v2 xlsx
- EN/DE translations updated for changed fields
- Unchanged EN/DE fields preserve v1 quality
- No image data lost

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Status reset to draft | Medium | Use `--status=published` explicitly |
| Overwrite good v1 translations | Low | Phase 2 merge strategy preserves unchanged |
| Missing relationships | Low | Same guides/categories/neighborhoods as v1 |
| Front site keeps serving stale data after import | Medium | Export `REVALIDATE_URL` + `REVALIDATION_SECRET`; script auto-POSTs to `/api/revalidate?tag=all` on success. Payload `afterChange` hooks don't fire here because the script runs outside a Next.js request context. |
