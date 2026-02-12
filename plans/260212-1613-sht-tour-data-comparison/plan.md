# Tour Data Comparison: swedenhistorytours.se vs Heritage Guiding Platform

**Date:** 2026-02-12
**Type:** Research / Comparison Deliverable
**Status:** Complete - No code changes proposed

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Source data analysis (SHT) | Done |
| 2 | Platform schema mapping | Done |
| 3 | Gap analysis | Done |
| 4 | Category mapping | Done |
| 5 | Integration considerations | Done |
| 6 | Recommendations | Done |

## Key Findings

- **~70% compatibility** out-of-the-box between SHT data and platform schema
- **Biggest gap:** FareHarbor (SHT) vs Bokun (platform) booking system mismatch
- **9 new categories** needed: viking, dark-history, religious-heritage, food-wine, cultural, medieval, ancient, museum, folklore
- **3 new tour fields** recommended: `bookingProvider`, `externalBookingUrl`, `transportType`
- ~59 tours (22 transported + 37 walking), ~14 guides to import

## Detailed Analysis

- [Phase 1-3: Data mapping & gap analysis](./phase-01-data-mapping-and-gap-analysis.md)
- [Phase 4: Category mapping](./phase-04-category-mapping.md)
- [Phase 5-6: Integration considerations & recommendations](./phase-05-integration-considerations-and-recommendations.md)

## Next Steps (When Ready to Implement)

1. **Decision required:** Booking integration approach (FareHarbor migration, platform integration, or external links)
2. **Decision required:** Public vs private tour variant strategy
3. Add new CMS fields (`bookingProvider`, `externalBookingUrl`, `transportType`)
4. Seed 9 new categories
5. Update CSV import pipeline for new fields
6. Update booking section component for external URLs
7. Collect SHT tour data into import CSV
8. Import tours via existing CSV pipeline
