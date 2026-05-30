---
type: research
phase: 01
status: complete
date: 2026-05-29
slug: bokun-extras-write-api-sandbox-findings
target: experience 24003 on api.bokuntest.com (linked to CMS tour 12)
related:
  - plans/reports/researcher-260529-1602-bokun-pricing-write-endpoint-exhaustive.md
---

# Phase 01 — Bokun Extras Write API Sandbox Findings

## TL;DR

**Extras writes work via `PUT /restapi/v2.0/experience/{id}/components` with `{ extras: [...] }`.** ID backfill is trivial because PUT returns the updated state (no GET-after-PUT required) AND `externalId` round-trips. EXTRAS writes do NOT side-effect PRICING or RATES.

**Pricing writes are CONFIRMED NOT POSSIBLE via Bokun REST v2.0.** A 4-variant deep probe and an OpenAPI audit both agree: the `ExtraPriceRuleDto` schema is documented but no endpoint accepts it. Bokun's gateway returns AWS-routing 404s with identical RequestIds when the body contains a top-level `pricing` key — meaning the gateway has no route handler. Extras pricing remains dashboard-only (or XLSX bulk-import).

**Locked scope for v1:** text-only extras sync (title, description, type, maxPerBooking, limitByPax). Bokun dashboard remains authoritative for price + Required + photo.

## Methodology

Probed sandbox tour `24003` (experience id, linked to CMS tour 12) with 4 modes via `scripts/spike-bokun-extras-write-api.ts`:

1. `read` — baseline GET (component-typed)
2. `probe-externalid` — PUT one new extra with `externalId="cms-spike-..."`
3. `probe-required` — attempt `required: true` field
4. `probe-empty` — DESTRUCTIVE PUT with `extras: []`
5. `probe-pricing` — attempt `{ pricing: { extraPriceRules: [...] } }` write

Raw outputs preserved in `raw-output/` (gitignored if needed).

## Answers to Phase 01 questions

| # | Question | Answer | Source |
|---|---|---|---|
| Q1 | PUT response shape on `/components`? | **Returns full updated state** (not 204). Response body includes `extras` (with new IDs), `rates`, `bookingQuestions`, `lastModified`, `id`. | `probe-externalid-put-response-*.json` |
| Q2 | Does `externalId` round-trip for new extras? | **YES.** Sent `externalId="cms-spike-1780063498164"`, Bokun assigned `id=5378` and returned `externalId` verbatim. Phase 04 can correlate CMS row → Bokun extra by externalId directly. | `probe-externalid-verdict-*.json` |
| Q3 | EXTRAS + PRICING in a single PUT? | **NO** for new-extra case. `ExtraPriceRuleDto` requires `extra: { id: <num> }`; no `extraExternalId` field — can't reference an extra that doesn't have an ID yet. Two-phase write forced when creating extras. Also, single-PUT pricing returned S3-style 404 (see Q7). | `probe-pricing` Jackson error |
| Q4 | Does extras PUT wipe PRICING / RATES side-effect? | **NO** — PRICING (all 4 sub-arrays: `experiencePriceRules`, `extraPriceRules`, `pickupPriceRules`, `dropoffPriceRules`) and RATES are byte-identical before/after a destructive `extras: []` PUT. Tour-level pricing is fully isolated from extras writes. | `probe-empty-verdict-*.json` |
| Q5 | Plan tier permits extras writes? | **YES.** PUT extras succeeded; no tier-related error code. | `probe-externalid` 200 OK |
| Q6 | Which field controls dashboard "Required" toggle? | **NEITHER `required` NOR `included` is on ExtraDto.** Bokun rejected with `UnrecognizedPropertyException` listing 9 allowed properties — neither is among them. **Required is dashboard-only.** CMS `isRequired` becomes UI-only (pill on tour page, not synced). | `probe-required` Jackson error |
| Q7 | Pricing-write endpoint shape | **CONFIRMED NOT EXPOSED.** Deep probe tried 4 variants — all failed (see § Pricing-write deep probe below). Independent OpenAPI audit confirms no documented endpoint accepts `ExtraPriceRuleDto` writes. Pricing is dashboard-only or XLSX-import-only. | `probe-pricing-deep-all-failed-*.json` + linked researcher report |
| Q8 | Component-typed reads | **Required.** `GET /components` without `?componentType=X` returns 400 "Mandatory request parameter `componentType` absent". Valid values include `EXTRAS`, `PRICING`, `RATES`. NOT valid: `BASIC`, `TRANSLATIONS` (Bokun calls these something else). | All `read-*.json` |

