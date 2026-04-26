# Phase 01 — Discovery & Bokun API Verification

**Priority:** P1 (blocks all downstream phases)
**Status:** pending
**Effort:** 1-2h

## Context Links

- Brainstorm: `../reports/brainstorm-260418-1450-per-tour-cancellation-policy.md`
- Existing Bokun integration: `scripts/import-tour-data.ts`, `packages/cms/collections/tours.ts` (`bokunExperienceId` field)

## Overview

De-risk schema lock. Before adding any CMS field, confirm Bokun's actual cancellation terms response shape and audit existing tours for policy variants that won't fit `{hoursBeforeStart, refundPercentage}`.

## Key Insights

- Scout report confirmed `bokunExperienceId` exists on Tour, but import pipeline does NOT currently fetch cancellation data. This phase adds the first read-only fetch to understand the schema.
- Assumption under test: Bokun returns cancellation policies as an array of tiers with numeric cutoff and refund %, not as pre-rendered localized strings.

## Requirements

### Functional
- Pull cancellation-policy payload for ≥3 representative Bokun experiences (one standard tour, one premium/strict, one with any unusual terms).
- Document the actual JSON structure in `reports/researcher-01-bokun-cancellation-shape.md` inside this plan dir.
- Map Bokun fields to the proposed `rules[]` schema and flag any fields that don't fit.

### Non-functional
- Read-only. No writes, no sync yet.
- Store Bokun API credentials via existing env var pattern (do not commit).

## Related Code Files

**Read:**
- `scripts/import-tour-data.ts` — existing Bokun integration entry point
- `packages/cms/collections/tours.ts` — current Tour schema
- `apps/web/.env*` (locally, not committed) — check for existing Bokun API vars

**Create:**
- `scripts/probe-bokun-cancellation.ts` — one-shot probe; logs raw response + mapped `rules[]` for a given experience ID. Delete or move to `scripts/dev/` after phase.

## Implementation Steps

1. Locate Bokun API credentials. If missing, request from user. Expected env vars: `BOKUN_API_KEY`, `BOKUN_API_SECRET`, `BOKUN_VENDOR_ID` (or similar).
2. Identify the Bokun endpoint returning cancellation terms. Likely `GET /experience.json/{id}` or `/booking.json/cancellation-policy/{id}`. Cross-check with Bokun docs (context7 / docs-seeker skill).
3. Write `scripts/probe-bokun-cancellation.ts` that:
   - Accepts a Bokun experience ID as CLI arg.
   - Fetches the experience.
   - Logs raw `cancellationPolicy` (or equivalent) field pretty-printed.
   - Attempts to map to `{hoursBeforeStart, refundPercentage}[]`.
4. Run probe against 3 experience IDs (pick from current tours in CMS — query via Payload local API or `psql`).
5. Write findings to `reports/researcher-01-bokun-cancellation-shape.md`:
   - Raw response excerpt per tour
   - Proposed mapping
   - Fields that don't fit (per-date variance, group-size rules, text-only clauses, etc.)
   - Recommendation: schema as-designed OR schema amendment needed
6. Audit CMS: query tours for any manually-noted policy exceptions. Check `description`, `notes`, existing `shortDescription` for hints like "non-refundable", "48-hour policy", etc.

## Todo List

- [ ] Locate/confirm Bokun API credentials in env
- [ ] Find correct Bokun endpoint for cancellation terms
- [ ] Write `scripts/probe-bokun-cancellation.ts`
- [ ] Run probe on 3 diverse experiences
- [ ] Query CMS for policy hints in existing tour descriptions
- [ ] Write `reports/researcher-01-bokun-cancellation-shape.md`
- [ ] Decision checkpoint: schema OK or needs amendment
- [ ] If amendment needed: update brainstorm decisions before Phase 02

## Success Criteria

- Raw Bokun cancellation payload documented.
- Mapping to `rules[]` validated or explicit amendment proposed.
- Non-standard cases enumerated (count + example per variant).
- User sign-off on final schema before Phase 02 starts.

## Risk Assessment

- **Bokun API docs outdated / endpoint unclear** → use docs-seeker skill + live probe; fall back to inspecting Bokun admin console for terminology.
- **Some tours have contract-negotiated custom terms** → escape hatch: `notes` richText field + flag `rules` as empty with `notes` populated.
- **Bokun returns localized strings not numbers** → schema becomes richText per locale, lose programmatic badge derivation. Re-brainstorm if this materializes.

## Next Steps

Proceed to Phase 02 only after schema confirmed. If shape differs substantially, pause and update brainstorm + this plan before continuing.
