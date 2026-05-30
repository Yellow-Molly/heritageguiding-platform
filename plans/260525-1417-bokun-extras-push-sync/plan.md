---
plan: bokun-extras-push-sync
title: "Bokun Extras Push Sync (CMS → Bokun) — text-only v1"
description: "Phase-2 extension of extras add-ons: automate CMS → Bokun extras text fields via PUT /experience/{id}/components. v1 syncs title/description/lifecycle only — pricing and Required flag remain Bokun-dashboard-managed (REST v2.0 doesn't expose pricing writes — confirmed Phase 01)."
status: complete
priority: P2
effort: 9-13h
completed: 2026-05-29
branch: master
created: 2026-05-25
tags: [bokun, cms, payload, sync, extras, add-ons]
blockedBy: []
blocks: []
related:
  - plans/260519-2046-bokun-extras-add-ons-checkout/   # Phase 1 — CMS mirror + webhook capture (shipped)
  - plans/260514-1437-bokun-integration/               # Existing CMS→Bokun text sync (shipped)
context:
  brainstorm: plans/reports/brainstorm-260525-1417-bokun-extras-push-sync.md
  research_initial: plans/reports/researcher-260525-1417-bokun-extras-write-api.md
  research_phase01: plans/260525-1417-bokun-extras-push-sync/research/bokun-extras-write-api-sandbox-findings.md
  research_pricing_audit: plans/reports/researcher-260529-1602-bokun-pricing-write-endpoint-exhaustive.md
---

# Bokun Extras Push Sync (CMS → Bokun)

## Summary

Today `optionalAddOns` is a **manual mirror** — operator edits both Bokun dashboard and CMS. This phase makes CMS the source of truth: on tour save, `bokun-sync-job` pushes the full extras list to Bokun via the existing `PUT /restapi/v2.0/experience/{id}/components`. Per-tour "Adopt baseline" gate prevents wiping pre-existing dashboard config on first sync.

## Locked decisions (post-Phase-01)

