---
phase: 5
title: "Validation & Threshold Restoration"
status: pending
priority: P1
effort: 0.5h
---

# Phase 5: Validation & Threshold Restoration

## Context
- [Plan overview](plan.md)
- Depends on all previous phases
- Lighthouse config: `apps/web/lighthouserc.js`
- CI workflow: `.github/workflows/lighthouse-ci.yml`

## Overview
Run Lighthouse locally, verify scores meet targets, restore CI thresholds to strict values, push and confirm CI passes.

## Implementation Steps

### Step 1: Local Lighthouse run
```bash
cd apps/web
npm run build
npm install -g @lhci/cli@0.14.x
lhci autorun
```

Check output for:
- Performance score per URL (target: > 0.9)
- LCP per URL (target: < 2500ms)
- CLS per URL (target: < 0.1)
- TBT per URL (target: < 300ms)

### Step 2: Address any score gaps
If performance < 0.9:
- Check which URL(s) fail
- Identify the failing audit (LCP, TBT, CLS)
- Apply targeted fix (likely image-related)
- Re-run Lighthouse

### Step 3: Restore Lighthouse thresholds
In `apps/web/lighthouserc.js`, restore performance threshold:
```js
// Phase 1 lowered to 0.7, now restore:
'categories:performance': ['error', { minScore: 0.9 }],
```

### Step 4: Push and verify CI
- Commit all changes
- Push to branch
- Open PR
- Verify Lighthouse CI workflow passes

### Step 5: Production verification
After merge:
- Check Vercel deployment
- Run PageSpeed Insights on production URLs
- Verify Core Web Vitals in Vercel Analytics (if enabled)

## Todo List
- [ ] Run Lighthouse locally — all 3 URLs
- [ ] Fix any failing audits
- [ ] Restore performance threshold to 0.9 in lighthouserc.js
- [ ] Push, open PR, verify CI passes
- [ ] Verify production performance post-merge

## Success Criteria
- Local Lighthouse: all URLs score > 0.9 performance
- CI Lighthouse: workflow completes with all assertions passing
- LCP < 2.5s, CLS < 0.1, TBT < 300ms on all tested URLs
- No regressions in accessibility, best practices, or SEO scores
