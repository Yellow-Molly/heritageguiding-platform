# Bokun Cart Delete-Button WCAG Fix

**Date**: 2026-05-21 02:00
**Severity**: Medium
**Component**: Bokun embedded-checkout widget (cross-origin iframe)
**Status**: Resolved (pending stakeholder sign-off)

## What Happened

Stakeholder flagged Bokun embedded-checkout cart delete button as inaccessible: 16×16px gray X icon on gray background, looks disabled/decorative, fails WCAG 2.5.5 (target size), 1.4.11 (contrast), 2.4.7 (focus visibility). Hard problem: the cart UI lives in widgets.bokun.io iframe. Cross-origin barrier blocks direct CSS injection from our domain.

## The Brutal Truth

I confidently told the user CSS injection wasn't possible due to cross-origin restrictions. I was wrong. The researcher subagent dug into Bokun docs and found a vendor-hosted CSS editor embedded in the Bokun admin panel (Settings → Booking Channels → Widget → Theme). Bokun serves that CSS into the iframe themselves, sidestepping the cross-origin block entirely.

The frustration here isn't technical — it's that I relied on a faulty mental model instead of verifying against the actual platform docs. Same-origin thinking was correct, but the conclusion missed that the vendor controls both sides of the boundary. Not the first time I've burned cycles on wrong priors.

Also embarrassing: I briefly considered suggesting a custom REST/OCTO API cart implementation (2–4 weeks, PCI scope headaches). User pushed back sensibly. Half-day CSS fix won. Sometimes the answer is simpler than the architecture.

## Technical Details

**DOM recon** revealed `data-testid="remove-from-cart"` on the button — massively more stable than the Tailwind/styled-components class scramble (`sc-dxroEu iuwoOl ...`) that churns between Bokun deploys.

**Final CSS** (32 lines):
- Target: 32×32px (was 16px) — WCAG 2.5.5 compliant
- Fill: gray-600 (`#4B5563`, ~7.5:1 contrast on white) — was `#C4C4C4` (~2.5:1, failed)
- Hover: red (#DC2626) for affordance
- Focus: blue ring (2px, 4px offset) via `focus-visible` — 2.4.7 compliant
- `!important` used deliberately to beat Tailwind utility specificity (Bokun ships `h-4 w-4 p-0 focus:outline-none` on the button; the utility chain was a moving target; parent-specificity workarounds would have been fragile)

**Known limitation:** Cannot inject `aria-label` via CSS. Bokun's DOM doesn't expose the attribute. Flagged as feature request.

## What We Tried

1. Direct CSS override via custom stylesheet — blocked by cross-origin.
2. Explored Bokun REST/OCTO API for custom cart — rejected (scope/timeline/PCI).
3. CSS-in-JS via Bokun init script — Bokun sanitizes inline styles; dead end.
4. **Success path:** Bokun admin Theme CSS editor. User can paste CSS; Bokun injects it into iframe pre-render.

## Root Cause Analysis

The root wasn't technical complexity — it was assumption-driven reasoning. I trusted my mental model of cross-origin restrictions instead of asking "does the vendor provide a workaround?" The researcher's doc-first approach caught what architecture-first reasoning missed.

Secondary: stakeholder initially framed this as "our team must solve the Bokun widget problem." Pushing back on that frame (single-tour-mostly traffic, no cart abandonment metrics) was the real unlock. The CSS fix was trivial once scope was realistic.

## Lessons Learned

1. **Vendor docs > mental models.** When working with third-party platforms, verify against official docs before concluding something is impossible. Cross-origin reasoning was sound but incomplete.

2. **`data-testid` as contract for third-party widgets.** CSS classes churn with every vendor deploy. Test IDs are intentionally stable. Anchor CSS selectors on test IDs when available.

3. **`!important` can be the right call.** Fighting Tailwind utility specificity via parent-chain selectors would have produced a fragile mess. Documenting *why* `!important` is there (vendor-controlled Tailwind context) matters more than avoiding it dogmatically.

4. **Phase gates work.** We cut Phase 03 (hosted-checkout comparison) post-research. Not needed for primary fix. Stopped ourselves from building extra features the user didn't ask for.

5. **Know when a plan isn't cookable.** Tried to invoke `/ck:cook` for plan execution. Realized the work was 90% manual (Bokun admin clicks, DevTools inspection). Stood down instead of spawning fake-implementation subagents. Not every plan is automatable.

## Next Steps

- **Stakeholder review + screenshot validation** — user owns the before/after bundle
- **Bokun feature request for `aria-label`** — not filed yet; deferred post-launch
- **Class-name stability monitoring** — accept as "fix when broken"; no proactive visual regression CI
- **Commit 47528ef pushed to master** after sign-off

## Artifacts

- Commit: `47528ef` (plan to push post-review)
- New doc: `docs/bokun-cart-css-customization.md` — canonical CSS + maintenance protocol
- Updated: `docs/deployment-guide.md` Related Documentation section
- Plan dir: `plans/260520-2316-bokun-cart-css-fix/` (plan + 4 phases + recon findings + screenshots)
- Reports: `plans/reports/brainstorm-*.md`, `researcher-*.md` (gitignored, local-only)
