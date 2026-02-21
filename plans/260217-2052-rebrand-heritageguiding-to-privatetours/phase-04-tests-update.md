# Phase 04: Tests Update

## Context Links
- [Plan Overview](./plan.md)
- [Phase 01: Source Code](./phase-01-source-code-rebrand.md)

## Overview
- **Date:** 2026-02-17
- **Description:** Update test assertions and fixtures to match new brand name and domain
- **Priority:** P1
- **Status:** Complete
- **Review Status:** Verified 2026-02-21

## Key Insights
- 4 test files reference old brand: seo.test.ts, travel-agency-schema.test.tsx, guide-detail-schema.test.tsx, about-schema.test.tsx
- Tests assert specific strings (brand name, URLs, email) -- must match updated source
- 600+ total tests; only ~4 files need changes but failures cascade if not updated

## Requirements

### Functional
- All test assertions match new brand name "PrivateTours"
- URL assertions use `privatetours.se`
- Email assertions use `@privatetours.se`
- All 600+ tests pass

### Non-Functional
- No test skipping or mocking changes needed
- Test coverage remains at current level

## Architecture
Tests use Vitest + React Testing Library. Assertions are string-matching against rendered output and data structures.

## Related Code Files

1. `apps/web/__tests__/lib/seo.test.ts`
2. `apps/web/__tests__/components/seo/travel-agency-schema.test.tsx`
3. `apps/web/__tests__/components/seo/guide-detail-schema.test.tsx`
4. `apps/web/__tests__/components/seo/about-schema.test.tsx`

## Implementation Steps

### Step 1: seo.test.ts
In `apps/web/__tests__/lib/seo.test.ts`:
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: any URL assertions with old domain -> Update to new domain

### Step 2: travel-agency-schema.test.tsx
In `apps/web/__tests__/components/seo/travel-agency-schema.test.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find: `info@heritageguiding.com` -> Replace: `info@privatetours.se`
- Update any social media URL assertions

### Step 3: guide-detail-schema.test.tsx
In `apps/web/__tests__/components/seo/guide-detail-schema.test.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

### Step 4: about-schema.test.tsx
In `apps/web/__tests__/components/seo/about-schema.test.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

### Step 5: Run Full Test Suite
```bash
npm test
```
All 600+ tests must pass. If any fail, check for additional files with old brand references.

### Step 6: Search for Remaining Test References
```bash
grep -r "heritageguiding" apps/web/__tests__/ --include="*.ts" --include="*.tsx"
```
If any matches found, update them.

## Todo List
- [x] Update seo.test.ts assertions (already done in Phase 01)
- [x] Update travel-agency-schema.test.tsx assertions (already done in Phase 01)
- [x] Update guide-detail-schema.test.tsx assertions (already done in Phase 01)
- [x] Update about-schema.test.tsx assertions (already done in Phase 01)
- [x] Run full test suite — 1,009 tests passed (785 web + 224 cms)
- [x] Verify zero remaining references in test files — grep confirmed clean

## Success Criteria
- `npm test` passes with 0 failures
- `grep -r "heritageguiding" apps/web/__tests__/` returns nothing
- Test count remains at 600+ (no tests removed)
- Coverage unchanged

## Risk Assessment
- **Low risk:** Assertion string updates only
- **Dependency:** Phase 01 must be complete (or at least the source files these tests cover)
- **Watch for:** Tests that dynamically build URLs from env vars -- may need NEXT_PUBLIC_URL mock update

## Security Considerations
- None for this phase

## Next Steps
- Run full test suite as final validation for Phases 1-4
- Proceed to Phase 05 (SEO & Domain Migration)
