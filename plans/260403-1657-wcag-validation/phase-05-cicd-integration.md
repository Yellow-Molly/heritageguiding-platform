# Phase 5: CI/CD Integration

**Priority:** High
**Status:** completed
**Effort:** Small (~1 hr)
**Depends on:** Phase 4

## Overview
Add accessibility test step to GitHub Actions CI pipeline so PRs with a11y regressions are blocked.

## Key Context
- CI config: `.github/workflows/ci.yml`
- Current jobs: `lint-and-typecheck` → `build`
- E2E runs separately (Playwright needs running app)
- Axe tests need a built app + server

## Implementation Steps

### 1. Add a11y job to CI workflow
Add new job `accessibility` to `.github/workflows/ci.yml`:

```yaml
  accessibility:
    name: Accessibility (WCAG 2.1 AA)
    runs-on: ubuntu-latest
    needs: build
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}
      NEXT_PUBLIC_URL: http://localhost:3000
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install app dependencies
        working-directory: apps/web
        run: npm ci

      - name: Build app
        working-directory: apps/web
        run: npm run build

      - name: Install Playwright browsers
        working-directory: e2e
        run: |
          npm ci
          npx playwright install --with-deps chromium

      - name: Start server and run a11y tests
        working-directory: e2e
        run: |
          cd ../apps/web && npm start &
          npx wait-on http://localhost:3000 --timeout 60000
          npx playwright test tests/accessibility/ --project=chromium
```

**Note:** Only run against Chromium in CI — a11y violations are browser-agnostic. Saves CI time.

### 2. Add wait-on dependency
```bash
cd e2e
npm install --save-dev wait-on
```

### 3. Alternative: Use STAGING_URL
If a staging environment is available, skip build/start and point tests at staging:

```yaml
      - name: Run a11y tests against staging
        working-directory: e2e
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
        run: npx playwright test tests/accessibility/ --project=chromium
```
This is simpler but depends on staging being up-to-date.

### 4. Test CI locally first
```bash
cd e2e
STAGING_URL=http://localhost:3000 npx playwright test tests/accessibility/ --project=chromium
```

## Files to Modify
- `.github/workflows/ci.yml` (new `accessibility` job)
- `e2e/package.json` (add `wait-on` dev dependency)

## Success Criteria
- [x] CI runs accessibility tests on every PR (uses STAGING_URL)
- [x] PRs with WCAG violations fail the CI check
- [x] Chromium-only for speed
- [x] False positives handled (Bokun iframe + BubblaV chat excluded)

## Risks
- CI needs database for app to start — ensure secrets available
- Server startup time may need longer `wait-on` timeout
- Flaky `networkidle` waits — may need retry configuration
- Consider making a11y job `continue-on-error: false` to hard-block PRs
