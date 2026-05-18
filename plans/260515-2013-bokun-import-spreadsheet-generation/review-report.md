# Bokun Import — Review Report

**Generated:** 2026-05-16 (v2 — incorporates Bokun import-error feedback)
**Source:** `docx/tours-2026-05-15.xlsx` (10 published tours, single sheet, 73 cols)
**Template:** `docx/Bokun-template.xlsx` (13 sheets, ~140 cols total, header-only)
**Output:** `docx/bokun-import-2026-05-15.xlsx`
**Generator:** `scripts/generate-bokun-import.ts`

## Summary

| Sheet | Rows (incl header) | Data rows | Status |
|---|---|---|---|
| Products | 11 | 10 | populated |
| Pricing categories | 11 | 10 (all "Per group") | populated |
| Rates | 11 | 10 (all "Standard") | populated |
| Photos | 78 | 77 | populated |
| Meeting points | 11 | 10 (5 with coords, 5 blank) | populated |
| Videos | 1 | 0 | header-only — CMS has no video data |
| Itinerary | 1 | 0 | header-only — no structured itinerary |
| Start times | 1 | 0 | header-only — set in Bokun extranet |
| Opening hours | 1 | 0 | header-only |
| Extras | 1 | 0 | header-only |
| Custom field values | 1 | 0 | header-only |
| Booking questions | 1 | 0 | header-only (Bokun defaults sufficient) |
| Inventory service | 1 | 0 | header-only |

## Per-Tour Completeness

| Slug | Photos | Coords | Min/Max group | Min age | Categories | City |
|---|---|---|---|---|---|---|
| stockholm-everyday-life-private-tour | 11 | — | 1/7 | 12 | walking-tour,culture-local-life | Stockholm |
| slow-travel-stockholm-archipelago-classic-boat | 8 | ✓ | 1/5 | 6 | boat-tour,day-trip,nature-water | Stockholm |
| slow-travel-malaren-classic-boat-stockholm | 6 | ✓ | 1/5 | 6 | boat-tour,day-trip,nature-water | Stockholm |
| gamla-stan-and-stockholm-city-hall-private-walking-tour | 7 | ✓ | 1/9 | 12 | walking-tour,history,culture | Stockholm |
| gamla-stan-and-vasa-museum-private-walking-tour | 8 | ✓ | 1/9 | 12 | walking-tour,history,culture | Stockholm |
| private-uppsala-day-tour-from-stockholm | 6 | — | 1/8 | 12 | day-trip,history | Uppsala |
| private-sigtuna-heritage-tour-from-stockholm | 7 | — | 1/8 | 12 | day-trip,history | Sigtuna |
| stockholm-islands-and-districts-private-overview-by-car-3-hour | 10 | — | 1/4 | 12 | car-tour,history | Stockholm |
| private-medieval-stockholm-walking-tour | 6 | ✓ | 1/9 | 12 | walking-tour,history | Stockholm |
| private-rib-tour-stockholm-3h | 8 | ✓ | 1/12 | 8 | boat-tour,adventure | Stockholm |

## Image URL Spot-Check (10/10 PASS — 2026-05-16)

All 10 sampled image URLs (1 per tour) responded **200 OK**:

```
200 https://staging.privatetours.se/api/media/file/coffe-fridhemsplan-1.jpg
200 https://staging.privatetours.se/api/media/file/albin-26.jpg
200 https://staging.privatetours.se/api/media/file/albin-25-2.jpg
200 https://staging.privatetours.se/api/media/file/a-view-from-pillars-from-the-city-hall-in-stockholm-1.jpg
200 https://staging.privatetours.se/api/media/file/changing-of-the-guard-in-the-royal-palace-1.jpg
200 https://staging.privatetours.se/api/media/file/royal-mounds-uppsala-gamla-ho-gar-1.jpg
200 https://staging.privatetours.se/api/media/file/sigtuna-main-street-1.jpg
200 https://staging.privatetours.se/api/media/file/djurgarden-overview-nordic-museum-1.jpg
200 https://staging.privatetours.se/api/media/file/gamla-stan-alley-coffeshop-with-people-1.jpg
200 https://staging.privatetours.se/api/media/file/red-wooden-house-archipelago-1.jpg
```

**Important context:** Original plan called for production URL (`https://privatetours.se`) but production currently shows `/coming-soon` and returns 404 for media. Switched to staging URL (confirmed reachable). Bokun typically fetches + caches photos at import time, so staging URL going down later won't break already-imported products.

