---
phase: 4
title: "LCP Resource Load Delay Reduction"
status: partial
priority: P2
effort: 1.5h
implemented_at: 2026-05-16
---

## Implementation Summary (2026-05-16)

**Investigation findings:**

| Hypothesis | Result |
|------------|--------|
| Payload media route is slow → contributes to resourceLoadDelay | **REJECTED**. Curl warm-up: TTFB ~48ms, total ~95ms for 1.3MB hero image. Edge-cached. Not the bottleneck. |
| Header logo with `priority` competes with hero for preload bandwidth | **CONFIRMED**. Logo (224×40, header.tsx:84) had `priority` set, causing Lighthouse to detect it as LCP on Home (since hero paints too late). |
| Hero `priorityHinted: true` already on TourListing/TourDetails | Confirmed via Lighthouse `lcp-discovery-insight` — hero IS being preloaded; bottleneck is downstream (network throttling + render-blocking CSS). |

**Change applied:**
- `apps/web/components/layout/header.tsx:84` — removed `priority` from header logo `<Image>`. The SVG logo (~few KB) loads instantly without priority hint; this frees the preload slot for the hero. Side benefit: Lighthouse will no longer misdetect the logo as LCP on Home.

**What remains (deferred to follow-up plan — per phase explicit escape hatch):**

Mobile LCP > 2500ms on all 3 pages is structurally bound by Slow 4G simulation in Lighthouse (1.6 Mbps, 150ms RTT). Without ability to re-run Lighthouse in this session and apply iterative fixes, the deeper interventions are not safe to shotgun:

1. **Critical CSS inlining** for hero — pulls render-blocking CSS off the critical path
2. **Hero image format swap** — current `auto=format` lets Unsplash choose; force `fm=avif` and `q=60` for smaller mobile payload
3. **Server-component hoist of hero** — move parallax logic to a small client child, keep `<Image>` in a server parent (eliminates hydration paint timing concerns)
4. **Direct Unsplash URL with explicit width** — bypass `/_next/image` for hero only, since Unsplash already delivers responsive images
5. **Above-the-fold layout shift mitigation** — confirm hero `min-h-screen` doesn't cause layout shift on slow loads

**Recommendation:** open follow-up plan `26XXXX-mobile-lcp-deepdive` with iterative Lighthouse loop (apply → measure → iterate). The current single-pass approach in a 1.5h time-box can't safely hit < 2500ms.

**Impact on Phase 5:** the LCP CI assertion `maxNumericValue: 2500ms` will likely still fail. Phase 5 needs to decide: relax the LCP assertion with documented justification, OR block on a follow-up LCP plan.



# Phase 4: LCP Resource Load Delay Reduction

## Context
- [Plan overview](plan.md)
- Lighthouse mobile metrics (2026-05-16 staging):

| Page | LCP | TTFB | resourceLoadDelay | resourceLoadDuration | LCP element detected |
|------|------|------|-------------------|----------------------|----------------------|
| Home | 3459ms | 9ms | **1145ms** | 41ms | `<img>` logo (22×40) ⚠ |
| TourListing | 3613ms | 8ms | **1020ms** | 15ms | first card `<img>` |
| TourDetails | 3161ms | 8ms | **1499ms** | 34ms | hero `<img>` |

- LCP CI assertion: `maxNumericValue: 2500ms`. **All 3 pages fail.**
- `lcp-discovery-insight` Home mobile: `priorityHinted: false` — Home logo is being detected as LCP because the hero image isn't painted in time.

## Why
Performance category score is 0.9 (borderline), but the CI LCP assertion (`< 2500ms`) is the harder gate. We can't restore the 0.9 perf threshold in Phase 5 with confidence until mobile LCP drops below 2.5s.

## Root Cause
TTFB is excellent (~8ms — cached HTML). The 1.0–1.5s **resourceLoadDelay** means the browser doesn't *start* fetching the LCP image until ~1s after navigation. Possible causes:
1. Render-blocking CSS/JS in `<head>` holding back preload scanner
2. Image preload firing but pointing at a slow upstream (`/_next/image?url=/api/media/file/...` → Payload → Vercel Blob round-trip)
3. Hero `<Image priority fetchPriority="high">` not being preloaded on mobile due to `srcset` mismatch
4. On Home: hero is inside `<section className="relative flex min-h-screen ...">` — possibly the image render is delayed by parallax effect setup

## Implementation Steps

### Step 1: Profile current waterfall on staging mobile
Open Chrome DevTools → Performance tab → throttle "Slow 4G" + "6× CPU" → record load of `/en` on a mobile viewport.

Identify:
- When the LCP image network request *starts* (look for `/_next/image?url=...` row)
- What blocks the preload scanner from initiating earlier (typically: large render-blocking stylesheet, sync script in `<head>`)
- Whether the `<link rel="preload" as="image" ...>` (already present per curl of staging HTML) fires before the actual `<img>` request