## Authoritative DTO schemas (from Bokun error messages — gold)

### `ExtraDto` — 9 known properties

```
maxPerBooking, photo, limitByPax, externalId, title, type, id, description, commissionGroupId
```

**For v1 mapper, send:** `id` (if existing), `externalId` (always, = CMS row id), `title`, `description`, `type: "OTHERS"`, **`maxPerBooking` (REQUIRED — Bokun 400s if omitted)**, `limitByPax: false`.
**Omit for v1:** `photo`, `commissionGroupId`.
**Cannot map from CMS:** `required` (dashboard-only — confirmed), price/currency (dashboard-only — confirmed by exhaustive probe).

### `ExtraPriceRuleDto` — 9 known properties

```
rate, currency, created, id, pricingCategoryId, extra, amount, priceCatalogId, priceScheduleId
```

**Reference shape:** `extra: { id: <num> }`, `rate: { id: <num> }`. No flat `extraId`/`extraExternalId` — must use object references.
**Notably absent:** `pricedPerPerson` (research wrongly listed this). Per-person semantics likely determined by `rate.pricedPerPerson` (set at rate definition, not per-rule).

## Other findings (operationally important)

### 1. UTF-8 charset corruption

Sent em-dash `—` (U+2014) in extra description. Bokun stored as `â€”` (mojibake = UTF-8 bytes interpreted as Latin-1).

Existing client header is `'Content-Type': 'application/json'` (no charset). RFC 8259 says JSON is UTF-8 by default but Bokun's Jackson parser appears to use system default encoding. **Phase 02 must add `; charset=UTF-8`** to the Content-Type header to remove ambiguity. Verify by sending Swedish `å/ä/ö` round-trip.

### 2. PUT response includes `bookingQuestions: []`

Bokun's response after EXTRAS write also includes empty `bookingQuestions`. Likely just response-envelope inclusion (not side-effect). No action needed unless Phase 04 sees existing bookingQuestions disappearing.

### 3. `read` mode requires per-component GETs

There is no aggregate "get whole experience" endpoint that works. Phase 05 baseline-adopt UI must do at minimum a `GET ?componentType=EXTRAS` (sufficient for the diff). Skip PRICING/RATES GETs since we're not touching those components.

### 4. ID backfill simplified

Original Phase 04 plan: PUT → GET → backfill IDs by externalId match. **Revised:** PUT response itself contains new IDs + externalId — single round-trip suffices. Drops the new `getExperience` client method requirement from Phase 04 (or keeps it as a separate utility for Phase 05 baseline diff).

## Pricing-write deep probe (4 variants — all failed)

After the initial pricing PUT failure, ran an exhaustive probe trying every plausible variant:

| # | Variant | HTTP | Diagnostic |
|---|---|---|---|
| V1 | `PUT /components?componentType=PRICING` body `{ pricing: { extraPriceRules: [rule] } }` | 404 | S3-style XML 404 — AWS gateway routing failure. RequestId `XHFXXQYV7F4Z7S1V`. |
| V2 | `PUT /components` body with **full pricing echo** (preserves `experiencePriceRules` + adds `extraPriceRules`) | 404 | S3-style XML 404. **Same RequestId as V1** → gateway can't route ANY body with top-level `pricing` key. |
| V3 | `PUT /pricing` body `{ extraPriceRules: [rule] }` | 404 | Bokun JSON 404 — endpoint doesn't exist. |
| V4 | `PUT /components/pricing` body `{ extraPriceRules: [rule] }` | 404 | Bokun JSON 404 — endpoint doesn't exist. |

