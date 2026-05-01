# Phase 01 — Commercial Onboarding (Manual)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P0 — blocking | not-started | 2–4 weeks elapsed (mostly waiting on KYC) |

Non-dev work. Business + finance owns this. Dev cannot start Phase 03 until this completes.

## Goal

Active Bokun account + active Stripe (or alternate) account + Stripe connected to Bokun + bank account verified for payouts. Test API credentials issued.

## Why This Comes First

Phase 08.1 code is dead until two external accounts exist and are linked. Dev work in Phase 02/03 can run partly in parallel, but real-credential testing in Phase 03 absolutely requires this finished.

---

## 1. Choose Plan & Sign Bokun Contract

**Output:** signed Bokun subscription + access to Bokun dashboard.

Steps:
1. Visit https://www.bokun.io/pricing
2. Compare current plan options (START / PLUS / PREMIUM) — confirm with Bokun sales which tier includes:
   - REST API access (needed if we ever want custom checkout — keep door open)
   - Webhook configuration in dashboard
   - Booking Channel UUID (required for widget)
3. Recommended: **PLUS** (includes Go Live Check call, more OTA channels)
4. Sign contract; receive admin login
5. **Schedule the Go Live Check call** (free on PLUS/PREMIUM) — use it to clarify all unresolved questions in Phase 08.1 (lines 1105–1113)

Documents Bokun will request:
- Company legal name + Swedish organisationsnummer
- Registered business address
- VAT registration number (momsregistreringsnummer)
- Billing contact + email
- Currency (SEK)
- Time zone (Europe/Stockholm)
- Logo + brand assets
- Public website URL (heritageguiding.com)
- Public T&C, Cancellation Policy, Privacy Policy URLs (must be live before go-live)

---

## 2. Choose & Open Payment Provider

**Decision:** Stripe (Sweden). Rationale: dominant in Nordics, native Bokun integration via Stripe Connect, lowest friction, multi-currency ready, modern dashboard.

**Alternates** (only if accountant insists): Adyen, Borgun, SaltPay. Same KYC documents apply.

### Stripe Sweden — Documents Required

| # | Document | Where to get |
|---|----------|--------------|
| 1 | Company registration (registreringsbevis) | Bolagsverket |
| 2 | Organisationsnummer | Bolagsverket |
| 3 | F-tax certificate (F-skattsedel) | Skatteverket |
| 4 | VAT registration confirmation (momsregistrering) | Skatteverket |
| 5 | Bank confirmation letter showing IBAN (`SE...`) + BIC/SWIFT | Company's bank |
| 6 | Passport/ID for ALL beneficial owners ≥25% (UBO) | Each owner |
| 7 | Passport/ID + proof of address for signing director | Director |
| 8 | Estimated monthly volume + average order value | Internal projection |
| 9 | Business website with visible T&C, refund/cancellation, privacy, contact | heritageguiding.com |

Steps:
1. Go to https://dashboard.stripe.com/register (Sweden country)
2. Create Stripe account under company legal entity
3. Complete business profile + upload all KYC documents
4. Add bank account: IBAN + BIC, account holder name **must match** company legal name
5. Set payout schedule (recommend: rolling 7-day during ramp, daily once stable)
6. Activate live mode (Stripe will email when KYC clears — typically 1–5 business days, longer if any document is rejected)

### Bank Information Bokun Itself Needs

