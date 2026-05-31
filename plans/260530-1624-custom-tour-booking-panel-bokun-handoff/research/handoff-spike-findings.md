---
type: research
phase: 1
status: gate-decided
slug: bokun-checkout-handoff-spike-findings
date: 2026-05-31
spike_script: scripts/spike-bokun-checkout-handoff.ts
widget_script: e2e/spike-bokun-widget-prefill.mjs
raw_output: plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/raw-output/
---

# Phase 1 — Bokun Checkout Handoff Spike — Findings & Gate Decision

**Run env:** local (`NODE_ENV` unset) → `api.bokuntest.com` (sandbox). HMAC creds from `apps/web/.env.local`. Channel UUID `11917131-ac6a-45e1-8e99-bd0cf1e318c8`. No prod writes.

## Verdict (gate) — FINAL after Plan B' follow-up

**No clean "custom selection → Bokun-hosted payment" handoff exists.** All three candidate paths are disproven:
- **Plan A** (widget deep-link pre-fill): widget ignores `date`/`startTimeId`/`participants`.
- **Plan B** (HMAC reserve → hosted-payment redirect URL): no URL returned; `RESERVE_FOR_EXTERNAL_PAYMENT` = caller collects payment (rejected Plan D).
- **Plan B'** (pre-build widget `shoppingCart` session, resume in-widget — user-authorized follow-up, 2026-05-31): **NOT FEASIBLE.** The widget session is **cookie-bound + server-signed** (`bokun_widgets_sign…` = bcrypt) and the widget **ignores** an injected `?sessionId=` and any preset localStorage. We cannot mint/transfer the signed session cookie (cross-origin, server-signed), so a server-prebuilt cart cannot be resumed in the user's browser.

**→ Only viable path = Plan C (Phase 6): restyle the live embedded widget.** The widget is the sole Bokun-hosted-payment surface, its booking flow already works in production, and its session is fully server-controlled. The custom-panel design (Phases 2–5) is **not achievable** against this Bokun account's capabilities.

## What was tested (evidence)

All raw responses saved under `research/raw-output/`. Spike modes: `list`, `discover`, `avail-probe`, `endpoint-probe`, `cart`, `reserve`; widget pre-fill via Playwright (`widget-*.png`, `widget-prefill-report.json`).

### 1. Sandbox account uses the OLD Booking API, not REST v2.0 availability ⚠️
- `GET /restapi/v2.0/activity/{id}/availabilities` → **404** for every activity (incl. the now-gone `24003`). `GET /restapi/v2.0/activity/{id}` → **404**.
- `GET /activity.json/{id}` and `GET /activity.json/{id}/availabilities` → **200** (old Booking API works; 360 slots returned for 24010).
- `GET /restapi/v2.0/experience/{id}/components?componentType=RATES|PRICING` → **200** (used to read pricing).
- **VERIFICATION (2026-05-31), direct against the Bokun HOST (not our app route):** on the **sandbox host** (`api.bokuntest.com`), EVERY REST v2.0 availability variant 404s — `/restapi/v2.0/activity/{id}/availabilities` (the prod-code path), `/restapi/v2.0/experience/{id}/availabilities`, `/restapi/v2.0/experience/{id}/availability`, `/restapi/v2.0/experience-availability/{id}` — while `/restapi/v2.0/experience/{id}/components` (RATES/PRICING/START_TIMES) AND the **old `/activity.json/{id}/availabilities`** return 200. So this account serves availability ONLY via the old Booking API; the prod code's REST v2.0 path is unsupported here. The IDs are "experiences" (components endpoint works) not "activities" (`/restapi/v2.0/activity/{id}` 404s), so the `/activity/{id}/availabilities` resource simply doesn't apply.
  - **PROD host VERIFIED directly (2026-05-31, `api.bokun.io`, prod creds, real experience `1215959`):** same result — `/restapi/v2.0/activity/1215959/availabilities` → **404**, `/restapi/v2.0/experience/1215959/availabilities` → **404**, **`/activity.json/1215959/availabilities` → 200**, `/restapi/v2.0/experience/1215959/components` → 200 (id resolves; `server=nginx/1.30.0`, `actualUrl=https://api.bokun.io/...`). So the prod-code REST v2.0 availability path 404s on the REAL prod Bokun host too; only the old `/activity.json` path works. (Earlier I incorrectly probed this via our app route `www.privatetours.se/api/bokun/availability` — not authoritative; superseded by this direct-host check via `scripts/bokun-availability-host-probe.ts --host=prod`.)
  - **Live impact regardless: none.** No component in `apps/web/{components,app}` calls `getBokunAvailability` / `/api/bokun/availability` (grep-confirmed); real booking availability is served by the embedded widget's own `/widgets/{uuid}/activity/...` API. Site is pre-launch (`privatetours.se` → `/sv/coming-soon`). **Verdict: latent dead/likely-broken code, zero live impact.** Optional: delete the route/service, or repoint it to `/activity.json/{id}/availabilities`. Not a launch blocker.

