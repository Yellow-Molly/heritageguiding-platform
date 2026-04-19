# Phase 5: Verification & Testing

## Context Links
- Existing tests: `apps/web/components/guide/__tests__/guide-listing-card.test.tsx`
- Test runner: `npm run test` (Vitest)
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`
- Build: `npm run build`
- Guide detail page: `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx`
- Verify script: `scripts/verify-guide-import.ts`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1.5h
- **Blocked by:** Phase 4

End-to-end verification of data import integrity, visual correctness across breakpoints, and CI pipeline checks (lint, types, build, tests).

## Key Insights
- Existing test suite has 1009 tests. Only `guide-listing-card.test.tsx` is guide-specific — it tests the listing card, NOT the detail page components.
- New detail components are server components rendering static text — unit tests verify prop-to-HTML mapping, not interactivity.
- Visual checks are manual (no Playwright/Cypress in project). Use dev server at multiple breakpoints.
- The `verify-guide-import.ts` script checks CMS data integrity post-import. Must be extended or re-run to validate new fields.

## Requirements

### Functional
1. Verify data integrity: all 12 guides have populated structured fields in CMS
2. Visual check: desktop (1440px) split layout matches design spec
3. Visual check: mobile (375px) stacked layout matches design spec
4. Visual check: all 3 locales render correctly (SV/EN/DE)
5. Update/add unit tests for new components
6. Full CI pipeline passes: lint, types, build, tests

### Non-Functional
- No regression in existing 1009 tests
- Build output has no new warnings related to guide components
- No hydration mismatches in browser console

## Architecture

### Verification Matrix

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| CMS data — 12 guides | `verify-guide-import.ts` | 0 errors, all fields non-null |
| CMS data — bio is plain only | Manual CMS admin spot-check | No `###` headers in bio richText |
| CMS data — new fields populated | Manual CMS admin for 2 guides | guideStyle, quote, etc. in SV/EN/DE |
| TypeScript | `npx tsc --noEmit` | Exit 0 |
| Lint | `npm run lint` | Exit 0 |
| Build | `npm run build` | Exit 0, no new warnings |
| Unit tests | `npm run test` | All pass, no regressions |
| Desktop layout | Browser 1440px | Sidebar 450px, right column sections |
| Mobile layout | Browser 375px | Stacked, sticky CTA visible |
| Locale SV | Browser `/sv/guides/{slug}` | Swedish text in all sections |
| Locale EN | Browser `/en/guides/{slug}` | English text in all sections |
| Locale DE | Browser `/de/guides/{slug}` | German text in all sections |
| Null safety | Guide with empty optional fields | No empty cards/sections rendered |
| Jack Voldstad | Browser `/en/guides/jack-voldstad` | Photo shown (not placeholder), all sections |
| SEO schema | View source on detail page | GuideDetailSchema present |

## Related Code Files

### Modify
- `scripts/verify-guide-import.ts` — add checks for new CMS fields (guideStyle, etc.)
- `apps/web/components/guide/__tests__/` — add test files for new components

### Create
- `apps/web/components/guide/__tests__/guide-expertise-section.test.tsx`
- `apps/web/components/guide/__tests__/guide-quote-section.test.tsx`
- `apps/web/components/guide/__tests__/guide-approach-section.test.tsx`
- `apps/web/components/guide/__tests__/guide-guest-feedback-section.test.tsx`

### Run (no modification)
- `npm run lint`
- `npm run test`
- `npm run build`

## Implementation Steps

### Step 1: Update Verify Script
1. Open `scripts/verify-guide-import.ts`
2. Add checks for new fields per guide:
   - `guideStyle` non-null for SV locale
   - `whatGuestsAppreciate` non-null
   - `uniqueAspectsQuote` non-null
   - `uniqueAspectsBody` non-null
   - `specialtyDescriptions` array length > 0
3. Add check: bio richText does NOT contain `###` heading nodes (verify it's plain bio only)
4. Add Jack Voldstad existence check (slug `jack-voldstad`, status `active`)
5. Run: `npx tsx --require ./scripts/patch-next-env.cjs scripts/verify-guide-import.ts`

### Step 2: Write Unit Tests
For each new server component, test:
- Renders heading + content when props provided
- Returns null when props are null/empty
- Uses correct i18n key (mock `getTranslations`)

Example test structure (each file ~40-60 lines):
```tsx
// guide-expertise-section.test.tsx
import { render, screen } from '@testing-library/react'
// Test: renders bullet list items
// Test: returns null for empty array
// Test: returns null for undefined
```

Note: Server component testing may require the project's existing test setup for async components. Check `guide-listing-card.test.tsx` for patterns.

### Step 3: Run CI Pipeline
```bash
# Sequential — each must pass before next
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

### Step 4: Visual Verification (Manual)
1. Start dev server: `npm run dev`
2. Desktop checks (1440px viewport):
   - Navigate to `/en/guides/anders-boysen` — verify split layout
   - Verify sidebar: photo, name, tagline, gold divider, tour languages, areas, credentials, also speaks
   - Verify right column: breadcrumb, about heading, bio text, divider, expertise bullets, quote card, approach, guest feedback, tours grid (2-col)
   - Navigate to `/en/guides/jack-voldstad` — verify new guide renders with photo
3. Mobile checks (375px viewport):
   - Same URLs — verify stacked layout
   - Verify sticky CTA bar at bottom
   - Verify header card with centered photo/name/tagline
4. Locale checks:
   - `/sv/guides/sabine-gruen` — Swedish throughout
   - `/de/guides/sabine-gruen` — German throughout
5. Null-safety check:
   - If any guide has empty optional fields, verify no empty cards appear

### Step 5: Fix Issues
- Address any test failures, lint errors, type errors, or visual bugs
- Re-run pipeline after fixes

## Todo

- [ ] Update `verify-guide-import.ts` with new field checks
- [ ] Run verify script — 0 errors
- [ ] Write test: `guide-expertise-section.test.tsx`
- [ ] Write test: `guide-quote-section.test.tsx`
- [ ] Write test: `guide-approach-section.test.tsx`
- [ ] Write test: `guide-guest-feedback-section.test.tsx`
- [ ] Run `npm run lint` — pass
- [ ] Run `npx tsc --noEmit` — pass
- [ ] Run `npm run test` — all pass, no regressions
- [ ] Run `npm run build` — pass
- [ ] Visual check: desktop 1440px (2 guides)
- [ ] Visual check: mobile 375px (2 guides)
- [ ] Visual check: SV locale
- [ ] Visual check: DE locale
- [ ] Visual check: Jack Voldstad (new guide)
- [ ] Verify no hydration errors in browser console

## Success Criteria
- Verify script: 0 errors for all 12 guides + new fields
- All existing 1009+ tests pass
- New component tests pass (4 new test files)
- `npm run lint` exits 0
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0
- Desktop layout matches Option B design spec
- Mobile layout matches Option B design spec
- All 3 locales render correct translated content
- No console errors or hydration mismatches

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server component tests need special async setup | Medium | Medium | Follow existing test patterns in codebase; use renderAsync if available |
| Build fails due to missing data at build time | Low | High | Ensure CMS is running and accessible during build |
| Visual regression in guide listing page | Low | Medium | Listing uses separate components; spot-check listing page too |

## Security Considerations
- No new attack surfaces
- Verify no PII (email/phone) leaks into frontend HTML

## Next Steps
- After all checks pass: commit, push, create PR
- Update `docs/development-roadmap.md` if guide profile redesign is a tracked milestone
