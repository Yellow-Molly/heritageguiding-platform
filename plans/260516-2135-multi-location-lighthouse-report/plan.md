---
plan: multi-location-lighthouse-report
title: "Free Multi-Location Lighthouse Report for Staging"
description: "Manual on-demand TypeScript tool that submits Lighthouse + accessibility audits to the WebPageTest public API from 5 global locations × 3 pages × 2 form factors, generates a self-contained HTML dashboard with diff-vs-previous-run, commits results under perf/."
status: superseded
supersededBy: plans/260517-1102-wpt-free-tier-multi-location-audit
supersededAt: 2026-05-17
supersededReason: "WebPageTest free public API discontinued post-Catchpoint migration (Oct 2025). `runtest.php` now returns HTTP 403 without paid Pro API key. Replacement plan uses Playwright to drive the WPT Starter web UI (anonymous, free) and the still-public `jsonResult.php` endpoint for result fetch."
priority: P1
effort: 4-6h
branch: master
created: 2026-05-17
tags: [performance, lighthouse, accessibility, webpagetest, tooling, perf, staging, superseded]
blockedBy: []
blocks: []
related:
  - plans/260514-1506-go-live-readiness-review/      # Performance validation feeds go-live readiness signoff
  - plans/260516-1716-bokun-tour-detail-widget-load-fix/  # Bokun widget dominates TourDetails LCP — measurement caveat documented in dashboard
context:
  brainstorm: plans/reports/brainstormer-260516-2135-multi-location-lighthouse-report.md
  existing_reports: perf/local Lighthouse report/  # Single-origin baseline (Stockholm)
  revalidation_research: plans/260517-1102-wpt-free-tier-multi-location-audit/research/researcher-wpt-catchpoint-status-revalidation.md
---

> ⚠️ **SUPERSEDED 2026-05-17** — WebPageTest free public API discontinued under Catchpoint migration. See [`plans/260517-1102-wpt-free-tier-multi-location-audit/`](../260517-1102-wpt-free-tier-multi-location-audit/plan.md) for the replacement plan (Playwright + WPT Starter UI). Phases 04/05/06 of this plan are reused there with minor edits; Phases 01/02/03 were rewritten.

# Free Multi-Location Lighthouse Report for Staging

## Summary

Build a local TypeScript script (`scripts/lighthouse-multi-location.ts`) that orchestrates 30 Lighthouse runs per invocation (3 pages × 2 form factors × 5 locations) via the **free WebPageTest public API**, parses results into a typed summary, renders a self-contained HTML dashboard with delta-vs-previous-run, and commits the dashboard + raw JSON to `perf/multi-location-{YYMMDD-HHmm}/`. No paid services, no recurring infra. Manual trigger (`npx tsx scripts/lighthouse-multi-location.ts`).

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

## Scope Boundaries