- **Approach A** (text-only variant): Full CMS-canonical push of EXTRAS component text fields. Bokun-side extras not in CMS → deleted.
- **Always allow CREATE** for CMS rows without `bokunExtraId`. New IDs backfilled **from PUT response directly** (Bokun returns full updated state — no GET round-trip required).
- **Single primary locale** via `BOKUN_SYNC_LOCALE` (reuse existing picker). Bokun's `ExtraDto.title` is a single string; we send primary locale only.
- **SAFEGUARD-1**: per-tour `bokunExtrasBaselineAt` flag gates inclusion of extras in sync payload.
- **PRICING + Required flag are NOT pushed** (REST v2.0 doesn't expose them — confirmed by 4-variant deep probe + OpenAPI audit). Bokun dashboard owns these.
- **`externalId` correlation works** — CMS row id maps to Bokun externalId, round-trips reliably.
- **Defer drift audit** — text-side is CMS-canonical; price-side drift remains an operator concern (mitigated via inline CMS UI hint copy).

## Constraints surfaced by Phase 01 (locked)

| Topic | Reality |
|---|---|
| Endpoint | `PUT /restapi/v2.0/experience/{id}/components` (no query param) with `{ extras: [...] }` body |
| PUT response | Full updated state (extras + new IDs) — no GET-after-PUT needed |
| `ExtraDto` allowed fields | `id, externalId, title, description, type, maxPerBooking (REQUIRED), limitByPax, photo, commissionGroupId` |
| Pricing writes | **Not exposed via REST v2.0.** Dashboard-only or XLSX bulk-import. |
| `required` flag | **Not on ExtraDto.** Dashboard-only. |
| Translations | `componentType=TRANSLATIONS` is not a valid value. v1 sends single primary locale. |
| UTF-8 charset | Existing client `Content-Type: application/json` corrupts non-ASCII. **Phase 02 must add `; charset=UTF-8`**. |
| Component-typed GETs | Required for diff endpoint in Phase 05 — `GET /components?componentType=EXTRAS`. |

## Architecture

```
CMS tour save
  └─► afterChange hook → syncTourToBokunTask
        └─► [GATE] BOKUN_EXTRAS_PUSH_ENABLED=true AND tour.bokunExtrasBaselineAt set?
              ├─ no  → push text fields only, extras omitted (existing behavior unchanged)
              └─ yes → mapper emits extras (text fields only) on the wire payload
                        └─► PUT /experience/{id}/components (existing endpoint)
                              └─► PUT response returns full extras list with new IDs
                                    └─► match new IDs by externalId (= CMS row id)
                                          └─► UPDATE tours_optional_add_ons.bokun_extra_id
                                              via direct SQL (empty ids only)
```

## Phases

| # | File | Status | Effort | Blocks |
|---|------|--------|--------|--------|
| 01 | [phase-01-bokun-sandbox-spike-verify-extras-write-api.md](./phase-01-bokun-sandbox-spike-verify-extras-write-api.md) | **complete** | 3h | 02, 04 |
| 02 | [phase-02-bokun-extras-types-and-wire-serializer.md](./phase-02-bokun-extras-types-and-wire-serializer.md) | **complete** | 1.5h | 03 |
| 03 | [phase-03-cms-addons-to-bokun-extras-mapper.md](./phase-03-cms-addons-to-bokun-extras-mapper.md) | **complete** | 1.5-2h | 04 |
| 04 | [phase-04-sync-job-extras-integration-and-id-backfill.md](./phase-04-sync-job-extras-integration-and-id-backfill.md) | **complete** | 2h | 05, 06 |
| 05 | [phase-05-adopt-baseline-admin-ui.md](./phase-05-adopt-baseline-admin-ui.md) | **complete** | 2-3h | 06 |
| 06 | [phase-06-canary-validation-and-sop-rewrite.md](./phase-06-canary-validation-and-sop-rewrite.md) | **complete** (SOP done; live canary = pre-cutover TODO) | 1h | — |

Total: ~9-13h (post-Phase-01 trim). Phase 02-04 simplified because pricing-rule serialization + GET-after-PUT are no longer needed.

## Status: code complete 2026-05-29 · reviewed + hardened 2026-05-30

Phases 01-06 shipped on master in one push session. Staging canary against a real tour is still TODO before flipping `BOKUN_EXTRAS_PUSH_ENABLED=true` in production. Sandbox canary against ephemeral tour 24003 (now deleted) verified the API contract end-to-end during Phase 01 spike.

**2026-05-30 review pass** (adversarial code review of the pending diff). Confirmed shippable; two HIGH items accepted by operator as-is (no separate staging Bokun account — deployed canary writes to prod; `maxPerBooking` fixed at 99). Applied hardening: duplicate-`bokunExtraId` rows now blocked at adopt (diff conflict bucket), adopt route 404s on unknown tour id, mapper trims title/description, stale architecture diagram corrected. Bokun suites green: web 215, cms 52.

### What landed
- `scripts/spike-bokun-extras-write-api.ts` — reusable Bokun probe harness (read / probe-externalid / probe-required / probe-pricing-deep / probe-empty)
- Types + wire serializer + UTF-8 charset fix on the HMAC client
- CMS optionalAddOns → BokunExtraInput mapper
- Sync job: `BOKUN_EXTRAS_PUSH_ENABLED` env gate + per-tour `bokunExtrasBaselineAt` gate + ID backfill from PUT response (single DB write)
- `GET /experience/{id}/components?componentType=EXTRAS` client method
- Diff helper + 2 admin API routes + sidebar Adopt-baseline panel + diff modal
- Tours schema: `bokunExtrasBaselineAt` field + ui panel field
- 13 new tests across 4 files; 491 tests total green
- SOP rewrite: docs/bokun-extras-setup.md fully replaced
- `.env.example` documents both `BOKUN_SYNC_LOCALE` and `BOKUN_EXTRAS_PUSH_ENABLED`

### TODO before prod cutover
- Recreate a sandbox tour, click through admin UI end-to-end on staging
- Flip `BOKUN_EXTRAS_PUSH_ENABLED=true` on staging → canary one real tour → confirm
- Then flip on production

## Key dependencies

- **External:** Bokun plan tier permits extras writes via PUT components (Phase 01 verifies)
- **Internal:** Existing `bokun-sync-job.ts`, `bokun-api-client-with-hmac-authentication.ts`, `serialize-bokun-wire-payload.ts`, `tour-to-bokun-experience-mapper.ts`, `optionalAddOns` schema

## Success criteria

- CMS edit on add-on row → next save → Bokun extra reflects change (verified via GET)
- New CMS row (empty `bokunExtraId`) → save → Bokun creates extra → CMS row gets ID populated
- Deleted CMS row → save → Bokun extra removed
- Tour without baseline flag → save → extras untouched (text-only sync, no surprise)
- Zero regressions on tours not yet baselined
- `docs/bokun-extras-setup.md` rewritten to reflect automated flow

## Out of scope (v1)

- **Pricing push (amount, currency, pricedPerPerson)** — Bokun REST v2.0 does not expose this. Dashboard-only.
- **`Required` flag push** — not in ExtraDto. Dashboard-only.
- **Multi-locale extras** — Bokun's ExtraDto title/description is single-string. TRANSLATIONS component not exposed for extras. v1 sends primary locale (`BOKUN_SYNC_LOCALE`, default `en`).
- **Drift audit job** — deferred; revisit if operator side-channel-edits.
- **Per-pricing-category extras** (Adult + Child split) — account doesn't use these.
- **Date/time-slot-conditional extras availability**.
- **`photo` and `commissionGroupId` fields** on ExtraDto — exposed but not modeled in CMS.
