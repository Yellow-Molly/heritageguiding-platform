---
phase: 03
title: "Integration Readiness"
priority: P0
status: code-complete-pending-external
effort: 0h dev remaining; awaiting Bokun commercial onboarding + DevOps DNS
owner: Dev
auditedAt: 2026-05-17
auditReport: ../reports/audit-260517-1311-go-live-readiness.md
codeWorkClosed: 2026-05-18
remaining:
  - I3 Bokun commercial onboarding (routed to 260430-1520 phase-01)
  - I6 SPF/DKIM/DMARC DNS records (DevOps, 30min + 1d propagation)
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

#### I2. Webhook → Bookings persistence — ✅ DONE (2026-05-18)
- **Done:**
  1. ✅ Pure mapper `lib/bokun/map-bokun-webhook-to-booking-row.ts` — `BokunWebhookPayload` → Bookings row, handles status enum case-mapping, multi-age-band participant summing, empty `productBookings` fallback. 8/8 unit tests.
  2. ✅ Idempotent upsert `lib/bokun/persist-bokun-booking.ts` — looks up by `bokunBookingId`, attaches matching Tour by `bokunExperienceId` (best-effort), writes via `payload.create`/`update`. Errors propagate so Bokun retries.
  3. ✅ Customer emails wired:
     - `lib/email/send-booking-confirmation-to-customer.ts` — sent once on first BOOKING_CREATED or BOOKING_CONFIRMED, gated by `confirmationEmailSent` flag.
     - `lib/email/send-booking-cancellation-to-customer.ts` — sent on transition into `cancelled`. Email failures don't fail the webhook (record is saved, ops can resend).
  4. ✅ `revalidateTag('bokun-availability', { expire: 0 })` fires for any state-changing event (CREATED / CONFIRMED / CANCELLED / MODIFIED).
  5. ✅ Webhook route trimmed to transport concerns (signature, parsing, status codes); persistence + emails live in `lib/bokun` + `lib/email` to keep the route under 200 lines.
- **Files added:** `lib/bokun/map-bokun-webhook-to-booking-row.ts`, `lib/bokun/persist-bokun-booking.ts`, `lib/email/send-booking-confirmation-to-customer.ts`, `lib/email/send-booking-cancellation-to-customer.ts`, mapper test.
- **Files changed:** `app/api/bokun/webhook/route.ts`.
- **Verified:** Mapper 8/8, full adjacent suite 196/196. Dev server: webhook GET returns ok, unsigned POST returns 401 (signature gate still works).
- **End-to-end test deferred:** Bokun canary booking lives in `260430-1520` phase-04 — requires commercial onboarding (I3).

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

- [x] I1: Bokun security fixes 3-5 verified (commit chain confirmed in audit 2026-05-17); fixes 1+2 tracked in `260430-1520` phase-02
- [x] I2: Webhook persists Bookings + sends confirmation email (commit `edc8681`, 2026-05-18); canary e2e booking still requires I3 commercial onboarding
- [ ] I3: Bokun commercial onboarding complete (production keys + Stripe Connect live) — external blocker
- [x] I4: Bokun CDN in remotePatterns (commit `5033658`, 2026-05-16)
- [x] I5: Rate limits on `/api/tours/recommend` + `/api/revalidate` (commit `f6fe371`, 2026-05-17)
- [ ] I6: SPF + DKIM + DMARC verified for `privatetours.se` — DevOps DNS task

## Open Questions

1. Booking confirmation email — template approved by business?
2. DMARC policy — `quarantine` or `reject` at launch?
3. Revalidate endpoint token rotation policy?
