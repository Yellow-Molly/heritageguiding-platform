---
title: "Production Go-Live Cutover"
description: "Executable go-live program: the definitive list of code/config switches to flip from coming-soon/staging mode to live production, plus legal/Bokun/content/monitoring gates. Catalogs auto-flip (env-driven) vs manual (code) switches. Red-teamed 2026-06-05."
status: in-progress
priority: P0
branch: "master"
tags: [launch, go-live, cutover, seo, env, runbook]
created: "2026-06-05"
createdBy: "ck:plan"
source: skill
related:
  - 260514-1506-go-live-readiness-review     # Master readiness AUDIT (legal/content/config gates). Owns env.ts CFG3 — see Red Team F3.
  - 260430-1520-bokun-go-live                 # Bokun commercial onboarding + prod config (phase 04 defers to it)
  - 260425-1207-mvp-launch-content-audit      # CMS content + legal-date sign-off (phase 05 defers to it)
  - 260408-1512-staging-seo-safety            # COMPLETE — built the isProductionDeployment() gate this plan flips
blockedBy: []                                  # Technical flip (01-03) is intentionally NOT blocked (user: flip ASAP)
blocks: []
---

# Production Go-Live Cutover

## Overview

The single executable runbook for taking `privatetours.se` from **coming-soon/staging mode → live production**. The user could not recall every switch; this plan is the result of a full codebase + docs scan **plus a 4-reviewer red-team** that found the switches AND a live exposure the original scan missed. It separates **switches that auto-flip** (env-driven — verify only) from **switches that need a code/config change** (act).

**Decisions locked (2026-06-05):**
- AI chat stays **disabled** (`NEXT_PUBLIC_ENABLE_AI_CHAT=false`, MVP).
- Technical flip (01–03) executes **independently / ASAP** — NOT gated on Bokun onboarding or legal counsel.
- `/de` **should have been dark** — it leaked live (see below); Phase 01 closes the gap (all-locale gate) + audits indexing.
- Go-live mechanism = **a single env flag** (`COMING_SOON`), not `IS_STAGING`/DNS (those are already done). Rollback = flip the same flag.

## ⚠️ Live exposure found by red-team (was NOT in the original scan)

The coming-soon redirect matches only `source: '/:locale(en|sv)'` (`next.config.ts:61,67,73,79`) but locales are `['sv','en','de']` (`i18n/routing.ts:3`). **`/de/*` has been serving live, crawlable content on `privatetours.se` the entire "dark" period.** Removing the redirect does not "flip the site live" — a third of it already is. Phase 01 treats this as a corrective + audit.

## Switch Inventory (master reference)

| # | Switch | Location | Type | Action |
|---|--------|----------|------|--------|
| S1 | **Coming-soon redirect** — `(en|sv)` only, so `/de` already LIVE | `apps/web/next.config.ts:57-83` | 🔴 Manual code | **Replace with all-locale `COMING_SOON` env gate** (Phase 01) |
| S2 | robots.txt allow/disallow | `apps/web/app/robots.ts` | 🟢 Auto (`isProductionDeployment()`) | Verify (Phase 02) |
| S3 | sitemap.xml emit/empty (+ silent CMS-failure degrade; `/cancellation` missing) | `apps/web/app/sitemap.ts` | 🟠 Auto + needs edits | Fix + verify (Phase 02) |
| S4 | `<meta robots noindex>` | `apps/web/app/(site)/[locale]/layout.tsx:136` | 🟢 Auto | Verify (Phase 02) |
| S5 | `X-Robots-Tag: noindex` header | `apps/web/next.config.ts:109` | 🟢 Auto (`VERCEL_ENV`+`IS_STAGING`) | Verify (Phase 02) |
| S6 | `IS_STAGING` MUST be absent on prod (master SEO gate) | Vercel prod env | 🟠 Config | Verify (Phase 02) |
| S7 | Bokun API + widget + **tour-detail preconnect** (3 sites) | `bokun-api-client*.ts:81`, `*widget-url-generator.ts:104`, `tours/[slug]/page.tsx:69` | 🟢 Auto (`NODE_ENV=production`) | Verify (Phase 04) |
| S8 | Bokun Experience-ID mapping (0/10) + prod channel UUID | CMS + `NEXT_PUBLIC_BOKUN_UUID` | 🟠 Config/content | Act (Phase 04 → `260430-1520`) |
| S9 | Phantom canonical var — `env.ts:47` validates `NEXT_PUBLIC_URL` (read by **0** files); code reads `NEXT_PUBLIC_SITE_URL` (22 files incl `packages/cms/payload.config.ts:52`) | `lib/env.ts:47` | 🔴 1-line fix + Vercel value | Fix (Phase 03) |
| S10 | Phantom email vars — `env.ts:52-53` validates `RESEND_API_KEY`/`EMAIL_FROM` (unused); email uses `GMAIL_USER`/`GMAIL_APP_PASSWORD` | `lib/email/*` vs `lib/env.ts:52-53` | 🔴 Code+`.env.example` | Fix (Phase 03) |
| S11 | AI chat widget | `NEXT_PUBLIC_ENABLE_AI_CHAT` | 🟠 Flag | **Keep off** (Phase 03); CSP still allowlists it (Phase 03 decision) |
| S12 | Canonical host — **Vercel makes www primary** (apex→www, runs before next.config). Do NOT add www→apex in code (loops). `NEXT_PUBLIC_SITE_URL` fallback is apex → mismatch with serving host | Vercel Domains + `next.config.ts` | 🟠 SEO decision | Resolve (Phase 02) |
| S13 | `REVALIDATION_SECRET` falls back to `PAYLOAD_SECRET` (master key) on public endpoint | `api/revalidate/route.ts:31` | 🔴 Secret hygiene | Fix (Phase 03) |
| S14 | Client Sentry gated on `NEXT_PUBLIC_VERCEL_ENV` (Vercel does NOT auto-inject) | `instrumentation-client.ts:13` | 🟠 Config | Set (Phase 06) |
| K1 | `heritageguiding.com` + `staging.*` → new-domain redirects | `next.config.ts:84-102` | ⚪ KEEP | Do NOT remove (Phase 01) |
| K2 | `proxy.ts` (Next 16 middleware) — runs on all locale routes; **verified no coming-soon/host gate** | `apps/web/proxy.ts:1-11` | ⚪ KEEP (verified) | No change (inventory completeness) |

