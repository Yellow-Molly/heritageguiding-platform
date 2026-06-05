---
phase: 1
title: "Live-Domain Flip"
status: in-progress
priority: P0
effort: "2-3h"
dependencies: []
---

# Phase 1: Live-Domain Flip

## Overview

Replace the brittle coming-soon redirect with a single **all-locale, env-gated holding switch** (`COMING_SOON`) covering both production hosts (Vercel is www-primary), and audit/repair indexing leaked during the dark period. Red-team found the current redirect only matches `(en|sv)` — so `/de` has been live and crawlable on `privatetours.se` the whole time. Per decision, `/de` should have been dark; this phase closes the gap and makes go-live (and rollback) a single flag.

## Requirements

- Functional: until go-live, ALL locales (`sv`,`en`,`de`) show the holding page; at go-live a single flag flip serves the full site.
- Non-functional: KEEP `heritageguiding.com` / `staging.heritageguiding.com` redirects; add `www.privatetours.se`→apex.
- Corrective: stop the unintended `/de` live exposure; 301 any already-indexed dark-period URLs.

## Architecture

**Current (broken) state** — `next.config.ts` `redirects()`:
- Coming-soon group: 4 rules, all `source: '/:locale(en|sv)...'` (lines 61,67,73,79) → `/:locale/coming-soon`, `permanent: false` (307). Rules 3-4 use `:path((?!coming-soon).*)` — a loop-guard so `/coming-soon` doesn't self-redirect. **`de` is absent → `/de/*` serves live.**
- Domain-migration group (KEEP): `heritageguiding.com` + `www.heritageguiding.com` + `staging.heritageguiding.com` (lines 84-102), `permanent: true`. **No `www.privatetours.se` rule exists anywhere.**

**Target state** — one env-gated gate covering all locales:
- Gate the holding redirect on `process.env.COMING_SOON !== 'false'` (**fail-safe dark** — active unless explicitly `'false'`, so a forgotten flag can never expose the site), matching `/:locale(sv|en|de)` (all locales) with the same `(?!coming-soon)` loop-guard, host-scoped to the bare apex.
- Add a permanent `www.privatetours.se`→`https://privatetours.se` redirect to the kept group.
- `proxy.ts` (Next 16 middleware) runs on all locale routes and contains **no** coming-soon/host gate (verified) — leave it; the gate stays in `next.config.ts` for consistency with the existing pattern.

Go-live = set `COMING_SOON=false` + redeploy. Rollback = unset `COMING_SOON` (or set `true`) + redeploy the current build (covers all locales, preserves Phase 03 env fixes — see Phase 08).

**Implementation note (shipped 2026-06-05):** code complete + code-reviewed (PASS); type-check clean. Used fail-safe `!== 'false'` (stronger than the originally-planned `=== 'true'`). Deferred to Phase 02 (H1): `robots.ts`/`sitemap.ts`/`llms*.txt` still gate on `isProductionDeployment()` not `COMING_SOON`, so they serve the live catalog on the dark apex. Ops step (Search Console audit) remains. **Post-deploy verify caught a redirect loop** — Vercel is www-primary (apex→www), so the added www→apex rule looped; hotfix `54dfdf8` removed it and now gates BOTH hosts.

## Related Code Files

- Modify: `apps/web/next.config.ts` — replace the 4 `(en|sv)` coming-soon rules with the `COMING_SOON`-gated all-locale block; add `www.privatetours.se`→apex to the kept group.
- Modify: `apps/web/.env.example` + `docs/deployment-guide.md` — document `COMING_SOON` (holding switch; unset in prod at go-live).
- Keep (transition): `apps/web/app/(site)/[locale]/coming-soon/page.tsx` — at go-live, redirect `/coming-soon`→`/:locale` (301) rather than hard-delete, so stale 307-cached clients + indexed URLs don't 404. Add `robots: { index: false }` to its metadata now (it is currently indexable).

## Implementation Steps

1. In `next.config.ts`, replace the 4 coming-soon rules with a `...(process.env.COMING_SOON !== 'false' ? [ ...rules ] : [])` block matching `/:locale(sv|en|de)` and `/:locale(sv|en|de)/:path((?!coming-soon).*)`, host-scoped to apex `privatetours.se` (`type: 'host' as const` to satisfy the `Redirect[]` type). Preserve the loop-guard. Gate BOTH prod hosts (`privatetours.se` + `www.privatetours.se`) since Vercel serves on www. Comment explains intent, NOT plan/finding codes. ✅ done
2. Add `www.privatetours.se`→`https://privatetours.se/:path*` `permanent: true` to the kept domain-migration group.
3. Add `robots: { index: false }` to `coming-soon/page.tsx` metadata (close the indexable-holding-page gap).
4. Deploying this change takes the apex dark **by default** (fail-safe — `COMING_SOON` unset → dark), which immediately closes the `/de` live exposure. German visitors currently seeing live content will see the holding page until go-live. Confirm `sv`/`en`/`de` all show holding on prod after deploy. (No env var needed to stay dark; go-live later = `COMING_SOON=false`.)
5. **Canonical host:** Vercel is **www-primary** (apex→www, verified 2026-06-05). Do NOT add a code www→apex (it loops against Vercel's apex→www — caught post-deploy, hotfixed `54dfdf8`). Decide canonical (www vs apex) in Phase 02.
6. **Indexing audit:** in Google Search Console, check coverage for `privatetours.se/de/*` and `*/coming-soon`. Record what leaked. Plan 301s for any indexed dark-period URLs (execute in Phase 02).
7. `npm run build` to confirm config compiles.

## Success Criteria

- [ ] With `COMING_SOON=true`: `sv`,`en`,`de` (root + sub-paths) all serve the holding page; `/coming-soon` does NOT self-redirect (loop-guard intact).
- [ ] `www.privatetours.se` 301s to apex (code rule present; Vercel config confirmed).
- [ ] `coming-soon/page.tsx` returns `noindex`.
- [ ] heritageguiding/staging redirects unchanged; build passes.
- [ ] Search Console audit of `/de` + `/coming-soon` exposure recorded; 301 list handed to Phase 02.
- [x] Code shipped + reviewed (fail-safe `!== 'false'`, both-host holding, noindex); type-check clean. Post-deploy loop (www→apex vs Vercel apex→www) caught + hotfixed (`54dfdf8`).
- [ ] Go-live dry-run: setting `COMING_SOON=false` serves full site in all 3 locales (verify on preview).

## Risk Assessment

- **`/de` was live for months** — content may be un-QA'd / pre-counsel. Taking it dark now is corrective; Phase 05/07 must QA it before the real go-live. Treat prior exposure as an incident note, not just a checkbox.
- **Removing the wrong rule** → loses old-domain SEO redirects. Mitigation: edit by host value; diff both groups; verify post-deploy.
- **Hand-retyping the gate on rollback** without the `(?!coming-soon)` loop-guard → infinite redirect. Mitigation: rollback is a flag flip on the SAME code (Phase 08), never a hand re-add.
- **Stale 307 cached redirects** in browsers/edge from the dark period → 404 if `/coming-soon` is deleted. Mitigation: 301 `/coming-soon`→home at go-live instead of deleting (step in Phase 08).