### 2. Visible sandbox inventory (current creds)
- `POST /activity.json/search` → 3 activities: **24005** "Stockholm through local perspectives – evening", **24006** "Full Day Stockholm Boat Tour", **24010** "Guided City Walk Including City Hall".
- All three: rate `pricedPerPerson: false` → **per-group flat** (24005 max 7, 24006 max 5, 24010 max 9). **No per-person experience exists** on this sandbox.
- `24010` is the richest: rate `57043` flat **3900 SEK**, pricing categories `30079` "Per group" (default, occupancy 9) + `30074` "Adults", start-times `48301/48302/48303` (09/10/13:00), extra `5380` priced 900 SEK @cat 30079 / 100 SEK @cat 30074. First bookable `2026-06-01`.

### 3. Plan A — widget deep-link pre-fill: **FAILS** ✗
- Loaded (Playwright, headless chromium) both:
  - baseline `…/online-sales/{uuid}/experience/24010?lang=en`
  - with-params `…?date=2026-06-01&startTimeId=48301&participants=2&lang=en`
- **Screenshots are pixel-identical** (`widget-baseline-no-params.png` == `widget-with-params.png`): same blank June-2026 calendar, **no date pre-selected**, Participants steppers at default, **empty Booking Summary**, greyed continue.
- **Conclusion:** the widget ignores `date`/`startTimeId`/`participants`. `getBokunCheckoutUrl()`'s params (`bokun-booking-service-and-widget-url-generator.ts:152`) have **no pre-fill effect**. Only `lang` is honored (research already confirmed). Plan A cannot deliver "selection pre-applied".

