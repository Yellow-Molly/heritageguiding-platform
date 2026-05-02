# Manual Verification — 2026-05-02

Status: **template — populate during local-dev / staging walkthrough.**

## Scenario matrix (from `phase-05-tests-verification.md`)

| # | Scenario | Route | Expected | Actual | Status |
|---|----------|-------|----------|--------|--------|
| 1 | Click 3 category chips rapidly (mobile) | /tours | All 3 flip instantly, overlay shows, final state matches URL | _pending_ | ☐ |
| 2 | Click 3 category chips rapidly (desktop sidebar) | /tours | Same | _pending_ | ☐ |
| 3 | Type search query | /tours | Debounced (500ms), URL `replace`, instant input echo | _pending_ | ☐ |
| 4 | Change sort | /tours | Instant flip, overlay, server resolves | _pending_ | ☐ |
| 5 | Open drawer, toggle multiple, close | /tours mobile | Each toggle commits per-change, drawer close ≠ Apply trigger | _pending_ | ☐ |
| 6 | Deep-link `/tours?categories=foo,bar` | /tours | Initial render matches URL, no flash | _pending_ | ☐ |
| 7 | Browser back/forward across filter changes | /tours | State reverts cleanly, overlay shows during refetch | _pending_ | ☐ |
| 8 | Filter change during infinite-scroll load-more | /tours | Old fetch discarded (existing generationRef), no double-render | _pending_ | ☐ |
| 9 | Repeat 1–8 on /guides | /guides | Same | _pending_ | ☐ |

## Lighthouse mobile (staging)

Run 3× per route, take median, compare to Phase 18 perceived-performance baseline.

| Route | LCP | TTI | CLS | TBT | Δ vs baseline | Pass (<5%) |
|-------|-----|-----|-----|-----|---------------|------------|
| /tours | _pending_ | | | | | ☐ |
| /guides | _pending_ | | | | | ☐ |

## Findings / Deviations
_populate after run_

## Sign-off
- [ ] All 9 scenarios pass
- [ ] Lighthouse no >5% regression
- [ ] Phase 01 staging baselines populated → decision applied → Phase 06 cleanup actioned
