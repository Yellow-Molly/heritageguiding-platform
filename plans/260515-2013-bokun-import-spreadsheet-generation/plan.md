---
plan: bokun-import-spreadsheet-generation
title: "Bokun Bulk Import — Generate Import Spreadsheet from CMS Tours"
description: "One-shot ETL: transform CMS staging tour export (tours-2026-05-15.xlsx) into Bokun's 13-sheet import format. Unblocks 'Sync to Bokun now' by populating bokunExperienceId for all 10 tours via Bokun's native bulk-import flow."
status: completed
priority: P1
effort: 4-6h
branch: master
created: 2026-05-15
tags: [bokun, import, etl, spreadsheet, exceljs]
blockedBy: []
blocks: []
related:
  - plans/260514-1437-bokun-integration/  # Outbound push: CREATE is gated; this plan unblocks UPDATE flow by seeding IDs
  - plans/260430-1520-bokun-go-live/      # Commercial onboarding — need Bokun account to actually import
context:
  source-xlsx: docx/tours-2026-05-15.xlsx
  template-xlsx: docx/Bokun-template.xlsx
  bokun-docs: https://docs.bokun.io/en/articles/118-import-experiences
---

# Bokun Bulk Import — Generate Import Spreadsheet from CMS Tours

## Problem

"Sync to Bokun now" in admin only **updates** existing Experiences (`PUT /experience/:id`). It requires `bokunExperienceId` on the Tour record. CREATE is gated behind `BOKUN_ALLOW_CREATE` (commit 460bfb0) and not enabled in prod. Result: 10 published Tours have empty `bokunExperienceId` → sync is a no-op.

## Solution

Use Bokun's native **bulk-import via spreadsheet** (one-shot, manual upload in Bokun admin) to create all 10 Experiences at once. Once imported, Bokun assigns IDs that we paste back into Payload — after which the existing outbound update sync handles all future changes.

This plan = build a Node script that reads `docx/tours-2026-05-15.xlsx` (CMS export) and emits `docx/bokun-import-2026-05-15.xlsx` matching Bokun's 13-sheet template structure.

## Scope

**In:**
- Field comparison report (CMS 73 cols × 1 sheet  ↔  Bokun 13 sheets × ~140 total cols)
- Node ETL script `scripts/generate-bokun-import.mjs` using ExcelJS (already a project dep)
- Output xlsx with 13 sheets populated per locked defaults
- Validation pass + markdown review report listing every assumed default

**Out:**
- Re-importing Swedish/German content (English-only for v1 — locked decision)
- Bulk-uploading photos (URLs referenced; Bokun fetches them from prod CMS)
- Geocoding the 5 tours with missing coords (left blank, fix in extranet)
- Writing IDs back to Payload automatically (manual paste post-import)
- Modifying the existing Bokun outbound client/mapper

## Locked Decisions (from user)

| Decision | Choice | Rationale |
|---|---|---|
| Locale | English-only | Bokun template is single-locale per row; multi-locale via Bokun admin/API later |
| Image URLs | Prefix `/api/media/file/...` with `https://privatetours.se` | Production CMS serves images publicly |
| Bokun enums | Sensible defaults + manual review flag | Bokun docs JS-rendered (couldn't fetch); user verifies in extranet after import |
| Missing coords | Leave blank | 5/10 tours; fix in Bokun extranet, not in this script |

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Field mapping & default values](./phase-01-field-mapping-and-defaults.md) — exhaustive col-by-col CMS→Bokun mapping table + defaults registry | 1-2h | complete |
| 02 | [Generator script](./phase-02-generator-script.md) — `scripts/generate-bokun-import.ts` reads source, writes 13-sheet xlsx | 2-3h | complete (5 files; runs in <5s; image URLs 10/10 verified) |
| 03 | [Validation + review report](./phase-03-validation-and-review-report.md) — completeness check, manual-review checklist | 1h | complete (see [review-report.md](./review-report.md)) |

## Critical Path

```
01 (mapping) ──▶ 02 (script) ──▶ 03 (validation report) ──▶ manual upload to Bokun
```

Linear — each phase consumes the prior. No parallelism.

## Field Comparison Summary

Bokun template = 13 sheets, normalized by `Product code` (we use slug as natural key). CMS export = 1 sheet, denormalized.

| Bokun sheet | Required for our tours? | Populated by | Notes |
|---|---|---|---|
| Products (55 cols) | Yes | All CMS tours | Main row per product. Many enum cols filled with defaults. |
| Pricing categories | Yes | All tours `per_group` → 1 "Per group" cat each | |
| Rates | Yes | 1 "Standard" rate per tour | Min/Max per booking ← minGroupSize/maxGroupSize |
| Photos | Yes | Tours with images (all 10) | Resolved to absolute URLs |
| Videos | No | none | CMS has no video field |
| Itinerary | No | none | CMS lacks structured itinerary; full description carries it |
| Meeting points | Yes | All 10 (5 with coords, 5 blank) | One row per tour |
| Start times | No | none for v1 | Operator sets in Bokun extranet |
| Opening hours | No | none for v1 | Same |
| Extras | No | none | Out of scope |
| Custom field values | No | none | Out of scope |
| Booking questions | No | none | Bokun defaults sufficient |
| Inventory service | No | none | Standalone, no IS plugin |

