# Bókun Widget CSS Customizations

> **Important — load-bearing.** The CSS documented here lives in the Bókun admin dashboard (not in this repo) and is injected into the Bókun widget/checkout iframe. If a future developer "cleans up" the Bókun theme without checking here, these fixes silently disappear.

This file is the single in-repo record of every CSS rule pasted into the Bókun theme editor. It currently covers:

1. **Cart delete button** — WCAG target-size / contrast / focus fix.
2. **Booking widget — "Per group" quantity stepper** — hidden so private tours sell as a single group; party size is chosen via the separate "Group size" dropdown, and parties above the max use the "Request Group Quote" button.
3. **Booking widget — "Group size" dropdown label** — hidden because it's a Bokun hardcoded system string that stays English on sv/de widgets with no CSS locale hook to translate it. With the stepper (item 2) already hidden, the "Group size" dropdown is the party-size selector; hiding its English label is the locale-safe choice (an unlabeled dropdown beats wrong-language text).
4. **Checkout modal close (X) button** — contrast / icon-size / focus / brand fix. The button is already ~50×50 (target size is fine), but ships a small, faint gray X that reads as disabled — enlarged + recolored navy + focus ring restored.

## Why this exists

Bokun's embedded checkout cart ships a delete-item button that fails WCAG 2.5.8 (16×16 px, target should be ≥24×24), 1.4.11 (`#C4C4C4` icon ~2.5:1 contrast on white, should be ≥3:1), and 2.4.7 (focus ring stripped via `focus:outline-none`). The button reads as decorative chrome rather than an interactive control. We cannot modify Bokun's iframe DOM directly (cross-origin), so we inject CSS via Bokun's own theme system, which Bokun serves alongside the cart.

Related context:
- Brainstorm: [plans/reports/brainstorm-260520-2316-bokun-cart-delete-button-css-fix.md](../plans/reports/brainstorm-260520-2316-bokun-cart-delete-button-css-fix.md)
- Research: [plans/reports/researcher-260520-2257-bokun-checkout-customization-options.md](../plans/reports/researcher-260520-2257-bokun-checkout-customization-options.md)
- Plan: [plans/260520-2316-bokun-cart-css-fix/plan.md](../plans/260520-2316-bokun-cart-css-fix/plan.md)
- Phase 01 recon: [plans/260520-2316-bokun-cart-css-fix/phase-01-recon-findings.md](../plans/260520-2316-bokun-cart-css-fix/phase-01-recon-findings.md)

## Where it lives

**Bokun admin path:** Settings → Booking channels → [channel matching `NEXT_PUBLIC_BOKUN_UUID`] → Widget → Theme → **"Show advanced options"** → CSS/SASS editor.

Bokun serves this CSS into the checkout iframe at `widgets.bokun.io`, sidestepping the cross-origin restriction that blocks us from injecting styles from our own domain.

## Widget theme colors (brand match)

Set in the **same Theme panel** (Widgets → Theme → **Primary color** / **Secondary color**), separate from the advanced CSS below. These map to the platform design tokens in `apps/web/app/globals.css`:

| Bokun field | Value | Platform token |
|---|---|---|
| **Primary color** | `#1E3A5F` (deep navy) | `--color-primary` |
| **Secondary color** | `#C05030` (coral) | `--color-accent` |

**Rationale / decision (2026-05-31):** Operator chose **navy-primary** for a calmer, more premium widget. Note this is a deliberate divergence: the platform's *actual primary CTA color is coral* — `components/ui/button.tsx` `primary` variant and the booking CTA (`components/tour/tour-mobile-price-bar.tsx`) both use `bg-[var(--color-accent)]` (coral) with white text; navy is the structural/heading color. So the widget's main buttons will read navy while the site's "Book" buttons are coral. Both are WCAG-AA with white text. If you ever want the widget buttons to match the site CTAs exactly, swap to Primary `#C05030` / Secondary `#1E3A5F`.

