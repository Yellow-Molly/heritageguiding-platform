---
plan: bokun-integration
title: "Bokun Integration v1 — Push CMS Tours to Bokun Experiences"
description: "One-way sync: CMS Tour → Bokun Experience. Extends existing inbound integration with outbound create/update via Payload afterChange hook + Jobs Queue + HMAC-SHA1."
status: in-progress
priority: P1
effort: 12-18h
branch: master
created: 2026-05-14
tags: [bokun, integration, payload, cms, sync, hmac]
blockedBy: []
blocks: []
related:
  - plans/260430-1520-bokun-go-live/  # Inbound + commercial go-live (loosely related, runs in parallel)
  - plans/mvp-implementation/phase-08.1-bokun-integration.md  # Existing inbound infrastructure (will be extended, not duplicated)
context:
  brainstorm: plans/reports/brainstormer-260514-1437-bokun-integration.md
  research: plans/reports/researcher-260514-1437-bokun-api-integration.md
---

# Bokun Integration v1 — Push CMS Tours to Bokun Experiences

## Summary

Add **outbound** Bokun integration: when a Tour is published/updated in Payload, automatically create or update the matching Experience in Bokun via REST API. Departures stay in Bokun dashboard. Booking widget already embedded on tour pages (Phase 08.1).

## Scope Boundaries

**In v1:**
- `POST /restapi/v2.0/experience` (create) and `PUT /restapi/v2.0/experience/:id` (update)
- Map: title, description, shortDescription, highlights, pricing (per_person→Adult+Child / per_group→flat), duration, meeting point, inclusions/exclusions, group sizes, difficulty, accessibility
- Payload afterChange hook + Payload Jobs Queue with retry/backoff
- Admin UI: sync status field, last-error display, manual "Sync to Bokun" button
- Sync against **production Bokun directly** (canary-tour strategy mitigates risk)
- Reuse existing `bokun-api-client-with-hmac-authentication.ts` — add methods, don't fork

**Out (deferred to v2):**
- Image upload to Bokun (manual via dashboard for v1)
- Category → Bokun tag mapping
- Departures / availability schedule sync (managed in Bokun dashboard)
- Two-way sync (booking pull-back already exists via webhook)
- Multi-vendor / supplier management
- Cancellation policy per-tour override

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Discovery & Gap Analysis](./phase-01-discovery-and-gap-analysis.md) — verify existing client, confirm import paths, validate POST /experience payload spec | 1-2h | complete (see [findings](./phase-01-findings.md)) |
| 02 | [Extend Bokun Client for Experience Write](./phase-02-extend-bokun-client-for-experience-write.md) — add createExperience/updateExperience methods + types | 2-3h | complete (11 tests passing) |
| 03 | [Tour → Experience Mapper](./phase-03-tour-to-experience-mapper.md) — pure transform + unit tests for all 3 priceType branches and 3 locales | 3-4h | complete (31 tests passing; +9 in lexical-to-bokun-html) |
| 04 | [Tour Collection Sync Fields](./phase-04-tour-schema-sync-fields.md) — add bokunSyncStatus, bokunLastSyncedAt, bokunLastError | 1h | complete (migration + flat schema) |
| 05 | [Payload Job + afterChange Hook](./phase-05-payload-jobs-task-and-after-change-hook.md) — syncTourToBokun task with exp. backoff, enqueue hook | 2-3h | complete (16 → 28 tests after review fixes: transient whitelist, 410 recovery, null-tour guard, redaction) |
| 06 | [Admin UI — Manual Sync + Status](./phase-06-admin-ui-manual-sync.md) — custom field component, retry button, error display | 2-3h | complete (panel + endpoint with origin-based CSRF guard) |
| 07 | [Canary Validation](./phase-07-canary-validation.md) — single `__TEST DO NOT BOOK__` tour, end-to-end against prod Bokun | 1-2h | not-started (manual, requires prod Bokun credentials) |

