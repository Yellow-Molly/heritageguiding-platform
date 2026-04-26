---
title: "Full Performance Overhaul & Lighthouse CI Fix"
description: "Fix failing Lighthouse CI (missing secrets), add image blur placeholders, optimize CMS image pipeline, advanced LCP/video optimizations, validate with Lighthouse"
status: in-progress
priority: P1
effort: 8h
branch: feat/performance-overhaul
tags: [performance, lighthouse, images, blur-placeholder, ci, core-web-vitals]
created: 2026-04-04
blockedBy: []
blocks: []
---

# Full Performance Overhaul & Lighthouse CI Fix

## Context
- Brainstorm report: `plans/reports/brainstorm-260404-1815-performance-overhaul.md`
- Lighthouse CI has **never passed** — build crashes on missing `PAYLOAD_SECRET`
- Production site slow after replacing Unsplash stock with real CMS photos
- 0 blur placeholders across 19 Image components, 30+ image instances

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Lighthouse CI Fix](phase-01-lighthouse-ci-fix.md) | complete | P0 | 1h |
| 2 | [Image Blur Placeholders](phase-02-image-blur-placeholders.md) | complete | P1 | 3h |
| 3 | [CMS Image Pipeline](phase-03-cms-image-pipeline.md) | complete | P1 | 2h |
| 4 | [Advanced Optimizations](phase-04-advanced-optimizations.md) | complete | P2 | 1.5h |
| 5 | [Validation](phase-05-validation.md) | in-progress | P1 | 0.5h |

## Dependencies
- Phase 1: User must set GitHub secrets (DATABASE_URL, PAYLOAD_SECRET, NEXT_PUBLIC_URL, BLOB_READ_WRITE_TOKEN)
- Phase 2: Independent (can start immediately)
- Phase 3: Depends on Phase 2 (blur utility reuse)
- Phase 4: Depends on Phase 2+3
- Phase 5: Depends on all previous phases

## Success Criteria
- Lighthouse CI passes on master (performance > 0.9)
- LCP < 2.5s on mobile simulation
- All images show blur placeholder during load
- CMS images use correct size variants (card/hero) not originals
- No regressions in accessibility or SEO scores