- For **subscription billing** (Bokun's monthly fee): credit card only — added in Bokun dashboard
- For **payout of bookings**: zero. Money flows customer → Stripe → company IBAN. Bokun never holds money in this model.
- For **Marketplace/OTA bookings** (Viator, GetYourGuide via Bokun Channel Manager): separate IBAN + SWIFT in Bokun's payout settings, plus possibly a US tax form (W-8BEN-E) since Tripadvisor is the US payor — **defer to Phase 04 if/when we enable OTAs**

---

## 3. Connect Stripe to Bokun

**Output:** booking widget can take live payment in Bokun test mode.

Steps (in Bokun dashboard once both accounts active):
1. Settings → Sales settings → Payment Providers → Add Provider → **Stripe Connect**
2. OAuth redirect to Stripe → authorise Bokun to charge on company's behalf
3. Configure default payment provider for the booking channel
4. Test transaction in Bokun sandbox: book the cheapest tour, use Stripe test card `4242 4242 4242 4242`
5. Verify funds appear in Stripe test dashboard
6. Reference: https://docs.bokun.io/docs/settings/sales-settings/payment-providers/how-to-set-up-stripe-connect-payment-methods

---

## 4. Public Pages Must Be Live

Required before Stripe AND Bokun activate live mode. Block production deploy until all four exist on heritageguiding.com:

- [ ] Terms & Conditions
- [ ] Cancellation Policy (per-tour overrides handled separately — see plan `260419-1332-per-tour-cancellation-policy/`)
- [ ] Privacy Policy (GDPR + cookie banner mentioning Bokun cookies)
- [ ] Contact info (company name, address, org number, email, phone)

Cross-check: existing pages — verify content is current, not placeholder text from earlier MVP.

---

## 5. Generate Test API Credentials

**Output:** test environment credentials to hand to dev for Phase 03.

Steps:
1. Bokun dashboard → Settings → Connections → Developer API
2. Generate **test environment** access key + secret (against `api.bokuntest.com`)
3. Note the **Booking Channel UUID** — needed for widget (`NEXT_PUBLIC_BOKUN_UUID`)
4. Generate **webhook secret** for `/api/bokun/webhook` signature verification
5. Hand off securely (1Password / encrypted note) to dev — not Slack, not email plain text

Hand-off envelope contents:
- `BOKUN_API_KEY` (test)
- `BOKUN_SECRET_KEY` (test)
- `BOKUN_WEBHOOK_SECRET` (test)
- `NEXT_PUBLIC_BOKUN_UUID` (test booking channel)
- Bokun dashboard URL + dev login (read-only role if possible)

---

## Todo

- [ ] Sign Bokun subscription (PLUS recommended)
- [ ] Schedule Bokun Go Live Check call
- [ ] Assemble Stripe KYC document pack (9 items above)
- [ ] Open Stripe Sweden account, submit KYC
- [ ] Verify bank account in Stripe (deposit verification)
- [ ] Connect Stripe Connect to Bokun in dashboard
- [ ] Run Bokun sandbox test transaction with Stripe test card
- [ ] Publish/verify T&C, Cancellation, Privacy, Contact pages
- [ ] Generate Bokun TEST credentials, secure hand-off to dev
- [ ] Decide on multi-currency (in/out of scope for MVP go-live)
- [ ] (Optional) Open Marketplace contract negotiations with Viator/GetYourGuide — defer

## Success Criteria

- Bokun dashboard accessible, account fully provisioned
- Stripe live mode active, IBAN verified
- Stripe ↔ Bokun connection green in Bokun settings
- One sandbox test booking completed end-to-end
- Test API credentials in dev's hands

## Risks

| Risk | Mitigation |
|------|------------|
| Stripe KYC stalls on missing UBO ID | Pre-collect ALL 9 documents before submission |
| Stripe rejects website (missing T&C) | Get pages live FIRST, before submitting KYC |
| Wrong Bokun tier blocks API access | Confirm with Bokun sales in writing before signing |
| Test credentials leaked in chat/email | Use 1Password / encrypted vault for hand-off |

## Unresolved Questions

1. Is HeritageGuiding currently VAT-registered? Affects Stripe + Bokun tax setup
2. Multiple beneficial owners ≥25%? Each adds days to KYC
3. Selling internationally — multi-currency now or SEK-only at launch?
4. Existing payment processor relationship to inherit (saves time) or fresh start?
5. OTA reselling planned for launch, or own-tours-only?
