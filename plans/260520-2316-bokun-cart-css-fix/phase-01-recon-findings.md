# Phase 01 — Recon Findings

**Date:** 2026-05-21
**Hard gate:** PASSED — Bokun admin exposes "Show advanced options" CSS editor on our tier (screenshot: `visuals/01-bokun-css-editor.png`)

## Target element

Delete button in Bokun checkout cart:

```html
<button
  class="flex cursor-pointer items-center justify-center border-none bg-transparent focus:outline-none active:scale-90 h-4 w-4 p-0"
  data-testid="remove-from-cart">
  <svg xmlns="..." viewBox="0 0 21.9 21.9" width="10" height="10" class="sc-dxroEu iuwoOl">
    <path d="..." fill="#C4C4C4"></path>
  </svg>
</button>
```

## Selector choice

**`button[data-testid="remove-from-cart"]`** — `data-testid` is a stable contract. Test IDs change rarely; far more durable than the scrambled `sc-dxroEu iuwoOl` SVG classes.

## Current state (WCAG fails)

| Property | Current | WCAG threshold | Status |
|---|---|---|---|
| Bounding box | 16×16 px (`h-4 w-4`) | ≥24×24 (2.5.8) | FAIL |
| SVG icon | 10×10 px (inline attrs) | — | FAIL (visual reading) |
| Fill color | `#C4C4C4` on white | ≥3:1 (1.4.11) → contrast 2.5:1 | FAIL |
| Focus ring | None (`focus:outline-none`) | Visible focus (2.4.7) | FAIL |
| Accessible name | None (no `aria-label`) | 4.1.2 | FAIL (cannot fix via CSS — Bokun feature request) |

## Notable

- Bokun uses Tailwind utilities (`flex`, `h-4`, `w-4`, `p-0`, `focus:outline-none`, `active:scale-90`)
- This means `!important` is needed in our overrides because Tailwind's specificity is single-class and our targeting via `[data-testid=...]` is also single attribute → without `!important`, Tailwind's later-in-stylesheet position usually wins
- `active:scale-90` press feedback is good UX — keep it, don't override
- Inline SVG `width`/`height` attributes can be overridden by CSS `width`/`height` on the SVG element
- Inline path `fill="#C4C4C4"` can be overridden by CSS `fill:` on the path

## Unresolved

- Cannot fix missing `aria-label` via CSS — separate Bokun support ticket recommended
- Exact parent container class for the cart row not captured (not strictly needed since `data-testid` is unique)
