---
phase: 03
title: "Integration Readiness"
priority: P0
status: partial
effort: 3-5h remaining (security fixes 3-5 ✅ verified 2026-05-17)
owner: Dev
auditedAt: 2026-05-17
auditReport: ../reports/audit-260517-1311-go-live-readiness.md
related:
  - 260430-1520-bokun-go-live
  - 260514-1437-bokun-integration
---

# Phase 03 — Integration Readiness

## Context

Scout: `plans/reports/Explore-260514-1458-integration-readiness.md`

Most integration concerns live in `260430-1520-bokun-go-live`. This phase tracks them + closes gaps the scout flagged outside that plan's scope.

## Findings → Actions

### P0 — BLOCKING

#### I1. Bokun security fixes 3-5 — ✅ VERIFIED COMPLETE (audit 2026-05-17)
- **Fix 3 — credential validation:** ✅ `BokunApiClient` constructor throws `CREDENTIALS_MISSING` when `BOKUN_API_KEY`/`BOKUN_SECRET_KEY` undefined (`apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts:61-67`).
- **Fix 4 — date validation:** ✅ `/api/bokun/availability` enforces `EXPERIENCE_ID_REGEX` + `isValidDate()` + range cap (max 90 days), rejects `start > end` (`apps/web/app/api/bokun/availability/route.ts:14-30, 53-98`).
- **Fix 5 — lazy client factory:** ✅ `getBokunClient()` with cached singleton — no module-level `new BokunApiClient()`; test helper `__resetBokunClientForTests` confirms intentional pattern (`bokun-api-client-with-hmac-authentication.ts:307-314`).
- **Owner:** `260430-1520-bokun-go-live/phase-02-security-fixes.md` — verify which `260430-1520` fixes 1+2 were also enumerated and confirm those.

#### I2. Webhook → Bookings persistence stubbed
- **Current:** `apps/web/app/api/bokun/webhook/route.ts` logs events but `payload.create()` calls are commented out (lines ~71-86 per scout).
- **Effect:** Booking events from Bokun are received and acknowledged but NOT saved. No CMS record, no admin visibility, no email confirmation.
- **Action:**
  1. Wire `payload.create({collection:'bookings', data: mapEvent(payload)})` for each event handler (CREATED, CONFIRMED, CANCELLED, PAYMENT_RECEIVED).
  2. Idempotency: lookup by `bokunBookingId` before create; update if exists.
  3. Enable booking confirmation email (currently stubbed at lines ~95-102 per scout).
  4. Call `revalidateTag('tours')` if booking affects availability.
- **Files:** `apps/web/app/api/bokun/webhook/route.ts`, `apps/web/lib/email/` (confirmation template)
- **Effort:** 2-3h

#### I3. Bokun commercial onboarding (route to `260430-1520`)
- **Owner:** `260430-1520-bokun-go-live/phase-01-commercial-onboarding.md`
- **Effort:** 2-4 weeks elapsed (KYC, Stripe Connect, bank info)
- **Not actionable in this phase** — track only.

### P1 — Risk-Waiverable

#### I4. Bokun CDN missing from Next.js image remotePatterns — ✅ ALREADY DONE (verified 2026-05-17)
- **Status:** `{ protocol: 'https', hostname: '*.bokun.io' }` already present in `next.config.ts`. Shipped earlier in commit `5033658` (2026-05-16, "fix(perf,a11y,seo): staging Lighthouse fixes"). Wildcard covers `cdn.bokun.io` and other Bokun subdomains. Audit-260517-1311 missed this — initial Read showed stale content.

#### I5. Rate limiting gaps — ✅ DONE (2026-05-17)
- **Done:**
  - `/api/tours/recommend` — 20 req/min/IP via `checkRateLimit`, key `recommend:${ip}`.
  - `/api/revalidate` — 10 req/min/IP, key `revalidate:${ip}`. Defense-in-depth on top of secret auth.
  - Both read IP from `request.headers.get('x-forwarded-for')` (no `next/headers` async context — keeps tests simple).
- **Test impact:** `app/api/tours/recommend/__tests__/route.test.ts` updated to mock `@/lib/rate-limit-by-ip` (matches existing vitals-route test pattern).
- **Files changed:** `apps/web/app/api/tours/recommend/route.ts`, `apps/web/app/api/revalidate/route.ts`, `apps/web/app/api/tours/recommend/__tests__/route.test.ts`

#### I6. Email DKIM/SPF/DMARC not documented
- **Current:** Gmail SMTP via app password. DKIM/SPF inherited from Gmail. DMARC unset for `privatetours.se`.
- **Action:**
  1. Set up SPF: `v=spf1 include:_spf.google.com ~all`
  2. Verify DKIM on Gmail Workspace admin (if not already)
  3. Add DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@privatetours.se`
- **Risk if skipped:** Booking confirmation emails land in spam.
- **Effort:** 30min DNS + 1-day propagation

### P2 — Post-Launch Acceptable

#### I7. Bokun outbound sync (CMS → Bokun Experience)
- **Owner:** `260514-1437-bokun-integration` (full plan)
- **Decision:** **Defer post-launch.** Manual Bokun extranet entry acceptable at MVP scale (5-10 tours).

#### I8. Semantic search embedding generation pipeline
- **Current:** Search service ready (`pgvector-semantic-search-service.ts`), endpoint live, but no embeddings generated for seeded tours.
- **Action:** Add post-publish hook OR one-off seed script after Phase 02 content lands.
- **Acceptable at launch:** Search degrades to keyword/filter — non-blocking.

#### I9. Health check endpoint
- **Current:** None.
- **Action:** Add `/api/health` returning 200 with DB ping + Bokun client init status.
- **Effort:** 30min. Defer to post-launch hardening.

## Done Criteria

- [ ] I1: All 5 Bokun security fixes in `260430-1520` phase-02 applied + verified
- [ ] I2: Webhook persists Bookings + sends confirmation email (canary booking validates e2e)
- [ ] I3: Bokun commercial onboarding complete (production keys + Stripe Connect live)
- [ ] I4: Bokun CDN in remotePatterns
- [ ] I5: Rate limits on `/api/tours/recommend` + `/api/revalidate`
- [ ] I6: SPF + DKIM + DMARC verified for `privatetours.se`

## Open Questions

1. Booking confirmation email — template approved by business?
2. DMARC policy — `quarantine` or `reject` at launch?
3. Revalidate endpoint token rotation policy?
