# Phase 01 — Field Mapping & Defaults

**Status:** not-started
**Effort:** 1-2h
**Depends on:** none

## Goal

Lock the exact column-by-column mapping from CMS staging export (`docx/tours-2026-05-15.xlsx`, single sheet, 73 cols) → Bokun import template (`docx/Bokun-template.xlsx`, 13 sheets, ~140 cols total). Define every default value used to fill Bokun-required-but-CMS-missing fields. This is a paper-only phase; no code changes.

## Inputs

- `docx/tours-2026-05-15.xlsx` (10 published tours)
- `docx/Bokun-template.xlsx` (header rows only; no example data)
- Locked decisions from `plan.md` (English-only, prod image prefix, default enums, blank coords)

## Output

Update this file in-place with finalized tables. Phase 02 consumes them as the script's data spec.

---

## Sheet 1 — Products (55 cols)

One row per tour. Bokun unique key = `Product code` (= CMS slug). `ID` left blank → Bokun assigns on import.

| # | Bokun col | Source (CMS col or default) | Transform |
|---|---|---|---|
| 1 | ID | (blank) | Bokun assigns |
| 2 | Product code | col 1 Slug (URL) | identity; sanity-check kebab-case |
| 3 | Title | col 3 Title (English) | trim |
| 4 | Experience type | default `ACTIVITY_TOUR` | flag for review |
| 5 | Booking type | default `DATE_AND_TIME` | flag for review |
| 6 | Capacity type | default `PRIVATE` (all tours are per_group private) | flag for review |
| 7 | Schedule type | default `START_TIMES` | flag for review |
| 8 | Pass expiry type | (blank) | not a pass product |
| 9 | Pass capacity | (blank) | — |
| 10 | Fixed pass expiry date | (blank) | — |
| 11 | Pass valid for days | (blank) | — |
| 12 | Meeting type | default `MEET_ON_LOCATION` | flag for review |
| 13 | Categories | col 65 Categories (slugs) | replace `;` → `,` (Bokun comma-list assumed) |
| 14 | Attributes | (blank) | none |
| 15 | Accessibility types | derive from cols 57/61/62/63 | comma-list; e.g. `WHEELCHAIR_ACCESSIBLE,SERVICE_ANIMALS` |
| 16 | Guidances | (blank) | — |
| 17 | Difficulty level | col 53 Difficulty Level | `easy`→`EASY`, `moderate`→`MODERATE`, `challenging`→`CHALLENGING` (reuse mapper convention) |
| 18 | Minimum age | col 54 Minimum Age | integer |
| 19 | Duration weeks | 0 | — |
| 20 | Duration days | 0 | — |
| 21 | Duration hours | floor(col 19 Duration Hours) | integer |
| 22 | Duration minutes | (col 19 % 1) × 60, rounded | integer |
| 23 | Cutoff weeks | 0 | — |
| 24 | Cutoff days | 1 | 24h cutoff default |
| 25 | Cutoff hours | 0 | — |
| 26 | Cutoff minutes | 0 | — |
| 27 | Cutoff type | default `BEFORE_START` | flag for review |
| 28 | Cutoff reference hour | (blank) | — |
| 29 | Cutoff reference minute | (blank) | — |
| 30 | Excerpt | col 6 Short Description (English) | trim |
| 31 | Description | col 9 Full Description (English) | trim; preserve line breaks |
| 32 | Keywords | col 66 Neighborhoods (slugs) | replace `;` → `,` |
| 33 | Flags | (blank) | `FEATURED` flag dropped; managed in Bokun |
| 34 | Included | col 44 Included (English) | replace `;` → `\n` (newline list) |
| 35 | Excluded | col 47 Not Included (English) | replace `;` → `\n` |
| 36 | Inclusions | (blank) | duplicate of 34; use Included only |
| 37 | Exclusions | (blank) | duplicate of 35; use Excluded only |
| 38 | KnowBeforeYouGo | concat cols 32 Meeting Instructions (EN) + col 38 Parking Info (EN) + col 41 Public Transport (EN) | join with `\n\n` |
| 39 | Requirements | col 50 What to Bring (English) | replace `;` → `\n` |
| 40 | Attention | (blank) | — |
| 41 | Ticket per person | `false` (all 10 tours are per_group) | bool |
| 42 | Private experience | `true` | bool |
| 43 | Request deadline weeks | (blank) | DATE_AND_TIME, not on-request |
| 44 | Request deadline days | (blank) | — |
| 45 | Request deadline hours | (blank) | — |
| 46 | Request deadline minutes | (blank) | — |
| 47 | Allow custom bookings | `false` | — |
| 48 | Custom pickup allowed | `false` | — |
| 49 | Pickup minutes before | (blank) | — |
| 50 | Dropoff service | (blank) | — |
| 51 | Custom dropoff allowed | `false` | — |
| 52 | Location | `Stockholm, SE` | TBD: confirm Bokun Location format (place name vs ID) |
| 53 | Default rate | `Standard` | matches Rates sheet Title |
| 54 | Default pricing category | `Per group` | matches Pricing categories sheet Title |
| 55 | Time zone | `Europe/Stockholm` | IANA tz |

