# Bokun Extras — Operator Setup SOP (v2)

> **Hybrid sync model.** CMS owns add-on **lifecycle + titles + descriptions**. Bokun dashboard owns **prices**, the **Required** toggle, and **photos**. Operator works in CMS for new extras; touches Bokun only to set price + Required. (Prior to 2026-05-29 this was a fully manual mirror — that SOP is archived below.)

## When to use this doc

You're an operator and you need to add a paid extra to a tour — museum admission, meals, equipment rental, etc.

## Prerequisites

- Bokun dashboard access (you still need it for price + Required + photos)
- Payload CMS admin access (`/admin` on staging + production)
- Tour is **already linked to Bokun** — its CMS `Bokun Experience ID` field is filled in
- **Feature flag enabled:** `BOKUN_EXTRAS_PUSH_ENABLED=true` is set in the environment (check with dev/ops if unsure)
- **Per-tour baseline adopted** — see Step 0 if this is the first time you're using the push sync on this tour

Related context:
- Plan: [plans/260525-1417-bokun-extras-push-sync/](../plans/260525-1417-bokun-extras-push-sync/)
- Phase 01 sandbox findings: [bokun-extras-write-api-sandbox-findings.md](../plans/260525-1417-bokun-extras-push-sync/research/bokun-extras-write-api-sandbox-findings.md)
- Pricing-write API audit: [researcher-260529-1602-bokun-pricing-write-endpoint-exhaustive.md](../plans/reports/researcher-260529-1602-bokun-pricing-write-endpoint-exhaustive.md)

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

## Step 0 — Adopt baseline (existing tours only, once)

If the tour already has extras configured directly in the Bokun dashboard (the old SOP path), you must explicitly adopt the current Bokun state into CMS **before** push sync activates. Otherwise the first save would wipe any dashboard-only extras CMS doesn't yet mirror.

1. Open the tour in Payload admin
2. In the right sidebar, find the **Extras push (Phase 2)** panel
3. Click **Adopt baseline…** — a modal opens showing:
   - **Will UPDATE in Bokun** — CMS rows already wired to Bokun extras (`bokunExtraId` matches)
   - **Will CREATE in Bokun** — CMS rows without a `bokunExtraId` (or with a stale one)
   - **Will DELETE in Bokun** — Bokun-side extras with no CMS row pointing to them ⚠️
4. **Read the DELETE bucket carefully.** Anything there will be removed on the next tour save. If you want to keep it, cancel and either (a) add a matching CMS row before adopting, or (b) verify it's truly orphaned.
5. Click **Adopt — allow future pushes**. The sidebar now shows `✓ Baseline adopted <date>`.

Adopting does NOT push anything immediately — it just unlocks the gate for the next save.

---

## Step 1 — Add the row in CMS

1. Open the tour → scroll to **Add-ons (Paid at Checkout)** section
2. Click **Add Add-on**
3. Fill the fields:
   - **Name** (localized sv/en/de) — customer-facing title. **English version** is what Bokun receives (configurable per deployment via `BOKUN_SYNC_LOCALE`).
   - **Description** (localized, optional) — one short line
   - **Pricing Type** — `Per booking (flat)` or `Per person`. **Informational only** (drives tour-page price-hint copy). The actual pricing config lives in Bokun.
   - **Adult Price Hint** — what the tour page displays as a hint. **Informational only — Bokun is authoritative.** Keep in sync manually after Step 2.
   - **Child Price Hint** — optional, same caveat
   - **Currency** — SEK / EUR / USD (display)
   - **Required at checkout** — renders the amber `Required` pill on the tour page. **Informational only** — the actual Bokun-side Required toggle is set in Step 3.
   - **Bokun Extra ID** — **leave empty for new add-ons.** Will be auto-populated by the push sync.
   - **Display Order** — lower numbers display first
4. **Save the tour.** The afterChange hook fires → Bokun receives the new extra → response returns the assigned ID → CMS row's `Bokun Extra ID` is populated automatically.
5. Refresh the page if needed. You should now see the `Bokun Extra ID` filled in.

> The push sync handles: title, description, type (hardcoded to "OTHERS"), maxPerBooking (default 99), limitByPax (false). Bokun's API does NOT accept `Required` or price as part of extras — those live elsewhere (Step 2-3).

---

## Step 2 — Set the price in Bokun dashboard

The extra now exists in Bokun with default config but no price. Set it:

1. Bokun dashboard → **Products → [tour] → Extras** (sidebar)
2. Find your new extra (matches the CMS Name)
3. Open it → set the **price** (SEK amount, per-booking flat or per-pricing-category)
4. Save

Then **update the CMS Adult Price Hint to match** so the tour page displays the correct number.

> If price hint drifts from Bokun price, the customer sees one number on the tour page and a different one in the widget. There is no automated drift check yet (deferred to v2.1).

---

## Step 3 — Toggle Required in Bokun dashboard (if needed)

