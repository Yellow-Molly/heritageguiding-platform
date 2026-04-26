---
title: "Staging SEO Safety & Trust Signals SSR Fix"
description: "Block staging from Google indexing and fix homepage stats showing 0 on initial render"
status: complete
priority: P1
effort: 2h
branch: master
tags: [seo, staging, ssr, trust-signals]
created: 2026-04-08
---

# Staging SEO Safety & Trust Signals SSR Fix

## Problem

1. **Staging indexed by Google** -- `robots.ts` has no env awareness; `staging.privatetours.se` (custom domain) gets no Vercel auto-protection. Sitemap, canonicals, and layout all serve production-like SEO signals on staging.
2. **Homepage stats flash "0+"** -- `useCountUp` hook initializes `useState(0)`, so SSR/initial render shows "0" before animation fires.

## Architecture Decision

- Create shared `isProductionDeployment()` helper in `apps/web/lib/environment.ts` (single source of truth)
- 2-layer defense for staging: robots.txt disallow + X-Robots-Tag header (covers 99%+ crawlers)
- Meta noindex in layout as HTML-level fallback
- Sitemap returns empty array on non-prod
- Trust signals: change `useState(0)` to `useState(target)` -- SSR renders target, useEffect animates 0->target client-side

## Phases

| # | Phase | Files | Status |
|---|-------|-------|--------|
| 1 | [Block staging crawlers](./phase-01-block-staging-crawlers.md) | `lib/environment.ts`, `robots.ts`, `robots.test.ts`, `sitemap.ts`, `next.config.ts`, `layout.tsx` | Complete |
| 2 | [Fix trust signals SSR](./phase-02-fix-trust-signals-ssr.md) | `trust-signals.tsx` | Complete |

## Dependencies

- Phase 1 and 2 are independent (no shared file edits, can parallelize)
- Phase 1 creates `lib/environment.ts` which Phase 2 does NOT need

## Rollback

- Revert commits per phase; no data migrations involved
- If X-Robots-Tag causes issues, remove the single header block from `next.config.ts`

## Validation Summary

**Validated:** 2026-04-08
**Questions asked:** 4

### Confirmed Decisions
- **Env detection consistency:** Use `isProductionDeployment()` helper everywhere (not inline `process.env.VERCEL_ENV`). Exception: `next.config.ts` if module import is problematic at config level.
- **Animation flicker:** Use `useRef` to track first paint — skip showing 0 until after hydration, eliminates theoretical target→0→target flicker.
- **Branch strategy:** Commit directly to master (small, low-risk, independent changes).
- **Deployment Protection:** Out of scope — robots blocking is sufficient for SEO safety.

### Action Items
- [ ] Update Phase 1: use `isProductionDeployment()` in sitemap.ts and layout.tsx instead of inline env checks
- [ ] Update Phase 2: add `useRef(false)` to track hasAnimated, prevent flicker on first paint
- [ ] Remove `branch: feat/tours-listing-redesign` from plan frontmatter

## Success Criteria

- `curl -s https://staging.privatetours.se/robots.txt` returns `Disallow: /`
- Staging response headers include `X-Robots-Tag: noindex, nofollow`
- Production robots.txt unchanged (allows `/`, disallows `/admin/`, `/api/`)
- SSR HTML of homepage contains target stat values (not "0")
- All existing + new tests pass
