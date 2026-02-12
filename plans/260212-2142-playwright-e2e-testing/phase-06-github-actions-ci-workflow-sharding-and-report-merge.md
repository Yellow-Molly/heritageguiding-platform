# Phase 06: GitHub Actions CI Workflow - Sharding + Report Merge

## Context Links
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: All previous phases (01-05)
- **Research**: [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- **Existing CI**: .github/workflows/ci.yml (lint, type-check, build)

## Overview
- **Date**: 2026-02-12
- **Priority**: MEDIUM
- **Effort**: 2.5h
- **Implementation Status**: Pending
- **Review Status**: Not started

Create a separate GitHub Actions workflow for Playwright E2E tests. Trigger: `workflow_dispatch` only (on-demand manual). Strategy: 3-browser matrix (chromium, firefox, webkit) x 4 shards = 12 parallel jobs. Merge blob reports into single HTML report artifact. No modification to existing ci.yml.

## Key Insights
- Existing CI runs in `apps/web/` working directory with `npm ci`; E2E is root `e2e/` directory
- Playwright `--shard=X/Y` splits tests across workers for parallel CI
- `blob` reporter outputs partial results; `merge-reports` combines them post-run
- `workflow_dispatch` supports input parameters (environment selector)
- Browser install: `npx playwright install --with-deps {browser}` (installs OS deps on Ubuntu)
- Node 20 used in existing CI; keep consistent
- E2E workflow is fully independent from main CI -- no changes to ci.yml needed
- STAGING_URL, ADMIN_EMAIL, ADMIN_PASSWORD stored as GitHub Actions secrets

## Requirements

### Functional
- New workflow file: `.github/workflows/playwright-e2e-tests-on-demand.yml`
- Trigger: `workflow_dispatch` with environment input (staging default)
- Matrix: 3 browsers x 4 shards = 12 parallel jobs
- Each job: checkout -> setup Node 20 -> install e2e deps -> install browser -> run sharded tests
- Upload blob reports as artifacts per shard
- Merge job: download all blobs -> merge -> upload final HTML report
- Timeout: 30 min per shard job, 15 min for merge job
- Pass STAGING_URL and admin credentials via GitHub secrets

### Non-Functional
- No changes to existing `.github/workflows/ci.yml`
- Workflow file under 200 lines
- Artifact retention: 30 days for merged report, 7 days for blob parts
- fail-fast: false (continue other browsers/shards even if one fails)

## Architecture

```
.github/workflows/
├── ci.yml                                        # Existing: lint, type-check, build
└── playwright-e2e-tests-on-demand.yml           # New: E2E on-demand

Jobs:
  test (matrix: browser x shard)
    ├── actions/checkout@v4
    ├── actions/setup-node@v4 (node 20)
    ├── npm ci (in e2e/)
    ├── npx playwright install --with-deps $browser
    ├── npx playwright test --project=$browser --shard=$idx/$total
    └── actions/upload-artifact@v4 (blob-report-*)

  merge-reports (needs: test)
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
| `.github/workflows/ci.yml` | Existing CI -- leave untouched |
| `e2e/package.json` | E2E dependencies (from Phase 01) |
| `e2e/playwright.config.ts` | Playwright config with blob reporter for CI |

## Implementation Steps

### 1. Create .github/workflows/playwright-e2e-tests-on-demand.yml

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

Add these secrets in GitHub repo Settings > Secrets and Variables > Actions:

| Secret | Description | Example |
|--------|-------------|---------|
| `STAGING_URL` | Staging site base URL | `https://staging.heritageguiding.com` |
| `PRODUCTION_URL` | Production site base URL | `https://heritageguiding.com` |
| `ADMIN_EMAIL` | Payload CMS admin email | `admin@heritageguiding.com` |
| `ADMIN_PASSWORD` | Payload CMS admin password | `(secure password)` |

### 3. Verify playwright.config.ts reporter for CI

The config from Phase 01 already handles this:
```typescript
reporter: process.env.CI
  ? [['blob'], ['github']]
  : [['html'], ['json', { outputFile: 'test-results/results.json' }]],
```

- `blob` reporter creates partial report files for merging
- `github` reporter adds inline annotations to PR checks

### 4. Update e2e/.gitignore (if not in root .gitignore)

```
test-results/
playwright-report/
blob-report/
node_modules/
```

### 5. Test workflow locally with act (optional)

```bash
# Dry-run to validate workflow syntax
gh workflow view playwright-e2e-tests-on-demand.yml

# Trigger manually from CLI
gh workflow run playwright-e2e-tests-on-demand.yml \
  --field environment=staging \
  --field browsers=chromium
```

### 6. Manual trigger from GitHub UI

1. Go to repo Actions tab
2. Select "Playwright E2E Tests" workflow
3. Click "Run workflow" dropdown
4. Select environment (staging/production) and browsers (all/chromium/firefox/webkit)
5. Click "Run workflow"
6. After completion, download "playwright-report-merged" artifact for HTML report

## Todo List
- [ ] Create `.github/workflows/playwright-e2e-tests-on-demand.yml`
- [ ] Configure GitHub secrets: STAGING_URL, PRODUCTION_URL, ADMIN_EMAIL, ADMIN_PASSWORD
- [ ] Verify `e2e/package-lock.json` is committed (needed for `npm ci`)
- [ ] Test workflow with single browser first: `gh workflow run ... --field browsers=chromium`
- [ ] Verify blob reports upload correctly from each shard
- [ ] Verify merged HTML report is downloadable and readable
- [ ] Test `fromJSON` matrix expression works for single-browser selection
- [ ] Document workflow usage in project README or docs

## Success Criteria
- Workflow appears in GitHub Actions tab as "Playwright E2E Tests"
- Manual dispatch with environment + browser selection works
- 12 parallel jobs run (3 browsers x 4 shards) when "all" selected
- Single-browser selection runs 4 shard jobs only
- Each shard uploads blob-report artifact
- Merge job combines all blobs into single HTML report
- Merged report downloadable with 30-day retention
- Workflow does NOT trigger on push/PR (on-demand only)
- Existing ci.yml is completely untouched

## Risk Assessment
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `fromJSON` matrix expression fails for single browser | Medium | Test with `gh workflow run` before relying on it |
| Blob report merge fails with mismatched versions | Low | All shards use same Playwright version from `npm ci` |
| WebKit install takes too long on ubuntu | Low | 30 min timeout per job; `--with-deps` handles OS deps |
| GitHub Actions minutes consumed quickly (12 jobs) | Medium | On-demand only; can reduce shards to 2 if needed |
| Secrets not configured leads to test failures | High | Admin tests use `test.skip()` when env vars missing |

## Security Considerations
- STAGING_URL, ADMIN_EMAIL, ADMIN_PASSWORD stored as GitHub encrypted secrets
- Secrets not logged in workflow output (GitHub masks them automatically)
- Production URL only used when explicitly selected via `workflow_dispatch` input
- Artifacts may contain failure screenshots -- 30-day retention auto-deletes
- No secrets committed to repository files

## Next Steps
- After first successful workflow run, tune shard count (2 or 4) based on actual test duration
- Consider adding Slack/Teams notification on workflow completion
- Consider adding workflow badge to README
- Future: add `schedule` trigger for nightly runs if desired
