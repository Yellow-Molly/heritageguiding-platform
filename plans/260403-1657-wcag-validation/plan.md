---
status: completed
priority: high
effort: medium
blockedBy: []
blocks: []
---

# WCAG 2.1 AA Validation Plan

**Date:** 2026-04-03
**Completed:** 2026-04-04
**Target:** WCAG 2.1 AA automated conformance on all public pages
**Approach:** Two-layer stack — eslint-plugin-jsx-a11y (dev-time) + @axe-core/playwright (CI/CD)
**PR:** #8

## Context
- Brainstorm report: `../reports/brainstorm-260403-1657-wcag-validation.md`
- Scout report: `../reports/Explore-260403-a11y-scout.md`
- Code review: `../reports/code-reviewer-260403-1807-wcag-validation.md`

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [ESLint jsx-a11y Setup](phase-01-eslint-jsx-a11y-setup.md) | completed | small |
| 2 | [Fix ESLint A11y Violations](phase-02-fix-eslint-a11y-violations.md) | completed | small |
| 3 | [Axe Playwright Tests](phase-03-axe-playwright-tests.md) | completed | medium |
| 4 | [Fix Axe Violations](phase-04-fix-axe-violations.md) | completed | medium |
| 5 | [CI/CD Integration](phase-05-cicd-integration.md) | completed | small |

## Results
- **14 axe tests:** 13 passed, 1 skipped (empty CMS), 0 failed
- **0 jsx-a11y lint errors** (9 fixed)
- **Color tokens updated:** accent `#E67E5A`→`#C05030`, gold `#C4A052`→`#856C2D`/`#C4A052` (light/dark bg), muted `#6B7280`→`#636B77`
- **24 files changed**, CI job added

## Success Criteria
- [x] Zero critical/serious axe violations on all public pages
- [x] jsx-a11y ESLint rules active with zero errors
- [x] CI pipeline blocks PRs with a11y regressions
- [x] All existing tests still pass

## Public Routes (13)
1. `/` — Homepage
2. `/tours` — Tours listing
3. `/tours/[slug]` — Tour detail
4. `/guides` — Guides listing
5. `/guides/[slug]` — Guide detail
6. `/find-tour` — Concierge wizard
7. `/about-us` — About page
8. `/contact` — Contact page
9. `/faq` — FAQ page
10. `/terms` — Terms page
11. `/privacy` — Privacy page
12. `/group-booking` — Group booking
13. `/not-found` — 404 page

## Validation Summary

**Validated:** 2026-04-03
**Questions asked:** 4

### Confirmed Decisions
- **Color contrast:** Adjust brand colors (gold/white) to pass 4.5:1 without design review cycle
- **CI strictness:** Block on critical + serious only; moderate/minor logged but don't fail CI
- **CI strategy:** Use staging URL (no local build in CI); simpler config, tests real content
- **Locale scope:** English only; WCAG violations are structural, one locale sufficient

### Action Items
- [x] Phase 5: Simplify CI job to use `STAGING_URL` instead of build+start
- [x] Phase 3: Configure axe to only fail on critical/serious impact levels
- [x] Phase 4: Freely adjust gold/contrast colors without separate design approval

## Key Files
- ESLint config: `apps/web/eslint.config.mjs`
- Axe fixture: `e2e/fixtures/test-fixtures.ts`
- Axe tests: `e2e/tests/accessibility/wcag-audit.spec.ts`
- Playwright config: `e2e/playwright.config.ts`
- CI workflow: `.github/workflows/ci.yml`
- CSS tokens: `apps/web/app/globals.css`