Same caveats as the CSS: **channel-wide** and **shared across staging + production** (one Bokun account).

## The CSS (canonical source)

```css
/* =============================================================
   Bokun cart delete button — discoverability + WCAG fix
   Targets:
     WCAG 2.5.8 Target Size  (≥24×24 CSS px)
     WCAG 1.4.11 Non-text Contrast (≥3:1, we ship ≥7:1)
     WCAG 2.4.7 Focus Visible (restore stripped outline)
   Selector contract: data-testid="remove-from-cart"
   Why !important: Bokun ships Tailwind utilities (h-4 w-4 p-0
   focus:outline-none) directly on the button. We override with
   single-attribute specificity — !important is the smallest hammer
   that wins without inventing parent-chain selectors that would
   break on layout refactors.
   ============================================================= */

button[data-testid="remove-from-cart"] {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  padding: 6px !important;
  margin-left: 12px;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid transparent;
  transition: background-color 150ms ease, border-color 150ms ease;
}

/* Scale the SVG icon above its inline width="10" height="10" attrs */
button[data-testid="remove-from-cart"] svg {
  width: 16px !important;
  height: 16px !important;
}

/* Recolor the icon path — overrides hardcoded fill="#C4C4C4" */
button[data-testid="remove-from-cart"] svg path {
  fill: #4b5563 !important;  /* gray-600, ~7.5:1 on white */
  transition: fill 150ms ease;
}

/* Hover — clear destructive intent */
button[data-testid="remove-from-cart"]:hover {
  background-color: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.30);
}
button[data-testid="remove-from-cart"]:hover svg path {
  fill: #b91c1c !important;  /* red-700 */
}

/* Keyboard focus — restore ring Bokun strips via focus:outline-none */
button[data-testid="remove-from-cart"]:focus-visible {
  outline: 2px solid #2563eb !important;
  outline-offset: 2px;
}

/* =============================================================
   Booking widget — hide the "Per group" quantity stepper.
   Private tours sell as ONE group at a flat price; the customer
   sets party size via the separate "Group size" dropdown, and
   parties above the max use "Request Group Quote". Hiding this
   control freezes the per-group quantity at its default of 1.
   Selector contract: .PricingCategorySelector (readable class).
   Title-scoped alternative: [data-testid="Per group-selector"].
   !important required — Bokun ships Tailwind utilities on the node.
   ============================================================= */
.PricingCategorySelector {
  display: none !important;
}

/* =============================================================
   Booking widget — hide the "Group size" dropdown label.
   "Group size" is a Bokun HARDCODED SYSTEM STRING (English): it is
   NOT in Settings → Translations (only the pricing-category Title is
   translatable), so it stays English on sv/de widgets while every
   surrounding label localizes. No CSS locale hook exists to translate
   it per-language — the widget iframe has NO lang attribute on
   <html>/<body>; locale is JS-only (window.forcedLanguage='sv_SE').
   So :lang() can't branch, and forcing one language would be wrong
   for the others → we hide it (locale-safe). With the stepper above
   already hidden, the "Group size" dropdown is the party-size control;
   an unlabeled dropdown is accepted over wrong-language text.
   Durable fix = a Bokun support ticket to localize the string.
   ⚠ FRAGILE selector: this label has NO data-testid — it leans on
   .justify-end + .text-sm (Tailwind) under .PricingCategories (the
   only .text-sm span in that block). Avoid the sc-* hashed classes.
   Re-verify after Bokun UI updates.
   ============================================================= */
.PricingCategories .justify-end span.text-sm {
  display: none !important;
}

/* =============================================================
   Checkout modal close (X) button — make it read as ACTIVE.
   Unlike the cart delete button, this one is already ~50×50 px, so
   target size (WCAG 2.5.8) is NOT the problem — do NOT shrink it.
   It ships a small, low-contrast X glyph that reads as disabled.
   Fix = enlarge the icon + recolor navy (brand) + restore focus ring.
   Closing is non-destructive → navy/neutral styling, NOT red.
   Selector contract: data-testid="close-widget-button".
   Navy #1E3A5F = --color-primary (~10:1 on white) and matches the
   site's own :focus-visible ring (apps/web/app/globals.css).
   ============================================================= */
button[data-testid="close-widget-button"] {
  min-width: 48px !important;   /* floor only — preserves the existing ~50px, never shrinks */
  min-height: 48px !important;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid transparent;
  color: #1E3A5F !important;    /* recolors currentColor SVGs / any text "×" glyph */
  opacity: 1 !important;        /* defeat any disabled-look opacity */
  cursor: pointer !important;
  transition: background-color 150ms ease, border-color 150ms ease;
}

/* The actual fix — bigger, darker X (covers <path>, <line>, stroke-drawn) */
button[data-testid="close-widget-button"] svg {
  width: 24px !important;       /* up from the faint ~16px */
  height: 24px !important;
}
button[data-testid="close-widget-button"] svg path,
button[data-testid="close-widget-button"] svg line {
  fill: #1E3A5F !important;
  stroke: #1E3A5F !important;
}

/* Hover — subtle navy wash, clearly interactive (non-destructive) */
button[data-testid="close-widget-button"]:hover {
  background-color: rgba(30, 58, 95, 0.08);
  border-color: rgba(30, 58, 95, 0.25);
}

/* Keyboard focus — navy ring matching the site */
button[data-testid="close-widget-button"]:focus-visible {
  outline: 2px solid #1E3A5F !important;
  outline-offset: 2px;
}
```