## Sheet 2 — Pricing categories (4 cols)

One row per (tour × pricing category). All tours `per_group` → 1 row each.

| # | Bokun col | Source | Transform |
|---|---|---|---|
| 1 | Product ID | (blank) | — |
| 2 | Product code | col 1 Slug | — |
| 3 | Title | `Per group` | constant |
| 4 | Ticket category | `ADULT` | TBD: confirm enum (Bokun has Adult/Child/Infant/Other; for per-group flat-rate, "Adult" is typical placeholder) |

## Sheet 3 — Rates (15 cols)

One row per (tour × rate plan). 1 rate "Standard" per tour.

| # | Bokun col | Source | Transform |
|---|---|---|---|
| 1 | Product ID | (blank) | — |
| 2 | Product code | col 1 Slug | — |
| 3 | Code | `STANDARD` | constant |
| 4 | Title | `Standard` | constant |
| 5 | Description | (blank) | — |
| 6 | Min per booking | col 71 Min Group Size | integer; fallback 1 |
| 7 | Max per booking | col 70 Max Group Size | integer; fallback 12 |
| 8 | Priced per person | `false` | all tours per_group |
| 9 | Pickup selection type | `NONE` | flag for review |
| 10 | Pickup pricing type | (blank) | — |
| 11 | Pickup priced per person | `false` | — |
| 12 | Dropoff selection type | `NONE` | flag for review |
| 13 | Dropoff pricing type | (blank) | — |
| 14 | Dropoff priced per person | `false` | — |
| 15 | Cancellation policy | `STANDARD` | TBD: confirm enum; alt `STRICT`, `FLEXIBLE` |

**Note:** Price *amount* lives in pricing-category vs rate join — Bokun template doesn't have a price column in Rates sheet. Need to verify: does Bokun bulk-import accept the price as a separate column we missed, or is price entered only via Bokun UI post-import? **Open question for Phase 03 test-import.**

## Sheet 4 — Photos (5 cols)

One row per (tour × image). 10 tours × avg 7-8 images ≈ 77 rows total.

| # | Bokun col | Source | Transform |
|---|---|---|---|
| 1 | Product ID | (blank) | — |
| 2 | Product code | col 1 Slug | — |
| 3 | Photo code | `${slug}-${index}` (1-based) | unique per row |
| 4 | Photo URL | col 67 Images, split on `;` | for each path: `https://privatetours.se` + path verbatim |
| 5 | Photo description | (blank) | CMS has no per-image caption |

## Sheet 5 — Videos (4 cols)

Empty (header only). CMS has no video field.

## Sheet 6 — Itinerary (13 cols)

Empty (header only). CMS lacks structured day-by-day itinerary; full description carries flow.

## Sheet 7 — Meeting points (15 cols)

One row per tour. 5/10 have coords; 5/10 leave lat/lng blank.

| # | Bokun col | Source | Transform |
|---|---|---|---|
| 1 | Product ID | (blank) | — |
| 2 | Product code | col 1 Slug | — |
| 3 | Title | col 24 Meeting Point Name (English) | trim |
| 4 | Address line 1 | col 27 Meeting Point Address (English) | trim |
| 5 | Address line 2 | (blank) | — |
| 6 | Address line 3 | (blank) | — |
| 7 | City | `Stockholm` (default for 9/10); `Uppsala` for `private-uppsala-day-tour-from-stockholm` | per-slug override map |
| 8 | Country code | `SE` | constant |
| 9 | State | (blank) | — |
| 10 | Postal code | (blank) | — |
| 11 | Latitude | col 29 Coordinates split on `,`, first part | float; blank if col empty |
| 12 | Longitude | col 29 split, second part | float; blank if col empty |
| 13 | Zoom level | `13` | constant; sensible city-block default |
| 14 | UN/Locode country | (blank) | — |
| 15 | UN/Locode city | (blank) | — |

## Sheet 8 — Start times (16 cols)

Empty (header only). Operator configures in Bokun extranet.

## Sheet 9 — Opening hours (9 cols)

Empty (header only).

