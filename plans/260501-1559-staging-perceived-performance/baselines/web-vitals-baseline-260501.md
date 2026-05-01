# Web Vitals Pipeline Baseline — 2026-05-01

## Status: WIRED, NOT PERSISTED

### Verified components
- `apps/web/components/analytics/web-vitals-reporter.tsx` — client component, mounts `useWebVitalsReporter()`
- `apps/web/lib/hooks/use-web-vitals-reporter.ts` — uses `useReportWebVitals` from `next/web-vitals`, whitelists LCP/FID/CLS/TTFB/INP/FCP, production-only, sends via `navigator.sendBeacon` with `fetch` keepalive fallback
- `apps/web/app/api/analytics/vitals/route.ts` — POST handler, validates metric name+rating, rate-limited 30/min/IP
- Mounted at `apps/web/app/(site)/[locale]/layout.tsx:81` inside `NextIntlClientProvider`
- CSP `connect-src 'self'` permits the request (`apps/web/next.config.ts:142`)

### Gaps
- **Endpoint logs to `console.info` ONLY** — no DB persistence, no analytics forwarder. Vercel function logs capture the data but they are not queryable for trends. To make Phase 3 + 7-day post-deploy analysis meaningful, wire the endpoint to either:
  - Vercel Speed Insights (requires Pro plan — user mentioned upgrading)
  - PostgreSQL via Payload (new collection: `web_vitals_events`)
  - Third-party (Datadog, Axiom, Logflare)
- **Firing-on-staging not verified** — requires manual mobile session to confirm beacons land. Re-check after deploying Phase 1.

### Next steps for Phase 2 / Phase 3
1. After Phase 1 deploy: open staging on mobile, confirm `/api/analytics/vitals` POSTs in network tab.
2. After Pro upgrade lands: enable Vercel Speed Insights, replace `console.info` with the SpeedInsights forward.
3. Optional: add a Payload `web_vitals_events` collection for self-hosted RUM (untouched by Pro upgrade).
