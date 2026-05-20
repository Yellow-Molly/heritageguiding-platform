# Bokun Cart CSS Customization

> **Important — load-bearing.** This CSS lives in the Bokun admin dashboard (not in this repo). If a future developer "cleans up" the Bokun theme without checking here, the WCAG fix for the cart delete button will silently disappear.

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
```

## Selector contract

| Selector | Why this one |
|---|---|
| `button[data-testid="remove-from-cart"]` | `data-testid` is a stable contract. Test IDs rarely churn even when Bokun renames CSS classes between deploys. Far more durable than the scrambled `sc-dxroEu iuwoOl` SVG classes. |
| `button[data-testid="remove-from-cart"] svg` | Scales the SVG above its inline `width="10" height="10"` HTML attributes — CSS dimensions beat presentation attributes. |
| `button[data-testid="remove-from-cart"] svg path` | Recolors via `fill:` (CSS) over inline `fill="#C4C4C4"` (attribute). |

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

- **No `aria-label` on the button.** Screen-reader users hear "button" with no purpose. Fixing this requires Bokun to add the attribute server-side. Submit a feature request to Bokun support if a11y compliance matters for your market.
- **CSS class names elsewhere in checkout still churn.** Avoid extending this stylesheet with scrambled-class selectors (`sc-abCDe iuwoOl` style); they regenerate on Bokun deploys. Stick to semantic attributes (`data-testid`, `aria-*`, `name`, etc.).

## Last verified

- **Date:** 2026-05-21
- **Bokun channel:** value of `NEXT_PUBLIC_BOKUN_UUID` (see deployment-guide.md)
- **Verified breakpoints:** desktop (≥1024px) right-rail cart, mobile (<768px) "Order summary" accordion
- **Applied via:** Bokun admin → Theme → Show advanced options
