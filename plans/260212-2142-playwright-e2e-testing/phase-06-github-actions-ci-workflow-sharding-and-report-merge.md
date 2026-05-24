# Phase 06: GitHub Actions CI Workflow - Sharding + Report Merge

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: All previous phases (01-05)
- **Research**: [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- **Existing CI**:
  - `.github/workflows/ci.yml` (lint, type-check, build)
  - `.github/workflows/lighthouse-ci.yml` (PR Preview perf audit — already shipped 2026-04)

## Overview
- **Date**: 2026-02-12 (rewritten 2026-05-19)
- **Priority**: MEDIUM
- **Effort**: 2h
- **Implementation Status**: Pending
- **Review Status**: Not started

Add a dedicated GitHub Actions workflow for Playwright E2E tests. Trigger: `workflow_dispatch` only (on-demand manual). Strategy: 3-browser matrix (chromium / firefox / webkit) × 4 shards = 12 parallel jobs, with `blob` reporter and a downstream merge job that publishes a single HTML report. **Leave `ci.yml` and `lighthouse-ci.yml` untouched.** Lighthouse CI continues to own performance budgets on every PR Preview; Playwright runs on demand against staging only.

## Key Insights
- Existing `ci.yml` runs in `apps/web/` with `npm ci`; E2E lives in root `e2e/` directory
- `lighthouse-ci.yml` already enforces perf ≥0.9, a11y ≥0.95 on every PR Preview → Playwright must NOT duplicate
- Playwright `--shard=X/Y` splits tests across workers; `blob` reporter outputs partials, `merge-reports` combines
- `workflow_dispatch` supports input parameters (environment, browser selection)
- Browser install: `npx playwright install --with-deps {browser}` on Ubuntu
- Node 20 used in existing CI workflows → keep consistent (note: app runtime is Node 24, but CI runner can stay on 20 for Playwright test execution — verified compatibility with @playwright/test 1.48+)
- STAGING_URL, ADMIN_EMAIL, ADMIN_PASSWORD stored as GitHub Actions secrets
- IS_STAGING / coming-soon redirect: staging URL bypasses production redirect; tests hit staging directly

## Requirements

### Functional
- New workflow file: `.github/workflows/playwright-e2e-tests-on-demand.yml`
- Trigger: `workflow_dispatch` with two inputs: `environment` (staging/production), `browsers` (all/chromium/firefox/webkit)
- Matrix: 3 browsers × 4 shards = 12 parallel jobs when `browsers=all`
- Each job: checkout → setup Node 20 → install e2e deps → install browser → run sharded tests → upload blob report
- Merge job: download all blobs → merge → upload final HTML report
- Timeout: 30 min per shard job, 15 min for merge job
- Pass STAGING_URL + admin credentials via GitHub secrets

### Non-Functional
- No changes to existing `ci.yml` or `lighthouse-ci.yml`
- Workflow file under 200 lines
- Artifact retention: 30 days for merged report, 7 days for blob parts
- `fail-fast: false` (continue other browsers/shards if one fails)

## Architecture

```
.github/workflows/
├── ci.yml                                       # untouched: lint / type-check / build
├── lighthouse-ci.yml                            # untouched: PR Preview perf audit
└── playwright-e2e-tests-on-demand.yml           # NEW: E2E on-demand

Jobs:
  test (matrix: browser × shard)
    ├── actions/checkout@v4
    ├── actions/setup-node@v4 (node 20)
    ├── npm ci (in e2e/)
    ├── npx playwright install --with-deps {browser}
    ├── npx playwright test --project={browser} --shard={idx}/{total}
    └── actions/upload-artifact@v4 (blob-report-*)

  merge-reports (needs: test, if: always)
    ├── actions/checkout@v4
    ├── actions/setup-node@v4
    ├── npm ci (in e2e/)
    ├── actions/download-artifact@v4 (blob-report-*)
    ├── npx playwright merge-reports --reporter html
    └── actions/upload-artifact@v4 (playwright-report-merged)
```

## Related Code Files

### To Create
| File | Purpose |
|------|---------|
| `.github/workflows/playwright-e2e-tests-on-demand.yml` | On-demand E2E workflow |

### Existing (No Modification)
| File | Relevance |
|------|-----------|
| `.github/workflows/ci.yml` | Existing CI — leave untouched |
| `.github/workflows/lighthouse-ci.yml` | Perf coverage — leave untouched |
| `e2e/package.json` | E2E dependencies (Playwright 1.48+, axe-core 4.9+) |
| `e2e/playwright.config.ts` | Already configures `blob`+`github` reporters under `process.env.CI` |

## Implementation Steps

### 1. Create `.github/workflows/playwright-e2e-tests-on-demand.yml`

```yaml
name: Playwright E2E Tests

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      browsers:
        description: 'Browsers to test'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - chromium
          - firefox
          - webkit

jobs:
  test:
    name: E2E (${{ matrix.browser }} shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
    timeout-minutes: 30
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: e2e
    strategy:
      fail-fast: false
      matrix:
        browser: ${{ inputs.browsers == 'all' && fromJSON('["chromium","firefox","webkit"]') || fromJSON(format('["{0}"]', inputs.browsers)) }}
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: e2e/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browser
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          STAGING_URL: ${{ inputs.environment == 'production' && secrets.PRODUCTION_URL || secrets.STAGING_URL }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}

      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.browser }}-${{ matrix.shardIndex }}
          path: e2e/blob-report/
          retention-days: 7

  merge-reports:
    name: Merge E2E Reports
    if: always()
    needs: test
    timeout-minutes: 15
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: e2e

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: e2e/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          pattern: blob-report-*
          path: e2e/all-blob-reports
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload merged HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: e2e/playwright-report/
          retention-days: 30
```

### 2. Configure GitHub Repository Secrets

In `Settings → Secrets and variables → Actions`:

| Secret | Description | Example |
|--------|-------------|---------|
| `STAGING_URL` | Staging site base URL | `https://staging.privatetours.se` |
| `PRODUCTION_URL` | Production site base URL | `https://www.privatetours.se` |
| `ADMIN_EMAIL` | Payload CMS admin email | `admin@privatetours.se` |
| `ADMIN_PASSWORD` | Payload CMS admin password | (vault) |

### 3. Verify `e2e/playwright.config.ts` (no edit required)

Already configured (verified 2026-05-19):
```typescript
reporter: process.env.CI
  ? [['blob'], ['github']]
  : [['html'], ['json', { outputFile: 'test-results/results.json' }]],
```

### 4. Update root `.gitignore` (if not already covered)

Confirm these are ignored:
```
e2e/test-results/
e2e/playwright-report/
e2e/blob-report/
e2e/node_modules/
e2e/all-blob-reports/
```

### 5. Verify locally with `gh` CLI

```bash
gh workflow view playwright-e2e-tests-on-demand.yml
gh workflow run playwright-e2e-tests-on-demand.yml \
  --field environment=staging \
  --field browsers=chromium
```

### 6. Manual trigger from GitHub UI

1. Actions tab → "Playwright E2E Tests" → Run workflow
2. Select environment + browsers
3. After completion, download `playwright-report-merged` artifact

## Todo List
- [ ] Create `.github/workflows/playwright-e2e-tests-on-demand.yml`
- [ ] Add GitHub secrets: `STAGING_URL`, `PRODUCTION_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- [ ] Verify `e2e/package-lock.json` is committed (needed for `npm ci`)
- [ ] Confirm root `.gitignore` covers `e2e/test-results/`, `e2e/playwright-report/`, `e2e/blob-report/`, `e2e/all-blob-reports/`
- [ ] Run first dispatch with `browsers=chromium` to validate flow before fanning out
- [ ] Verify blob reports upload per shard and merge job succeeds
- [ ] Document workflow usage in `docs/deployment-guide.md` or `docs/codebase-summary.md`
- [ ] Decide whether to commit visual baselines now or after first green dispatch (recommended: commit after green)

## Success Criteria
- Workflow appears in Actions tab as "Playwright E2E Tests"
- Dispatch with `browsers=all` produces 12 parallel jobs (3 × 4)
- Dispatch with `browsers=chromium` produces 4 jobs only
- Each shard uploads a blob-report artifact (7-day retention)
- Merge job combines blobs into `playwright-report-merged` (30-day retention)
- Workflow does NOT trigger on push/PR (on-demand only)
- `ci.yml` and `lighthouse-ci.yml` remain untouched and continue to pass

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `fromJSON` matrix expression fails for single-browser input | Medium | Test with `gh workflow run` before relying |
| Blob merge fails on mismatched Playwright versions | Low | All shards install identical versions via `npm ci` |
| WebKit install slow on Ubuntu | Low | 30 min per-job timeout, `--with-deps` handles OS deps |
| 12 parallel jobs burns GitHub Actions minutes | Medium | On-demand only; reduce to 2 shards if needed |
| `STAGING_URL` missing → tests target `http://localhost:3000` and fail | High | Add explicit `if: secrets.STAGING_URL == ''` guard or assert in spec setup |
| Production dispatch hits real Bokun + sends real emails | High | `environment=production` requires manual selection; honeypot + sentinel in payloads |

## Security Considerations
- All secrets stored encrypted in GitHub Actions secret store
- Secrets auto-masked in workflow logs
- Production URL only used when explicitly selected via dispatch input
- Failure artifacts (screenshots, traces) may contain PII — 30-day retention auto-deletes
- No secrets committed to repository files
- `npm ci` uses lockfile only — no surprise dependency injection

## Next Steps
- After first green dispatch, tune shard count based on observed duration
- Consider Slack/Teams notification on workflow completion
- Consider adding workflow badge to README
- Future: optional nightly `schedule` trigger if business value justifies CI minutes
- Coordinate with Lighthouse CI ownership boundary — Playwright owns functional + visual + SEO + a11y; Lighthouse owns Core Web Vitals
