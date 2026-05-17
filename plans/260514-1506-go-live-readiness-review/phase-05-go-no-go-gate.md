---
phase: 05
title: "Go/No-Go Launch Gate"
priority: P0
status: not-started
effort: 1h
owner: Tech Lead + Business
blockedBy: phases 01, 02, 03, 04
---

# Phase 05 — Go/No-Go Launch Gate

## Purpose

Single sign-off ceremony. Convene Tech Lead + Business owner. Walk the matrix. Decide launch / waiver / no-go per row. Publish signed checklist.

## Pre-Gate Requirements

- [ ] All P0 items in phases 01–04 resolved or explicitly waived (with named waiver-approver + risk note)
- [ ] Bokun canary booking succeeded end-to-end (`260430-1520` phase-04)
- [ ] Lighthouse CI green on production preview
- [ ] Manual smoke walk in all 3 locales (homepage → tours listing → tour detail → contact → privacy → terms → cancellation → imprint)
- [ ] DNS cutover plan written (TTL lowering, rollback path)

## Launch Decision Matrix

### Legal (Phase 01)

| ID | Item | Required | Status | Owner | Decision |
|----|------|----------|--------|-------|----------|
| L1 | Cookie consent CMP | P0 | | Dev | □ GO □ WAIVE □ NO-GO |
| L2 | Imprint page | P0 | | Dev | □ GO □ WAIVE □ NO-GO |
| L3 | Counsel-signed legal dates | P0 | | Legal | □ GO □ WAIVE □ NO-GO |
| L5 | Bokun T&C disclosure | P1 | | Dev | □ GO □ WAIVE |
| L6 | Newsletter consent (or disabled) | P1 | | Dev | □ GO □ WAIVE |

### Content (Phase 02)

| ID | Item | Required | Status | Owner | Decision |
|----|------|----------|--------|-------|----------|
| C1 | ≥5 tours / ≥2 guides / ≥6 categories live in sv/en/de | P0 | | Content | □ GO □ NO-GO |
| C2 | Legal copy real dates committed | P0 | | Legal | □ GO □ NO-GO |
| C3 | Bokun ID per tour + widget loads | P0 | | Dev + Content | □ GO □ NO-GO |
| C4 | Business contact env vars verified | P0 | | Business | □ GO □ NO-GO |
| C5 | Hero photography uploaded | P1 | | Content | □ GO □ WAIVE |
| C6 | Trust signals copy approved | P1 | | Marketing | □ GO □ WAIVE |

### Integration (Phase 03)

| ID | Item | Required | Status | Owner | Decision |
|----|------|----------|--------|-------|----------|
| I1 | Bokun security fixes 3-5 | P0 | | Dev | □ GO □ NO-GO |
| I2 | Webhook → Bookings persistence + confirmation email | P0 | | Dev | □ GO □ NO-GO |
| I3 | Bokun commercial onboarding (KYC + Stripe Connect) | P0 | | Business | □ GO □ NO-GO |
| I4 | Bokun CDN in remotePatterns | P1 | | Dev | □ GO □ WAIVE |
| I5 | Rate limits on remaining endpoints | P1 | | Dev | □ GO □ WAIVE |
| I6 | SPF/DKIM/DMARC verified | P1 | | DevOps | □ GO □ WAIVE |

### Configuration (Phase 04)

| ID | Item | Required | Status | Owner | Decision |
|----|------|----------|--------|-------|----------|
| CFG1 | Sentry receiving errors | P1 | | DevOps | □ GO □ WAIVE |
| CFG2 | Uptime monitoring + alerts | P1 | | DevOps | □ GO □ WAIVE |
| CFG3 | Env Zod validation | P1 | | Dev | □ GO □ WAIVE |

## Final Decision

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | | | |
| Business Owner | | | |
| Legal (if applicable) | | | |

**Final verdict:** □ GO □ NO-GO □ DELAY UNTIL ____________

## Launch Day Runbook (high-level)

1. T-24h: Lower DNS TTL to 300s for `privatetours.se` if rolling cutover
2. T-2h: Final smoke in staging mirroring prod env vars
3. T-1h: Switch `IS_STAGING=false` on production deployment, redeploy
4. T-0: DNS apex/www points to Vercel production project
5. T+15m: Verify robots.txt allows `/`, sitemap.xml populated
6. T+30m: First canary booking by team member on lowest-priced tour
7. T+1h: Monitor Sentry + Uptime Robot + Vercel logs
8. T+24h: Restore DNS TTL to 3600s if no rollback needed

## Rollback Plan

- Vercel deployment promotion: revert to previous build via dashboard (1-click)
- DB rollback: PITR restore (RPO 24h, RTO 4h per `docs/infrastructure-setup.md`)
- DNS rollback: re-point to previous host (if changed) within TTL window
- Bokun: pause Experience visibility in extranet if booking flow breaks

## Post-Launch Hypercare (first 72h)

- Monitor Sentry hourly for new error types
- Daily booking volume + funnel check
- Email deliverability monitoring (booking confirmations)
- Lighthouse CI baseline comparison
- Hotfix authority: Tech Lead + on-call Dev

## Open Questions

1. Hypercare on-call rotation defined?
2. Communications: launch announcement timing relative to DNS cutover?
3. Backup verified by test-restore in last 30 days?