### Step 2: Verify hero preload markup matches actual rendered srcset
Staging head already has:
```html
<link rel="preload" as="image" imageSrcSet="...640w, 750w, 828w, 1080w, 1200w, 1920w" imageSizes="100vw" fetchPriority="high" />
```
Confirm:
- The `imageSrcSet` URLs exactly match the `<img srcset>` the browser actually resolves at mobile DPR/viewport
- No `media=` mismatch dropping the preload on mobile

### Step 3: Fix Home LCP misdetection
On Home, the LCP element is detected as the 22×40 header **logo** SVG. That means the hero image isn't painted by the LCP timestamp. Options:
- Confirm hero has `priority` + `fetchPriority="high"` (already does per `hero-section.tsx:49-50`)
- Convert hero from `'use client'` to a server component if the parallax `useEffect` is delaying paint (move parallax to a child client component, keep `<Image>` in the server parent)
- Check if `min-h-screen` + `fill` layout is causing Lighthouse to mis-measure (try `width`/`height` props)

### Step 4: Investigate Payload media route latency
The mobile LCP on Home requests:
```
/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2F... (Unsplash — direct CDN, fast)
```
But TourDetails uses CMS-hosted media:
```
/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fwooden-boat-show-on-langholmen-hero-1.jpg
```
Time the Payload media route directly:
```bash
time curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" "https://staging.privatetours.se/api/media/file/wooden-boat-show-on-langholmen-hero-1.jpg"
```
If > 200ms, the `/_next/image` proxy waits on that fetch → 1.5s `resourceLoadDelay` explained. Mitigation: serve CMS media from Vercel Blob direct URL (skip the Payload route), or add `Cache-Control: public, max-age=...` headers from Payload.

### Step 5: Check render-blocking resources
```bash
grep -n "render-blocking" perf/local\ Lighthouse\ report/staging.privatetours.se-Home-mobile.json | head
```
Look for any large CSS file in `<head>` blocking the preload scanner. The staging head shows `0i-v9q1di24ry.css` as render-blocking — quantify its impact.

### Step 6: Apply targeted fix(es)
Based on Steps 1–5, apply ONE root-cause fix per page. Re-measure. Don't shotgun multiple changes simultaneously — won't be able to attribute the improvement.

Likely-best fixes (rank-order by expected impact):
- Add `<link rel="preconnect" href="https://[vercel-blob-host]">` to root layout (saves DNS+TLS handshake for CMS media first request)
- Serve CMS images from direct Blob URL on the homepage (bypass `/_next/image` for above-the-fold) — measured first to confirm it actually helps
- Defer non-critical CSS / inline critical CSS for hero

### Step 7: Re-run Lighthouse
After each fix, re-run Lighthouse on all 3 pages mobile + desktop. Target:
- Home LCP < 2500ms (currently 3459ms — needs ~1s reduction)
- TourListing LCP < 2500ms (currently 3613ms — needs ~1.1s reduction)
- TourDetails LCP < 2500ms (currently 3161ms — needs ~0.7s reduction)

## Related Code Files
- `apps/web/components/home/hero-section.tsx` (hero with parallax)
- `apps/web/app/(site)/[locale]/layout.tsx` (add preconnect if needed)
- `packages/cms/payload.config.ts` + media route (cache headers)
- `apps/web/next.config.ts` (image config: `remotePatterns`, `deviceSizes`)

## Todo List
- [ ] Chrome DevTools Performance recording of `/en` mobile (Slow 4G, 6× CPU)
- [ ] Time `curl /api/media/file/<hero>.jpg` for TourDetails
- [ ] Verify hero `<Image>` preload srcset matches rendered srcset
- [ ] Identify single root cause from waterfall
- [ ] Apply minimal fix, re-measure
- [ ] Confirm all 3 pages mobile LCP < 2500ms

## Success Criteria
- Mobile LCP < 2500ms on Home, TourListing, TourDetails
- Lighthouse `largest-contentful-paint` audit score > 0.9 on all 3 pages mobile
- On Home, LCP element is detected as the hero image (not the logo)

## Risk
- This may require structural changes (server vs client component split, image hosting changes) that touch many files. Time-box to 1.5h; if root cause requires bigger refactor, split into follow-up plan.
- LCP measurements vary run-to-run. Average ≥3 runs before claiming a fix worked.

## Unresolved Questions
- Is Vercel Blob direct URL access enabled, or does all CMS image serving go through `/api/media/file/*`? Affects feasibility of Step 4 mitigation.
- What's the Largest Contentful Paint *element* expected to be on Home? If it's not the hero, what is the design intent (perhaps the H1 text)?