## Sheet 10 — Extras (8 cols)

Empty (header only).

## Sheet 11 — Custom field values (4 cols)

Empty (header only).

## Sheet 12 — Booking questions (10 cols)

Empty (header only); Bokun's default questions (name, email, phone, etc.) sufficient.

## Sheet 13 — Inventory service (6 cols)

Empty (header only).

---

## Defaults Registry (flagged for manual review)

This table is the source of truth for the Phase 03 review report. Every value here must appear in the post-import manual verification checklist.

| Bokun field | Default | Verification path |
|---|---|---|
| Experience type | `ACTIVITY_TOUR` | Bokun admin → Product → General → Type matches |
| Booking type | `DATE_AND_TIME` | Product → Booking → Type |
| Capacity type | `PRIVATE` | Product → Capacity |
| Schedule type | `START_TIMES` | Product → Schedule |
| Meeting type | `MEET_ON_LOCATION` | Product → Meeting & pickup |
| Cutoff | 1 day BEFORE_START | Product → Booking → Cutoff |
| Pickup/Dropoff selection | `NONE` | Product → Pickup |
| Cancellation policy | `STANDARD` | Product → Policies |
| Pricing category title | `Per group` | Product → Rates & pricing |
| Ticket category | `ADULT` (per-group placeholder) | Product → Rates & pricing |
| Location | `Stockholm, SE` | Product → Location |
| Time zone | `Europe/Stockholm` | Product → Time zone |
| Default rate | `Standard` | Product → Default rate |
| Zoom level (meeting point) | `13` | Map view |

## Dropped CMS Fields (no Bokun column / out of scope)

Documented for transparency — these data points exist in CMS but won't survive the import.

| CMS col | Reason |
|---|---|
| 2 Title (Swedish), 4 Title (German) | Multi-locale out of scope — English-only import |
| 5 Short Desc (SV), 7 Short Desc (DE) | Same |
| 8 Full Desc (SV), 10 Full Desc (DE) | Same |
| 11 Highlights (SV/EN/DE) | No Bokun column in import template; appears in Bokun API (`highlights` array) but not in xlsx — flag for follow-up to push via API or paste into Description |
| 20/21/22 Duration text | Bokun renders from h/m |
| 23/25/26/28 Meeting point name/address SV+DE | Multi-locale out of scope |
| 30 Google Maps Link | Coords used instead |
| 31/33 Meeting Instructions SV/DE, 37/39 Parking SV/DE, 40/42 Public Transport SV/DE | Multi-locale |
| 34/35/36 Ending Point | No Bokun equivalent for non-A-to-B tours |
| 43/45 Included SV/DE, 46/48 Not Included SV/DE, 49/51 What to Bring SV/DE | Multi-locale |
| 52 Target Audience | No Bokun equivalent; could append to Excerpt (flagged) |
| 17 Group Discount | Single-rate per_group; no discount tier in v1 |
| 18 Child Price | All `per_group`; child price irrelevant |
| 55 Child Friendly?, 56 Teen Friendly? | No Bokun column; could go in Attributes — flagged |
| 58/59/60 Mobility Notes | No Bokun column; could append to KnowBeforeYouGo — flagged |
| 64 Guides (slugs) | Bokun doesn't model guides per Experience |
| 68 Bokun Experience ID | All empty — that's the problem we're solving |
| 69 Availability | Bokun manages |
| 72 Featured?, 73 Status | Bokun manages |

**Items above with "flagged" are candidates for Phase 02 to merge into adjacent Bokun cols (Excerpt / Attributes / KnowBeforeYouGo) — decide before coding.**

## Acceptance Criteria for Phase 01

- [ ] All 13 Bokun sheets have a row in this doc describing source → transform
- [ ] Defaults registry exhaustive (every required Bokun col CMS lacks has an entry)
- [ ] Dropped fields list complete (every CMS col not used appears here)
- [ ] Open questions raised in plan.md are reflected back here as TBDs

## Open Questions (carry into Phase 02/03)

1. Does Bokun bulk import accept the **price amount** in Rates or Pricing categories sheet? Template has neither obvious price col — must verify by test-import.
2. Are Bokun enum strings UPPER_SNAKE (`ACTIVITY_TOUR`) or human-readable (`Activity tour`)? Mapper code in repo uses UPPER for API; xlsx import may differ.
3. Does Bokun expect `;` or `,` for multi-value cells (Categories, Accessibility types, Keywords)?
4. Is `Included` a newline-joined string or comma-list? Template doesn't show example data.
5. Should "Highlights" be appended to Description (since no dedicated Bokun col in template)?