Result: **5 sheets populated** (Products, Pricing categories, Rates, Photos, Meeting points); **8 sheets emitted empty** (header rows only).

## Gaps Identified (CMS lacks → defaulted in script)

| Bokun field | Default value | Manual review needed? |
|---|---|---|
| Experience type | `ACTIVITY_TOUR` | Yes — verify enum value with Bokun |
| Booking type | `DATE_AND_TIME` | Yes |
| Capacity type | `PRIVATE` (all tours marked per_group + private) | Yes |
| Schedule type | `START_TIMES` | Yes — alt: `OPENING_HOURS` |
| Meeting type | `MEET_ON_LOCATION` | Yes |
| Cutoff | 24h before start | Confirm in extranet |
| Location | `Stockholm, SE` | UN/Locode TBD |
| Time zone | `Europe/Stockholm` | Locked |
| Default rate / Default pricing category | `Standard` / `Per group` | Wired from Pricing categories sheet |

## Field Mismatches (CMS field with no Bokun column)

These are not lost; documented for transparency:

| CMS field | Decision |
|---|---|
| Title/Description in SV + DE | Dropped from import; re-add via Bokun admin or future API push |
| Duration text (Swedish/English/German) | Dropped; Bokun renders duration from hours |
| Google Maps Link | Dropped; coords used instead |
| Parking Info / Public Transport Info | Merged into Meeting Instructions → Bokun `KnowBeforeYouGo` |
| Ending Point | Dropped (no Bokun equiv. on single-point tours) |
| Target Audience | Dropped (no clean Bokun mapping) — could append to Excerpt; flagged for review |
| Group Discount? / Child Price | Dropped (all tours `per_group` flat-rate; child price irrelevant) |
| Featured? / Status | Dropped; managed in Bokun extranet post-import |
| Categories slugs / Neighborhoods slugs | Joined as comma-list into Categories col + Keywords col |
| Guides (slug) | Dropped — Bokun doesn't model guides per Experience |

## Success Criteria

1. `docx/bokun-import-2026-05-15.xlsx` produced with 13 sheets, 10 product rows, exact header parity with `docx/Bokun-template.xlsx`
2. Generator is idempotent: re-running produces byte-stable output for unchanged input
3. Review report (`plans/260515-2013-bokun-import-spreadsheet-generation/review-report.md`) lists every defaulted enum + every dropped CMS field
4. Spot-check: opening generated xlsx in Excel shows 10 products, 10 pricing categories, 10 rates, ~77 photos, 10 meeting points
5. Image URL spot-check (5 sampled) returns 200 OK from `https://privatetours.se/api/media/file/...`
6. Manual upload into Bokun test account succeeds → 10 Experiences created → IDs obtained
7. Existing unit tests still pass (no production code touched in this plan)

## Risk Register

| Risk | Mitigation | Phase |
|------|------------|-------|
| Bokun enum values wrong (e.g. `ACTIVITY_TOUR` not a real value) | Review report flags every guessed enum; test-account import surfaces errors before prod | 01, 03 |
| Bokun rejects production image URLs (CDN auth, hot-link block) | Spot-check 5 URLs in validation phase; Bokun shows import errors per-row | 03 |
| Bokun import expects ISO duration format, not split weeks/days/hours/min | Template explicitly has 4 cols (W/D/H/M); we split decimal hours → integer H+M | 02 |
| Product code collisions if slug starts with number / contains chars Bokun rejects | All 10 slugs are clean kebab-case; defensive sanitize in script | 02 |
| Re-import overwrites manual Bokun edits | Single-shot import only; subsequent updates go via existing outbound sync once IDs are populated | (workflow) |
| ID write-back to Payload is manual → drift risk | Document the paste-back procedure in review report; future plan can automate | 03 |
| Multi-locale gap: SV/DE content not imported | Documented; out of scope. Followup ticket to push translations via Bokun API | (deferred) |

## Post-Plan Workflow (after script runs)

1. Generate xlsx with `node scripts/generate-bokun-import.mjs`
2. Open Bokun admin (test env) → Inventory → Import Experiences → upload xlsx
3. Resolve any per-row import errors (likely 1–2 enum corrections)
4. Once all 10 import cleanly to test, repeat against prod Bokun
5. Copy each new Experience ID from Bokun → paste into Payload Tour `bokunExperienceId` field
6. Trigger "Sync to Bokun now" on each tour → confirms outbound `PUT` works
7. Manually upload SV/DE translations in Bokun extranet (or schedule a future locale-push plan)

## Open Questions

1. Does Bokun bulk import accept duplicate `Product code` as upsert, or strict-create only? (Affects re-import strategy if a row fails.) — Confirm in Phase 03 by intentional duplicate test.
2. Is `ACTIVITY_TOUR` the correct `Experience type` enum string? Bokun docs page is JS-only; might need to inspect their template UI or contact support.
3. Does Bokun fetch photo URLs at import time (cache them) or store the URL as a reference (re-fetched on each render)? Affects whether prod image URL must stay stable forever.
4. Are `Cancellation policy` values in Rates sheet free-text or enum codes (e.g. `STANDARD`, `STRICT`)?
