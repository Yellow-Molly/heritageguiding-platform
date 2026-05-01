---
phase: 2
title: "Measurement Infrastructure"
status: pending
priority: P1
effort: 1 day (~6h)
---

# Phase 2: Measurement Infrastructure

## Context
- [Plan overview](plan.md)
- [Brainstorm report](../reports/brainstorm-260501-1559-staging-perceived-performance.md)
- **Soft dependency:** [`260404-1815-performance-overhaul/phase-05-validation.md`](../260404-1815-performance-overhaul/phase-05-validation.md) — Lighthouse CI threshold restore. Verify status; absorb if abandoned.
- Phase 1 can ship before Phase 2 finishes — no hard dependency.

## Overview
Without numbers, optimization is guesswork. Build measurement layer to drive Phase 3 fix decisions.

Three tracks:
1. **Lighthouse CI** — fix or verify (coordinate with `260404` Phase 5).
2. **Bundle analyzer** — identify heavy chunks.
3. **Web Vitals validation + baseline** — confirm RUM pipeline + record current state on 5 routes.

## Key Insights
- `lighthouserc.js` exists at `apps/web/lighthouserc.js`. Workflow at `.github/workflows/lighthouse-ci.yml`. User says CI broken.
- Web Vitals reporter exists in `components/analytics/web-vitals-reporter.tsx` and route at `app/api/analytics/vitals` — never confirmed firing in prod.
- Free Vercel plan limits Speed Insights — user upgrading to Pro soon.
- `260404` Phase 1 marked complete (CI workflow updated with secrets), Phase 5 pending (threshold restore + final validation).

## Requirements

### Functional
- Lighthouse CI runs on every PR, reports performance scores.
- `npm run analyze` (or `ANALYZE=true npm run build`) emits bundle treemap.
- Web Vitals events visible in DB / logs from production traffic.
- Baseline captured: Lighthouse mobile scores for `/`, `/sv/tours`, `/sv/tours/[slug]`, `/sv/guides`, `/sv/find-tour`. Saved as JSON snapshot in `plans/260501-1559-staging-perceived-performance/baselines/`.

### Non-functional
- CI run time stays under 5min.
- Bundle analyzer disabled by default (no production overhead).

## Architecture

### Track A: Lighthouse CI Coordination

1. **Check `260404` Phase 5 status** first — if validation already done, skip to Track B.
2. **If still pending:** absorb work — fix CI workflow, restore threshold to 0.9, verify run.

### Track B: Bundle Analyzer

```ts
// next.config.ts (modify)
import withBundleAnalyzer from '@next/bundle-analyzer'
const bundleAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
export default withNextIntl(withPayload(bundleAnalyzer(nextConfig)))
```

```json
// apps/web/package.json — add script
"analyze": "ANALYZE=true next build"
```

### Track C: Web Vitals Validation + Baseline

1. Verify `web-vitals-reporter.tsx` mounted in root layout.
2. Hit staging from mobile, check `/api/analytics/vitals` log/DB for events.
3. If not firing → debug (rate limit? CSP? client error?).
4. Run Lighthouse mobile on 5 routes (local or via fixed CI), save snapshot.

## Related Code Files

### Files to modify
- `apps/web/next.config.ts` — add bundle analyzer wrapper
- `apps/web/package.json` — add `analyze` script, add `@next/bundle-analyzer` dep
- `.github/workflows/lighthouse-ci.yml` — only if `260404` Phase 5 abandoned
- `apps/web/lighthouserc.js` — restore threshold to 0.9 (only if `260404` left at 0.7)

### Files to read for context
- `apps/web/components/analytics/web-vitals-reporter.tsx`
- `apps/web/app/api/analytics/vitals/route.ts`
- `apps/web/app/(site)/[locale]/layout.tsx` — verify reporter mounted
- `plans/260404-1815-performance-overhaul/phase-05-validation.md` — coordinate

### Files to create
- `plans/260501-1559-staging-perceived-performance/baselines/lighthouse-baseline-260501.json`
- `plans/260501-1559-staging-perceived-performance/baselines/web-vitals-baseline-260501.md`

## Implementation Steps

