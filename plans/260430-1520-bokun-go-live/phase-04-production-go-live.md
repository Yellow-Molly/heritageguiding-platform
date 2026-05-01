# Phase 04 — Production Go-Live

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 — final cutover | not-started | 2–4h elapsed (mostly verification windows) |

Flip from test to production. Soft-launch with one cheap tour, monitor, then expand.

## Prereqs Checklist

- [ ] Phase 01 — Stripe live mode active, IBAN verified
- [ ] Phase 02 — security fixes merged, in production build
- [ ] Phase 03 — at least 1 successful test booking end-to-end
- [ ] Public T&C / Cancellation / Privacy / Contact pages live
- [ ] On-call rotation defined for the first 48h post-launch

---

## 1. Generate Production Credentials

In Bokun dashboard (production mode):
1. Settings → Connections → Developer API → Generate **production** keys
2. Note production **Booking Channel UUID** (different from test)
3. Generate **production webhook secret**
4. Hand off via 1Password to whoever owns deploy access

⚠️ Production credentials must NEVER touch test environment. Vercel project env scope must be `Production` only.

---

## 2. Configure Vercel Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

| Variable | Scope | Value source |
|----------|-------|--------------|
| `BOKUN_API_KEY` | Production | prod key from step 1 |
| `BOKUN_SECRET_KEY` | Production | prod secret from step 1 |
| `BOKUN_WEBHOOK_SECRET` | Production | prod webhook secret from step 1 |
| `NEXT_PUBLIC_BOKUN_UUID` | Production | prod Booking Channel UUID |

Preview/Development envs can keep test credentials — they pull from `bokuntest.com` automatically because of `NODE_ENV` switch in client.

After saving: redeploy production once.

---

## 3. Configure Production Webhook in Bokun

1. Bokun dashboard (prod mode) → Webhooks → Add
2. URL: `https://heritageguiding.com/api/bokun/webhook`
3. Events: `BOOKING_CREATED`, `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `PAYMENT_RECEIVED`
4. Secret: matches `BOKUN_WEBHOOK_SECRET` in Vercel

---

## 4. Soft-Launch — One Tour Only

Pick the cheapest active tour. In Bokun dashboard:
1. Confirm production product configured (price, capacity, schedule, cancellation policy)
2. Set the matching `bokunExperienceId` in Payload Tour record
3. Publish

Internal smoke test on production:
- Open tour detail page in incognito
- Place a real booking with company credit card for the cheapest available slot
- Verify Stripe charge appears in live dashboard (NOT test)
- Verify webhook fires, Bookings collection records it
- Cancel via Bokun dashboard — verify refund flows back

⚠️ Do not announce or promote until soft-launch tour completes one real cycle.

---

## 5. Monitoring (first 48h)

Watch:
- `/api/bokun/webhook` logs in Vercel — error rate, processing time
- `/api/bokun/availability` logs — 429 rate limit responses
- Stripe live dashboard — failed payments, disputes
- Payload `Bookings` collection — orphans without webhook events
- Sentry / error tracker — any exception from `bokun-*` files

Define alarms:
- ≥3 webhook 5xx in 5 min → page on-call
- ≥10 availability 429 in 5 min → bump cache TTL or investigate
- Any Stripe dispute → finance email

---

## 6. Expand Coverage

Once soft-launch tour has accepted ≥3 real bookings without incident:
1. Backfill `bokunExperienceId` for remaining tours one batch at a time
2. Each batch: book one slot to verify product config
3. Update tour CMS visibility flags as products are verified

No big bang. Track in this phase file as a checklist appended on each batch.

---

## 7. Communicate Go-Live

- Internal: Slack #ops with quick-reference doc (where to find bookings, how to refund, who to call when broken)
- Customer-facing: nothing yet; let it run quiet for first week

---

## 8. Post-Launch Cleanup

- [ ] Remove any inquiry-form fallback messaging from tours that now have Bokun integration
- [ ] Update `docs/system-architecture.md` with Bokun integration block
- [ ] Update `docs/deployment-guide.md` with Vercel env var matrix
- [ ] Schedule a 2-week retrospective check (use `/schedule` if helpful)

---

## Todo

- [ ] Generate Bokun PROD API keys + webhook secret + UUID
- [ ] Set Vercel Production env vars
- [ ] Redeploy production
- [ ] Configure prod webhook in Bokun dashboard
- [ ] Pick soft-launch tour, populate `bokunExperienceId` in CMS
- [ ] Place real internal test booking, verify Stripe + webhook + Bookings
- [ ] Cancellation/refund flow verified end-to-end
- [ ] Monitoring alarms armed
- [ ] First 48h soak — no incidents
- [ ] Expand to remaining tours in batches
- [ ] Update docs/system-architecture.md and docs/deployment-guide.md

## Success Criteria

- Real customer booking placed on production with payment landing in company Stripe → IBAN
- Zero webhook 5xx in first 48h
- All 5 critical security fixes verified in production logs (no error spikes)
- Cancellation tested with real refund issued
- Documentation updated

## Risks

| Risk | Mitigation |
|------|------------|
| Wrong env var pushed to wrong scope (test key in prod) | Vercel Production scope only; double-check before redeploy |
| Real customer hits launch before soft-launch verified | Keep new tours unpublished in CMS until verified one-by-one |
| Stripe holds first payouts (new account caution) | Stripe communicates this in dashboard; expect 7-day rolling first payout |
| Webhook URL change breaks delivery | Webhook URL is stable post-launch; if changed, update Bokun dashboard within 5 min |

## Unresolved Questions

- Credential rotation cadence (Phase 08.1 Q7) — propose: rotate every 12 months, document procedure in deployment-guide.md after first successful rotation
- IP allowlist for webhook (Phase 08.1 Q6) — keeping signature-only verification; revisit if signed payloads ever leak