## Selector contract

| Selector | Why this one |
|---|---|
| `button[data-testid="remove-from-cart"]` | `data-testid` is a stable contract. Test IDs rarely churn even when Bokun renames CSS classes between deploys. Far more durable than the scrambled `sc-dxroEu iuwoOl` SVG classes. |
| `button[data-testid="remove-from-cart"] svg` | Scales the SVG above its inline `width="10" height="10"` HTML attributes — CSS dimensions beat presentation attributes. |
| `button[data-testid="remove-from-cart"] svg path` | Recolors via `fill:` (CSS) over inline `fill="#C4C4C4"` (attribute). |

### Per-group stepper selector

| Selector | Why this one |
|---|---|
| `.PricingCategorySelector` | Readable class (not scrambled like `sc-kGCsyv kbnaUT`). Hides the whole per-group quantity block; the "Group size" dropdown is a sibling node and is unaffected. **Channel-wide** — hides the stepper for every pricing category on every product in this channel. Fine for a per-group-only catalogue. |
| `[data-testid="Per group-selector"]` | Title-scoped alternative — matches only categories titled exactly "Per group". Switch to this if the channel ever serves per-person products (Adult/Child) whose steppers must stay visible. |

### "Group size" label selector

| Selector | Why this one |
|---|---|
| `.PricingCategories .justify-end span.text-sm` | The label has **no `data-testid`** and no class of its own, so this leans on `.justify-end` + `.text-sm` (Tailwind) scoped under `.PricingCategories` — the only `.text-sm` span in that block. **More fragile** than the data-testid selectors; re-check after Bokun UI changes. Avoid the `sc-*` hashed classes (regenerate on deploys). |

> **Why hide, not translate:** the widget iframe exposes no CSS-reachable locale — no `lang` attribute on `<html>`/`<body>`; language is JS-only (`window.forcedLanguage='sv_SE'`). So `:lang()`/`[lang]` scoping is impossible on a shared channel, and forcing one language would be wrong for the others. Per-language CSS would require **separate booking channels** (one theme each). The durable fix is a **Bokun support request** to localize the "Group size" system string for sv/de.

