# Phase 02 — Generator Script

**Status:** not-started
**Effort:** 2-3h
**Depends on:** Phase 01 (mapping + defaults locked)

## Goal

Build `scripts/generate-bokun-import.mjs` — one-shot Node script that reads CMS staging export and emits a Bokun-format import xlsx. Pure ETL: no DB, no network (except a final optional URL spot-check), no Payload dependency.

## Why a script (not a Payload export route)?

- One-shot job; doesn't justify a CMS endpoint
- Input is already an xlsx file the user has on disk — closer to data than to runtime CMS state
- Easy to re-run after fixing data in CMS export (just re-export + re-run)
- No coupling to existing `apps/web/lib/bokun/` code (which targets API JSON, not xlsx format)

## File Layout

```
scripts/
└── generate-bokun-import.mjs              # entry point — argv parsing, top-level orchestration
└── bokun-import/
    ├── read-cms-export.mjs                # parse tours-2026-05-15.xlsx → array of TourRow objects
    ├── map-tour-to-bokun-rows.mjs         # per-tour transform → { product, pricingCategory, rate, photos[], meetingPoint }
    ├── defaults.mjs                       # locked default constants (enums, time zone, image prefix) — DRY source
    ├── write-bokun-xlsx.mjs               # build 13-sheet workbook from transformed rows
    └── __tests__/
        ├── map-tour-to-bokun-rows.test.mjs
        └── fixtures/
            └── sample-tour-row.mjs
```

All files kebab-case, all under 200 LOC. Vitest is already in the project (configured for `apps/web` + `packages/cms`); reuse the root `vitest.config.ts` or add a minimal config for the script.

## Script Spec

### Entry: `scripts/generate-bokun-import.mjs`

```
Usage:
  node scripts/generate-bokun-import.mjs \
    --input  docx/tours-2026-05-15.xlsx \
    --template docx/Bokun-template.xlsx \
    --output docx/bokun-import-2026-05-15.xlsx \
    [--image-base https://privatetours.se] \
    [--dry-run]            # print summary, don't write xlsx
    [--verbose]            # log per-tour mapping decisions
```

Defaults:
- `--input` → `docx/tours-2026-05-15.xlsx`
- `--template` → `docx/Bokun-template.xlsx`
- `--output` → `docx/bokun-import-<YYYY-MM-DD>.xlsx`
- `--image-base` → `https://privatetours.se`

Exit codes:
- `0` success
- `1` input file missing or malformed
- `2` validation error in any row (logs all errors, then exits)

### Step-by-step

1. **Parse args** (`process.argv`; no external dep — keep it tiny)
2. **Read template** (`new ExcelJS.Workbook().xlsx.readFile(template)`) — used as the structural skeleton; we copy its headers verbatim so column order/names are guaranteed to match.
3. **Read CMS export** via `read-cms-export.mjs`:
   - Open `tours-2026-05-15.xlsx`, sheet `Tours`
   - For each data row (2..N), build a `TourRow` object with all 73 fields keyed by stable names (no col indexes leaking into transform)
   - Skip rows where `Status !== 'published'` (defensive; today all 10 are published)
   - Return array
4. **Transform** each `TourRow` via `map-tour-to-bokun-rows.mjs`:
   - Returns `{ product, pricingCategory, rate, photos: PhotoRow[], meetingPoint }`
   - Pure function; no I/O; deterministic
   - Imports defaults from `defaults.mjs`
5. **Write output** via `write-bokun-xlsx.mjs`:
   - Load template (`xlsx.readFile`) → get header rows for all 13 sheets
   - For each transformed product, push rows into:
     - `Products` (1 row)
     - `Pricing categories` (1 row — `Per group`)
     - `Rates` (1 row — `Standard`)
     - `Photos` (N rows — one per image)
     - `Meeting points` (1 row)
   - Other 8 sheets remain header-only
   - `wb.xlsx.writeFile(output)`
6. **Dry-run mode:** skip step 5, print summary table to stdout:
   ```
   ✓ stockholm-everyday-life-private-tour       Products:1  Pricing:1  Rates:1  Photos:11  Meeting:1 (no coords)
   ✓ slow-travel-stockholm-archipelago-...      Products:1  Pricing:1  Rates:1  Photos:8   Meeting:1
   ...
   Total: 10 products / 10 pricing categories / 10 rates / 77 photos / 10 meeting points
   ```

### `defaults.mjs` (single source of truth)

