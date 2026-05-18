---
plan: wpt-free-tier-multi-location-audit
title: "Free-Tier Multi-Location Lighthouse Audit (Playwright + WPT Starter)"
description: "Manual on-demand TypeScript tool. Playwright drives the WebPageTest Starter web UI to submit 30 Lighthouse audits/run (3 pages × 2 form factors × 5 locations), then collects results via the public jsonResult.php endpoint. Renders a self-contained HTML dashboard with diff-vs-previous-run. Stays on $0 free tier."
status: not-started
priority: P1
effort: 5-7h
branch: master
created: 2026-05-17
tags: [performance, lighthouse, accessibility, webpagetest, catchpoint, playwright, tooling, perf, staging, free-tier]
blockedBy: []
blocks: []
supersedes: [plans/260516-2135-multi-location-lighthouse-report]
related:
  - plans/260514-1506-go-live-readiness-review/      # Performance validation feeds go-live readiness signoff
  - plans/260516-1716-bokun-tour-detail-widget-load-fix/  # Bokun widget dominates TourDetails LCP — measurement caveat documented in dashboard
context:
  predecessor: plans/260516-2135-multi-location-lighthouse-report/  # Original API-based plan; superseded after WPT free-API was discontinued
  revalidation_research: ./research/researcher-wpt-catchpoint-status-revalidation.md
  brainstorm: plans/reports/brainstormer-260516-2135-multi-location-lighthouse-report.md
  existing_reports: perf/local Lighthouse report/  # Single-origin baseline (Stockholm)
---

# Free-Tier Multi-Location Lighthouse Audit (Playwright + WPT Starter)

## Summary

Local TypeScript script (`scripts/lighthouse-multi-location.ts`) orchestrates 30 Lighthouse runs per invocation (3 pages × 2 form factors × 5 locations) by driving the **WebPageTest Starter web UI via headless Playwright** (the Catchpoint free tier blocks the submit API). Submitter captures `testId` from the result page URL; a separate fetcher polls the **public** `jsonResult.php` endpoint (no API key needed for retrieval). Parser builds typed `SummaryFile`; renderer emits self-contained HTML dashboard with diff-vs-previous-run. Artefacts commit to `perf/multi-location-{YYMMDD-HHmm}/`. **Cost: $0; recurring cost: $0.** WPT Starter quota (150 tests/month) supports ~5 full audits/month — fits "pre-deploy / major release" cadence comfortably.

## Why this plan supersedes the predecessor

Predecessor (`plans/260516-2135-multi-location-lighthouse-report/`) assumed a free WebPageTest public API key (`getkey.php` → `runtest.php?k=...`). On 2026-05-17 verification:
- `runtest.php` returns **HTTP 403** without a Pro API key (Catchpoint paywall, ~$15-18.75/mo)
- `getkey.php` no longer issues free keys (deprecated post Oct-2025 Catchpoint migration)
- **`jsonResult.php` remains publicly readable** for any valid `testId` (no auth required for result fetch)

This plan replaces the API-based submitter with a browser-driven submitter and keeps the public result-fetch path. Phases 04/05/06 (renderer, diff, baseline) are reused with minor edits.

See [`research/researcher-wpt-catchpoint-status-revalidation.md`](./research/researcher-wpt-catchpoint-status-revalidation.md) for full revalidation report.

## Goals

1. Geographic visibility into Core Web Vitals + Lighthouse scores from Nordics, Western Europe, UK, US East, US West
2. Reproducible accessibility audit per page (location-independent — rendered once per page)
3. Diff-vs-previous-run highlighting regressions/improvements
4. Self-contained HTML dashboard (no server, no external CDN deps) committed for historical record
5. Total cost: $0; total recurring cost: $0

## Non-Goals

- CI/CD integration (manual on-demand only)
- Synthetic monitoring / alerting
- Real user monitoring (RUM)
- Performance budgets enforcement (separate concern)
- Self-hosted WebPageTest agents
- Use of paid Catchpoint API tiers

## Scope Boundaries

