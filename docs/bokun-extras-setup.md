# Bokun Extras — Operator Setup SOP

> **Manual sync model.** Bokun is the source of truth for prices and checkout. The CMS holds an **informational mirror** so the tour page can show what's available before the customer reaches the booking widget. Operators configure both sides; there is no automatic CMS → Bokun push in v1.

## When to use this doc

You're an operator (not a developer) and you need to add a paid extra to a tour — museum admission tickets, meals, extra-equipment rental, etc. Customer picks quantity and pays inside the Bokun checkout widget on the tour page.

## Prerequisites

- Bokun dashboard access (you can edit Products → [a tour] → Extras)
- Payload CMS admin access (`/admin` on the staging + production sites)
- The tour you want to add an extra to is **already linked to Bokun** — its CMS `Bokun Experience ID` field is filled in. If it isn't, finish the Bokun integration onboarding for that tour first.

Related context:
- Plan: [plans/260519-2046-bokun-extras-add-ons-checkout/](../plans/260519-2046-bokun-extras-add-ons-checkout/)
- Webhook shape findings: [research/bokun-extras-shape-findings.md](../plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-shape-findings.md)
- Related Bokun customizations: [bokun-cart-css-customization.md](./bokun-cart-css-customization.md)

---

## ⚠️ Critical warning before you start

**Do NOT toggle "Price is per pricing category" on an experience rate.** That toggle lives on **Products → [tour] → Pricing → Rates → [Standard] → Edit**, and flipping it on a "Per group" tour invalidates the rate → the widget shows "Your selection is not available" across **every tour on the account** until each rate is re-saved.

If a tour widget suddenly shows "not available" after editing extras, this toggle is the most likely cause. Walk through every tour's rate edit modal and confirm:
- "Price is per pricing category" = **OFF**
- "All pricing categories" = **ON**
- "All start times" = **ON**
- Min passengers per booking = **1**

Then re-save the rate. Repeat for every affected tour.

---

## Step 1 — Create the extra in Bokun

1. Bokun dashboard → **Products → [your tour] → Extras** (sidebar)
2. Click **+ Add Extra**
3. **Title:** Customer-facing name (e.g. `Vasa Museum admission ticket`). This appears in the widget.
4. **Max units per booking:** pick **"Maximum by participant"** for per-person items (museum tickets, meals); **"No maximum"** only if quantity is truly unlimited; **"Custom"** for a hard cap (rare).
5. **Type:** pick **"Others"** unless this is a Food/Drinks/Transport item — the field only matters for the GetYourGuide channel and you can ignore it for direct Bokun bookings.
6. **Description:** optional. Plain text. Shown to the customer inside the widget.
7. **Submit** — you land on the Extra's pricing screen next.

### On the Extra's pricing screen

- **Stay per-booking flat** for this account's model. Leave any "Per person" or "Per pricing category" toggle **OFF** unless you've explicitly configured Adult + Child pricing categories on the tour (which Private Tours does not have today).
- **Price:** enter the SEK amount. This is what Bokun actually charges; the CMS Adult Price Hint must match.
- **Required:** **OFF** for opt-in items. **ON** only for things that are part of the tour (e.g. mandatory museum admission). Required extras auto-include in every booking — customer cannot deselect.

Save.

---

## Step 2 — Copy the Extra ID

After saving, the URL ends in `.../extras/<NUMBER>/edit` — that number is the Extra ID (e.g. `276080`). Copy it somewhere you can paste from in a moment.

---

## Step 3 — Mirror in Payload CMS

