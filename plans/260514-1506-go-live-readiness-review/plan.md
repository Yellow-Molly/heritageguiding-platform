---
plan: go-live-readiness-review
title: "Go-Live Readiness Review — Master Launch Checklist"
description: "Master pre-launch audit across Legal, Content, Integration, Configuration. Consolidates findings from existing plans, identifies uncovered gaps, defines go/no-go gate."
status: in-progress
priority: P0
effort: ~6h audit + closes gaps via referenced plans
branch: master
created: 2026-05-14
tags: [launch, audit, checklist, go-live, gate]
blockedBy:
  - 260425-1207-mvp-launch-content-audit       # CMS empty, business data, legal dates
  - 260430-1520-bokun-go-live                  # Bokun security + commercial onboarding
blocks: []
related:
  - 260514-1437-bokun-integration              # Outbound sync (DEFERRED post-launch)
  - 260419-1332-per-tour-cancellation-policy   # Per-tour policy variant
  - 260508-2335-privacy-policy-page-implementation
  - 260506-2049-real-company-phone-rollout
context:
  scouts:
    legal: plans/reports/Explore-260514-1458-legal-readiness.md
    content: plans/reports/Explore-260514-1458-content-readiness.md
    integration: plans/reports/Explore-260514-1458-integration-readiness.md
    configuration: plans/reports/Explore-260514-1504-infrastructure-readiness.md
---

# Go-Live Readiness Review

## Purpose

Single gate for production launch. Audits state across 4 dimensions, cross-links execution to existing plans, identifies uncovered gaps. **No new code planned here** — phases either reference existing plan owners or add minimal scope to close gaps.

## Readiness Matrix (re-verified 2026-05-17; quick-wins implemented same day — see [audit report](../reports/audit-260517-1311-go-live-readiness.md))

| Dimension | Implemented | Partial | Missing | Gate Status |
|-----------|-------------|---------|---------|-------------|
| Legal     | Privacy, Terms, Cancellation (static), schema.org clean, essential-cookies-only stance documented in privacy policy, **Bokun T&Cs disclosure in widget ✅** | Counsel sign-off (incl. L1 cookie-stance question), newsletter consent | Impressum, DSAR endpoint | 🔴 BLOCK |
| Content   | CMS seeded (10 tours / 15 guides / 10 cats / 97 media, all 3 locales — verified 2026-05-15), i18n aligned, sitemap/robots, 404, footer dynamic, schema conditional | Business contact env vars (code path ready; Vercel prod values unverified), VAT placeholder, legal dates pending counsel | Bokun Experience ID mapping (0/10 tours) | 🟡 PARTIAL |
| Integration | Bokun HMAC, webhook signature, email (group+contact), CMS+RLS, CI/CD, analytics endpoint, Bokun security fixes 3-5 ✅, **Bokun CDN remotePatterns ✅**, **rate-limit on /api/tours/recommend + /api/revalidate ✅** | Bokun outbound sync (deferred), embedding pipeline | Webhook→Bookings persistence, booking confirmation emails | 🟡 PARTIAL |
| Configuration | Security headers, HSTS, CSP, redirects, robots/sitemap, SSL, DB backups, **env Zod validation + boot fail-fast (`lib/env.ts` + `instrumentation.ts`) ✅** | CORS, logging, vercel.json minimal | Error tracking (Sentry), uptime monitor | 🟡 PARTIAL |

## Phases

| # | Phase | Owner | Effort | Status |
|---|-------|-------|--------|--------|
| 01 | [Legal Readiness](./phase-01-legal-readiness.md) — L2 imprint ✅, L5 Bokun T&Cs ✅; awaiting L1+L3 counsel | Dev + Legal | counsel turnaround | code-complete-awaiting-counsel |
| 02 | [Content Readiness](./phase-02-content-readiness.md) — CMS seed ✅; Bokun IDs + business sign-off + counsel dates pending | Content + Business | gated on `260425-1207-mvp-launch-content-audit` | blocked |
| 03 | [Integration Readiness](./phase-03-integration-readiness.md) — I1 ✅, I2 webhook ✅, I4 ✅, I5 ✅; awaiting I3 commercial + I6 DNS | Dev | external blockers | code-complete-pending-external |
| 04 | [Configuration Readiness](./phase-04-configuration-readiness.md) — CFG1 Sentry SDK ✅, CFG3 env Zod ✅; awaiting CFG2 Uptime Robot + Sentry project provision | DevOps | account work | code-complete-pending-devops |
| 05 | [Go/No-Go Gate](./phase-05-go-no-go-gate.md) — final P0/P1/P2 decision matrix + sign-off | Tech Lead + Business | 1h | not-started |