**In scope:**
- New script `scripts/lighthouse-multi-location.ts` + libs under `scripts/lib/wpt-*.ts`
- Playwright as new devDependency (browser automation only — used in dev/scripts, not app runtime)
- New `perf/multi-location-{timestamp}/` artefacts (HTML + summary.json + raw/*.json)
- One-line update to `docs/deployment-guide.md` documenting how to run

**Out of scope:**
- Any change to apps/web/* runtime code
- Changes to existing `perf/local Lighthouse report/` artefacts
- Generic "Lighthouse CI" wiring or score budgets
- Multi-environment (production / preview) — staging only for now
- Catchpoint account creation (Starter is anonymous: no signup needed for ≤9 tests/day; UI flow allows submission without login)

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Scaffolding + config + Playwright dep](./phase-01-scaffolding-config-env.md) — wpt-config.ts (5 locations × 3 pages × 2 form factors), Playwright devDependency, env validation helper, project plumbing | 30-45m | not-started |
| 02 | [WPT browser submitter (Playwright)](./phase-02-wpt-browser-submitter.md) — wpt-submitter-browser.ts: headless fills WPT form, captures testIds, bounded concurrency, retry-once, smoke flag | 1.5-2h | not-started |
| 03 | [Result fetcher + parser](./phase-03-result-fetcher-parser.md) — wpt-result-fetcher.ts (poll public jsonResult.php) + wpt-result-parser.ts (raw JSON → typed RunSummary) | 1-1.5h | not-started |
| 04 | [HTML report renderer](./phase-04-html-report-renderer.md) — report-template.ts + report-builder.ts: self-contained dashboard with scores grid, CWV table, a11y findings, Bokun caveat | 1-1.5h | not-started |
| 05 | [Diff vs previous run](./phase-05-diff-vs-previous-run.md) — report-diff.ts: locate previous summary.json, compute deltas, threshold flagging, render arrows | 30-45m | not-started |
| 06 | [Baseline run + docs](./phase-06-baseline-run-and-docs.md) — execute first end-to-end run, commit baseline, update deployment-guide.md | 30m | not-started |

## Critical Path

```
01 ──▶ 02 ──▶ 03 ──▶ 04 ──▶ 05 ──▶ 06
```

Parser (Phase 03) shape is stable contract: renderer (Phase 04) and diff (Phase 05) can be drafted in parallel once schema locked.

## File Layout

```
scripts/
  lighthouse-multi-location.ts        # CLI orchestrator (~180 LOC — slightly larger than predecessor due to submit/collect split)
  lib/
    wpt-config.ts                     # Locations, pages, form factors, thresholds (~60 LOC)
    wpt-submitter-browser.ts          # Playwright UI submit (~180 LOC)
    wpt-result-fetcher.ts             # Public jsonResult.php poll (~80 LOC)
    wpt-result-parser.ts              # Raw JSON → typed summary (~120 LOC)
    report-builder.ts                 # summary[] + previous → HTML (~120 LOC)
    report-template.ts                # Inline HTML/CSS/SVG (~180 LOC)
    report-diff.ts                    # Compare current vs previous (~100 LOC)

perf/
  multi-location-{YYMMDD-HHmm}/
    index.html                        # Self-contained dashboard
    summary.json                      # Aggregated scores (next-run diff input)
    submissions.json                  # Captured testIds per submission (durability + manual re-collect)
    raw/
      home-stockholm-mobile.json
      home-stockholm-desktop.json
      ...                             # 30 files total
```

All `scripts/lib/wpt-*.ts` files kept under 200 LOC per project rule.

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Test provider | WebPageTest Starter (Catchpoint free tier) | 150 tests/month, 30 locations, Lighthouse + a11y built-in; $0 |
| Submission path | Playwright headless (web UI) | Starter blocks API (`runtest.php` 403); UI submission works anonymously |
| Result-fetch path | Public `jsonResult.php?test={id}` | No auth required for retrieval; verified 2026-05-17 |
| Locations | Stockholm, Frankfurt, London, ec2-us-east-1, ec2-us-west-1 | User confirmed hard requirement; covers home + EU + NA |
| Form factors | mobile + desktop both | Mobile dominates tourist booking; desktop for desk research |
| Runs per test | 1 (Starter's lowest; WPT picks single result) | Saves quota; Starter's "3 runs per test" is opt-in, single-run is fine for trend |
| Trigger | Manual `npx tsx` | KISS; pre-deploy / major release cadence only |
| Cadence | Pre-deploy or major release (~2-5×/month) | Within 150-tests/mo quota (each audit = 30 tests) |
| Output format | Self-contained HTML + JSON sidecars | Human dashboard + machine-diffable record |
| Diff baseline | Latest sibling `perf/multi-location-*` folder | Simple filesystem convention; no DB or external state |
| Accessibility section | Once per page (not per location) | A11y audits are static — location-independent — avoid noise |
| Browser binary | Playwright Chromium (`npx playwright install chromium`) | Single browser; ~120MB one-time install; avoids requiring system Chrome |
| Script runtime | `tsx` (matches `generate-bokun-import.ts`) | Consistent with existing scripts |
| Concurrency cap | 2 simultaneous Playwright submissions | Be polite to free tier; UI tab-switching cost ≈ network cost |
| Submission durability | `submissions.json` written after each successful submit | Allows resume / manual re-collect if process killed mid-run |

## Success Criteria

1. Single command `npx tsx scripts/lighthouse-multi-location.ts` produces dashboard end-to-end in <25 min wall-clock (Playwright submission ~5-8 min + WPT processing ~10-15 min)
2. Dashboard opens standalone in any browser — no network requests, no missing assets
3. All 30 tests reflected as cards/rows; failed tests shown as "—" with reason, do not break rendering
4. Lighthouse scores (Perf/A11y/BP/SEO) and CWV metrics (TTFB/FCP/LCP/TBT/CLS/SI) visible per page × location × form factor
5. When a previous `perf/multi-location-*` exists, deltas render with arrows; thresholds (Δscore ≥5, ΔLCP ≥200ms) highlighted
6. `summary.json` schema stable and documented in code comments — re-renderable from raw without re-running WPT
7. `submissions.json` allows `--collect-only <run-dir>` resume mode (Phase 02 stretch goal — not blocking)
8. Zero recurring cost confirmed (no signup, no payment, no API key)

## Risk Register

| Risk | Mitigation | Phase |
|------|------------|-------|
| Playwright form-selector drift if Catchpoint redesigns WPT UI | Centralise selectors in one file; smoke flag (`--smoke`) catches drift quickly; document selector audit in deployment-guide | 02 |
| WPT Starter UI requires CAPTCHA or auth wall in future | Plan B documented: switch to manual paste-testIds mode (config-driven `submissions.json` input) | 02 |
| WPT 150-tests/mo quota exhausted | Each audit = 30 tests → ~5 audits/mo safe; cadence is pre-deploy only | 02 |
| Headless detection blocks submission | Use Playwright stealth options; randomised user-agent if needed; smoke test reveals early | 02 |
| `jsonResult.php` requires auth in future | Phase 03 fetcher detects 401/403 → fallback to scraping the HTML result page | 03 |
| Single test fails (network blip / WPT side) | Per-test try/catch; record `status: 'failed'` in summary; render "—" in dashboard | 02, 03, 04 |
| TourDetails slug changes / 404s | Centralised in `wpt-config.ts`; pre-flight smoke checks 200 before submit | 01, 02 |
| Bokun widget skews TourDetails LCP | Boilerplate caveat rendered on TourDetails card in dashboard | 04 |
| WPT response schema variance | Parser handles missing fields gracefully; unit-test with archived raw JSON sample | 03 |
| Playwright Chromium binary adds repo install cost | One-time ~120MB; documented in setup; not committed to repo | 01 |
| HTML rendering inconsistency across browsers | Use plain HTML + inline CSS; no JS frameworks; tested in Chrome + Firefox | 04 |

## Open Questions

1. Should TourDetails URL hit a specific tour slug or a stable canonical demo tour? *(Phase 01 will pick one slug and document it in `wpt-config.ts`.)*
2. Does WPT Starter UI require anonymous-user CAPTCHA on rapid submissions? *(Phase 02 smoke run verifies; if yes, raise concurrency cap discussion.)*
3. Is the Starter-tier result JSON shape identical to historical Pro-tier samples? *(Phase 03 parser handles missing fields; first real result from Phase 02 smoke validates shape.)*
4. Do we want a `--collect-only <run-dir>` resume mode for partial-failure recovery? *(Yes — Phase 02 writes `submissions.json` after each submit; resume mode is small add. Decide before Phase 02 wrap.)*

## Validation Log

### Session 1 — 2026-05-17 (revalidation trigger)
**Trigger:** User reported `webpagetest.org` redirects to `catchpoint.com/webpagetest` — questioning if predecessor plan still works.

**Research:** Spawned researcher subagent → produced [`research/researcher-wpt-catchpoint-status-revalidation.md`](./research/researcher-wpt-catchpoint-status-revalidation.md). Verified empirically:
- `GET runtest.php` → HTTP 403 (paywall)
- `GET jsonResult.php?test=fake` → HTTP 404 (endpoint reachable, no auth wall)
- Catchpoint Starter pricing (verified at catchpoint.com/pricing): $0, 150 tests/mo, 30 locations, **no API access**
- SpeedVitals free: 60 tests/mo, 10 locations, no API on free either

**Decisions:**

| Question | Choice | Rationale |
|---|---|---|
| Budget tolerance | Stay free | User confirmed 150 tests/mo Starter quota suffices for pre-deploy cadence |
| Geographic scope | Keep all 5 locations | Hard requirement; geographic CWV variance is the tool's core value |
| Test cadence | Pre-deploy / major release only | ~2-5 audits/month; well within 150-tests/mo quota |
| Submission path | Playwright headless browser | API blocked; manual paste tedious; browser automation is best balance of fragility + effort |
| Restructure | New plan dir (full rewrite) | User prefers clean break over patching superseded plan; predecessor marked superseded |

**Outcome:** Predecessor plan `260516-2135-multi-location-lighthouse-report/` marked `status: superseded`. This plan replaces it with same goals + free-tier-compatible architecture.

## Notes

- Brainstorm reference: [`plans/reports/brainstormer-260516-2135-multi-location-lighthouse-report.md`](../reports/brainstormer-260516-2135-multi-location-lighthouse-report.md) (predecessor)
- Revalidation research: [`research/researcher-wpt-catchpoint-status-revalidation.md`](./research/researcher-wpt-catchpoint-status-revalidation.md)
- WPT Starter sign-up: NOT required for anonymous submission; account only needed if hitting daily-limit guards
- Existing single-origin baseline lives in `perf/local Lighthouse report/` — keep for reference; do not modify
- Convention precedent: `scripts/generate-bokun-import.ts` + `scripts/lib/bokun-import-*.ts`