1. Open Payload admin → **Tours** → the tour you just edited in Bokun
2. Scroll to the **Add-ons (Paid at Checkout)** section (between "What's Not Included" and "Logistics")
3. Click **Add Add-on**
4. Fill the fields:
   - **Name:** match the Bokun title. Localize per language (see Step 4).
   - **Description:** optional, localized. One short line.
   - **Pricing Type:** **Per booking (flat)** for this account's model. Switch to **Per person** only if the Bokun extra is actually configured with Adult/Child pricing categories.
   - **Adult Price Hint:** the SEK number you entered in Bokun (e.g. `150`). This is what the tour page displays as a price hint. **Must match Bokun-side price.**
   - **Child Price Hint:** leave empty unless using per-person tiers.
   - **Currency:** SEK (or whichever matches the tour).
   - **Required at checkout:** mirror what you set in Bokun.
   - **Bokun Extra ID:** paste the number from Step 2.
   - **Display Order:** lower numbers display first. Leave `0` unless you have multiple add-ons to order.
5. **Save the tour.**

> The collapsed row label updates to show the add-on name. If it shows `Vasa Museum Ticket — not yet wired`, the `Bokun Extra ID` field is empty — fix and save again. **The public tour page hides rows missing the Bokun Extra ID.**

---

## Step 4 — Localize (sv / en / de)

1. Still in the tour edit page, use the **locale switcher** (top-right of Payload admin)
2. For each of `sv`, `en`, `de`: switch locale → update `Name` and optionally `Description` for the add-on row → save
3. The non-localized fields (Pricing Type, prices, Currency, Required, Bokun Extra ID, Display Order) are shared across locales — you only edit them once.

> Bokun translates extra names separately inside its own admin. Verify the customer-facing widget translation matches your CMS copy. If they diverge, fix in Bokun.

---

## Step 5 — Verify end-to-end

1. **Tour page (public):** open the tour on staging in all 3 locales. The new add-on row should appear in the **Add-ons** section with the right pill (`Required` amber / `Optional` slate) and price hint.
2. **Widget checkout:** click `Book Now` → step through to the extras step → the extra is offered with the correct price.
3. **Sandbox booking:** complete a test booking (use `qa+addontest@privatetours.test` to skip PII concerns). Confirm:
   - **Admin booking detail** in Payload shows the read-only **Add Ons** JSON field populated with the purchased extra
   - **Confirmation email** to the test address renders the `Add-ons:` block with the line item

If any of those fail, see Troubleshooting below.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Tour page section doesn't appear | All rows missing `Bokun Extra ID` | Add the ID and save. Filter is at the loader level — rows without ID are hidden entirely from the public. |
| Widget shows extra at wrong price | Bokun ↔ CMS drift | Bokun price is canonical at checkout. Update CMS `Adult Price Hint` to match. |
| Widget shows no extras at all | Extra not enabled on the channel | In Bokun → Settings → Booking channels → [your channel] → confirm the extra is included for this product |
| Widget shows "not available" after editing extras | "Price is per pricing category" was toggled on the rate (see Critical Warning above) | Open each affected tour's rate edit modal → toggle OFF → re-save |
| Confirmation email has no Add-ons line | Booking happened before Phase 04 webhook deploy, OR rate didn't fire `BOOKING_CREATED` | New bookings only. Old bookings have no `addOns` in their DB row (NULL). |
| Customer wants to deselect a Required extra | Required = auto-included in Bokun config | Switch Required to OFF in Bokun → save → re-test widget |

---

## Limitations (v1)

- **No automatic CMS → Bokun push sync** for extras. Prices and titles must be kept in sync manually. Phase-2 push sync would extend the existing `bokun-sync-job` (see [plans/260514-1437-bokun-integration/](../plans/260514-1437-bokun-integration/)).
- **No live validation** that the `Bokun Extra ID` you paste actually exists in Bokun. A typo means the customer sees no extra in the widget but the CMS row stays visible. Verify in Step 5.
- **No price-drift audit script.** A periodic check that flags CMS Adult Price Hint ≠ Bokun price is a Phase-2 candidate.
- **Date / time-slot-conditional extras** are not supported — an extra is either always offered for the tour or not at all.
- **Confirmation + cancellation emails are English-only**, regardless of booking locale. Localized emails are a separate scope.

---

## When you're ready to retire this SOP

The manual workflow above can be replaced by extending the `bokun-sync-job` to push extras (CMS → Bokun) on tour save. Until that ships, this doc is the contract.
