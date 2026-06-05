---
phase: 3
title: "Env-Var Audit & Reconciliation"
status: pending
priority: P0
effort: "1.5h"
dependencies: []
---

# Phase 3: Env-Var Audit & Reconciliation

## Overview

Correct `lib/env.ts` so it validates the variables the running code actually reads. This **supersedes master plan CFG3** (`260514-1506` phase-04, commit `c1d1d9f`), which authored the schema but validated the **wrong** var names — so this is a correction of a signed-off item, not a gap the audit missed. Sequencing matters: `env.ts` throws at boot, so a careless "tighten" can self-inflict a production outage.

## Requirements

- `env.ts` validates the vars the code reads; no phantom keys; no prod-critical key left unvalidated.
- Schema tightening cannot crash boot on deploy (set values first, or validate-if-present).
- Public revalidate endpoint stops authenticating against the master session secret.

## Architecture — Findings

### S9 — Phantom canonical var (1-line fix, not a multi-file bug)
- `env.ts:47` validates `NEXT_PUBLIC_URL`, which **0 files read** (grep: the only occurrence in `apps/web` is `env.ts:47` itself).
- Code reads `NEXT_PUBLIC_SITE_URL` in **22 files** incl. `packages/cms/payload.config.ts:52` (`admin.livePreview.url`) — crosses the package boundary.
- Everything currently falls back to hardcoded `'https://privatetours.se'` (correct by luck; the validation guards a key nothing uses).
- **Fix:** change the one `env.ts:47` line to validate `NEXT_PUBLIC_SITE_URL` (prod-required URL). Keep the hardcoded fallbacks (do NOT let a future "DRY" refactor remove them). Set `NEXT_PUBLIC_SITE_URL=https://privatetours.se` on Vercel prod.

### S10 — Phantom email vars (silent failure)
- Email uses `GMAIL_USER` + `GMAIL_APP_PASSWORD` (`lib/email/create-email-transporter.ts:11-12` + all `send-*.ts`). `env.ts:52-53` validates `RESEND_API_KEY`/`EMAIL_FROM` — unused.
- **Fix:** add `GMAIL_USER`/`GMAIL_APP_PASSWORD` to `env.ts` as **validated-if-present** (NOT prod-required — see sequencing + browse-only stance). Drop phantom `RESEND_API_KEY`/`EMAIL_FROM`. Set Gmail vars on Vercel prod.

### S13 — `REVALIDATION_SECRET` → `PAYLOAD_SECRET` fallback (secret hygiene)
- `api/revalidate/route.ts:31` = `process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET`. If `REVALIDATION_SECRET` is unset (optional + undocumented), the public revalidate endpoint authenticates against the master session-signing secret.
- **Fix:** make `REVALIDATION_SECRET` prod-required in `env.ts`; drop the `|| PAYLOAD_SECRET` fallback for prod (or assert the two differ). Set on Vercel prod.

### Doc drift (NOT minor — structural)
- `deployment-guide.md:242-271` documents a header-based `X-Revalidate-Token` POST flow that does not exist; the real route uses `?secret=` query + `REVALIDATION_SECRET`. The real CMS hook (`revalidate-cache-tags-hook.ts:33`) calls `revalidateTag()` **in-process** and swallows errors. Rewrite the section to the real contract, fix the CI `NEXT_PUBLIC_URL` reference, document `COMING_SOON`.

## Related Code Files

- Modify: `apps/web/lib/env.ts` (S9 line, S10 keys, S13 required + drop fallback; also strip the stale plan-ref comment at `env.ts:41` — replace with intent-only text).
- Modify: `apps/web/.env.example` (real var names: `NEXT_PUBLIC_SITE_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `REVALIDATION_SECRET`, `COMING_SOON`; remove phantom `NEXT_PUBLIC_URL`/`RESEND_API_KEY`).
- Modify: `apps/web/app/api/revalidate/route.ts` (drop prod `PAYLOAD_SECRET` fallback).
- Modify: `README.md`, `docs/deployment-guide.md` (var names + revalidation section rewrite).

## Implementation Steps

1. **Set Vercel prod values FIRST** (before tightening schema): `NEXT_PUBLIC_SITE_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `REVALIDATION_SECRET` (distinct from `PAYLOAD_SECRET`). Confirm present.
2. `env.ts`: S9 one-line swap to `NEXT_PUBLIC_SITE_URL` (prod-required); S10 add Gmail vars validated-if-present + drop phantom email vars; S13 `REVALIDATION_SECRET` prod-required; strip the `260430-1520 phase-01` comment at line 41 (intent-only). Comments explain the why, never plan/finding codes.
3. `api/revalidate/route.ts`: remove `|| process.env.PAYLOAD_SECRET` for prod.
4. `.env.example` / README / deployment-guide: real names + rewrite the revalidation section to the in-process hook + `?secret=` contract; document `COMING_SOON`.
5. `npm run build` + boot: confirm `instrumentation.ts` env validation passes with values now set (no boot crash). Reconcile master CFG3: mark it superseded by this phase in `260514-1506`.

## Success Criteria

- [ ] `env.ts` validates `NEXT_PUBLIC_SITE_URL`, Gmail vars (if-present), `REVALIDATION_SECRET` (required); no phantom keys; line-41 plan-ref removed.
- [ ] Vercel prod values set BEFORE schema tightened; boot passes (no self-inflicted outage).
- [ ] revalidate endpoint no longer falls back to `PAYLOAD_SECRET` in prod.
- [ ] `.env.example`/README/deployment-guide match real names; revalidation section rewritten.
- [ ] master CFG3 marked superseded; no dual ownership of `env.ts`.

## Risk Assessment

- **Boot crash** if a var is made required before its Vercel value exists (`env.ts` throws via `instrumentation.ts`). Mitigation: step 1 (values first); Gmail = validated-if-present, not required, consistent with browse-only launch.
- **Removing hardcoded URL fallback** would break canonicals silently (validation guards the right key only after the fix). Mitigation: keep fallbacks; set the explicit value.
- **Dual ownership** with master CFG3 → status drift. Mitigation: explicitly supersede CFG3.
