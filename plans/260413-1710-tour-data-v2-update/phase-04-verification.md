# Phase 4: Verification

## Context Links
- [verify-tour-import.ts](../../scripts/verify-tour-import.ts) — existing verification script

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phase 3
- **Description:** Verify all 10 tours updated correctly across all 3 locales.

## Verification Checklist

### Automated Checks
- [ ] Run existing `verify-tour-import.ts` — confirms all tours exist with correct fields
- [ ] Query all tours via Payload API, compare titles against v2 xlsx
- [ ] Verify featured flags match v2 xlsx
- [ ] Verify EN/DE translations exist for all translatable fields
- [ ] Check for null/empty fields that should have values

### Manual Spot Checks (Payload Admin)
- [ ] `private-rib-tour-stockholm-3h` — title now "RIB-tur i Stockholm...", featured=Yes
- [ ] `gamla-stan-and-stockholm-city-hall-private-walking-tour` — "Not Included" now includes "Inträdesbiljett till Stockholms stadshus"
- [ ] `slow-travel-malaren-classic-boat-stockholm` — basePrice=11000 (no space), included now has "Klassisk kabinbåt" and "Svensk fika ombord"

### Frontend Verification
- [ ] Browse tour listing page in SV, EN, DE — titles render correctly
- [ ] Open 2-3 tour detail pages — descriptions, highlights, included lists correct
- [ ] Verify featured tours carousel shows updated set

## Success Criteria

- All 10 tours have updated content matching v2 xlsx
- All 3 locales have translations
- No broken images or missing relationships
- Frontend renders correctly

## Todo List

- [ ] Run automated verification
- [ ] Spot-check in Payload admin (3 tours)
- [ ] Frontend check (listing + detail pages in 3 locales)
