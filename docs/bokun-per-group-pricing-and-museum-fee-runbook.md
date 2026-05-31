# Bokun Per-Group (Private) Tour — Pricing & Museum Fee Runbook

> Operator runbook for setting up a **private / per-group** tour with a **capped group size** and a **per-person attraction admission** — single-tier (e.g. Vasa Museum: adult-paid / child-free) or multi-tier (e.g. Stockholm City Hall: adult / senior / student / youth / free child). Covers the booking model, the price, the admission extra(s), and the traps that silently empty the calendar.
>
> For the **CMS↔Bokun extras push-sync** (lifecycle, titles, delete-by-omission), see [bokun-extras-setup.md](./bokun-extras-setup.md). Read the ⚠️ sync-interaction section below before relying on any dashboard-only extra config.

All settings here are **Bokun dashboard only** and apply to the shared **production** Bokun account (staging + prod both read it; only local dev uses the sandbox).

---

## 1. Booking model — per-group, exclusive

A private tour is sold as **one group unit**, not per person:

- **Pricing category** = a **"Group" ticket category** (e.g. "Per group", Group Size N). The widget renders a single **"Group size" 1–N dropdown**. N comes from the category's **Group Size** field — NOT the rate.
- **Pricing categories are shared account-wide.** To give different tours different max group sizes, **clone** the category (Pricing categories → Create Pricing Category → "Per group (max N)") and assign per tour. **Do not edit the shared default** "Per group" (it is `Default` + `Has bookings` → editing changes every tour).
- **Group occupancy = "Reserve as many seats as group size"** → any booking reserves the full group size of seats → the departure is **exclusive** (one party owns the slot). This is what makes it private.

---

## 2. The three "calendar goes empty" traps

The booking engine filters out departures if these are inconsistent. Keep all three aligned to the group size N:

1. **Capacity per departure ≥ N.** (Availability → Capacity = Limited number; the number lives in Operating hours / Calendar.) With occupancy "reserve as group size", a booking needs N seats — if capacity < N, no booking fits → all departures vanish.
2. **Rate "Max. passengers per booking" ≥ N, or empty.** Setting it **below** the group size makes every booking impossible → all departures vanish (looks like a total outage; clearing the field restores it). To cap party size, lower the **category Group Size**, never the rate Max.
3. **Never toggle "Price is per pricing category" on the rate.** On a per-group tour this invalidates the rate and shows "Your selection is not available" across **every tour on the account** until each rate is re-saved. (Same trap documented in the extras SOP.)

If a widget suddenly shows "not available", check these three first.

---

## 3. Museum admission — why it's awkward, and the chosen model

A per-group booking captures only the **total group size** — never the adult/child split. So you **cannot** have all of these at once: *scales by head + child-free + mandatory + strict*. One must yield. The honest options:

| Option | Scales w/ size | Kids free | Mandatory/strict | Cost |
|---|---|---|---|---|
| A. Per-person extra | ✅ | ❌ charges kids | ✅ | overcharges families |
| **B. Per-adult selectable extra** | ✅ | ✅ kids not added | ❌ optional, self-reported | **chosen** |
| C. Bake into flat price | ❌ | ✅ cost math | ✅ | no scaling |

**Chosen: Option B.** Tour stays flat per-group; museum is a **selectable per-adult ticket extra**. Children (free at Vasa, under-18) are simply not added. Trade-off accepted: the extra is **optional + self-reported** (Bokun has no true mandatory multi-quantity extra — "Preselected" auto-adds exactly 1 and locks the quantity).

---

## 4. Exact configuration (the gotchas that cost us hours)