```js
export const BOKUN_DEFAULTS = {
  experienceType: 'ACTIVITY_TOUR',
  bookingType: 'DATE_AND_TIME',
  capacityType: 'PRIVATE',
  scheduleType: 'START_TIMES',
  meetingType: 'MEET_ON_LOCATION',
  cutoffDays: 1,
  cutoffType: 'BEFORE_START',
  pickupSelectionType: 'NONE',
  dropoffSelectionType: 'NONE',
  cancellationPolicy: 'STANDARD',
  defaultRate: 'Standard',
  defaultPricingCategory: 'Per group',
  pricingCategoryTitle: 'Per group',
  ticketCategory: 'ADULT',
  timeZone: 'Europe/Stockholm',
  countryCode: 'SE',
  defaultCity: 'Stockholm',
  zoomLevel: 13,
  imageBaseUrl: 'https://privatetours.se',
}

export const DIFFICULTY_MAP = {
  easy: 'EASY',
  moderate: 'MODERATE',
  challenging: 'CHALLENGING',
}

// Per-slug city overrides (most are Stockholm, some are out-of-city)
export const CITY_OVERRIDES = {
  'private-uppsala-day-tour-from-stockholm': 'Uppsala',
  'private-sigtuna-heritage-tour-from-stockholm': 'Sigtuna',
}
```

### `map-tour-to-bokun-rows.mjs` (core transform)

Function signature:

```js
/** @param {TourRow} tour @returns {BokunRowBundle} */
export function mapTourToBokunRows(tour) { ... }
```

Internal helpers (each tiny, testable):

- `splitDurationHours(decimalHours)` → `{ hours, minutes }`
- `splitCoordinates(coordsStr)` → `{ lat, lng } | null`
- `splitList(str, sep)` → `string[]` (handle `;` and trim)
- `joinAsLines(items)` → `string` (newline-joined for Included/Excluded)
- `buildKnowBeforeYouGo(tour)` → concat Meeting Instructions + Parking + Public Transport (EN), each section non-empty
- `mapAccessibility(tour)` → comma-list of `WHEELCHAIR_ACCESSIBLE`, `HEARING_ASSISTANCE`, `VISUAL_ASSISTANCE`, `SERVICE_ANIMALS`
- `resolveImageUrls(imagesField, baseUrl)` → array of absolute URLs

Sample mapping (Products row from `TourRow`):

```js
const product = {
  productCode: tour.slug,
  title: tour.titleEn,
  experienceType: BOKUN_DEFAULTS.experienceType,
  bookingType: BOKUN_DEFAULTS.bookingType,
  capacityType: BOKUN_DEFAULTS.capacityType,
  scheduleType: BOKUN_DEFAULTS.scheduleType,
  meetingType: BOKUN_DEFAULTS.meetingType,
  categories: splitList(tour.categoriesSlugs, ';').join(','),
  accessibilityTypes: mapAccessibility(tour),
  difficultyLevel: DIFFICULTY_MAP[tour.difficultyLevel] ?? '',
  minimumAge: tour.minimumAge ?? '',
  durationWeeks: 0,
  durationDays: 0,
  durationHours: Math.floor(tour.durationHours),
  durationMinutes: Math.round((tour.durationHours % 1) * 60),
  cutoffDays: BOKUN_DEFAULTS.cutoffDays,
  cutoffType: BOKUN_DEFAULTS.cutoffType,
  excerpt: tour.shortDescriptionEn,
  description: tour.fullDescriptionEn,
  keywords: splitList(tour.neighborhoodsSlugs, ';').join(','),
  included: joinAsLines(splitList(tour.includedEn, ';')),
  excluded: joinAsLines(splitList(tour.notIncludedEn, ';')),
  knowBeforeYouGo: buildKnowBeforeYouGo(tour),
  requirements: joinAsLines(splitList(tour.whatToBringEn, ';')),
  ticketPerPerson: false,
  privateExperience: true,
  allowCustomBookings: false,
  customPickupAllowed: false,
  customDropoffAllowed: false,
  location: `${BOKUN_DEFAULTS.defaultCity}, ${BOKUN_DEFAULTS.countryCode}`,
  defaultRate: BOKUN_DEFAULTS.defaultRate,
  defaultPricingCategory: BOKUN_DEFAULTS.defaultPricingCategory,
  timeZone: BOKUN_DEFAULTS.timeZone,
}
```

(Full row list mirrors phase-01 table 1:1.)

### `write-bokun-xlsx.mjs` — column-index mapping

ExcelJS lets us `worksheet.addRow([...])` with positional values. To keep this readable, define per-sheet column order constants:

