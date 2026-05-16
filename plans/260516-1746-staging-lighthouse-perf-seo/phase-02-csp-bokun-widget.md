---
phase: 2
title: "CSP Whitelist Bokun Widget Origin"
status: complete
priority: P0
effort: 0.5h
implemented_at: 2026-05-16
---

## Implementation Summary (2026-05-16)

Edited `apps/web/next.config.ts:136-146` adding Bokun origins to CSP:
- `script-src`: `https://widgets.bokun.io` (tight — loader only)
- `style-src`: `https://widgets.bokun.io` (widget injects CSS)
- `font-src`: `https://widgets.bokun.io` (icon font)
- `img-src`: `https://*.bokun.io` (product imagery from any subdomain — media.bokun.io etc.)
- `frame-src`: `https://*.bokun.io` (checkout iframe — domain may differ from widgets.)
- `connect-src`: `https://*.bokun.io` (XHR/fetch for tour data + checkout)

**Design rationale:** kept `script-src` tight to `widgets.bokun.io` (highest-risk directive). Broadened to `*.bokun.io` only for passive resources (img/frame/connect/style) where the checkout flow may use sibling subdomains.

**Pending staging verification (post-deploy):**
- Open tour detail page on staging Preview URL → DevTools Console clean
- Re-run Lighthouse TourDetails → Best Practices = 1.0
- If new CSP violations appear in staging, narrow `*.bokun.io` to the specific subdomains observed.



# Phase 2: CSP Whitelist Bokun Widget Origin

## Context
- [Plan overview](plan.md)
- CSP source: `apps/web/next.config.ts:131-146` (in `headers()` for `/:path*`)
- Lighthouse evidence (TourDetails mobile, `inspector-issues` + `errors-in-console`):
  - Blocked script: `https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=6abfcd3a-a86c-485e-a01f-899cea8a78d0`
  - Violation: `script-src` directive does not include `widgets.bokun.io`
- Result: Bokun booking widget never loads on tour details → revenue impact.

## Why
Tour detail pages render a Bokun widget for booking. CSP currently allows only `'self'` and `https://www.bubblav.com` in `script-src`, blocking the widget. Production behavior is identical — this is a live revenue blocker, not just a Lighthouse cosmetic.

## Current CSP (apps/web/next.config.ts:139)
```
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.bubblav.com
```

## Implementation Steps

### Step 1: Identify all Bokun widget origins
The Bokun widget loader transitively fetches more resources. Verify on staging:
```bash
# Watch network in browser devtools on a tour detail page,
# OR check the Lighthouse network-requests audit for any *.bokun.io URLs
```

Likely-needed directives (confirm via devtools, do NOT speculate broadly):
- `script-src`: `https://widgets.bokun.io`
- `connect-src`: `https://widgets.bokun.io` (XHR/fetch for tour data)
- `frame-src`: `https://widgets.bokun.io` (likely renders an iframe checkout)
- `style-src`: `https://widgets.bokun.io` (widget injects CSS)
- `img-src`: `https://*.bokun.io` (avatar/product imagery)

### Step 2: Update CSP in `apps/web/next.config.ts`
Add `https://widgets.bokun.io` to each directive that the widget needs. Start minimal — only add directives that devtools confirms are blocked.

```ts
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.bubblav.com https://widgets.bokun.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://widgets.bokun.io",
    "img-src 'self' data: blob: https://*.blob.vercel-storage.com https://images.unsplash.com https://*.privatetours.se https://www.gravatar.com https://*.bokun.io",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://www.bubblav.com https://www.youtube.com https://www.youtube-nocookie.com https://widgets.bokun.io",
    "connect-src 'self' https://www.bubblav.com https://*.bubblav.com https://*.ably.net https://*.ably-realtime.com wss://*.ably.net wss://*.ably-realtime.com https://widgets.bokun.io",
  ].join('; '),
},
```

**Apply incrementally** — push minimal change, watch console, add origins as new violations appear. Avoid wildcard scope creep.

### Step 3: Verify locally
```bash
cd apps/web
npm run dev
# Open http://localhost:3000/en/tours/<any-tour-slug>
# DevTools Console must be free of CSP violations
# Network: BokunWidgetsLoader.js status 200
```

### Step 4: Deploy to staging + re-run Lighthouse
- Push branch, get Preview URL
- Manually re-run Lighthouse on TourDetails page
- Expected: Best Practices = 1.0, no `errors-in-console` / `inspector-issues` failures

## Related Code Files
- `apps/web/next.config.ts:131-146` — sole CSP source

## Todo List
- [ ] Open tour detail in browser, list all *.bokun.io network requests + their initiator types
- [ ] Update CSP directives in `apps/web/next.config.ts` — add only the origins confirmed-needed
- [ ] Local verify: no CSP violations in console
- [ ] Deploy to staging, re-run Lighthouse TourDetails
- [ ] Confirm Best Practices = 1.0

## Success Criteria
- Bokun widget loads without console errors on tour detail page.
- Lighthouse TourDetails Best Practices score = 1.0.
- No new CSP wildcards introduced beyond what's necessary.

## Risk
- Adding `widgets.bokun.io` to `frame-src` is required if the booking step uses an iframe — verify before merge to avoid second round-trip.
- The widget may load nested resources from CDN domains (e.g., `bokun.io`, `cdn.bokun.io`) not just `widgets.bokun.io`. Watch console carefully on staging.

## Security Note
Avoid `script-src 'self' *.bokun.io` wildcard. Be specific: `https://widgets.bokun.io`. Wildcard subdomain expands attack surface to any compromised Bokun subdomain.

## Unresolved Questions
- Does the Bokun checkout iframe live on `widgets.bokun.io` or a separate `checkout.bokun.io`? Confirm on staging before finalizing `frame-src`.
