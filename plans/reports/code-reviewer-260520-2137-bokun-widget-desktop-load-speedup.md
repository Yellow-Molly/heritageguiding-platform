# Code Review — Bokun Widget Desktop Load Speedup

**Date:** 2026-05-20
**Scope:** 2 files, ~10 LOC
**Plan:** `plans/260520-2117-bokun-widget-desktop-load-speedup/`

## Files Reviewed

- `apps/web/components/lazy-bokun-widget.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`

## Findings

### 1. Intent match — CONFIRMED
- `DESKTOP_LOAD_DELAY_MS` is `1500` (line 26). Updated doc-comment (lines 18-25) accurately frames the trade: TBT/Speed Index rises, real-user perceived speed wins. Rationale is self-documenting — future maintainer won't need to grep git blame.
- Two `<link rel="preconnect" crossOrigin="anonymous">` tags placed at lines 66-67, inside the root `<>` fragment of `TourPage`, before `<TourSchema />`. Inline comment (lines 62-65) explains per-route placement vs. global dns-prefetch safety net.

### 2. Head hoisting under Next 16 / React 19 — SAFE
React 19 natively hoists `<link>`, `<meta>`, `<title>`, and `<script async>` from anywhere in the tree into `<head>` (this is the documented "Support for metadata tags" feature that replaced the React Helmet pattern). Next.js 16 App Router relies on this. Since `TourPage` is a server component (no `'use client'`) and `<link>` is a known hoistable element, both preconnects will land in `<head>` at SSR time. No no-op risk. The placement before `<TourSchema />` is fine — order inside `<head>` doesn't affect preconnect priority.

### 3. `crossOrigin="anonymous"` — CORRECT
Bokun's widget loader is fetched as a `<script>` without `crossorigin` (verified `bokun-booking-widget-with-fallback.tsx:44`), but its fonts (`https://widgets.bokun.io` in `font-src` per CSP) and CORS-fetched assets are anonymous. Per [HTML spec](https://html.spec.whatwg.org/multipage/links.html#link-type-preconnect), preconnect connection is keyed by `(origin, credentials-mode, network-partition)`. Without `crossOrigin="anonymous"`, the connection only matches credentialed requests — fonts (always anonymous) would open a second TCP+TLS handshake, wasting the preconnect.

Note: the global `dns-prefetch` (layout.tsx:92-93) has no `crossOrigin` attribute, which is fine — `dns-prefetch` only does DNS, no connection keying. The route-level preconnect is the right place for `crossOrigin="anonymous"`.

Mild observation (non-blocking): the actual `BokunWidgetsLoader.js` `<script>` tag is NOT crossorigin, so its connection won't reuse the anonymous preconnect's TCP socket — it'll get DNS for free (from dns-prefetch) but open its own credentialed connection. Fonts/CSS/XHR-style fetches will reuse the anonymous preconnect. Net result is still a win; if you wanted maximum coverage you'd add a second `<link rel="preconnect">` without `crossOrigin` for the script, but that's overkill for this trade.

### 4. Mobile path — UNCHANGED (verified by reading)
`lazy-bokun-widget.tsx` lines 50-77 retain the desktop/mobile branch. Desktop short-circuits to `setTimeout`; mobile falls through to `IntersectionObserver` with `rootMargin: '400px'` (line 72). Eager-load fallback for `IntersectionObserver === undefined` (lines 60-63) preserved. Cleanup functions intact.

### 5. Second-order issues — NONE BLOCKING
- **CSP:** `widgets.bokun.io` and `static.bokun.io` already in `script-src`, `style-src`, `font-src` (next.config.ts:144-147). `connect-src` not checked here but preconnect doesn't need it (preconnect is a hint, not a fetch).
- **Other consumers of `DESKTOP_LOAD_DELAY_MS`:** only `lazy-bokun-widget.tsx` references the constant (plan docs aside). Safe to change in isolation.
- **Other LazyBokunWidget consumers:** only `components/tour/booking-section.tsx:45`, which is rendered exclusively under the tour-detail route — preconnect placement matches usage.
- **`force-dynamic` on the page:** preconnect hints emit on every render, no caching concern.
- **No backwards-compat break:** constant is module-private (no export), prop shape unchanged.

## Behavioral Checklist
- [x] Concurrency: no shared state changed; timer cleanup intact
- [x] Error boundaries: N/A (no new throw paths)
- [x] API contracts: prop signatures unchanged
- [x] Backwards compatibility: no exported surface changed
- [x] Input validation: N/A
- [x] Auth/authz: N/A
- [x] N+1: N/A
- [x] Data leaks: preconnect is a hint, no credentialed fetch; no PII

## Recommended Actions
None blocking. Optional follow-up: when validating in DevTools, confirm only ONE TCP connection opens per Bokun origin during widget load. If you see two (one anonymous for fonts, one credentialed for script), and the script handshake adds meaningful latency, consider duplicating each preconnect without `crossOrigin` — but verify first before adding noise.

## Unresolved Questions
None.

---

**Status:** DONE
**Summary:** 10-LOC perf change is correct, well-documented, and matches stated intent. Head hoisting works under React 19 / Next 16 server components — preconnects will not no-op. `crossOrigin="anonymous"` is the right choice for font/CORS reuse; mobile IntersectionObserver path verified unchanged. Ship it.
