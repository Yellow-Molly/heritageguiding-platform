# Phase 02 — CSS implementation + cross-browser validation

## Context Links

- Plan: [plan.md](./plan.md)
- Previous phase: [phase-01-recon-verify-and-selector-map.md](./phase-01-recon-verify-and-selector-map.md)
- WCAG: Target Size (Minimum) 2.5.8 → ≥24×24 CSS px; Contrast (Minimum) 1.4.3 → ≥4.5:1 for non-text 1.4.11 ≥3:1 (we aim for 4.5 conservatively)

## Overview

- **Priority:** Core deliverable
- **Status:** pending (blocked by Phase 01)
- **Estimated effort:** 2 hours
- **Description:** Iterate CSS in DevTools using selectors from Phase 01, paste into Bokun admin CSS editor, validate across browsers and breakpoints.

## Key Insights

- Iterate in DevTools FIRST — fastest feedback loop, avoids Bokun cache delay
- Avoid `!important` until proven necessary; specificity chain first
- One stylesheet block, not scattered — single anchor for future maintenance
- Test on a real test booking, not just visual stub — Bokun's cart state may differ

## Requirements

### Functional
- Delete button bounding box ≥24×24px
- Contrast ratio ≥4.5:1 against its actual rendered background
- Visible hover state (color shift OR scale OR background change)
- Visible focus-visible state (outline ring for keyboard users)
- ≥4px horizontal gap between price text and delete button

### Non-functional
- Single CSS block, commented
- No `!important` unless documented why
- No new selectors targeting scrambled Bokun classes
- Renders correctly Chrome + Safari, desktop + mobile

## Architecture

CSS lives in Bokun admin (canonical) + mirrored in `docs/bokun-cart-css-customization.md` (version-controlled reference). No code architecture change.

## Related Code Files

- **No code files modified this phase.**
- CSS lives in Bokun admin Theme → Advanced options

## Implementation Steps

1. Open the live cart in Chrome with DevTools open
2. In the Elements panel, locate the delete button using selectors from Phase 01
3. Use the Styles panel "+" to add CSS rules iteratively. Suggested rule structure (selectors are placeholders — fill from Phase 01 findings):

   ```css
   /* Bokun cart delete button — discoverability fix */
   /* Target: WCAG 2.5.8 ≥24×24px, 1.4.11 ≥4.5:1 contrast */

   [READABLE_PARENT_CLASS] [READABLE_BUTTON_SELECTOR] {
     min-width: 28px;
     min-height: 28px;
     padding: 4px;
     margin-left: 12px;
     color: #1a1a1a;             /* dark — paired against light bg */
     border: 1px solid transparent;
     border-radius: 50%;
     cursor: pointer;
     transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
   }

   [READABLE_PARENT_CLASS] [READABLE_BUTTON_SELECTOR]:hover {
     background-color: rgba(220, 38, 38, 0.10);
     color: #b91c1c;
     border-color: rgba(220, 38, 38, 0.35);
   }

   [READABLE_PARENT_CLASS] [READABLE_BUTTON_SELECTOR]:focus-visible {
     outline: 2px solid #2563eb;
     outline-offset: 2px;
   }
   ```

4. If `::after { content: 'Remove' }` is viable on the target element AND deemed valuable, prototype it; otherwise drop (locale concern + icon-only fix already passes WCAG)
5. Verify with DevTools Accessibility pane: target size, contrast — green checks
6. Repeat at mobile breakpoint via Device Toolbar; tune `min-width`/`min-height` if cramped
7. Once DevTools-validated, copy the final CSS block into Bokun admin Theme → Advanced options
8. Save in Bokun admin; hard-refresh tour page; verify CSS applied
9. Cross-browser smoke: Chrome desktop, Safari desktop (Mac if available; else accept gap), Chrome mobile emulator, real mobile if accessible
10. Capture before/after screenshots at desktop + mobile breakpoints; save to `plans/260520-2316-bokun-cart-css-fix/visuals/`

## Todo List

- [ ] Iterate CSS in DevTools using Phase 01 selectors
- [ ] Verify target size ≥24×24px via DevTools box model
- [ ] Verify contrast ≥4.5:1 via DevTools accessibility pane
- [ ] Add hover state
- [ ] Add focus-visible state
- [ ] Add price/button spacing
- [ ] (Optional) prototype `::after { content: 'Remove' }`; drop if breaks anything
- [ ] Mobile breakpoint validation
- [ ] Paste final CSS into Bokun admin Theme → Advanced
- [ ] Hard-refresh + verify CSS applied live
- [ ] Cross-browser smoke (Chrome + Safari minimum)
- [ ] Capture before/after screenshots desktop + mobile → `visuals/`
- [ ] Regression check: contact form, gift card, promo code, payment buttons unchanged

## Success Criteria

- All todo items checked
- Bounding box ≥24×24px measurable in DevTools
- Contrast ≥4.5:1 measurable in DevTools or axe
- Hover state visible
- Focus-visible state visible on Tab
- No visual regression to other checkout elements
- Before/after screenshots saved

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Specificity wars with Bokun stylesheet | Prefix with parent class chain; reserve `!important` as last resort + comment why |
| Bokun cache delays applied CSS | Hard refresh + incognito; wait 1-2 min between iterations |
| Hover-only enhancement misses touch users | Ensure baseline (non-hover) state already meets size + contrast |
| Regression to other parts of checkout | Selectors scoped tightly via parent class; smoke test contact + payment + gift card |
| `::after` content breaks Bokun's layout | Drop label-via-pseudo; keep icon-only fix |

## Security Considerations

- CSS cannot exfiltrate data, but ill-targeted selectors could hide important info (e.g. price). Smoke test must verify price still visible.
- No inline `<style>` injection from our domain — CSS lives only in Bokun admin

## Next Steps

- Proceed to Phase 03 (hosted-checkout comparison) — can technically run in parallel
- Documentation phase (04) consumes the final CSS block
