# Phase 06: Tests & Cleanup

## Context Links
- Existing test: `apps/web/components/guide/__tests__/guide-listing-card.test.tsx`
- Test patterns: `apps/web/components/tour/__tests__/`
- Barrel export: `apps/web/components/guide/index.ts`

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Description:** Update existing tests for redesigned card, add tests for new components, update barrel exports.

## Key Insights
- Project has 1009 unit tests, 90%+ coverage — maintain this standard
- Existing card test needs update (DOM structure changed)
- New components need basic render + interaction tests
- Use existing test patterns (React Testing Library + Vitest)

## Requirements

### Functional
- All new components have at least 1 render test
- Filter bar tests: search input fires debounced callback, dropdown changes update params
- Load-more button: click triggers fetch, button hides when no more pages
- Card: renders all fields correctly, handles missing optional fields

### Non-Functional
- Tests run in under 5 seconds total
- No mocking of CMS data (use fixture objects)

## Related Code Files
- **Modify:** `apps/web/components/guide/__tests__/guide-listing-card.test.tsx`
- **Create:** `apps/web/components/guide/__tests__/guide-listing-hero.test.tsx`
- **Create:** `apps/web/components/guide/__tests__/guide-filter-bar.test.tsx`
- **Create:** `apps/web/components/guide/__tests__/guide-load-more-button.test.tsx`
- **Modify:** `apps/web/components/guide/index.ts` — add new exports

## Implementation Steps

1. Update `guide-listing-card.test.tsx`:
   - Update test fixture to include `tourCount` and `yearsExperience`
   - Assert circular photo renders at 140px
   - Assert stats line shows tour count and experience
   - Assert max 2 specialization badges
   - Assert credential displays
   - Test missing optional fields (no photo, no experience, no tours)

2. Create `guide-listing-hero.test.tsx`:
   - Mock `getTranslations`
   - Assert renders tag, heading, subtitle
   - Assert correct CSS classes for styling

3. Create `guide-filter-bar.test.tsx`:
   - Mock `useSearchParams`, `useRouter`, `usePathname`
   - Test search input renders with placeholder
   - Test typing triggers debounced param update
   - Test dropdown selection updates URL params
   - Test guide count displays correctly

4. Create `guide-load-more-button.test.tsx`:
   - Test button renders when currentPage < totalPages
   - Test button hidden when on last page
   - Test click triggers loading state
   - Mock fetch for next page response

5. Update `components/guide/index.ts`:
   - Add exports: `GuideListingHero`, `GuideFilterBar`, `GuideFilterDrawerMobile`, `GuideLoadMoreButton`

## Todo List
- [ ] Update card test for new DOM structure
- [ ] Create hero test
- [ ] Create filter bar test
- [ ] Create load-more button test
- [ ] Update barrel exports in `index.ts`
- [ ] Run full test suite — all pass
- [ ] Run typecheck — no errors

## Success Criteria
- All existing tests pass (no regressions)
- New component tests pass
- Coverage for new files >80%
- `npm run test` exits 0
- `npm run typecheck` exits 0

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Existing card test breaks due to DOM changes | Certain | Low | Update test assertions to match new structure |
| Mocking next-intl/navigation in tests | Low | Medium | Follow existing test patterns in codebase |

## Security Considerations
- None (test-only changes)

## Next Steps
- Plan complete. Ready for implementation.
