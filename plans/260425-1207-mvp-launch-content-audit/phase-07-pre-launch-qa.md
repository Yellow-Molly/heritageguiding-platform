# Phase 07 — Pre-Launch QA

## Context Links
- Research: both researcher reports (verifies all findings closed)
- Depends on: phase-01 (frontend fixes merged), phase-02 (CMS seeded), phase-04 (legal sign-off), phase-05 (marketing approved)

## Overview
- **Date:** 2026-04-25
- **Description:** Final QA gate: 3-locale render, schema.org validity, Lighthouse ≥90, sitemap/robots correctness, hardcoded-string grep audit, E2E smoke, link check, cache revalidation, mobile responsive, live Bokun booking.
- **Priority:** P1 (LAUNCH GATE)
- **Status:** pending
- **Review status:** not started

## Key Insights
- IS_STAGING flag controls indexability — must verify OFF in production
- 1009 unit tests already passing; QA focuses on integration/E2E + manual smoke
- Cache invalidation webhook recently fixed (commit `ddfc0ea`) — re-test post-seed
- Bokun integration: live test booking required; staging Bokun ≠ production catalog

## Requirements

### Functional
- Every public page renders in SV, EN, DE w/o broken layout, missing translations, or fallback English
- All schema.org JSON-LD validates via Google Rich Results Test (no errors)
- Lighthouse CI: Performance, Accessibility, Best Practices, SEO ≥ 90 (mobile + desktop)
- `sitemap.xml` includes all locale variants of public routes; excludes admin, API
- `robots.txt` allows crawlers in production (IS_STAGING=false); blocks admin
- Grep audit: zero hardcoded business strings in production build
- Playwright E2E smoke passes on production-like build
- No broken links (internal or external) on top 20 pages
- CMS edit → frontend update visible within cache TTL (5 min)
- Mobile (375px), tablet (768px), desktop (1440px) responsive
- Live Bokun booking: complete checkout flow in production env

### Non-functional
- QA checklist completed in `plans/260425-1207-mvp-launch-content-audit/qa-checklist.md`
- Defects logged + resolved before launch
- Tech lead + QA sign-off on launch-readiness doc

## Architecture

```
Production-like build ──► Lighthouse CI ──► report
                     ├──► Playwright E2E ──► report
                     ├──► schema.org Rich Results ──► report
                     ├──► grep audit script ──► report
                     ├──► sitemap/robots check ──► report
                     ├──► broken-link-check ──► report
                     ├──► manual locale + responsive smoke
                     └──► live Bokun test booking
                              │
                              ▼
                  Sign-off: Tech lead + QA lead
```

## Related Code Files (read-only)

- `apps/web/middleware.ts` (or `proxy.ts`) — IS_STAGING check
- `apps/web/app/sitemap.ts` — sitemap generation
- `apps/web/app/robots.ts` — robots config
- `apps/web/components/seo/*` — all schema.org JSON-LD
- `e2e/` — Playwright suites
- `packages/cms/payload.config.ts` — admin route check

### QA tooling (may need install)
- `@lhci/cli` (Lighthouse CI)
- `linkinator` or similar (broken-link check)
- Playwright already installed

## Implementation Steps