## Phases

| # | Phase | Owner | Priority | Status |
|---|-------|-------|----------|--------|
| 1 | [Live-Domain Flip](./phase-01-live-domain-flip.md) — all-locale `COMING_SOON` gate (both hosts), indexing audit | Dev | P0 | in-progress (code ✅, ops pending) |
| 2 | [SEO Activation](./phase-02-seo-activation.md) — verify auto-flip + sitemap fixes + Search Console | Dev | P0 | pending |
| 3 | [Env-Var Audit](./phase-03-env-var-audit.md) — correct CFG3 (S9/S10/S13), sequence-safe | Dev | P0 | pending |
| 4 | [Bokun Go-Live](./phase-04-bokun-go-live.md) — gate input → `260430-1520` | Dev + Business | P0 | pending |
| 5 | [Legal & Content](./phase-05-legal-content.md) — gate input → `260514-1506`/`260425-1207` + Web Vitals consent | Legal + Content | P0/P1 | pending |
| 6 | [Monitoring](./phase-06-monitoring.md) — Sentry DSN + `NEXT_PUBLIC_VERCEL_ENV`, Uptime Robot | DevOps | P1 | pending |
| 7 | [Pre-Launch QA](./phase-07-pre-launch-qa.md) — prod smoke, 3 locales, security probes | QA | P0 | pending |
| 8 | [Go/No-Go & Launch](./phase-08-go-no-go-launch.md) — gate, flag flip, flag rollback | Tech Lead | P0 | pending |

## Critical Path

```
Fast-track (independent):  01 (gate+www) ─▶ 02 (SEO) ─▶ 07 (QA) ─▶ 08 (flag off)
Parallel:                  03 (env, sequence-safe) ┘
Gate inputs (defer to master plan, can lag the flip):  04 Bokun · 05 Legal · 06 Monitoring
```

01–03 are owned here and unblocked. 04–06 are **thin gate inputs** that defer to existing plans as source of truth (kept per "full program" choice; reframed to avoid dual-tracking drift). They feed the Phase 08 gate but do NOT block the flip.

## Dependencies

- **Builds on** `260408-1512-staging-seo-safety` (COMPLETE) — created `isProductionDeployment()`, the gate S2–S6 read.
- **Corrects** `260514-1506-go-live-readiness-review` CFG3: that item authored `lib/env.ts` and validated `NEXT_PUBLIC_URL`/`RESEND_API_KEY`/`EMAIL_FROM` — the **wrong** var names (code reads `NEXT_PUBLIC_SITE_URL`/`GMAIL_*`). Phase 03 supersedes CFG3, not "fixes a gap it missed". Master plan note updated.
- **Reconcile launch mechanic** with master Phase 05: that runbook says launch = `IS_STAGING=false` + DNS; the verified mechanic is the `COMING_SOON` flag (apex already points to Vercel — the redirect is the only dark switch). Phase 08 is the single executable gate; master Phase 05 should defer to it.

