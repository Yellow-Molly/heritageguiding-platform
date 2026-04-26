# Phase 07 — QA, Drift Verification, Launch

**Priority:** P1
**Status:** pending
**Effort:** 1h
**Depends on:** Phases 03, 04, 05, 06

## Context Links

- All previous phase files in this plan

## Overview

End-to-end validation that per-tour cancellation policy is consistent across tour detail, FAQ, `/cancellation`, AND matches what Bokun enforces at checkout.

## Key Insights

- **Drift check is the critical test.** Pick 5 tours spanning different policy shapes; compare our rendered terms to Bokun checkout terms manually.
- Inquiry tours (no Bokun ID) must render global default cleanly.
- Regression: ensure existing tour pages without policy data still load.

## Requirements

### Functional QA Checklist

**Per-tour coverage (pick 5 tours):**
1. One tour with standard 24h/2h tiers.
2. One tour with stricter terms (e.g., non-refundable close to start).
3. One premium tour with unique tiers if any exist.
4. One inquiry-only tour (no `bokunExperienceId`).
5. One tour with non-English primary locale content.

**Per tour, verify:**
- [ ] Sidebar badge renders with correct derived label.
- [ ] Clicking badge scrolls smoothly to `#cancellation-policy` section.
- [ ] Dedicated section lists rules in descending hours order.
- [ ] Localized `notes` render (if present) with correct formatting.
- [ ] "Final terms confirmed at checkout" microcopy present.
- [ ] "Learn how our cancellation system works" links to `/cancellation`.
- [ ] For inquiry tour: "standard policy" fallback note present; uses `GLOBAL_DEFAULT_CANCELLATION_POLICY` values.

**Bokun drift check (Bokun-linked tours only):**
- [ ] Open Bokun widget / checkout in parallel tab.
- [ ] Compare cancellation terms shown. Report deltas — any drift = blocker.

**Cross-page consistency:**
- [ ] `/cancellation` page copy matches new framing; CTA goes to `/tours`.
- [ ] `/faq` cancellation Q&As link to correct destinations and work.
- [ ] Platform-wide "we cancel → 100%" guarantee appears in at least 2 places (tour section optional, /cancellation prose yes, FAQ Q3 yes).

**Locale check:**
- [ ] `/en`, `/sv`, `/de` — no missing i18n key warnings in server logs.
- [ ] Flagged `[TODO-TRANSLATE]` markers not visible in production build (translator passes complete, or staging only).

**Accessibility:**
- [ ] Keyboard tab through booking sidebar → badge is focusable.
- [ ] Screen reader announces section heading and list.
- [ ] Sticky header does not obscure scroll target (verify `scroll-margin-top`).

**Regression:**
- [ ] Existing tours without Bokun ID: no errors, fallback renders.
- [ ] Booking widget (Bokun embed) still loads and functions for Bokun-linked tours.
- [ ] Existing `/cancellation` page loads across all 3 locales without errors.

### Non-functional
- No perf regression on tour detail page (Lighthouse quick check).
- No new console errors in browser devtools across checked pages.

## Related Code Files

**Read-only verification** — no code changes in this phase except tiny fixes found during QA.

## Implementation Steps

1. Run Bokun sync on staging (`npm run sync:cancellation` with `--apply`).
2. Walk QA checklist above on staging environment.
3. Record deltas in `reports/qa-staging-260419.md` (or appropriate dated name).
4. Fix any issues found; loop back to affected phase.
5. Translator review complete for flagged keys; production-ready values in sv.json and de.json.
6. Merge to master, deploy.
7. Smoke check production: 1 random tour, /cancellation, /faq.
8. Archive brainstorm + mark this plan `status: completed` in frontmatter.

## Todo List

- [ ] Bokun sync on staging
- [ ] QA checklist walk-through (5 tours)
- [ ] Drift check against Bokun checkout
- [ ] Cross-page consistency check
- [ ] Locale + a11y checks
- [ ] Regression check (non-Bokun tours, Bokun widget)
- [ ] Translator final pass
- [ ] Merge + deploy
- [ ] Production smoke check
- [ ] Mark plan completed

## Success Criteria

- Zero drift vs. Bokun checkout on all sampled tours.
- Zero contradictions across tour detail / FAQ / /cancellation.
- Zero i18n warnings in logs.
- Zero regressions on existing tours.
- Translator-approved copy live in all 3 locales.

## Risk Assessment

- **Drift found** → root cause in Phase 03 mapper; fix, re-sync, re-test.
- **Bokun widget shows different terms than our page** → user-facing inconsistency; highest-severity defect. Treat as launch blocker.
- **Translator delay** → can ship with en only if business accepts, or hold full launch until sv/de ready. Decide with stakeholder.

## Security Considerations

- None specific. Confirm no dev secrets or probe-script artifacts accidentally pushed.

## Next Steps

Post-launch (out of scope for this plan, backlog candidates):
- Scheduled cancellation sync (cron) to prevent drift.
- Admin stale-sync warning (>30 days old).
- Per-tour reschedule-policy field if demand emerges.
- Analytics: track FAQ Q&A click-throughs to tour pages.