1. Branch deploy → staging environment that mirrors production (same env vars except IS_STAGING)
2. **Locale render check**: load `/sv`, `/en`, `/de` for every public route (12 pages); manual visual smoke
3. **Schema.org validation**:
   - Visit each unique page type, copy `<script type="application/ld+json">` content
   - Paste into [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Confirm zero errors per schema (TravelAgency, Tour, BreadcrumbList, FAQPage)
4. **Lighthouse CI**: run `lhci autorun` against deployed staging; target ≥90 each category
5. **Sitemap check**:
   - `curl https://staging.../sitemap.xml` → confirm all 3 locales × 12 routes + dynamic tour/guide URLs
6. **Robots check**:
   - `curl https://staging.../robots.txt` → confirm reflects staging (Disallow: /)
   - In production env: confirm Allow: / + Sitemap: line
7. **Hardcoded string grep audit**:
   ```bash
   rg -i "info@privatetours|drottninggatan|sarah mitchell|marcus weber|emma larsson|james chen|+46 8 123" apps/web
   ```
   Expect ZERO matches.
8. **E2E smoke**: `pnpm test:e2e` against staging URL; confirm full booking flow + locale switch
9. **Broken-link check**: `npx linkinator https://staging... --recurse --skip "^https://(facebook|instagram|linkedin)"`
10. **Cache revalidation test**:
    - Edit a tour title in Payload admin
    - Wait 5 min (or trigger webhook)
    - Confirm frontend shows new title
11. **Responsive check**: Chrome DevTools — 375 / 768 / 1440px on home, tour list, tour detail, contact
12. **Bokun production test booking**:
    - Switch to production Bokun env vars
    - Book 1 tour end-to-end (use real card, refund post-test)
    - Confirm booking appears in Bokun + Payload Bookings collection
    - Confirm confirmation email delivered
13. **Legal gate**: phase-04 sign-off doc attached
14. **Marketing gate**: phase-05 sign-off doc attached
15. **Business gate**: phase-03 sign-off doc attached
16. Tech lead + QA lead sign launch-readiness doc
17. Trigger production deploy

## Todo
- [ ] Staging mirrors prod env vars (except IS_STAGING)
- [ ] 12 routes × 3 locales render check
- [ ] Schema.org validation (all page types) green
- [ ] Lighthouse CI ≥90 (Perf/A11y/Best/SEO) on mobile + desktop
- [ ] Sitemap includes all locale routes
- [ ] Robots correct for prod (allows crawl, blocks admin)
- [ ] Grep audit returns zero hardcoded strings
- [ ] Playwright E2E smoke passes
- [ ] Broken-link check clean (or known-acceptable list)
- [ ] Cache revalidation tested end-to-end
- [ ] Responsive check (375/768/1440)
- [ ] Bokun live booking test successful
- [ ] Phase-03 sign-off attached
- [ ] Phase-04 sign-off attached
- [ ] Phase-05 sign-off attached
- [ ] Tech lead + QA lead launch-readiness sign-off
- [ ] Production deploy executed

## Success Criteria
- All 16 todo items checked
- Zero P1 defects open
- Lighthouse mobile + desktop ≥90 each category
- Schema.org validators green per page type
- Live Bokun booking confirmed end-to-end
- All sign-offs attached
- Production deploy succeeded; first 24h monitored (error rate, cache hit rate, booking funnel)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lighthouse Perf < 90 due to image weight | High | Med | Image optimization (Vercel Blob); preload LCP; defer non-critical JS |
| Schema.org error from removed aggregateRating | Low | Med | Verify removal complete; re-test after phase-05 |
| Bokun production differs from staging catalog | Med | Critical | Sync product IDs before staging→prod; manual verification |
| Cache invalidation flaky | Med | High | Webhook test in staging; manual purge fallback documented |
| Locale fallback to English (missing key) | Med | High | i18n key-parity CI gate; manual smoke per locale |
| IS_STAGING accidentally true in prod | Low | Critical | Env var checklist; deployment hook asserts IS_STAGING=false |
| Broken external link (social) | Med | Low | Skip external in linkinator; quarterly external check |
| Mobile booking flow breaks (Bokun iframe) | Med | Critical | Test on real iOS Safari + Android Chrome devices |

## Security Considerations
- Production deploy requires IS_STAGING=false confirmation
- Admin route (/admin) not in sitemap; robots blocks crawlers
- Bokun live booking uses real card; refund procedure documented
- PII in test bookings: cleanup script post-test
- CSP headers verified (no unsafe-inline)
- Cookie consent rendered before analytics fire
- HTTPS enforced; HSTS header set
- Rate limiting on contact/inquiry forms (anti-spam)

## Rollback Plan
- Production deploys via Vercel: instant rollback to previous deployment via dashboard
- DB schema unchanged this phase (no migration to revert)
- CMS content rollback: Payload version history per document
- If Bokun integration fails post-launch: feature-flag CTA off (env var) → degrades to inquiry form

## Next Steps
- Post-launch monitoring: error rate, Bokun success rate, cache hit rate
- Week 1 retro: log launch issues for v1.1
- Schedule quarterly content audit (re-run grep + sign-offs)
- Document QA checklist as reusable template