## Top Risk

- **Flipping live with Bokun bookings still onboarding** = live site, non-functional "Book Now". Accepted per "flip ASAP"; Phase 07 confirms graceful degradation (group-inquiry/WhatsApp/contact) and Phase 08 records the waiver.
- **Rollback** is forward-fix only: set `COMING_SOON=true` + redeploy the *current* build. Do NOT "promote previous deployment" — it reverts Phase 03 env fixes, re-exposes `/de`, and risks `42703` against apply-only-migrated prod DB.

## Red Team Review

### Session — 2026-06-05
**Reviewers:** 4 (Security Adversary, Failure Mode Analyst, Assumption Destroyer, Scope & Complexity Critic) · Full tier.
**Findings:** 12 accepted (after dedup + evidence filter), 1 guarded (user decision). **Severity:** 4 Critical, 7 High, 1 High-accuracy + folded Mediums.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | `/de` not in redirect → already live + crawlable | Critical | Accept | Phase 01, plan inventory S1 |
| 2 | Rollback (promote-previous) reverts env fixes, re-exposes /de, 42703 risk | Critical | Accept | Phase 08 (flag rollback) |
| 3 | `env.ts` mismatches authored by master CFG3 — reframe "missed"→"correct" | Critical | Accept | Phase 03, Dependencies |
| 4 | Launch-mechanic contradiction (redirect vs IS_STAGING/DNS) | Critical | Accept | Phase 08, Dependencies |
| 5 | No `www.privatetours.se`→apex redirect | High | Accept | Phase 01 (S12) |
| 6 | GMAIL prod-required + deploy-before-set = boot crash | High | Accept | Phase 03 (sequence-safe) |
| 7 | `.env.example` documents phantom vars → silent email fail | High | Accept | Phase 03 |
| 8 | `REVALIDATION_SECRET`→`PAYLOAD_SECRET` fallback (privileged reuse) | High | Accept | Phase 03 (S13) |
| 9 | `sitemap.ts` silent CMS-failure degrade + `/cancellation` missing | High | Accept | Phase 02 |
| 10 | Client Sentry `NEXT_PUBLIC_VERCEL_ENV` not auto-injected | High | Accept | Phase 06 (S14) |
| 11 | deployment-guide revalidation structurally wrong (header vs query) | High | Accept | Phase 03 |
| 12 | S9 count wrong (1 phantom reader, 22 real, incl CMS); 1-line fix | High-accuracy | Accept | Phase 03, S9 |
| M | Web Vitals unconsented EU beacon; `group-inquiries` open REST create; CSP allowlists disabled chat; coming-soon page indexable→301 transition; `proxy.ts`/Bokun-3rd-site inventory | Medium | Accept (folded) | Phases 02/05/07, inventory K2/S7 |
| G | Delete phases 04/05/06 + collapse gates (YAGNI) | — | **Guarded — NOT applied** | User chose "full program"; reframed as thin gate inputs instead |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01…08 (after edits).
- Decision deltas: S1→all-locale `COMING_SOON` gate; rollback→flag forward-fix; S9/S10→correct CFG3; add S12/S13/S14, K2; reframe 04/05/06 as gate inputs; launch mechanic→flag (not IS_STAGING/DNS).
- Reconciled stale references: removed "audit missed two switches" framing; aligned Phase 08 ↔ master Phase 05 mechanic; aligned S7 (3 sites) and S9 (22 files) counts across plan + phases.
- Unresolved contradictions: see Open Questions (launch-gate canonicalization + DNS state need a human/dashboard check; not repo-resolvable).

## Open Questions

1. **Launch gate canonicalization:** master Phase 05 still describes an `IS_STAGING`/DNS launch; this plan uses the `COMING_SOON` flag. Confirm Phase 08 here is the single runbook and master Phase 05 defers to it.
2. **Canonical host — RESOLVED 2026-06-05: www is primary.** Vercel redirects apex→www; the code www→apex looped and was removed (`54dfdf8`). Open SEO choice: keep www canonical (set `NEXT_PUBLIC_SITE_URL=https://www.privatetours.se`) OR flip Vercel to apex-primary then set apex. Phase 02/03.
3. **Search Console state** — are `/de/*` or `/coming-soon` URLs already indexed? Drives the Phase 01/02 301 cleanup.
4. **Browse-only vs hold** — launch with tours visible but "Book Now" pending Bokun, or hold tour pages until S8 ready?
5. **Target launch date** — drives Phase 08 timing and P1 (monitoring) waiver.