## v1 Import Errors — RESOLVED in v2 (2026-05-16)

First test-import surfaced Bokun's actual enum constraints. All fixed in v2:

| Col | Field | v1 (rejected) | v2 (corrected) |
|---|---|---|---|
| 4 | Experience type | `ACTIVITY_TOUR` | `DAY_TOUR_OR_ACTIVITY` |
| 6 | Capacity type | `PRIVATE` | `LIMITED` |
| 7 | Schedule type | `START_TIMES` | `RECURRING` |
| 10 | Fixed pass expiry date | `""` (STRING) | truly blank (BLANK type) |
| 13 | Categories | `walking-tour,culture-local-life` (CMS slugs) | single Bokun enum, e.g. `WALKING_TOUR` |
| 15 | Accessibility types | `WHEELCHAIR_ACCESSIBLE,...` | `WHEELCHAIR,LIMITED_SIGHT` |
| 27 | Cutoff type | `BEFORE_START` | `RELATIVE_TO_START_TIME` |
| 38 | KnowBeforeYouGo | free text (Bokun expects enum tags!) | enum tags: `WHEELCHAIR_ACCESSIBLE,PUBLIC_TRANSPORTATION_NEARBY,...` |
| 40 | Attention | (empty) | free-text meeting instructions moved here |
| 52 | Location | `Stockholm, SE` | `SE STO Stockholm` (regex `\p{Upper}{2} \p{Upper}{3} .*`) |

CMS category → Bokun enum mapping locked in `scripts/lib/bokun-import-defaults.ts` → `CMS_CATEGORY_TO_BOKUN`. UN/Locode per city in `CITY_UN_LOCODE` (Stockholm=STO, Uppsala=UPS, Sigtuna=SIG).

## Defaulted Values — VERIFY IN BOKUN AFTER IMPORT

Every value below was supplied by the script because CMS lacks the data. Open each imported Experience in Bokun extranet and confirm or correct:

| Field | Default applied | Where to verify |
|---|---|---|
| Experience type | `ACTIVITY_TOUR` | Product → General → Type |
| Booking type | `DATE_AND_TIME` | Product → Booking → Type |
| Capacity type | `PRIVATE` | Product → Capacity |
| Schedule type | `START_TIMES` | Product → Schedule |
| Meeting type | `MEET_ON_LOCATION` | Product → Meeting & pickup |
| Cutoff | 1 day before start, type `BEFORE_START` | Product → Booking → Cutoff |
| Pickup selection | `NONE` | Product → Pickup |
| Dropoff selection | `NONE` | Product → Pickup |
| Cancellation policy | `STANDARD` | Product → Policies |
| Pricing category title | `Per group` | Product → Rates & pricing |
| Ticket category | `ADULT` (per-group placeholder) | Product → Rates & pricing |
| Default rate | `Standard` | Product → Default rate |
| Location | `Stockholm, SE` | Product → Location |
| Time zone | `Europe/Stockholm` | Product → Time zone |
| Map zoom level | `13` | Meeting point → Map |

## Price Amounts — REQUIRED BEFORE ACTIVATION

The generated xlsx does NOT carry price values. Bokun's `Rates` sheet (15 cols) and `Pricing categories` sheet (4 cols) have no obvious price-amount column. **Test the bulk import** — if Bokun reports missing prices, prices likely need to be set via UI:

For each imported Experience: Bokun → Product → Rates & pricing → "Standard" → "Per group" → set flat price → save.

| Slug | Base price | Currency |
|---|---|---|
| stockholm-everyday-life-private-tour | 5500 | SEK |
| slow-travel-stockholm-archipelago-classic-boat | 19000 | SEK |
| slow-travel-malaren-classic-boat-stockholm | 11000 | SEK |
| gamla-stan-and-stockholm-city-hall-private-walking-tour | 3900 | SEK |
| gamla-stan-and-vasa-museum-private-walking-tour | 3900 | SEK |
| private-uppsala-day-tour-from-stockholm | 12900 | SEK |
| private-sigtuna-heritage-tour-from-stockholm | 9800 | SEK |
| stockholm-islands-and-districts-private-overview-by-car-3-hour | 5500 | SEK |
| private-medieval-stockholm-walking-tour | 2800 | SEK |
| private-rib-tour-stockholm-3h | 14000 | SEK |

## Missing Coordinates — ADD IN BOKUN

These 5 tours imported without lat/lng; map markers won't show until coords are added:

- stockholm-everyday-life-private-tour (Hotel pickup — no fixed coords expected)
- private-uppsala-day-tour-from-stockholm (depart from Stockholm, tour in Uppsala — add Uppsala coords)
- private-sigtuna-heritage-tour-from-stockholm (same — add Sigtuna coords)
- stockholm-islands-and-districts-private-overview-by-car-3-hour (chauffeur tour, multi-stop)

Path: Bokun → Product → Meeting points → edit → drag marker on map → save.

## Dropped CMS Fields — RE-ADD MANUALLY IN BOKUN

These exist in CMS but were NOT imported. Add via Bokun admin (translations panel or product fields) if needed:

| CMS field | Why dropped | Where to re-add in Bokun |
|---|---|---|
| Title / Description / Short Desc / Highlights / Included / Not Included / What to Bring / Meeting Instructions (**Swedish + German**) | English-only locked decision | Product → Translations → Swedish/German |
| Highlights (English) | No Bokun xlsx column; lost on import | Product → Highlights section (API field) or append to Description |
| Target Audience (couples / family_friendly / etc) | No clean Bokun mapping | Product → Attributes (closest match) |
| Mobility Notes (EN/SV/DE) | No Bokun column | Product → Accessibility info |
| Featured? | Managed in Bokun | Product → Promotion |
| Group Discount? / Child Price | All tours per_group flat-rate | Product → Rates & pricing (if tiered pricing needed) |
| Child Friendly? / Teen Friendly? | No Bokun column | Product → Attributes |
| Parking Info / Public Transport Info | **Merged into KnowBeforeYouGo** along with Meeting Instructions | (already in import) |
| Ending Point | No Bokun equiv. | Append to Description if needed |
| Guides (slug) | Bokun doesn't model guides per Experience | (kept in CMS only) |
| Duration Text (SV/EN/DE) | Bokun renders from h/m | n/a |
| Google Maps Link | Coords used instead | n/a |
| Availability / Status | Managed in Bokun | n/a |

## Post-Import Workflow

1. Upload `docx/bokun-import-2026-05-15.xlsx` in Bokun **test** environment → confirm all 10 import
2. Resolve any per-row import errors. Most likely fixes:
   - Update enum strings in `scripts/lib/bokun-import-defaults.ts` (e.g. `ACTIVITY_TOUR` → actual Bokun string)
   - Update multi-value separator if Bokun expects `;` instead of `,`
   - Re-run `npx tsx scripts/generate-bokun-import.ts` and retry
3. Once all 10 import cleanly to test, repeat against Bokun **production**
4. For each new Bokun Experience: copy ID → paste into Payload Tour `bokunExperienceId` field
5. Trigger "Sync to Bokun now" on each tour → confirms outbound PUT works
6. Manually add SV/DE translations + Highlights + prices in Bokun extranet

## ID Write-Back Procedure (manual)

After Bokun assigns IDs:

```
For each tour:
  1. Bokun → Inventory → find Experience by Product code (= slug)
  2. Copy "Experience ID" (numeric, e.g. 1234567)
  3. Payload admin → Tours → open by slug → "Bokun Experience ID" field → paste → save
  4. (optional) Click "Sync to Bokun now" to verify PUT works
```

Future automation: if Bokun returns an import-result xlsx with assigned IDs, write a sibling script that bulk-updates Payload via Local API.

## Files Created

| File | Purpose | LOC |
|---|---|---|
| `scripts/generate-bokun-import.ts` | CLI entry, orchestration, validation | 130 |
| `scripts/lib/bokun-import-defaults.ts` | Locked constants (enums, time zone, image base) | 64 |
| `scripts/lib/bokun-import-reader.ts` | Parse CMS xlsx → TourRow[] | 360 |
| `scripts/lib/bokun-import-mapper.ts` | Pure transform: TourRow → BokunRowBundle | 270 |
| `scripts/lib/bokun-import-writer.ts` | Build 13-sheet workbook with template headers | 200 |

## Open Questions (resolve via test-import)

1. **Price amount column** — does Bokun bulk-import expect price in a column we missed?
2. **Enum string format** — `ACTIVITY_TOUR` vs `Activity tour`? Bokun import-error message will reveal.
3. **Multi-value separator** — `,` or `;` for Categories/Accessibility types/Keywords?
4. **Included/Excluded list format** — newline-separated (current) vs comma-separated?
5. **Highlights** — Bokun API has `highlights[]` array but xlsx template has no column. Lost on import or extracted from Description?
6. **Bokun image caching** — fetch-once-and-cache at import, or re-fetch on each render? Affects staging URL longevity.