### 4. Plan B — HMAC reserve → hosted-payment redirect: **NOT SUPPORTED as planned** ✗
- Endpoints DO exist (contradicts red-team #5's "endpoints don't exist" worry):
  - `POST /checkout.json/submit` → 400 `Cannot read field "activityBookings" because "bookingRequest" is null` (exists; wants `{bookingRequest:{activityBookings:[…]}}`).
  - `POST /checkout.json/options/booking-request` → 200. `GET /checkout.json/options/shopping-cart/{uuid}` → 200. `GET /cart.json/{sessionId}` → 200 (cart object).
- BUT, fatal for the planned design:
  - `options/booking-request` for a built per-group request returned **only `CUSTOMER_NO_PAYMENT` ("Pay later")** and **total 0** (pricing did not attach to my hand-built booking line — old-API create body is undocumented and was not cracked).
  - The cart object (`GET /cart.json/create`) and the captured prod reservation sample contain **NO hosted-payment / redirect / resume URL** anywhere. `scanForUrls` over cart + options + (attempted) submit found **zero** payment URLs.
  - `RESERVE_FOR_EXTERNAL_PAYMENT` semantics = **the API caller collects payment externally**, then calls `confirm-reserved`. That is **Plan D (PCI on us)** — explicitly rejected ("Bokun keeps payment"). It is NOT a "redirect to Bokun-hosted payment" mechanism.
- **Conclusion:** there is no documented "create reservation via HMAC REST → get a Bokun-hosted payment URL → redirect" path. Bokun-hosted card payment happens **only inside the widget**.

### 5. The widget's REAL mechanism (captured from its network traffic)
The hosted widget, when loaded, calls (browser-side, NOT HMAC):
- `GET https://widgets.bokuntest.com/widgets/{channelUUID}/activity/24010?availabilityRequired=1&currency=SEK&sessionId={clientUUID}&lang=en`
- `POST https://widgets.bokuntest.com/widgets/{channelUUID}/shoppingCart?currency=SEK&sessionId={clientUUID}&lang=en_US`
- i.e. a **client-generated `sessionId` + a `/widgets/{channelUUID}/shoppingCart`**; payment is rendered in-widget for that session.
- **Untested hypothesis (potential Plan B'):** pre-build a `shoppingCart` for a chosen `sessionId` (our date/time/participants + extras), then open the widget bound to that `sessionId` so it resumes the cart at the payment step. This is essentially research "Option B". Unknowns: exact `shoppingCart` POST body; whether the widget honors an injected `?sessionId=`/resumes a pre-built cart at checkout; whether `/widgets/*` accepts server-side calls (CSRF/cookies). **Not validated — would need a dedicated follow-up spike.**

### 6. Plan B' — pre-build cart + resume in-widget: **NOT FEASIBLE** ✗ (user-authorized follow-up)
Scripts: `e2e/spike-bokun-widget-cart-capture.mjs`, `e2e/spike-bokun-widget-session-source.mjs`. Output: `widget-session-source-report.json`, `cart-capture-network.json`.
- Widget cart API (browser-side, no HMAC), keyed by `sessionId`: `GET /widgets/{uuid}/activity/{id}?availabilityRequired=1&currency=SEK&sessionId=…`, `POST /widgets/{uuid}/shoppingCart?...sessionId=…`, priced availability `POST /widgets/{uuid}/activity/{id}/{year}/{month}` body `{"pricingCategories":[{"id":30079,"quantity":1}],"giftCard":false}`.
- **Session is server-controlled and unforgeable:**
  - `?sessionId=spike-resume-…` on the URL → **ignored** (widget generated its own UUID).
  - Live session stored in **cookies** on `widgets.bokuntest.com`: `bokunSessionId_{uuid}` + `bokun_widgets_bc14797` (the UUID) + `bokun_widgets_sign14797` = **bcrypt `$2a$10$…` server signature**.
  - Preset localStorage (`sessionId`, `bokun.sessionId`, …) → **ignored**.
- **Why this kills B':** resuming a pre-built cart requires the user's browser to present Bokun's signed session cookie. We cannot mint that signature (server-side bcrypt), cannot inject a sessionId via URL/localStorage, and cannot read/set the `widgets.bokuntest.com` cookie cross-origin from our site. So "server pre-builds cart → user resumes at Bokun payment" is impossible. Driving the cart client-side would require embedding the widget (cross-origin DOM/postMessage — research Q5: no API).

## Required gate outputs (red-team hardening) — status

| # | Required output | Status |
|---|---|---|
| #3 | Webhook event + `booking.status` on reserve / reserve→paid | **UNVERIFIED** — no reservation succeeded; webhook not exercised. (`BokunBooking.status` still lacks `RESERVED`.) |
| #4 | confirm-reserved semantics / does Bokun auto-confirm CARD | **Resolved (negative):** `RESERVE_FOR_EXTERNAL_PAYMENT` = caller collects payment (contradicts "Bokun keeps payment"). Hosted CARD payment exists only in the widget. |
| #11 | Resolved redirect host(s) allowlist | **NONE** — no hosted-payment redirect URL exists in any API response. Only Bokun payment surface = the widget (`widgets.bokuntest.com`). |
| #16 | Extras-carry proof | **UNPROVEN** — no working reservation handoff to carry extras into. |
| #8 | Per-person `rates[]` per-age-band unit prices | **NOT VERIFIABLE here** — no per-person experience on this sandbox; prod availability endpoint also 404s on this account. |
| #13 | Idempotency token accepted? | **UNVERIFIED** — `clientReference` accepted in body shape but no reservation completed to confirm dedup. |
| #13 | Hold TTL + orphan behavior | **UNVERIFIED empirically** — research cites documented 30-min; not observed (no successful hold). |

## Recommendation

The plan's two assumed mechanisms are dead. Options for the user (see plan.md gate escalation):
1. **Phase 6 — restyle the embedded widget (Plan C).** Safe, ships visible improvement this week (remove multi-group stepper + redundant group-size; brand CSS). No custom panel.
2. **Authorize a bounded follow-up spike on the widget `shoppingCart` session-resume (Plan B').** Determines whether a custom panel → in-widget-checkout handoff (with extras, Bokun keeps payment) is achievable before committing the 9–12d build. If it dead-ends → fall to (1).
3. **Re-plan / drop the custom-panel goal.**

## Unresolved questions
1. Does prod Bokun differ from this sandbox account (REST v2.0 availability 404 here)? Affects production availability service validity. **MUST resolve before Phase 2 even if gate passes.**
2. Can the `/widgets/{channelUUID}/shoppingCart` session be pre-built server-side and resumed in the widget at the payment step (Plan B')? — the only remaining custom-panel-viable path.
3. Is there a true per-person experience anywhere (sandbox or prod) to capture the per-age-band `rates[]` shape (#8)?
