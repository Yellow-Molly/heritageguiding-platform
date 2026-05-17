---
title: "Mobile LCP Deepdive — Drop Under 2500ms"
description: "Reduce simulated mobile LCP across Home/TourListing/TourDetails from 2560-2867ms to under 2500ms so the strict Lighthouse CI gate passes. Predecessor plan (260516-1746) shipped CSP, A11y, CLS and bundle-size wins; this plan tackles the last remaining LCP gap on Slow 4G simulation."
status: pending
priority: P2
effort: 2-3h
branch: feat/mobile-lcp-deepdive
tags: [performance, lcp, mobile, lighthouse, hero, fonts]
created: 2026-05-17
blockedBy: []
blocks: [260404-1815-performance-overhaul, 260516-1746-staging-lighthouse-perf-seo]
related:
  - plans/260516-1746-staging-lighthouse-perf-seo/plan.md
  - plans/260404-1815-performance-overhaul/plan.md
---

# Mobile LCP Deepdive

## Context

After 7 rounds of fixes in plan `260516-1746-staging-lighthouse-perf-seo`, the staging mobile LCP gap is:

| Page | Mobile LCP (simulated Slow 4G) | Gap vs 2500ms gate |
|------|-------------------------------|--------------------|
| Home | 2560ms | +60ms |
| TourListing | 2867ms | +367ms |
| TourDetails | 2715ms | +215ms |

**Observed (real-world) LCP** in trace: ~1065ms (Home), ~1940ms (later run) — excellent under unthrottled conditions. The 2500ms gate compares against Lighthouse's pessimistic Slow 4G + 4× CPU simulation.

**Already shipped (predecessor plan):**
- Logo `priority` removed from header (frees preload bandwidth)
- Hero Unsplash: `auto=format&q=75&w=1920` → `fm=avif&q=55&w=1600` (~28KB transfer)
- Font subsets trimmed to `latin` only; Playfair Display `preload: false`
- Bokun cart CLS fully eliminated (zero-size phantom container)
- Bubblav AI chatbot fully disabled (saves ~1.9MB widget runtime)

The remaining gap is now structural, not asset-size.

## Hypotheses (ranked by expected impact)

### H1 — Hero `<Image fill>` causes LCP misdetection (Home)
**Evidence:** Lighthouse repeatedly detects the header logo (224×40) as Home's LCP element even though the hero is 412×823. `<Image fill>` renders without intrinsic width/height attributes; Lighthouse's LCP algorithm may not classify it as a valid LCP candidate, falling back to the next-largest painted element (logo).

**Fix candidate:** convert hero from `<Image fill>` to explicit `<Image width={...} height={...}>` with responsive `sizes`. Keep the `min-h-screen` parent for layout but the image gets concrete dimensions. May require restructuring the absolute-positioned wrapper.

### H2 — Render-blocking CSS chunk delays preload scanner
**Evidence:** staging head loads `/_next/static/chunks/0n~kc.19.sr69.css` as `VeryHigh` priority blocking. Under Slow 4G, this 1 round-trip cost can delay the hero image fetch by ~300ms.

**Fix candidate:** extract critical CSS for hero area, inline in `<head>`, defer rest of the stylesheet. Next.js Turbopack doesn't have built-in critical CSS extraction; would need to identify hero-relevant rules manually and inline.

### H3 — Too many High-priority requests competing under throttling
**Evidence:** even after font trim, the Home mobile waterfall shows 1 stylesheet + 2 fonts + hero image + 1 icon.svg all at High/VeryHigh priority. Slow 4G simulated bandwidth (1.6 Mbps) means these compete strictly serially.

**Fix candidate:** demote favicon/icon.svg priority (currently High because Next.js auto-emits a preload). Drop one more font weight if any.

### H4 — TourListing first card image not preloaded
**Evidence:** TourListing has the largest gap (+367ms). LCP is the first tour card image at top:279 — below the fold on mobile. May lack `priority` hint or sizes mismatch.

**Fix candidate:** verify `priority={true}` lands on the first card in the rendered HTML. Check `tour-grid-layout.tsx` for cards 1-3 priority logic.

### H5 — TTFB variance on staging ISR
**Evidence:** TTFB across runs: 9ms / 609ms / 173ms — huge swings depending on ISR cache state. A cold-cache run easily adds 400-600ms to LCP.

**Fix candidate:** confirm Lighthouse CI runs use the same warm-up sequence (3 iterations with median). May need a `wait-for-ready` preflight before LCP runs.

## Implementation Strategy

**Iterative — do not shotgun.** Apply ONE fix, redeploy, re-run Lighthouse, observe Δ. If Δ < 50ms, revert and try the next hypothesis.

### Round 1 — H1 (Home hero structural)
- Convert `apps/web/components/home/hero-section.tsx` hero `<Image fill>` → explicit dimensions
- Verify the `min-h-screen` layout still works (likely needs `<Image>` inside a `position: relative` wrapper with explicit aspect-ratio or fixed dimensions)
- Measure: Home LCP delta. Target: -100ms.

### Round 2 — H4 (TourListing priority verification)
- Inspect `apps/web/components/tour/tour-grid-layout.tsx` — confirm priority is passed to the first 1-3 cards
- Check `apps/web/components/tour/tour-card.tsx:56-57` — verify `priority` prop maps to actual `<Image priority>`
- Verify in deployed HTML via curl that `fetchpriority="high"` appears on the first card image

### Round 3 — H3 (priority hierarchy audit)
- Verify favicon doesn't preload at High priority
- Audit all `<link rel="preload">` and `<Image priority>` in `apps/web/app/(site)/[locale]/layout.tsx` and child components
- Document the intended priority hierarchy in a comment

### Round 4 (if needed) — H2 (critical CSS inline)
- Highest effort, lowest certainty. Defer unless rounds 1-3 don't close the gap.

## Success Criteria

- All 3 mobile LCP under 2500ms across **3 consecutive Incognito Lighthouse runs** (variance proof)
- No regressions to A11y / BP / SEO / CLS / Perf score
- Predecessor plan `260516-1746-staging-lighthouse-perf-seo` Phase 5 flips to `complete` once this plan delivers
- Parent plan `260404-1815-performance-overhaul` flips to `superseded`

## Out of Scope

- **Maps async warning** — confirmed iframe-isolated (Bokun internals). File a ticket with Bokun support instead. Documented in `plans/260516-1746-staging-lighthouse-perf-seo/phase-02-csp-bokun-widget.md` and acknowledged here.
- **TTFB optimization** — handled by Vercel ISR; outside our control once configured.
- **Threshold relaxation** — explicitly rejected by user. Stay strict at 2500ms.

## Risk

- H1 may require visible layout changes (hero parallax behavior, gradient overlay positioning). Visual regression check needed.
- LCP simulated values have ±150ms variance between runs. Need 3+ runs to claim a fix worked.
- If none of H1-H5 closes the gap, the conservative path is to accept Phase 5 stays partial and file the simulation pessimism as an upstream Lighthouse concern.

## Unresolved Questions

- Does the staging environment use the same `lighthouserc.cjs` settings (3 runs, median) when run manually in Incognito? Verify before claiming a fix's impact is real.
- Is there value in adding `<link rel="preload" as="image" type="image/avif">` for the hero explicitly in the root layout? Next.js Image should already emit this for `priority` images; may be missing the `type` attribute.