### Step 1: Coordinate with 260404 Phase 5 (0.5h)
1. Read `260404-1815-performance-overhaul/phase-05-validation.md` — check actual completion vs status.
2. Run `lhci autorun` locally — confirm CI passes/fails.
3. Decision:
   - If CI green and threshold at 0.9 → mark `260404` Phase 5 complete, skip Track A.
   - If CI broken → absorb fix here, mark `260404` Phase 5 superseded.
4. Update both plans' statuses accordingly.

### Step 2: Track B — Bundle Analyzer (1h)
1. `npm i -D @next/bundle-analyzer` in `apps/web/`.
2. Wrap config in `next.config.ts`.
3. Add `analyze` script to `package.json`.
4. Run `npm run analyze` — capture treemap output (`.next/analyze/client.html`).
5. Identify top 5 heaviest client chunks. Save list to baseline.

### Step 3: Track C — Web Vitals Validation (1h)
1. Verify `<WebVitalsReporter />` mounted in `[locale]/layout.tsx`.
2. Open staging on mobile.
3. Inspect Network tab for `/api/analytics/vitals` POSTs.
4. If not firing:
   - Check CSP `connect-src` allows self-origin (it does per `next.config.ts:142`).
   - Check rate limit not blocking (`apps/web/app/api/analytics/vitals/route.ts`).
   - Check console for client errors.
   - Check `useReportWebVitals` hook properly imported.
5. If firing: confirm DB/log destination receiving events.

### Step 4: Capture Baseline (2.5h)
1. Run Lighthouse mobile on 5 URLs:
   - `https://staging.privatetours.se/sv`
   - `https://staging.privatetours.se/sv/tours`
   - `https://staging.privatetours.se/sv/tours/{popular-slug}`
   - `https://staging.privatetours.se/sv/guides`
   - `https://staging.privatetours.se/sv/find-tour`
2. Record per URL: Performance, LCP, INP, TTFB, FCP, TBT, CLS.
3. Save as JSON in `baselines/` folder.
4. Cross-reference with bundle analyzer findings.
5. Document Top 3 hypotheses for Phase 3 (e.g., "TTFB high on /tours due to uncached query").

### Step 5: Pro upgrade prep (0.5h, async)
1. Document steps to enable Vercel Speed Insights once Pro upgrade lands.
2. Add to plan as follow-up note for user.

### Step 6: Decision package (0.5h)
1. Write decision summary to `baselines/measurement-summary-260501.md`.
2. Identify which Phase 3 branch to take (TTFB / INP / LCP / TBT decision tree from brainstorm).

## Todo List
- [ ] Read `260404` Phase 5 status, decide absorb vs skip
- [ ] Install `@next/bundle-analyzer`, add to `next.config.ts`
- [ ] Add `analyze` script to `package.json`
- [ ] Run `npm run analyze`, save heavy-chunks list
- [ ] Verify Web Vitals reporter mounted
- [ ] Verify Web Vitals events firing on staging
- [ ] Run Lighthouse mobile on 5 URLs, capture baseline JSON
- [ ] Document Top 3 hypotheses for Phase 3
- [ ] Document Speed Insights enablement steps for Pro upgrade
- [ ] Write `measurement-summary-260501.md` decision package

## Success Criteria
- Lighthouse CI green (or absorbed work delivered green CI).
- Bundle analyzer runnable via `npm run analyze`, treemap captured.
- Web Vitals events confirmed firing in production.
- Baseline JSON snapshot saved with 5-route metrics.
- Phase 3 decision package written — clear top 3 priorities identified.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `260404` Phase 5 work conflicts with our Lighthouse fix | Medium | Medium | Read first, coordinate before editing CI workflow |
| Web Vitals reporter never fired in prod (silent failure) | Medium | Medium | Debug in Step 3, escalate if blocked |
| Bundle analyzer build fails in monorepo | Low | Low | Use stable version, test locally first |
| Lighthouse CI run time >5min on free GH minutes | Low | Low | Cache `.next` build, parallelize URL checks |

## Security Considerations
- Bundle analyzer output (`.next/analyze/`) must not be deployed — verify `.gitignore` excludes.
- Lighthouse CI secrets remain in GitHub Actions Secrets — never logged.

## Next Steps
- Phase 3: data-driven targeted fixes based on baseline + analyzer output.
