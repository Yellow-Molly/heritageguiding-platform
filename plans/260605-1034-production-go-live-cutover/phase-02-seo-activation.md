---
phase: 2
title: "SEO Activation"
status: pending
priority: P0
effort: "2-3h + Search Console"
dependencies: [1, 3]
---

# Phase 2: SEO Activation

## Overview

The robots/sitemap/meta/header switches **auto-flip** on production (gated by `isProductionDeployment()`), so this phase is mostly verification — BUT red-team found `sitemap.ts` needs real edits (silent failure + a missing legal route) and there is dark-period indexing to clean up. Not "verify only".

## Requirements

- Functional: production allows indexing; staging stays blocked; sitemap is complete and robust.
- Non-functional: dark-period indexed URLs (`/de/*`, `/coming-soon`) 301'd; canonical origin correct.

## Architecture

Auto-flip gated on `isProductionDeployment()` = `IS_STAGING !== 'true' && VERCEL_ENV === 'production'` (`lib/environment.ts`): `robots.ts` (allow `/`, disallow `/admin/`,`/api/` + sitemap ref), `sitemap.ts` (emit vs `[]`), `layout.tsx:136` (noindex meta), `next.config.ts:109` (`X-Robots-Tag`). **Master SEO switch = no `IS_STAGING=true` on prod.**

Two `sitemap.ts` defects: (1) the whole CMS fetch is wrapped in try/catch that returns partial static-only routes on ANY error and still 200s (`sitemap.ts:109-111`) — a silent degrade to ~10 URLs with zero tours; (2) `STATIC_ROUTES` (`sitemap.ts:10-21`) lists privacy/terms/imprint but **omits `/cancellation`** (a live legal page).

## Related Code Files

- Modify: `apps/web/app/sitemap.ts` — add `/cancellation` to `STATIC_ROUTES`; make CMS-fetch failure fail loud (Sentry capture / non-200) instead of silent partial; add ISR/cache so it doesn't `getPayload` per crawl.
- Modify (H1 — deferred from Phase 01): `apps/web/app/robots.ts`, `apps/web/app/sitemap.ts`, and the `llms.txt`/`llms-full.txt` route handlers — gate crawlable output on `COMING_SOON` so the apex is truly dark while holding (they currently gate only on `isProductionDeployment()`).
- Verify: `lib/environment.ts`, `layout.tsx`, `next.config.ts`.

## Implementation Steps

1. Vercel → Production: confirm `IS_STAGING` unset; confirm Preview/staging has `IS_STAGING=true`.
2. `sitemap.ts`: add `/cancellation` (priority/freq matching other legal pages); on CMS fetch failure, capture to Sentry and emit a clear signal rather than a silent 10-URL sitemap; wrap in cache to avoid per-request DB load.
2b. **H1 (deferred from Phase 01) — true darkness:** while `COMING_SOON !== 'false'`, make `robots.ts` return `disallow: '/'`, `sitemap.ts` return `[]`, and the `llms.txt`/`llms-full.txt` routes return empty/minimal. On the dark apex these currently serve the live catalog (they gate on `isProductionDeployment()`, which is true on prod even while dark). Mirror the `next.config.ts` `COMING_SOON !== 'false'` predicate.
3. After go-live (`COMING_SOON` off), verify on prod:
   - `robots.txt` → allow `/`, disallow `/admin/`,`/api/`, `Sitemap:` line.
   - `sitemap.xml` → non-empty; contains all 10 tours + 15 guides + `/cancellation`; correct absolute origin + hreflang; URL count above a sanity threshold.
   - No `X-Robots-Tag: noindex` and no `<meta robots noindex>` on prod; both present on staging.
4. **Dark-period cleanup (from Phase 01 audit):** 301 any indexed `/de/*` (if they should not have been live) and `*/coming-soon` URLs to their live equivalents / locale home. Submit updated `sitemap.xml` to Google Search Console; request indexing of home + key tours; re-check coverage.
5. **Security probe (defense-in-depth, robots is advisory not access control):** `curl` unauthenticated `https://privatetours.se/api/bookings`, `/api/users`, `/api/contact-inquiries`, `/api/group-inquiries` → expect 401/403 (verify Payload `access.read` locks PII; the `/api/[...slug]` catch-all mounts the full REST API publicly).

## Success Criteria

- [ ] Production `IS_STAGING` absent; staging `true`.
- [ ] `sitemap.ts` includes `/cancellation`, is cached, and fails loud on CMS error.
- [ ] prod robots allows crawl; sitemap non-empty with tours+guides+legal, correct origin; no noindex on prod.
- [ ] Dark-period `/de` + `/coming-soon` URLs 301'd; sitemap accepted in Search Console.
- [ ] PII REST endpoints return 401/403 unauthenticated.

## Risk Assessment

- **`IS_STAGING` leaks to prod** → full-site noindex blackout. Mitigation: step-1 + post-deploy curl.
- **Silent sitemap degrade on launch-day DB contention** → tours never indexed, 200 hides it. Mitigation: step-2 fail-loud + count assertion in Phase 07.
- **Canonical origin** uses `NEXT_PUBLIC_SITE_URL` (Phase 03 sets it explicitly; hardcoded fallback currently masks absence).