**In scope:**
- New script `scripts/lighthouse-multi-location.ts` + libs under `scripts/lib/wpt-*.ts`
- WPT_API_KEY documented in `.env.local` (gitignored)
- New `perf/multi-location-{timestamp}/` artifacts (HTML + summary.json + raw/*.json)
- One-line update to `docs/deployment-guide.md` documenting how to run

**Out of scope:**
- Any change to apps/web/* runtime code
- Changes to existing `perf/local Lighthouse report/` artifacts
- Generic "Lighthouse CI" wiring or score budgets
- Multi-environment (production / preview) — staging only for now

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Scaffolding + config + env wiring](./phase-01-scaffolding-config-env.md) — wpt-config.ts, .env.local key documentation, env validation helper, project plumbing | 30m | not-started |
| 02 | [WPT API client](./phase-02-wpt-api-client.md) — wpt-client.ts: submit, poll with backoff, parallel orchestration, retries, smoke test | 1-1.5h | not-started |
| 03 | [Result parser](./phase-03-result-parser.md) — wpt-result-parser.ts: raw WPT JSON → typed summary including Lighthouse scores, CWV, a11y audits | 45m-1h | not-started |
| 04 | [HTML report renderer](./phase-04-html-report-renderer.md) — report-template.ts + report-builder.ts: self-contained dashboard with scores grid, CWV table, a11y findings, Bokun caveat | 1-1.5h | not-started |
| 05 | [Diff vs previous run](./phase-05-diff-vs-previous-run.md) — report-diff.ts: locate previous summary.json, compute deltas, threshold flagging, render arrows | 30-45m | not-started |
| 06 | [Baseline run + docs](./phase-06-baseline-run-and-docs.md) — execute first end-to-end run, commit baseline, update deployment-guide.md | 30m | not-started |

## Critical Path

```
01 ──▶ 02 ──▶ 03 ──▶ 04 ──▶ 05 ──▶ 06
                              │
03 and parser unit tests can run in parallel with 04 (renderer) once parser shape is locked.
```

## File Layout

```
scripts/
  lighthouse-multi-location.ts        # CLI orchestrator (~150 LOC)
  lib/
    wpt-config.ts                     # Locations, pages, form factors, thresholds (~60 LOC)
    wpt-client.ts                     # WPT REST submit + poll (~150 LOC)
    wpt-result-parser.ts              # Raw JSON → typed summary (~120 LOC)
    report-builder.ts                 # summary[] + previous → HTML (~120 LOC)
    report-template.ts                # Inline HTML/CSS/SVG (~180 LOC)
    report-diff.ts                    # Compare current vs previous (~100 LOC)

perf/
  multi-location-{YYMMDD-HHmm}/
    index.html                        # Self-contained dashboard
    summary.json                      # Aggregated scores (next-run diff input)
    raw/
      home-stockholm-mobile.json
      home-stockholm-desktop.json
      ...                             # 30 files total
```

All `scripts/lib/wpt-*.ts` files kept under 200 LOC per project rule. Existing `scripts/lib/bokun-import-*.ts` modules establish the pattern.

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Test provider | WebPageTest public API | Real Chrome in real datacenters; 200 free tests/day; Lighthouse + a11y built-in; no infra |
| Locations | Stockholm, Frankfurt, London, ec2-us-east-1, ec2-us-west-1 | Covers home market + EU + NA — user-confirmed target audience |
| Form factors | mobile + desktop both | Mobile is dominant for tourist booking; desktop for desk research segment |
| Runs per test | 3 (WPT picks median) | Reduces variance; still fits 30 tests / 200/day quota |
| Trigger | Manual `npx tsx` | KISS; no CI overhead for occasional pre-deploy check |
| Output format | Self-contained HTML + JSON sidecar | Human dashboard + machine-diffable record |
| Diff baseline | Latest sibling `perf/multi-location-*` folder | Simple filesystem convention; no DB or external state |
| Accessibility section | Once per page (not per location) | A11y audits are static analysis — location-independent — avoid noise |
| API key storage | `.env.local` (already gitignored) | Project convention |
| Script runtime | `tsx` (matches `generate-bokun-import.ts`) | Consistent with existing scripts |

## Success Criteria

1. Single command `npx tsx scripts/lighthouse-multi-location.ts` produces dashboard end-to-end in <20 min wall-clock
2. Dashboard opens standalone in any browser — no network requests, no missing assets
3. All 30 tests reflected as cards/rows; failed tests shown as "—" with reason, do not break rendering
4. Lighthouse scores (Perf/A11y/BP/SEO) and CWV metrics (TTFB/FCP/LCP/TBT/CLS/SI) visible per page × location × form factor
5. When a previous `perf/multi-location-*` exists, deltas render with arrows; thresholds (Δscore ≥5, ΔLCP ≥200ms) highlighted
6. `summary.json` schema stable and documented in code comments — re-renderable from raw without re-running WPT
7. Zero recurring cost confirmed (no signup beyond free WPT key)

## Risk Register

| Risk | Mitigation | Phase |
|------|------------|-------|
| WPT API rate-limit / throttle mid-run | Submit in batches; poll with exponential backoff; cap parallel submissions at 6 | 02 |
| Single test fails (network blip / WPT side) | Per-test try/catch; record `status: 'failed'` in summary; render "—" in dashboard | 02, 03, 04 |
| TourDetails slug changes / 404s | Centralised in `wpt-config.ts`; smoke test checks 200 before submit | 01, 02 |
| Bokun widget skews TourDetails LCP | Boilerplate caveat rendered on TourDetails card in dashboard | 04 |
| WPT response schema variance | Parser handles missing fields gracefully; unit-test with archived raw JSON sample | 03 |
| Free 200/day quota exhausted (rare) | Each run = 30 tests; retries doubled = 60; ~3 runs/day safe | 02 |
| WPT_API_KEY leaks via committed `.env.example` | `.env.example` shows placeholder only; raw JSON contains no secrets | 01 |
| HTML rendering inconsistency across browsers | Use plain HTML + inline CSS; no JS frameworks; tested in Chrome + Firefox | 04 |

## Open Questions

1. Should TourDetails URL hit a specific tour slug or a stable canonical demo tour? *(Phase 01 will pick one slug and document it in `wpt-config.ts`.)*
2. Do we want a "skip diff" CLI flag for first-time runs? *(Phase 05 will add `--no-diff`; first run skips automatically if no prior folder.)*
3. Should we archive WPT test IDs in `summary.json` for re-fetch? *(Yes — Phase 03 includes `wptTestId` per entry; cheap insurance.)*

## Notes

- Brainstorm reference: [`plans/reports/brainstormer-260516-2135-multi-location-lighthouse-report.md`](../reports/brainstormer-260516-2135-multi-location-lighthouse-report.md)
- Free WPT API key: https://www.webpagetest.org/getkey.php (one-time, no payment)
- Existing single-origin baseline lives in `perf/local Lighthouse report/` — keep for reference; do not modify
- Convention precedent: `scripts/generate-bokun-import.ts` + `scripts/lib/bokun-import-*.ts`