```js
const PRODUCTS_COL_ORDER = [
  'id', 'productCode', 'title', 'experienceType', 'bookingType', 'capacityType',
  'scheduleType', 'passExpiryType', 'passCapacity', 'fixedPassExpiryDate', 'passValidForDays',
  'meetingType', 'categories', 'attributes', 'accessibilityTypes', 'guidances',
  'difficultyLevel', 'minimumAge', 'durationWeeks', 'durationDays', 'durationHours',
  'durationMinutes', 'cutoffWeeks', 'cutoffDays', 'cutoffHours', 'cutoffMinutes',
  'cutoffType', 'cutoffReferenceHour', 'cutoffReferenceMinute', 'excerpt', 'description',
  'keywords', 'flags', 'included', 'excluded', 'inclusions', 'exclusions',
  'knowBeforeYouGo', 'requirements', 'attention', 'ticketPerPerson', 'privateExperience',
  'requestDeadlineWeeks', 'requestDeadlineDays', 'requestDeadlineHours', 'requestDeadlineMinutes',
  'allowCustomBookings', 'customPickupAllowed', 'pickupMinutesBefore', 'dropoffService',
  'customDropoffAllowed', 'location', 'defaultRate', 'defaultPricingCategory', 'timeZone',
]
// addRow(PRODUCTS_COL_ORDER.map(k => product[k] ?? ''))
```

(Same pattern for the other 4 populated sheets.)

## Unit Tests

Single test file `map-tour-to-bokun-rows.test.mjs` — fixtures cover:

1. Full happy-path tour (all fields populated) → snapshot match against expected bundle
2. Tour with empty coords → `meetingPoint.latitude === ''`
3. Tour with 0 images → `photos.length === 0`
4. Tour with non-Stockholm city (Uppsala/Sigtuna) → city override applied
5. Duration 4.5h → `{ hours: 4, minutes: 30 }`
6. Difficulty `null` → `''` (not `'undefined'`)
7. Slug used as product code verbatim (no transform)
8. Image URL with leading slash → `https://privatetours.se/api/media/file/x.jpg` (no double slash)

No need for read/write integration tests — those are validated manually in Phase 03.

## Manual Smoke Test (run after implementation)

```bash
# Dry run — should print 10-tour summary
node scripts/generate-bokun-import.mjs --dry-run --verbose

# Real run
node scripts/generate-bokun-import.mjs

# Inspect
node -e "const e=require('exceljs');const w=new e.Workbook();w.xlsx.readFile('docx/bokun-import-2026-05-15.xlsx').then(()=>{w.eachSheet(s=>console.log(s.name, s.rowCount))})"
```

Expected row counts:
```
Products             11   (1 header + 10 rows)
Pricing categories   11   (1 + 10)
Rates                11   (1 + 10)
Photos               ~78  (1 + ~77)
Meeting points       11   (1 + 10)
Videos               1    (header only)
Itinerary            1
Start times          1
Opening hours        1
Extras               1
Custom field values  1
Booking questions    1
Inventory service    1
```

## Acceptance Criteria

- [ ] Script runs to completion in <5s on the 10-tour input
- [ ] All unit tests pass
- [ ] Generated xlsx opens cleanly in Excel (no corruption warnings)
- [ ] Row counts match the table above ±2 (image-count variance)
- [ ] Re-running produces byte-identical output (deterministic)
- [ ] `--dry-run` prints clean summary, doesn't touch filesystem
- [ ] `npm run lint` passes (script files pass project ESLint)

## Risks

| Risk | Mitigation |
|---|---|
| ExcelJS strips header formatting when copying template | Inspect output in Excel; if formatting matters to Bokun importer, copy header style explicitly via `header.style = templateHeader.style` |
| Wrong column order silently maps wrong data | `write-bokun-xlsx.mjs` asserts header strings match template after read — fail-fast on drift |
| CMS export adds a new column tomorrow → script breaks | `read-cms-export.mjs` keys by header string, not col index — resilient to column reorder; new columns are ignored |
| Image paths contain spaces / special chars Bokun rejects | URL-encode each path segment before prefixing |
| Slug contains chars Bokun product code rejects | Validate slugs match `/^[a-z0-9-]+$/` at read time; fail-fast |

## Out of Scope (defer to Phase 03 or later)

- Writing IDs back to Payload after Bokun assigns them (manual paste post-import)
- Pushing Swedish/German translations (future plan)
- Geocoding missing coordinates (future plan)
- Highlights field — append-to-description vs Bokun API push (TBD in Phase 03 review)
