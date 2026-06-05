---
phase: 5
title: "Legal & Content Sign-Off"
status: pending
priority: P0
effort: "external (counsel) + content review"
dependencies: []
---

# Phase 5: Legal & Content Sign-Off

## Overview

Non-code launch gates: legal counsel sign-off and final CMS/business-data verification. Execution detail lives in `260514-1506-go-live-readiness-review` (phase-01 legal) and `260425-1207-mvp-launch-content-audit` (content + legal dates). This phase is a **thin gate input** — those plans remain the source of truth; it re-specifies nothing, only the launch-blocking decisions plus the Web Vitals consent fix that must land before the flip. Not a blocker on the technical flip per the launch decision, but a P0 for a compliant public launch.

## Requirements

- Legal copy + effective dates counsel-approved.
- Cookie-consent stance final (currently essential-cookies-only, documented in privacy policy).
- Impressum present (DE audience) — already shipped.
- DSAR handling decided (pre-launch form vs post-launch manual).
- CMS content + business contact data final across sv/en/de.

## Architecture / State

- `apps/web/lib/legal-dates.ts` — effective dates set (privacy 2026-05-09, terms 2026-05-04, cancellation 2026-04-25, imprint 2026-05-17), explicitly "until counsel sign-off". Counsel confirms or adjusts.
- Privacy/Terms/Imprint/Cancellation pages live + i18n. Schema.org clean.
- Web Vitals (`/api/analytics/vitals`) fires without a consent gate — reconcile with the essential-only cookie stance (counsel question: is anonymous RUM "essential"?).
- CMS seeded + verified (10 tours / 15 guides / 10 categories / 97 media, all 3 locales — verified 2026-05-15).

## Related Code Files

- Reference only (no new code expected here): legal page components, `legal-dates.ts`, privacy policy content.
- Possible follow-ups owned by referenced plans: DSAR endpoint, newsletter consent, cookie banner (only if counsel requires non-essential analytics).

## Implementation Steps

1. Engage counsel (internal vs external Swedish firm — open question): review privacy, terms, cancellation, imprint copy + dates.
2. **Decouple Web Vitals from the counsel timeline (pre-flip, technical):** the beacon is mounted unconditionally for every visitor incl. EU (`layout.tsx:143` → `/api/analytics/vitals`). Before the flip, gate it behind consent OR disable it until the CMP decision lands — do NOT ship unconsented EU RUM while the legal question is open and the flip is decoupled from Phase 05. Then resolve the cookie-consent stance (essential-only vs CMP) with counsel.
3. Confirm impressum completeness (company name, org-nr, VAT, contact, responsible person).
4. Decide DSAR mechanism; document in privacy policy.
5. Content: verify business contact (phone/email/address) values live in prod (env + CMS), VAT not placeholder, all tours/guides final copy in sv/en/de. (a) `/de` was live during the dark period — QA German content + legal for the prior public exposure. (b) **PII hardening:** `group-inquiries` has `create: () => true` (`group-inquiries.ts:18`) so public Payload REST `POST /api/group-inquiries` bypasses the route's rate-limit + honeypot (unlike `contact-inquiries`, which gates `req.payloadAPI === 'local'`); tighten to match — this collection holds DSAR-scoped PII.
6. Update `260514-1506` phase-01 + `260425-1207` statuses; surface any residual P0 to Phase 08.

## Success Criteria

- [ ] Counsel sign-off recorded; `legal-dates.ts` reflects approved dates.
- [ ] Cookie stance final (and CMP added only if required).
- [ ] Impressum complete + verified.
- [ ] DSAR mechanism decided + documented.
- [ ] Business contact + VAT final in prod; CMS content confirmed across locales.

## Risk Assessment

- **Counsel turnaround** is external — may lag flip. Launching before sign-off = compliance risk; Phase 08 must explicitly waive or hold.
- **Web Vitals vs consent** — if counsel rules RUM non-essential without a banner = GDPR exposure. Cheapest mitigation: gate the vitals beacon behind consent or disable until CMP.