**Tour price** — Pricing → Rate → **Per booking** = flat tour price (e.g. 3900 SEK). Leave unchanged. (A per-group price cannot scale by headcount — quantity is always 1 group unit. That's expected.)

**Museum extra** (e.g. "Vasa Museum Ticket"):

1. **Extras step → Edit extra:** **Max units per booking = `Custom` = N** (the max group size, e.g. 9).
   - **Do NOT use "Maximum by participant"** — a Group category counts as **1 participant**, so that caps the extra at 1 (single toggle, can't add up).
2. **Rates step → on the rate row click "Manage N extras" → "Extras in this Rate" modal:**
   - **Pricing = "Priced separately"**
   - **"Extra is priced per person" = OFF** ← this is the per-unit switch. ON (or per-category) makes it **"per group"** = one flat charge with a single toggle, and it **ignores the Custom max**. OFF = per unit → quantity stepper.
   - **Selection = "Optional"** ← "Preselected" auto-adds 1 and locks quantity; "Optional" gives the 1–N stepper.
3. **Pricing step:** set the extra price = **240 SEK per unit** (Vasa adult admission).
4. **Description:** e.g. *"240 SEK per adult. Children under 18 enter free — do not add tickets for children."*
5. **Finish update.**

**Result:** checkout shows a **−0+ stepper (1–N)** at 240 each → total = 240 × quantity.

---

## 4b. Multi-tier admission (N price tiers → N extras)

Some attractions price entry by several visitor categories. A per-group booking still captures only the **total group size**, so the rule is unchanged — just repeated: **one selectable per-unit extra per PAID tier**, customer self-selects the count of each.

Worked example — **Stockholm City Hall** (guided visit):

| Attraction tier | Extra | Price / unit (SEK) |
|---|---|---|
| Entrance, adult | City Hall – Adult | 150 |
| Entrance, senior | City Hall – Senior | 130 |
| Entrance, student | City Hall – Student | 130 |
| Entrance, youth 7–18 | City Hall – Youth (7–18) | 60 |
| Entrance, child 0–6 (free, w/ guardian) | — **omit** | 0 |

Every tier extra uses the **identical config from §4** — Max units = **Custom = N**; **Priced separately**; **"Extra is priced per person" = OFF**; **Selection = Optional**; price = the per-unit amount. Checkout renders one stepper per tier; total = Σ(price × quantity).

Notes:
- **Merge same-price tiers** to cut clutter — Senior + Student (both 130) → one **"Senior / Student – 130"** extra. Price-identical so billing is unaffected; only the on-site manifest is slightly less granular. (DRY.)
- **Omit free tiers** (child 0–6) — no charge, no extra. Add a 0-SEK extra only if the manifest must show child counts.
- Trade-offs from §3 / §7 **amplify** with more tiers: more self-report rows = more honest mis-categorisation; per-tier caps don't *jointly* bound to the group size; checkout is busier (3–4 rows). The guide reconciles tier counts vs tickets on-site.
- **Same hard limit:** making this automatic/strict (Bokun charges exact per-tier prices, no self-reporting) needs real per-person pricing categories → which forfeits the private/per-group exclusivity. For a private tour, the extras approach is the correct trade.
- **§5 sync caveat applies to every tier extra** (the `maxPerBooking`→99 reset, title overwrite, and delete-by-omission hit all of them).

---

## 5. ⚠️ CMS push-sync interaction — verify before relying on this

If this tour's extras are managed by the **CMS→Bokun push sync** (baseline adopted + `BOKUN_EXTRAS_PUSH_ENABLED=true` — see [bokun-extras-setup.md](./bokun-extras-setup.md)):

- **Safe (dashboard-only, not synced):** the **price (240)**, the **"priced per person" toggle**, and **Selection**. The sync has no pricing-write endpoint, so these are never overwritten.
- **At risk (CMS-owned / push semantics):**
  - **`maxPerBooking` is pushed as 99** → your **Custom `9` gets reset to 99** on the next tour save.
  - **Title + description** are CMS-owned → manual Bokun edits get **overwritten**.
  - If the extra exists only in Bokun and isn't mirrored as a CMS add-on row, the next save **deletes it by omission**.

**Before trusting the dashboard config:** confirm whether 1215959 is on the push flow. If it is, mirror the extra as a CMS add-on row, manage title/description from CMS, and accept the cap reverts to 99 (tighten in dashboard after each push, or treat the cap as cosmetic since it's self-reported anyway). If it is **not** on the push flow, the dashboard config above is authoritative and safe.

---

## 6. Verification checklist

- [ ] Group-size dropdown caps at **N**; calendar **populated**; booking locks the slot **exclusively**.
- [ ] Museum extra shows a **1–N stepper** at 240; total = **240 × quantity**.
- [ ] Test booking (sandbox) completes; booking detail + confirmation email show the add-on.
- [ ] If CMS-synced: a CMS tour-save does **not** delete the extra or break the cap (see §5).

---

## 7. Operational notes & limitations

- **Self-reported, optional** — a customer can under-buy or skip tickets. Mitigate: per-adult instruction in **Description** + **"Know before you go"**, and the **guide reconciles adult count vs tickets at the meeting point** (collect any shortfall on-site).
- **"Includes Vasa Museum" wording** — entry isn't enforced online; don't promise pre-paid entry the booking can't guarantee.
- **Cap is fixed at N** — it can't auto-match the chosen group size (group = 1 participant). Bounded by max group, acceptable for self-reported tickets.
- **No true mandatory multi-quantity extra** in Bokun (Preselected = qty 1).

---

## Open questions

1. Is tour **1215959** on the CMS extras **push-sync** flow (baseline adopted + flag on)? If yes, §5 risks apply and need reconciliation before go-live.
2. Margin stance for all-adult max groups — flat 3900 + per-adult museum is set; confirm the flat tour price still covers cost at small group sizes.