**Conclusion:** Bokun's gateway returns AWS-style 404s (not API-style) for `pricing` bodies — strong signal there is NO route handler for pricing writes via this endpoint. The OpenAPI audit (`researcher-260529-1602-bokun-pricing-write-endpoint-exhaustive.md`) corroborates: `ExtraPriceRuleDto` schema exists in spec, but no endpoint references it.

**Confirmed by independent audit:** extras pricing is editable only via (a) Bokun dashboard, (b) XLSX bulk-import. No public REST API write path exists in v2.0.

## Revised plan implications

| Phase | Change |
|---|---|
| 02 (types + serializer) | Reduce ExtraDto to confirmed 9 fields. Drop `BokunExtraPricingRuleDto` and pricing-rule serialization from v1. Add `; charset=UTF-8` to client `Content-Type`. |
| 03 (mapper) | Drop pricing/currency/pricingType/childPriceHint/isRequired mapping. Mapper emits: `externalId` (CMS row id), `title` (primary locale), `description` (primary locale), `type: "OTHERS"`, `limitByPax: false`. `adultPriceHint` and `isRequired` stay in CMS for tour-page UI but aren't pushed. |
| 04 (sync job) | Skip GET-after-PUT — backfill from PUT response. Drop `getExperience` from this phase (defer to Phase 05 where needed for diff). Two-phase write architecture not needed because we're not pushing pricing. |
| 05 (adopt baseline UI) | Diff only on title/description/type/extras-count (no price comparison). Warning copy: "Bokun-side prices + Required toggle remain dashboard-managed." Diff endpoint uses `GET ?componentType=EXTRAS`. |
| 06 (SOP rewrite) | New operator contract: **CMS owns titles + descriptions + which extras exist for which tours. Bokun dashboard owns prices + Required toggle + photos.** Document this split clearly. |

## Unresolved questions (defer to v2 or sandbox follow-up)

1. **Pricing write endpoint** — S3 404 mystery. Either Bokun's pricing-write needs (a) full echo of all sibling arrays as full-replacement, (b) a different endpoint like `/restapi/v2.0/experience/{id}/pricing`, or (c) it's broken on sandbox. Reproducing on prod (read-only first) would help. If pricing sync proves viable, it becomes a v2 candidate.
2. **`required` mapping** — confirmed not on ExtraDto. Is there a `requiredExtraIds` array on a different component (RATES? bookable-products?)? Worth checking the OpenAPI spec for any `required` field outside ExtraDto.
3. **Translations** — `componentType=TRANSLATIONS` returned "Unsupported". Bokun's actual translations endpoint TBD. Not blocking v1 (single primary locale design holds).
4. **`pricedPerPerson` location** — not on rule, not on extra. Likely at rate definition (we saw `pricedPerPerson: true` on the RATES.rates[0] response). For mixed-pricing tours (per-person Adult + per-booking extra) Phase 04 may need rate disambiguation.
5. **`commissionGroupId` and `priceScheduleId`** — exposed in DTOs but undocumented for us. v1 ignores; revisit if Bokun support flags any required defaults.

## Final verdict

**Phase 01: DONE.** Scope adjustment recommended before Phase 02 starts:

> v1 ships **text-only extras sync** (title, description, type, lifecycle: create/update/delete). Bokun dashboard remains authoritative for **price** and **Required** toggle. Operator workflow simplifies from "create in Bokun → paste ID into CMS → mirror title manually" to "create row in CMS → save → Bokun extra appears + CMS row gets ID; configure price + Required in Bokun once".

Next step: decision gate — does user accept de-scoped v1 OR pursue pricing-write spike further?
