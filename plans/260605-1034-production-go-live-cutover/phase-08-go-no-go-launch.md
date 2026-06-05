---
phase: 8
title: "Go/No-Go Gate & Launch Execution"
status: pending
priority: P0
effort: "1h ceremony + launch window"
dependencies: [1, 2, 3, 4, 5, 6, 7]
---

# Phase 8: Go/No-Go Gate & Launch Execution

## Overview

Single decision ceremony, the flag flip, and the post-launch watch. The launch mechanic is the `COMING_SOON` env flag (Phase 01), NOT `IS_STAGING`/DNS — the apex already resolves to Vercel (the coming-soon redirect proves it) and `IS_STAGING` only ever gated noindex. This phase is the **one** executable gate; the master `260514-1506` Phase 05 should defer its launch runbook to this one (they currently contradict — see Dependencies in plan.md).

## Requirements

- Documented go/no-go decision with owners per dimension.
- Reproducible flag-based launch + rollback.
- Post-launch watch with abort criteria.

## P0/P1/P2 Classification

| Tier | Definition | Launch Effect |
|------|------------|---------------|
| P0 | Legal/compliance violation OR site cannot serve/accept its core action | BLOCKS (or explicit waiver + holding state) |
| P1 | User-visible defect OR audit risk | Launch with Tech Lead + Business waiver |
| P2 | Hardening / post-launch acceptable | Document + defer |

## Decision Matrix (fill at gate)

| Dimension | Phase | Owner | Status | P-tier | Go? |
|-----------|-------|-------|--------|--------|-----|
| All-locale gate + www + de exposure resolved | 01 | Dev | | P0 | |
| SEO active + sitemap robust + dark-period cleanup | 02 | Dev | | P0 | |
| Env vars correct + sequence-safe (S9/S10/S13) | 03 | Dev | | P0 | |
| Bokun bookable | 04 | Dev+Biz | | P0* | |
| Legal sign-off + Web Vitals consent | 05 | Legal | | P0 | |
| Monitoring (incl client Sentry env) | 06 | DevOps | | P1 | |
| QA/smoke green (3 locales, security probes) | 07 | QA | | P0 | |

*P0 for a bookable launch; downgradable to waiver if launching browse-only (open question in plan.md).

## Launch Mechanic (verified)

Site is dark because of the `COMING_SOON` gate, not DNS/`IS_STAGING`. To go live:
1. Confirm `IS_STAGING` is absent on prod (enables SEO — Phase 02) and `NEXT_PUBLIC_SITE_URL`/Gmail/`REVALIDATION_SECRET` set (Phase 03).
2. Set `COMING_SOON=false` on Vercel prod + redeploy the current build (fail-safe default is dark, so `false` is the explicit go-live). (Do NOT touch DNS — already correct.)
3. Convert `/coming-soon`→`/:locale` 301 (don't hard-delete) so stale 307-cached/indexed clients don't 404.

## Implementation Steps

1. Collect Phase 01-07 statuses; fill the matrix; record waivers (esp. Bokun/legal if flipping ahead).
2. Sign-off: Tech Lead (technical), Business (commercial/legal), per dimension.
3. Execute the Launch Mechanic above. Confirm all 3 locales serve live; `www`→apex; robots/sitemap correct.
4. Immediate post-flip smoke (Phase 07 abridged) on prod: home + a tour in sv/en/de, a contact/group-inquiry email send, booking widget renders or degrades.
5. Post-launch watch (24-48h): Sentry (server AND client — verify client events actually arrive, S14), Uptime Robot, Vercel Analytics, Search Console coverage. Define abort threshold.
6. Decide CSP hardening: chat stays off — either drop BubblaV/Ably origins from the CSP now, or document that they're retained intentionally for a post-launch re-enable. Record the choice.
7. Update master `260514-1506` Phase 05 (defer to this runbook) + mark this plan `completed`; archive via `/ck:plan archive` + journal.

## Rollback (forward-fix only)

- **Correct way:** set `COMING_SOON=true` on Vercel prod + redeploy the **current** build. Covers all 3 locales, preserves Phase 03 env fixes. One toggle.
- **Do NOT "promote previous deployment":** that build predates Phase 03 (re-breaks email/canonical env validation), still uses the `(en|sv)`-only redirect (leaves `/de` live), and — because prod runs **apply-only migrations** — an older build can hit `42703 column does not exist` against the already-migrated DB.
- **Migration safety:** ensure the go-live release contains NO new schema migration (keep the flag flip in a migration-free deploy), so rollback is purely the flag.
- App-level issues (email/Bokun) → disable the affected CTA via holding copy, not a full rollback.

## Success Criteria

- [ ] Signed go/no-go with named owners + recorded waivers.
- [ ] `COMING_SOON` off; all 3 locales serve live; `/coming-soon`→301; www→apex.
- [ ] Post-flip smoke passes; client Sentry confirmed receiving events.
- [ ] 24-48h watch within threshold.
- [ ] Master Phase 05 reconciled; plan archived; journal written.

## Risk Assessment

- **Flipping ahead of Bokun/legal** (per decision) → live site with gaps. Mitigation: explicit waivers + holding CTAs + abort criteria.
- **Wrong rollback** (promote-previous) → compounds outage (env regressions + `/de` + migration mismatch). Mitigation: flag-only rollback, migration-free release, rehearse the toggle on preview before launch.
- **Two runbooks** (this vs master Phase 05) → operator flips `IS_STAGING` expecting it to go live while the gate is still on. Mitigation: reconcile master Phase 05 to defer here (step 7) BEFORE launch day.
