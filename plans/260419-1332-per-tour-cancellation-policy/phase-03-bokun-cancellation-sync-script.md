# Phase 03 — Bokun Cancellation Sync Script

**Priority:** P1
**Status:** pending
**Effort:** 2h
**Depends on:** Phase 02 (schema must exist)

## Context Links

- Phase 01 shape report: `reports/researcher-01-bokun-cancellation-shape.md`
- Existing import: `scripts/import-tour-data.ts`
- Existing diff tool: `scripts/diff-tour-data-v2.ts` (patterns for Bokun field comparison)

## Overview

Populate `Tour.cancellationPolicy` from Bokun. Standalone script runnable on demand. Dry-run by default.

## Key Insights

- Prefer a **separate script** over mixing into `import-tour-data.ts`. Cancellation sync runs on different cadence than content import; single-purpose scripts are easier to reason about and safer.
- Map `bokunExperienceId` → Tour via Payload Local API, not REST. Existing scripts use this pattern.
- Bokun sync is authoritative: admin manual edits get overwritten on next run (user-confirmed in brainstorm). `bokunSyncedAt` is the visible signal.

## Requirements

### Functional
- Script takes `--dry-run` (default true), `--apply` (execute writes), `--only <slug>` (target single tour).
- For each Tour with `bokunExperienceId`:
  1. Fetch Bokun experience cancellation terms.
  2. Map to `rules[]` using logic validated in Phase 01.
  3. Compare against current CMS value; log diff.
  4. If `--apply`, write new rules + `bokunSyncedAt = now()`.
- Skip tours without `bokunExperienceId`; log count at end.
- Handle API errors per-tour (don't abort entire run).
- Exit code: 0 if all succeed, 1 if any tour failed.

### Non-functional
- Idempotent. Re-running produces zero diffs when Bokun unchanged.
- Rate-limited: respect Bokun API limits (sleep between requests; default 500ms).
- Log summary: X tours synced, Y unchanged, Z failed, W skipped-no-bokun-id.

## Related Code Files

**Create:**
- `scripts/sync-bokun-cancellation-policies.ts`
- `scripts/lib/bokun-cancellation-mapper.ts` — pure fn, unit-testable: `bokunResponse → { rules, notes? }`

**Read:**
- `scripts/import-tour-data.ts` (Payload local API bootstrap pattern)
- `scripts/probe-bokun-cancellation.ts` from Phase 01 (reuse fetch helper)

**Modify:**
- `package.json` — add `npm run sync:cancellation` script entry
- `docs/deployment-guide.md` (or create if missing) — document sync procedure

## Implementation Steps

1. Extract the probe's fetch helper from Phase 01 into `scripts/lib/bokun-api-client.ts` (reusable).
2. Write `scripts/lib/bokun-cancellation-mapper.ts` as pure function with unit tests (Vitest). Cover: standard 24h/2h case, strict no-refund case, missing-policy case (returns empty rules).
3. Write main `scripts/sync-bokun-cancellation-policies.ts`:
   - Bootstrap Payload local API.
   - Query all tours with `bokunExperienceId` set.
   - For each: fetch → map → diff → (apply or dry-run log).
   - Summary output.
4. Add `sync:cancellation` npm script.
5. Dry-run on full catalog. Inspect output.
6. Apply to 1 test tour, verify in Payload admin + frontend.
7. Full apply run.
8. Document in `docs/deployment-guide.md` (or `docs/bokun-sync.md`) including: credentials needed, cadence recommendation, rollback procedure.

## Todo List

- [ ] Extract Bokun API client helper
- [ ] Write `bokun-cancellation-mapper.ts` + unit tests
- [ ] Write `sync-bokun-cancellation-policies.ts`
- [ ] Add npm script
- [ ] Dry-run full catalog; review output
- [ ] Apply to single test tour; verify end-to-end
- [ ] Full apply run
- [ ] Document sync procedure
- [ ] Commit with clear rollback notes in message

## Success Criteria

- All Bokun-linked tours have `rules[]` populated.
- `bokunSyncedAt` timestamps set.
- Re-run produces zero diffs (idempotent).
- Mapper unit tests pass.
- Sync procedure documented.

## Risk Assessment

- **Bokun rate limits** → 500ms sleep + exponential backoff on 429. If limits unclear, start conservative.
- **Partial sync failure** → per-tour try/catch; failed tours logged with experience ID for manual retry.
- **Overwrites admin-edited policy** → expected behavior; documented in admin UI field helper text (added in Phase 02).
- **API credentials leak** → never log full secret; `.env` already gitignored. Confirm before commit.

## Security Considerations

- Secrets in env only, never committed.
- Log responses at debug level only; sanitize if logging includes IDs.
- Scripts should refuse to run without explicit `--apply` flag for any write op.

## Next Steps

Phase 04 consumes the populated data in the tour detail UI.