If this extra should be auto-included with every booking:
1. Bokun dashboard → same Extras edit page
2. Toggle **Required = ON**
3. Save

Then mirror in CMS by toggling `Required at checkout` on the same row — this only affects the amber pill on the tour page; Bokun's setting is what actually matters at checkout.

---

## Step 4 — Localize widget translations (sv / de)

The push sync sends ONE locale per extra (`BOKUN_SYNC_LOCALE`, default `en`). If you need the Bokun checkout widget to show Swedish or German extra titles:

1. Bokun dashboard → Extras → your new extra → **Translations**
2. Add the sv / de versions manually

CMS keeps the localized name for tour-page rendering; Bokun's separate translation flow handles the widget. **These can diverge** — verify both match.

---

## Step 5 — Verify

1. **Tour page (public):** open in all 3 locales. The new add-on row should appear with the right pill (`Required` amber / `Optional` slate) and price hint.
2. **Widget checkout:** click `Book Now` → step through to the extras step → the extra is offered with the **correct Bokun price** (not the hint).
3. **Sandbox booking:** complete a test booking (`qa+addontest@privatetours.test`). Confirm:
   - **Admin booking detail** shows the purchased `Add Ons` JSON
   - **Confirmation email** renders the `Add-ons:` block

---

## Removing an extra

1. Delete the row from CMS `optionalAddOns`
2. Save the tour
3. Push sync sends the remaining extras list (the deleted one is omitted) → Bokun deletes the corresponding extra by omission (full-replacement semantics).
4. **No manual Bokun cleanup needed.** Confirm in the Bokun dashboard.

---

## Re-baseline (after manual Bokun dashboard changes)

If anyone edits the extras list directly in the Bokun dashboard while baseline is active (added an extra, deleted one, etc.), CMS will not know — and the next CMS save will overwrite. To re-sync:

1. Open the tour in Payload admin
2. Click **Re-baseline (after manual Bokun changes)** in the sidebar panel
3. Review the new diff → if it looks right, **Adopt**

This is a defensive workflow — the normal path is "all extras lifecycle changes happen in CMS".

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Tour page section doesn't appear | All rows missing `Bokun Extra ID` | Save the tour to trigger the push sync — IDs auto-populate. |
| Widget shows extra at wrong price | CMS hint ≠ Bokun price | Bokun is canonical. Update CMS `Adult Price Hint` to match. |
| Save doesn't push extras to Bokun | `BOKUN_EXTRAS_PUSH_ENABLED` is false OR `bokunExtrasBaselineAt` is null on this tour | Check env var + adopt baseline (Step 0). |
| Diff modal "Will DELETE" bucket has rows you want to keep | Bokun-side extras not mirrored in CMS | Add matching CMS rows before adopting baseline. |
| Save failed with `bokunLastError` mentioning `maxPerBooking absent` | CMS row defaults didn't apply | Internal bug — file an issue. Default should always apply. |
| Save failed with `Unrecognized field "required"` | Old code path | Update — push mapper deliberately drops `required` (not on Bokun's ExtraDto). |
| Widget shows extra in English only | Bokun-side translations not configured | Add sv/de in Bokun dashboard (Step 4). |
| Customer wants Required removed | Bokun-side toggle | Step 3, set Required = OFF, then mirror in CMS row. |
| Widget shows "not available" after editing extras | "Price is per pricing category" trap (see Critical Warning) | Open each affected tour's rate edit modal → toggle OFF → re-save. |
| Confirmation email has no Add-ons line | Booking happened before Phase 1 of the extras work | New bookings only. Old bookings have NULL `addOns`. |

---

## Limitations (v2)

- **Pricing not synced** — Bokun REST v2.0 has no pricing-write endpoint for extras (confirmed by exhaustive probe + OpenAPI audit). Operator keeps Adult Price Hint in CMS up to date manually after Step 2.
- **Required flag not synced** — `required` is not on Bokun's `ExtraDto` schema. Dashboard-only.
- **Photos not synced** — `photo` field is on ExtraDto but not modeled in CMS yet.
- **`maxPerBooking` hardcoded to 99** — CMS doesn't model this. Operator can tighten the cap directly in Bokun dashboard.
- **Single locale sync** — only `BOKUN_SYNC_LOCALE` (default `en`) is pushed. Bokun-side translations for sv/de are managed separately in the dashboard.
- **No price-drift audit script yet** — periodic check that CMS Adult Price Hint matches Bokun is a v2.1 candidate.
- **Date / time-slot-conditional extras** are not supported.
- **Confirmation + cancellation emails are English-only**, regardless of booking locale.

---

## When you're ready to retire this SOP

A future v2.1 could:
- Add automated drift detection (CMS hint vs Bokun price)
- Push multi-locale titles via Bokun's translations component (when/if that endpoint becomes exposed)
- Sync `Required` flag (when/if `required` becomes a write-side field on ExtraDto)

Until then, this is the contract.
