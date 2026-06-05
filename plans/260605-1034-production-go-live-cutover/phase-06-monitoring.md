---
phase: 6
title: "Monitoring & Observability"
status: pending
priority: P1
effort: "30m + account work"
dependencies: [3]
---

# Phase 6: Monitoring & Observability

## Overview

Wire production error tracking and uptime monitoring before launch. The Sentry SDK is already integrated in code (gated on `VERCEL_ENV=production` + DSN present); the remaining work is **account/DevOps provisioning**, owned by `260514-1506-go-live-readiness-review` phase-04 (CFG1/CFG2, which remains source of truth). This phase is a thin gate input that adds only the client-Sentry env-var gap (S14) below. P1 — launch may proceed with a risk waiver, but strongly recommended before public traffic.

## Requirements

- Production errors captured (server, edge, browser).
- External uptime monitor on the homepage with alerting.

## Architecture / State

- `@sentry/nextjs` wired: `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation-client.ts`, `app/global-error.tsx`, `next.config.ts` `withSentryConfig`. Init is a **no-op until** `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` set AND `VERCEL_ENV==='production'`. Staging tagged `environment: 'staging'`.
- `env.ts` accepts all `SENTRY_*` keys as optional (format-checked).
- **Client Sentry gap (S14):** `instrumentation-client.ts:13` enables browser Sentry only when `NEXT_PUBLIC_VERCEL_ENV === 'production'` (env tag from `NEXT_PUBLIC_IS_STAGING`). Vercel auto-provides server `VERCEL_ENV` but NOT the `NEXT_PUBLIC_` mirrors — they must be set manually or browser error capture stays dark even with a valid DSN.
- No external uptime monitor today — outages found reactively.

## Related Code Files

- Reference only (code complete): Sentry config files, `instrumentation.ts`.
- No app code changes expected; this is config + external accounts.

## Implementation Steps

1. Create Sentry project (SaaS free tier ≤5k errors/mo is enough).
2. Set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` on Vercel Production (and staging if desired). For source-map upload set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in the build env. **Also set `NEXT_PUBLIC_VERCEL_ENV=production` on prod (and `NEXT_PUBLIC_VERCEL_ENV=production` + `NEXT_PUBLIC_IS_STAGING=true` on staging)** — without these the client SDK never initializes.
3. Trigger BOTH a server-side AND a **client-side** test error on prod/preview; confirm both land in Sentry with correct environment + release (the client one proves the `NEXT_PUBLIC_VERCEL_ENV` gate is satisfied).
4. Create Uptime Robot monitor (5-min interval) on `https://privatetours.se/` (HTTP 200); add `/api/health` if/when added. Alert to ops email + Slack webhook.
5. Confirm Vercel Analytics RUM active (built-in, no config).

## Success Criteria

- [ ] Sentry DSNs + `NEXT_PUBLIC_VERCEL_ENV` set on Vercel prod; BOTH server and client test errors captured with env=production.
- [ ] (Optional) source-map upload working — readable stack traces.
- [ ] Uptime Robot monitoring `/` with verified alert delivery.

## Risk Assessment

- **Launch blind** if deferred — no error visibility during the highest-risk window (first public traffic). Mitigation: at minimum set Sentry DSN before flip; uptime monitor same day.
- Account provisioning is DevOps-owned external work — start early to avoid gating Phase 08.
