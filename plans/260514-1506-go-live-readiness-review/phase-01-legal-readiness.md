---
phase: 01
title: "Legal Readiness"
priority: P0
status: partial
effort: 4-7h dev + counsel turnaround
owner: Dev + Legal counsel
auditedAt: 2026-05-17
auditReport: ../reports/audit-260517-1311-go-live-readiness.md
---

# Phase 01 — Legal Readiness

## Context

Scout: `plans/reports/Explore-260514-1458-legal-readiness.md`

Privacy, Terms, Cancellation pages ✅ implemented and i18n-complete. **Critical gaps below block EU/DE launch.**

## Findings → Actions

### P0 — BLOCKING

#### L1. Cookie consent banner (CMP) — premise contested (audit 2026-05-17)
- **Audit finding:** Privacy policy explicitly declares essential-cookies-only stance: *"We use only strictly necessary cookies and equivalent storage… Because we use only essential cookies, no consent banner is required under ePrivacy."* Web Vitals (`use-web-vitals-reporter.ts`) sends `{name, value, rating, id, navigationType}` — no PII, no third-party — to `/api/analytics/vitals` which only `console.info`s. Privacy policy classifies as Art. 6(1)(f) legitimate interest.
- **Risk reframed:** Not a clear-cut GDPR violation; the project has taken a defensible legal stance. Question is whether **counsel signs off on the stance**, not whether code is missing.
- **Action (revised):**
  1. **First:** Counsel review of the essential-cookies-only stance + Web Vitals classification.
  2. **If counsel agrees:** L1 ships as documentation only — no code change.
  3. **If counsel disagrees:** install CMP (Cookiebot recommended) and gate `useWebVitalsReporter` on `analytics` consent category.
- **Files (only if implementation needed):** `apps/web/components/analytics/web-vitals-reporter.tsx`, `apps/web/app/(site)/[locale]/layout.tsx`, `messages/{sv,en,de}.json`
- **Effort:** 0h (stance ratified) or 3-5h (CMP required)

#### L2. Impressum / Imprint page — ✅ DONE (2026-05-17)
- **Done:**
  1. ✅ `apps/web/app/(site)/[locale]/(frontend)/imprint/page.tsx` — single-file page, mirrors privacy hero style, body is flat fact-sheet (provider / contact / registration / VAT / editorial responsibility / EU ODR) using semantic `<address>` + `<dl>`.
  2. ✅ `imprint` namespace added to sv/en/de with TMG §5 + §55 RStV terminology.
  3. ✅ Values sourced from `lib/contact-constants.ts` (`LEGAL_ENTITY`, `CONTACT_ADDRESS`, `CONTACT_PHONE`, `CONTACT_EMAIL`) — one source of truth. VAT shows `<VAT-TBD>` with an in-page pending note until Bolagsverket registration completes.
  4. ✅ Footer `legalLinks` cluster includes `/imprint` in all locales.
  5. ✅ `app/sitemap.ts` registers `/imprint` (priority 0.3, yearly).
  6. ✅ `lib/legal-dates.ts` adds `imprint: '2026-05-17'`.
- **Verified:** Dev server smoke — `/en/imprint`, `/sv/imprint`, `/de/imprint` all return 200 with no missing-key markers; footer link renders on home and imprint pages in all locales.
- **Remaining dependency:** VAT number from Bolagsverket → flips `<VAT-TBD>` to real ID (Phase 02 / `260425-1207` phase-03).

#### L3. Legal copy dates are placeholder
- **Risk:** Privacy lastUpdated = `2026-05-09`, Terms = `2026-05-04`, but Phase-04 legal review in `260425-1207` says these are **drafts not counsel-signed**. Phase-04 plan flags effective dates as `2026-01-01` mock.
- **Action:** Route through `260425-1207-mvp-launch-content-audit/phase-04-legal-review.md`. Get counsel sign-off, set real effective dates.
- **Owner:** Legal (external/internal Swedish counsel)
- **Effort:** depends on counsel turnaround

### P1 — Risk-Waiverable

#### L4. Analytics fires without consent
- **Sub-issue of L1** — once CMP wired, gate Web Vitals on `analytics` category.

#### L5. Bokun T&Cs not surfaced at booking — ✅ DONE (2026-05-17)
- **Risk:** Customer agrees to site Terms but unaware of Bokun's own cancellation terms. Mismatch = liability.
- **Done:**
  1. ✅ Inline disclosure rendered below Bokun widget in `booking-section.tsx` (`hasBokunIntegration` branch only).
  2. ✅ `tourDetail.booking.bokunDisclosure` key added in sv/en/de with `<link>` rich-text → `https://www.bokun.io/legal/terms-of-service` (target=_blank, rel=noopener).
- **Files changed:** `apps/web/components/tour/booking-section.tsx`, `apps/web/messages/{sv,en,de}.json`

#### L6. Newsletter consent / double opt-in
- **Current:** Footer form `disabled`. Awaiting backend wiring.
- **Action:** When re-enabled, MUST implement: explicit consent checkbox (no pre-tick), double opt-in (confirmation email), unsubscribe in every send. Defer until newsletter goes live.

### P2 — Post-Launch Acceptable

#### L7. GDPR DSAR endpoint
- **Current:** Manual via contact form. Acceptable per GDPR Art. 12 if response SLA monitored (1 month).
- **Action:** Add DSAR receipt automation to `260425-1207` phase-04 backlog. Manual workflow OK at launch.

#### L8. Per-tour cancellation policy variant
- **Current:** Static policy in `/cancellation`. Plan `260419-1332-per-tour-cancellation-policy` exists, not complete.
- **Action:** Defer. Static policy + Bokun T&C disclosure (L5) covers liability at MVP scale.

## Done Criteria

- [ ] L1: CMP installed and Web Vitals gated on consent (test in 3 locales)
- [ ] L2: Imprint page live in sv/en/de + linked from footer
- [ ] L3: Privacy + Terms counsel-signed with real `lastUpdated` dates (via `260425-1207` phase-04)
- [ ] L5: Bokun T&C disclosure in widget container
- [ ] L6: Newsletter remains disabled OR consent flow implemented before enabling

## Open Questions

1. CMP vendor — Cookiebot / Osano / in-house? (recommend Cookiebot)
2. Counsel — internal review acceptable or external Swedish law firm required?
3. Imprint VAT number — confirmed via Bolagsverket?
4. Newsletter — included in MVP launch or deferred?
