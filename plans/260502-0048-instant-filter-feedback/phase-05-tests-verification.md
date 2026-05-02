---
phase: 05
title: Tests + Manual Verification
status: tests complete (manual matrix pending)
priority: high
effort: 45m
depends: [03, 04]
---

# Phase 05 — Tests + Manual Verification

## Context Links
- Brainstorm: `plans/reports/brainstorm-260501-1949-instant-filter-feedback.md` (§ "Validation plan")

## Overview
**Priority:** High (ship gate)
**Status:** Pending (blocked by 03 + 04)

Update existing tests to assert optimistic state. Run manual verification matrix from brainstorm. Lighthouse staging sanity check for LCP/TTI regression.

## Key Insights
- Existing `category-chips.test.tsx` likely mocks `useRouter` and asserts `router.push` was called — must ALSO assert chip's `aria-selected` flips before `router.push` resolves
- React Testing Library's `waitFor` with `act()` handles transitions; `useOptimistic` updates synchronously inside transition
- Manual verification matrix is already validation-grade per brainstorm — codify outcomes in this phase's report

## Requirements
**Functional**
- `category-chips.test.tsx` asserts optimistic state path
- New test (or extension) covers conflict path: optimistic flip → server resolves with different state → UI reverts to server truth
- All previously-passing tests still pass

**Non-functional**
- Test additions <50 LOC total (KISS)
- No fake timers gymnastics — use RTL's natural async helpers

## Architecture
N/A (verification phase)

## Related Code Files
**Modified:**
- `apps/web/components/tour/filter-bar/__tests__/category-chips.test.tsx`

**Created (optional, only if existing test file structure forces it):**
- `apps/web/components/tour/__tests__/filter-state-provider.test.tsx` — unit-level provider behavior

## Implementation Steps

### Test updates
1. Read current `category-chips.test.tsx` to understand mocking style
2. Wrap render in test helper that includes `<FilterStateProvider>`
3. Add assertion: after click, `chip` has `aria-selected="true"` synchronously (before any router resolution)
4. Add assertion: `router.push` called with expected URL
5. (Optional) Add provider unit test covering: setParam, toggleListItem add+remove, clearAll, replace vs push routing

### Manual verification matrix (record results in `reports/manual-verification-260502.md`)
| # | Scenario | Route | Expected | Actual |
|---|----------|-------|----------|--------|
| 1 | Click 3 category chips rapidly (mobile) | /tours | All 3 flip instantly, overlay shows, final state matches URL | |
| 2 | Click 3 category chips rapidly (desktop sidebar) | /tours | Same | |
| 3 | Type search query | /tours | Debounced (500ms), URL replaces (no history pollution), instant input echo | |
| 4 | Change sort | /tours | Instant flip, overlay, server resolves | |
| 5 | Open drawer, toggle multiple, close | /tours mobile | Each toggle commits per-change, drawer close ≠ Apply trigger | |
| 6 | Deep-link `/tours?categories=foo,bar` | /tours | Initial render matches URL, no flash | |
| 7 | Browser back/forward across filter changes | /tours | State reverts cleanly, overlay shows during refetch | |
| 8 | Filter change during infinite-scroll load-more | /tours | Old fetch discarded (existing generationRef), no double-render | |
| 9 | Repeat 1–8 on /guides (substituting guide-specific filters) | /guides | Same | |

### Lighthouse sanity (staging)
1. Run mobile Lighthouse on `/tours` and `/guides` after Phase 03 + 04 ship to staging
2. Compare LCP, TTI, CLS, TBT against Phase 3 perceived-performance baseline
3. Pass criteria: no metric regresses by >5%

## Todo List
- [ ] Read existing `category-chips.test.tsx`
- [ ] Add test helper that wraps with `<FilterStateProvider>`
- [ ] Add optimistic-state assertion
- [ ] (Optional) Add provider unit test
- [ ] `npm test` passes
- [ ] Manual verification scenarios 1–9 (record in `reports/manual-verification-260502.md`)
- [ ] Lighthouse mobile staging — confirm no >5% regression
- [ ] Document any deviations or edge-case findings

## Success Criteria
- All tests green (no skips, no `.only`)
- All 9 manual scenarios pass with captured evidence
- Lighthouse mobile: LCP, TTI, CLS, TBT within ±5% of pre-change baseline
- Report file `reports/manual-verification-260502.md` exists with filled-in matrix

## Risk Assessment
- **Risk:** Test helper duplication across consumer test files. **Mitigation:** If 2+ tests need it, extract to `apps/web/test-utils/filter-state-render.tsx`
- **Risk:** Lighthouse on staging is noisy; one bad run ≠ regression. **Mitigation:** Run 3 passes per route, take median
- **Risk:** Manual verification depends on staging availability. **Mitigation:** Local dev acceptable for scenarios 1–8; staging required only for Lighthouse and scenario 7 history behavior

## Security
- N/A

## Next Steps
- Phase 06 cleanup runs after verification passes
