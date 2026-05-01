# Phase 03 — Bokun Configuration & Test-Environment Validation

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 — gate to production | not-started | 6–10h |

End-to-end validation against `api.bokuntest.com`. Cannot start until Phase 01 delivers credentials AND Phase 02 fixes ship.

## Prereqs Checklist

- [ ] Test credentials in 1Password from Phase 01
- [ ] Phase 02 security fixes merged
- [ ] One real test tour created in Bokun dashboard with known `experienceId`
- [ ] At least one matching record in Payload `tours` collection has `bokunExperienceId` populated

---

## 1. Wire Local Dev Environment

```bash
# apps/web/.env.local (NEVER commit)
BOKUN_API_KEY=<from 1Password>
BOKUN_SECRET_KEY=<from 1Password>
BOKUN_WEBHOOK_SECRET=<from 1Password>
NEXT_PUBLIC_BOKUN_UUID=<test booking channel UUID>
```

Verify `.env.example` lists these (no values). It already does per Phase 08.1 plan.

Run dev server, check no startup errors.

---

## 2. Validate HMAC Signature Against Live Test API

Make one read-only request to confirm signature math is correct:

```bash
curl "http://localhost:3000/api/bokun/availability?experienceId=<test-id>&startDate=2026-05-01&endDate=2026-05-07"
```

Expected: 200 with availability JSON (or empty array if no slots configured). 401/403 means signature is wrong — debug by:
1. Logging `stringToSign` (do NOT commit log statements)
2. Comparing against Bokun's docs example signature
3. Checking date format (ISO 8601 UTC, must match `X-Bokun-Date` header exactly)

**Resolves unresolved Q1 from Phase 08.1: SHA1 vs SHA256.** SHA1 is for API request signing (per current code); SHA256 is for inbound webhook signing.

---

## 3. Configure Bokun Webhook → Local via Tunnel

Webhook needs a public URL. Use ngrok / cloudflared for local testing:

```bash
# example
cloudflared tunnel --url http://localhost:3000
```

In Bokun dashboard:
1. Settings → Connections → Webhooks → Add
2. URL: `https://<tunnel>.trycloudflare.com/api/bokun/webhook`
3. Events: `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `PAYMENT_RECEIVED`
4. Save secret — must match `BOKUN_WEBHOOK_SECRET`

Trigger a test booking via Bokun sandbox, watch Next.js console for the event. Confirm:
- Signature verifies (returns 200, not 401)
- `Bookings` collection in Payload gets a row
- `revalidateTag('bokun-availability')` fires (next availability fetch goes upstream)

---

## 4. End-to-End Booking via Embedded Widget

On a tour detail page where `bokunExperienceId` is set:

1. Page loads, widget skeleton appears, then iframe loads
2. Pick a date with availability
3. Pick participants
4. Proceed to checkout in iframe
5. Use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC)
6. Complete payment

Verify:
- Booking confirmation visible in iframe
- Webhook fires `BOOKING_CONFIRMED`
- Payload `Bookings` row created with correct `confirmationCode`, `tourId`, `participants`, `totalPrice`
- Stripe test dashboard shows the charge

Test failure cases:
- Declined card `4000 0000 0000 0002`: confirm widget shows error gracefully
- Network failure (DevTools → offline mid-checkout): confirm fallback inquiry email path

---

## 5. Performance Sanity Check

- Measure widget load impact: Lighthouse on tour detail page before/after widget mount
- Confirm `BokunWidgetsLoader.js` is lazy-loaded (not in root `<head>` for non-tour pages)
- Confirm CSP headers in `apps/web/next.config.ts` allow:
  - `script-src`: `widgets.bokun.io`
  - `frame-src`: `widgets.bokun.io`, `*.bokun.io`, `js.stripe.com`, `hooks.stripe.com`
  - `connect-src`: `api.bokun.io`, `api.bokuntest.com`, `widgets.bokun.io`
  - `img-src`: `*.bokun.io`, `*.cloudfront.net`

If CSP not set yet, add minimal headers — do not over-restrict on first pass.

---

## 6. i18n Smoke Test

The widget itself is rendered by Bokun and won't follow next-intl. Verify:
- Bokun product is configured with EN/SV/DE titles in dashboard so widget shows correct language per browser locale
- Tour detail page strings (price label, "Book Now", trust signals) render correctly in all three locales — already shipped per Phase 08.1 line 1015

---

## 7. Document Findings

Append a section to this phase file documenting:
- Actual signature algorithm confirmed (SHA1 / SHA256 / where each is used)
- Webhook event payload structure (real example, redacted) — useful for Bookings collection schema validation
- Any Bokun quirks discovered (timezone handling, currency rounding, etc.)

---

## Todo

- [ ] Receive test credentials from Phase 01
- [ ] Set local `.env.local`
- [ ] Validate availability API call — signature works
- [ ] Set up Cloudflare/ngrok tunnel for webhook
- [ ] Configure webhook in Bokun dashboard
- [ ] Trigger test booking, verify webhook lands + Bookings row created
- [ ] Full widget checkout with Stripe test card
- [ ] Decline-card test
- [ ] Network-failure / fallback inquiry test
- [ ] Lighthouse + CSP audit on tour detail page
- [ ] i18n locale smoke test (en/sv/de)
- [ ] Document confirmed signature algorithms + payload examples
- [ ] Resolve Phase 08.1 unresolved questions 1–4 (lines 1107–1110)

## Success Criteria

- 1 successful end-to-end booking on test environment
- Webhook delivery 100% across 5 consecutive test bookings
- No 401/403 from API
- CSP doesn't break widget
- Phase 08.1 unresolved questions answered

## Risks

| Risk | Mitigation |
|------|------------|
| Webhook signature format wrong (hex vs base64) | First signature failure — log expected vs received side by side, fix in 5 min |
| Tunnel URL expires mid-test | Use cloudflared named tunnel or pin ngrok session |
| Bokun test env throttles aggressively | Cache 60s already in place; if still hitting limits, raise `revalidate` to 300s |
| Stripe test webhooks confused with Bokun webhooks | Stripe events go to Stripe; Bokun events go to our `/api/bokun/webhook` — different endpoints |

## Unresolved Questions

- Bokun's webhook retry policy (Phase 08.1 Q2) — observe in test, document
- Custom booking-form fields API (Phase 08.1 Q4) — only investigate if business requires dietary/access info at booking
- Modification/cancellation API (Phase 08.1 Q5) — defer; Bokun dashboard handles ops manually for MVP