## Critical Path

```
01 (legal) ─┐
02 (content, blocked on 260425) ─┤
03 (integration, blocks on 260430) ─┼──▶ 05 (gate)
04 (config) ─┘
```

Phases 01–04 run parallel where ownership permits. **Phase 05 cannot fire until 01–04 reach `ready` status.**

## Scope Boundaries

**In scope:**
- Audit current state per dimension
- Reference existing plans for in-flight execution
- Identify gaps NOT covered by existing plans
- Define P0/P1/P2 blocker classification
- Produce launch checklist with sign-off owners

**Out of scope:**
- Implementation work (lives in referenced plans)
- Smoke testing or e2e validation (separate QA phase)
- Marketing copy, press kit, social launch
- Post-launch hypercare runbook

## P0/P1/P2 Classification

| Tier | Definition | Launch Effect |
|------|------------|---------------|
| P0 | Legal/compliance violation OR site cannot accept bookings | **BLOCKS launch** |
| P1 | User-visible defect OR audit risk | Launch with risk waiver from Tech Lead + Business |
| P2 | Nice-to-have / hardening / post-launch acceptable | Document and defer |

## Top Blockers Summary (P0)

1. **Bokun Experience ID mapping** — 0 of 10 published tours linked to Bokun. Widget cannot load. (Content P0, → `260425-1207` phase-02 + `260430-1520` phase-03)
2. **Cookie consent banner missing** — GDPR violation; Web Vitals fires without consent. (Legal P0)
3. **Impressum page missing** — Required for DE audience. (Legal P0)
4. **Legal copy dates still placeholder** — Counsel sign-off pending. (Legal P0, → `260425-1207` phase-04)
5. **Webhook → Bookings persistence stubbed** — Bookings won't save to CMS, no confirmation email. (Integration P0)
6. **Bokun commercial onboarding pending** — KYC, Stripe Connect, bank info. (Integration P0, → `260430-1520` phase-01)

**Note (2026-05-15):** Original claim that CMS was empty was wrong — verified 10 published tours / 15 guides / 10 categories / 97 media items live, all 3 locales. Bokun security fixes (5 critical) now complete.

**Note (2026-05-17 audit):** Re-verified code state. Bokun security fixes 3-5 confirmed in `bokun-api-client-with-hmac-authentication.ts` and `availability/route.ts`. L1 premise (CMP required) contested — privacy policy declares essential-cookies-only stance; L1 is now a **counsel-decision question**, not a code gap. I2 / I4 / I5 / L2 / L5 / CFG1 / CFG3 still owed. See [audit report](../reports/audit-260517-1311-go-live-readiness.md).

**Note (2026-05-17 quick-wins shipped):** I4 ✅, I5a+I5b ✅, L5 ✅, CFG3 ✅. Remaining P0 code owned by this plan: L2 Imprint (2-3h), I2 webhook persistence (2-3h). CFG1 Sentry + CFG2 Uptime Robot (P1) still open. L1, L3, C2, C3, C4, I1 sub-fixes 1+2, I3 routed to other plans or stakeholders. See [implementation report](../reports/cook-260517-1359-go-live-quick-wins.md).

**Note (2026-05-18 code-complete):** L2 imprint (`8dfb22e`), I2 webhook persistence + customer emails (`edc8681`), CFG1 Sentry SDK (`5dc5ddd`) all shipped. All code-owned items in this plan are now complete. Remaining work is non-code: counsel sign-off (L1, L3), Bokun commercial onboarding (I3 → `260430-1520`), DevOps DNS (I6) and account provisioning (CFG1 Sentry project, CFG2 Uptime Robot), content/business sign-off (C2/C3/C4 → `260425-1207`). **Plan ready to advance to Phase 05 gate ceremony once external blockers clear.**

## Success Criteria

- All P0 items resolved or risk-waived
- Phase 05 produces signed go/no-go with named owners per dimension
- Launch checklist exported as final artifact in `phase-05-go-no-go-gate.md`

## Unresolved Questions

1. CMP vendor — Cookiebot vs Osano vs in-house? (recommend Cookiebot — Nordic SaaS, GDPR-native)
2. Counsel engagement — internal review acceptable or external Swedish law firm required?
3. DSAR endpoint — pre-launch automated form OR post-launch manual via contact form?
4. Per-tour cancellation policy — defer to post-launch acceptable?
5. Bokun outbound sync (`260514-1437`) — confirmed deferred post-launch?
6. Target launch date — drives prioritization of P1 items
