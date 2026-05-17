---
phase: 04
title: "Configuration & Infrastructure Readiness"
priority: P1
status: not-started
effort: 3-5h
owner: DevOps
auditedAt: 2026-05-17
auditReport: ../reports/audit-260517-1311-go-live-readiness.md
auditNotes: |
  Verified 2026-05-17 — no work started.
  - CFG1: no @sentry/nextjs in deps
  - CFG3: lib/environment.ts is a 12-line isProductionDeployment() helper, no Zod schema
---

# Phase 04 — Configuration & Infrastructure Readiness

## Context

Scout: `plans/reports/Explore-260514-1504-infrastructure-readiness.md`

Strong baseline: security headers, HSTS, CSP, staging crawler blocking, DB backups, SSL, redirects all in place. Two notable gaps + minor hardening items.

## Findings → Actions

### P1 — Risk-Waiverable

#### CFG1. Error tracking missing
- **Current:** No Sentry / LogRocket / Datadog. Errors visible only in Vercel logs.
- **Effect:** Production incidents hard to triage; no aggregation across regions/users; no alerting.
- **Action:**
  1. Add Sentry (`@sentry/nextjs`). Free tier covers ≤5k errors/mo — sufficient for MVP.
  2. Env-gated: only enable when `NEXT_PUBLIC_SENTRY_DSN` set (prod only).
  3. Wire to App Router + Edge / Node runtimes.
  4. Add release tagging via `SENTRY_RELEASE` from CI.
- **Effort:** 1.5h
- **Files:** `apps/web/sentry.{client,server,edge}.config.ts`, `apps/web/next.config.ts` (withSentryConfig), `.env.example`

#### CFG2. Uptime monitoring missing
- **Current:** No external uptime monitor. Outages discovered reactively.
- **Action:**
  1. Set up Uptime Robot (free tier — 5min interval).
  2. Monitor: `https://privatetours.se/` (HTTP 200) + future `/api/health`.
  3. Alert to ops email + Slack webhook.
- **Effort:** 15min setup, no code change
- **Owner:** DevOps (account creation)

#### CFG3. No runtime env var validation — ✅ DONE (2026-05-17)
- **Done:**
  - `apps/web/lib/env.ts` — Zod schema with prod-only strict mode (VERCEL_ENV=production && IS_STAGING!=true). Validates DATABASE_URL (URL), PAYLOAD_SECRET (≥32 in prod), BOKUN_API_KEY/SECRET_KEY/WEBHOOK_SECRET (required in prod), NEXT_PUBLIC_BOKUN_UUID (UUID in prod), NEXT_PUBLIC_URL (URL in prod). Optional services (BLOB, REVALIDATION_SECRET, RESEND, EMAIL_FROM, OPENAI) must be valid format if set.
  - `apps/web/instrumentation.ts` — Next.js boot hook imports `lib/env` so misconfiguration throws at startup rather than first request.
- **Replacing `process.env` reads:** Deferred. Schema gates boot; replacing call sites is a follow-up that doesn't block launch.
- **Files added:** `apps/web/lib/env.ts`, `apps/web/instrumentation.ts`

### P2 — Post-Launch Acceptable

#### CFG4. `typescript.ignoreBuildErrors: true` in next.config.ts
- **Reason known:** Payload CMS separate type checking (per MEMORY.md).
- **Mitigation:** `npm run type-check` already runs in CI separately.
- **Risk:** Acceptable. Document in deployment-guide.md.

#### CFG5. CORS not explicit
- **Current:** No `middleware.ts` / `proxy.ts` CORS config. Relies on Vercel defaults.
- **Effect:** Same-origin only — no cross-origin browser clients consume our API. Acceptable.
- **Action:** Defer. Add only if external API consumer requires it.

#### CFG6. Logging unstructured
- **Current:** `console.log/error` litter in production paths.
- **Effect:** Manageable in Vercel log viewer for MVP traffic.
- **Action:** Defer pino/winston migration to post-launch hardening.

#### CFG7. Vercel.json minimal
- **Current:** Only `installCommand`. Region / timeouts via dashboard.
- **Action:** Add `vercel.ts` with explicit config (recommended over `vercel.json` per 2026-02 Vercel docs):
  ```ts
  import type { VercelConfig } from '@vercel/config/v1';
  export const config: VercelConfig = {
    framework: 'nextjs',
    regions: ['fra1'],
    functions: { 'app/api/bokun/**/*.ts': { maxDuration: 30 } },
  };
  ```
- **Effort:** 30min. Optional.

#### CFG8. Cookie domain for next-intl
- **Current:** Default request-domain scoping. Staging cookies don't leak to prod.
- **Action:** No change needed at launch. Document only.

## Done Criteria

- [ ] CFG1: Sentry installed + receiving errors from production deploy
- [ ] CFG2: Uptime Robot monitoring `/` + alerting verified
- [ ] CFG3: Env Zod schema covers all required vars; build fails on missing/invalid

## Open Questions

1. Sentry self-hosted or SaaS free tier?
2. Uptime alert recipient — ops email + Slack channel?
3. Sentry release sourcemap upload — wire to CI via `@sentry/cli`?
