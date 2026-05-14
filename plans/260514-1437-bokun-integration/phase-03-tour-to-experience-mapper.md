# Phase 03: Tour → Experience Mapper

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: [Phase 02 types](./phase-02-extend-bokun-client-for-experience-write.md)
- Tour schema: `packages/cms/collections/tours.ts`

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 3-4h
- **Description:** Pure transform function `tourToBokunExperiencePayload(tour) → BokunExperienceCreatePayload`. No I/O, no API calls, heavily unit-tested. This is the only file in v1 that encodes business logic for the CMS→Bokun mapping.

## Key Insights
- Pure function = trivial to test, easy to maintain
- Locales must follow Bokun convention from Phase 01 findings
- `per_group` flat-rate pricing has a fallback path if Bokun doesn't support per-booking categories
- Lexical richText → HTML conversion needed for `description` field
- Mapper accepts the depth-2 Tour shape (with populated images, guides, categories — but v1 ignores images and categories)

## Requirements

### Functional
- Input: Payload Tour document (depth=2)
- Output: typed `BokunExperienceCreatePayload`
- Map all v1 fields (see field mapping table in plan.md)
- Handle all 3 `priceType` branches: `per_person`, `per_group`, `custom`
- Handle all 3 locales: sv, en, de (only non-empty translations emitted)
- Strip empty arrays / undefined optionals (clean payload)
- Convert prices to strings (Bokun requirement)
- Convert duration hours → ISO 8601 (`PT{n}H` or `PT{n}H{m}M`)

### Non-Functional
- Pure function (no I/O, no `await`, no globals)
- Deterministic output (same input → same output)
- 100% branch coverage for priceType + locale logic
- All edge cases tested (missing optional fields, empty arrays)

## Related Code Files

### Read
- `packages/cms/collections/tours.ts` — field definitions
- `packages/cms/payload-types.ts` — generated `Tour` type
- `apps/web/lib/bokun/bokun-types.ts` — target types (from Phase 02)

### Create
- `apps/web/lib/bokun/tour-to-bokun-experience-mapper.ts` — pure transform
- `apps/web/lib/bokun/lexical-to-html-converter.ts` — richText → HTML helper (small)
- `apps/web/lib/bokun/__tests__/tour-to-bokun-experience-mapper.test.ts` — comprehensive tests
- `apps/web/lib/bokun/__tests__/fixtures/tour-fixtures.ts` — fixture builders for tests

## Implementation Steps

1. **Create locale helper**
   - `mapCmsLocaleToBokun(cmsLocale: 'sv' | 'en' | 'de'): BokunLocale` — per Phase 01 findings
   - `localizedField<T>(value: Record<string, T>): BokunLocalizedString[]` — accepts Payload's localized object, emits Bokun array, skips empty strings

2. **Create duration helper**
   - `hoursToISO8601(hours: number): string`
     - `1.5 → "PT1H30M"`
     - `3 → "PT3H"`
     - `0.5 → "PT30M"`

3. **Create pricing mapper** — `mapPricingToBokunRates(pricing: Tour['pricing']): BokunRate[]`
   - `per_person` → 1 rate "Standard", categories: `[Adult: basePrice]` + `[Child: childPrice]` if `childPrice` set
   - `per_group` → 1 rate "Standard", 1 category "Per group" with `pricePerBooking: basePrice`. If Phase 01 confirmed Bokun does NOT support per-booking pricing, fall back: `[Adult: basePrice / minGroupSize]`
   - `custom` → log warning, default to Adult-only with basePrice as per-person (require manual edit in Bokun)
   - All prices as strings: `toFixed(2)`
   - Currency from `pricing.currency`

4. **Create Lexical → HTML converter**
   - `lexicalToHtml(rich: SerializedEditorState): string`
   - Minimal: handle paragraph, heading, list, bold, italic, link nodes (matches what tour editors use)
   - For unsupported nodes, fall back to `node.text` or skip
   - Existing solution check: search the codebase for any existing Lexical HTML serializer to reuse first

5. **Create meeting-point mapper**
   - `mapLogisticsToBokunMeetingPoint(logistics: Tour['logistics']): BokunMeetingPoint`
   - Map name, address, instructions across locales
   - `coordinates: [lng, lat]` (GeoJSON) → `{ latitude: lat, longitude: lng }` (Bokun)