> **Pairs with a Bókun product setting** (not CSS): on each per-group experience, the **Standard** rate's **Max. passengers per booking = max group size** (e.g. 9) blocks any 2-group booking server-side, so a customer who bypasses the hidden stepper still cannot complete an over-count. This value is **not** written by the CMS→Bókun sync — `apps/web/lib/bokun/serialize-bokun-wire-payload.ts` omits the pricing/rates component (`BokunExperienceWirePayload` carries only title/description/included/excluded/requirements/extras), so the manually-set cap is safe from re-syncs.

### Close (X) button selector

| Selector | Why this one |
|---|---|
| `button[data-testid="close-widget-button"]` | Stable `data-testid` contract (like the cart delete button). Note: **no size override** — the button is already ~50×50, so we set only a `min-*` floor and never shrink it. |
| `button[data-testid="close-widget-button"] svg` | Enlarges the faint ~16px X to 24px so it reads as active. |
| `button[data-testid="close-widget-button"] svg path, … svg line` | Recolors via `fill`/`stroke` to navy. The `color:#1E3A5F` on the button also covers `currentColor` SVGs and any text-`×` glyph. If the X stays gray, inspect the markup (text glyph vs stroke-only SVG) and tighten. |

## Maintenance protocol

If the cart delete button looks broken again (tiny, gray, no hover effect), Bokun likely changed something. Walk through:

1. Open a tour-detail page on production, add to cart, advance to the cart/order-summary step
2. Open Chrome DevTools, click into the cart iframe
3. Inspect the delete-X element. Confirm:
   - Does `data-testid="remove-from-cart"` still exist?
     - If **yes** but styles aren't applied → check Bokun admin still has the CSS pasted; theme may have been reset
     - If **no** → Bokun changed the test ID. Find the new attribute, update the CSS, re-paste in admin, update this doc
4. Check whether the markup structure changed (`<button>` → `<a>`, SVG removed, etc.). Adjust selectors accordingly.
5. Verify in incognito + hard refresh (Bokun caches the theme aggressively)

## Known limitations (NOT solvable via CSS)

- **No `aria-label` on the cart delete or modal close buttons.** Screen-reader users hear "button" with no purpose (CSS can't add an accessible name). Fixing this requires Bokun to add the attribute server-side. Submit a feature request to Bokun support if a11y compliance matters for your market.
- **CSS class names elsewhere in checkout still churn.** Avoid extending this stylesheet with scrambled-class selectors (`sc-abCDe iuwoOl` style); they regenerate on Bokun deploys. Stick to semantic attributes (`data-testid`, `aria-*`, `name`, etc.).
- **"Group size" label is a Bokun system string, not translatable in-dashboard.** Settings → Translations exposes only the pricing-category Title; the "Group size" selector label is hardcoded English. We hide it via CSS (locale-safe) because the iframe has no CSS-reachable locale hook. Durable fix: a Bokun support ticket to localize it for sv/de.

## Last verified

- **Cart delete button — Date:** 2026-05-21
- **Per-group stepper — Date:** 2026-05-31 (verified hidden in Bókun Preview; "Group size" dropdown retained)
- **"Group size" label hide — Date:** 2026-05-31 (confirmed system string — only category Title translatable; iframe has no lang attribute, locale is JS-only `window.forcedLanguage='sv_SE'` → no `:lang()` hook)
- **Widget theme colors — Date:** 2026-05-31 (Primary `#1E3A5F` navy / Secondary `#C05030` coral; deliberate navy-primary choice — site CTA is actually coral)
- **Modal close (X) button — Date:** 2026-05-31 (button already ~50×50 — not a size issue; enlarged icon 16→24px, recolored navy, focus ring restored)
- **Bokun channel:** value of `NEXT_PUBLIC_BOKUN_UUID` (see deployment-guide.md)
- **Verified breakpoints:** desktop (≥1024px) right-rail cart, mobile (<768px) "Order summary" accordion
- **Applied via:** Bokun admin → Theme → Show advanced options
