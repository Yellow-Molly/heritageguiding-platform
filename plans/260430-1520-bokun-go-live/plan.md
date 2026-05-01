---
plan: bokun-go-live
created: 2026-04-30
status: in-progress
blockedBy: []
blocks: []
related:
  - plans/mvp-implementation/phase-08.1-bokun-integration.md
  - plans/reports/code-reviewer-260201-0120-bokun-integration.md
---

# Bokun Booking System — Go-Live Plan

## Context

Phase 08.1 already shipped the Bokun integration code (HMAC client, availability cache, webhook handler, widget component, Bookings collection, unit tests). Plan exists at `plans/mvp-implementation/phase-08.1-bokun-integration.md`.

What's missing to actually take a real booking:
1. Commercial onboarding — Bokun account, payment provider, KYC, bank info (manual, blocking)
2. 5 critical security fixes flagged in 2026-02-01 code review (timing-safe equals, body-size limit, credential validation, date validation, singleton race)
3. End-to-end testing against Bokun test environment (cannot start until credentials exist)
4. Production cutover

This plan closes that gap.

## Phases

| # | Phase | Owner | Effort | Status |
|---|-------|-------|--------|--------|
| 01 | [Commercial onboarding (manual)](./phase-01-commercial-onboarding.md) | Business + Finance | 2–4 weeks elapsed | not-started |
| 02 | [Security fixes (5 critical)](./phase-02-security-fixes.md) | Dev | 4–6h | not-started |
| 03 | [Bokun config & test-env validation](./phase-03-bokun-config-and-test.md) | Dev (needs creds from 01) | 6–10h | not-started |
| 04 | [Production go-live](./phase-04-production-go-live.md) | Dev + Business | 2–4h elapsed | not-started |

## Critical Path

```
Phase 01 (commercial, weeks)  ──┐
Phase 02 (security, hours) ─────┼──▶ Phase 03 (test-env) ──▶ Phase 04 (go-live)
```

Phase 01 and 02 run in parallel. Phase 03 cannot start until both are done. Phase 04 is the final cutover.

## Key Decisions (locked)

- **Approach:** embedded widget (already shipped in `bokun-booking-widget-with-fallback.tsx`)
- **Payment provider:** Stripe (Sweden default — see Phase 01 for rationale)
- **Bokun ↔ Stripe:** Stripe Connect (Bokun receives money on operator's behalf, payouts to operator's IBAN)
- **Currency:** SEK primary; multi-currency deferred until proven needed
- **Tax:** VAT included in displayed price; Bokun tax engine configured per product

## Dependencies

- Existing code from Phase 08.1 stays as-is except for security patches in Phase 02
- No changes to Tour CMS schema needed (`bokunExperienceId` field already exists)
- DNS/CSP changes required for production (`*.bokun.io`, `widgets.bokun.io`, Stripe domains)

## Success Criteria

- Real booking placed by external customer on a low-priced test tour, payment lands in Stripe → payout to company bank
- Webhook delivers `BOOKING_CONFIRMED` to production endpoint, `Bookings` collection records it
- Zero PII or credentials in logs, all 5 critical security findings resolved
- Production widget loads under 1.5s on tour detail page (no regression vs current placeholder)

## Risks

| Risk | Mitigation |
|------|------------|
| Stripe KYC delays go-live by weeks | Start Phase 01 immediately, in parallel with Phase 02 |
| Bokun pricing tier excludes API access | Confirm tier in Phase 01 before relying on API in Phase 03 |
| Cross-border card refusals (Swedish merchant, foreign cards) | Test multiple card BINs in Phase 03, configure 3DS |
| Webhook IP allowlist breaks if Bokun changes infra | Use signature verification only, no IP allowlist |