6. **Create activity-level + accessibility mapper**
   - `difficultyLevel` enum mapping: `easy → EASY`, `moderate → MODERATE`, `challenging → CHALLENGING`
   - `wheelchairAccessible` → direct boolean

7. **Compose the top-level mapper**
   ```typescript
   export function tourToBokunExperiencePayload(
     tour: Tour
   ): BokunExperienceCreatePayload {
     return {
       title: localizedField(tour.title),
       description: localizedField(mapRichTextToHtmlPerLocale(tour.description)),
       summary: localizedField(tour.shortDescription),
       highlights: localizedFieldArray(tour.highlights, h => h.highlight),
       durationISO: hoursToISO8601(tour.duration.hours),
       minParticipants: tour.minGroupSize ?? 1,
       maxParticipants: tour.maxGroupSize ?? 12,
       rates: mapPricingToBokunRates(tour.pricing),
       meetingPoint: mapLogisticsToBokunMeetingPoint(tour.logistics),
       inclusions: localizedFieldArray(tour.included, i => i.item),
       exclusions: localizedFieldArray(tour.notIncluded, i => i.item),
       bringList: localizedFieldArray(tour.whatToBring, i => i.item),
       activityLevel: mapDifficulty(tour.difficultyLevel),
       wheelchairAccessible: tour.wheelchairAccessible ?? false,
     }
   }
   ```

8. **Build unit tests** — `tour-to-bokun-experience-mapper.test.ts`
   - Fixture builder: `buildTourFixture(overrides)` for concise tests
   - Test: `per_person` with childPrice → 2 categories
   - Test: `per_person` without childPrice → 1 category
   - Test: `per_group` → flat-rate category (or fallback if Phase 01 said so)
   - Test: `custom` → warning + Adult fallback
   - Test: 1.5 hours → `PT1H30M`
   - Test: missing optional fields produce undefined/empty (not null)
   - Test: empty highlights array → field omitted
   - Test: single-locale tour → 1 entry in localized arrays (not 3)
   - Test: GeoJSON coordinates correctly swapped to Bokun lat/long format
   - Test: prices always strings, 2 decimal places
   - Test: rich-text with bold + link produces correct HTML
   - Test: difficulty enum mapping

9. **Run coverage**
   - `npm -w apps/web test tour-to-bokun-experience-mapper -- --coverage`
   - Target: 100% branch coverage for this file

## Todo List

- [ ] Check codebase for existing Lexical-to-HTML serializer before writing one
- [ ] Create `tour-to-bokun-experience-mapper.ts` with all submappers
- [ ] Create `lexical-to-html-converter.ts` (if no reusable one exists)
- [ ] Create fixture builder `tour-fixtures.ts`
- [ ] Write 12+ unit tests covering all branches
- [ ] Hit 100% branch coverage for mapper file
- [ ] Document any open mapping decisions inline as JSDoc

## Success Criteria
- Mapper is pure (no async, no I/O)
- 100% branch coverage on mapper file
- All 3 priceType branches produce valid `BokunExperienceCreatePayload`
- All locales handled correctly (drops empty)
- Reviewable in isolation without Payload or Bokun running

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Lexical → HTML loses formatting | Test with realistic richText fixtures; v2 can improve |
| per_group flat-rate fallback produces wrong price | Phase 01 confirms support; fallback math documented + tested |
| Missing required Bokun field surfaces only at runtime | Phase 02 types require minimum; mapper sets defaults |
| Locale array order matters to Bokun | Test stable ordering (alphabetical by locale) |
| GeoJSON coordinate order confusion (lng/lat vs lat/lng) | Explicit test fixture and assertion |

## Security Considerations
- HTML output from Lexical converter must be sanitized — no `<script>` allowed even if richText contains it
- Use a known-good sanitizer or strict allowlist (no `dangerouslySetInnerHTML`-style passthrough)

## Next Steps
- Phase 05 (job) calls this mapper before invoking Phase 02 methods
- Phase 06 (admin UI) doesn't touch the mapper directly