## Critical Path

```
01 (gap analysis) ──▶ 02 (client) ──▶ 03 (mapper) ──▶ 05 (job+hook) ──▶ 07 (canary)
                                       │                  │
                          04 (schema) ─┴── 06 (admin UI) ─┘
```

Phase 04 can start in parallel with 02–03. Phase 06 needs both 04 (schema fields) and 05 (job) to surface status meaningfully.

## Key Decisions (locked)

| Decision | Choice |
|---|---|
| Direction | One-way push CMS → Bokun (CMS is source of truth) |
| Trigger | Payload `afterChange` hook auto-enqueues job |
| Update strategy | CMS overwrites Bokun-side edits on every change |
| Queue | Payload Jobs Queue (built-in, DB-backed) |
| Failure handling | Exponential backoff retry (30s, 2m, 10m, 1h), then `status='failed'` + admin UI surfaces error |
| Pricing map | per_person → Adult + optional Child; per_group → single flat-rate category |
| Departures | Managed in Bokun dashboard, not synced |
| Booking UX | Existing widget (Phase 08.1) — no change |
| Environment | Production Bokun direct, with canary tour as mitigation |
| Code reuse | Extend existing `bokun-api-client-with-hmac-authentication.ts`, do not duplicate |

## Success Criteria

1. Publishing/updating a Tour in Payload creates/updates the Bokun Experience within 60s
2. `bokunExperienceId` populated on Tour after first successful create
3. Sync failures surface in admin UI with retriable error message + manual retry button
4. Unit tests cover mapper for all priceType branches and all 3 locales (sv/en/de)
5. Canary tour end-to-end validated against production Bokun, then archived
6. No regression to existing inbound flow (widget, availability, webhook)
7. Build, lint, tests all pass

## Risk Register

| Risk | Mitigation | Phase |
|------|------------|-------|
| Production-first dev creates orphan Bokun Experiences | Canary tour `__TEST DO NOT BOOK__` validates flow; manual cleanup in extranet | 07 |
| Concurrent edits with `260430-1520-bokun-go-live` security fixes touching same client | Coordinate via PR review; both plans share `bokun-api-client-with-hmac-authentication.ts` | 02 |
| HMAC signing edge cases for POST/PUT body hashing | Reuse existing signer (proven for GET/POST); add unit tests for new methods | 02 |
| Locale code mismatch (sv vs sv-SE) | Verified in Phase 01 against API response; small locale-map module | 01, 03 |
| Bokun required fields not in CMS (cancellation policy, supplier ID) | Hardcode safe defaults in client config; flag for v2 | 02 |
| per_group → flat-rate category not supported by Bokun | Phase 01 verifies; fallback divides by minGroupSize | 01, 03 |
| Editor confusion: CMS overwrites Bokun manual edits | Admin banner on Tour edit page noting CMS source of truth | 06 |
| Bokun rate limit (400/min) blocks burst sync | Existing client already handles 429; non-issue at 10-tour scale | 02 |

## Open Questions (resolve in Phase 01)

1. Exact Bokun locale codes (`sv` vs `sv-SE` vs `sv_SE`)
2. PUT vs PATCH for update; response shape on success
3. Whether Bokun accepts a flat-rate per-booking pricing category for `per_group` tours
4. Default cancellation policy / supplier ID — confirm in Bokun account settings
5. Whether `apps/web/lib/bokun/*` is importable from Payload `afterChange` hook context (Next.js runtime overlap)

## Notes

- Existing infrastructure shipped in Phase 08.1: client, types, availability cache, booking service, widget, webhook, Bookings collection, unit tests. **Reuse.**
- `bokunExperienceId` field already on Tour collection (sidebar). **Reuse.**
- This plan adds outbound only. Inbound stays as-is.
- File naming follows project convention: long descriptive kebab-case (e.g. `tour-to-bokun-experience-mapper.ts`).
