---
phase: 7
title: "Pre-Launch QA & Smoke Test"
status: pending
priority: P0
effort: "2-3h"
dependencies: [1, 2, 3]
---

# Phase 7: Pre-Launch QA & Smoke Test

## Overview

End-to-end validation that the flipped, live-configured site works across all locales and that the env-var fixes (Phase 03) actually took. Run against a production-config preview first, then re-verify on prod immediately after the Phase 01 flip. Confirms the "graceful degradation" promise for booking CTAs while Bokun (Phase 04) may still be onboarding.

## Requirements

- All public routes render 200 in sv/en/de.
- SEO signals correct (ties Phase 02).
- Forms send email (validates Phase 03 S10 fix).
- Booking CTA either transacts (Phase 04 done) or degrades gracefully.
- Build/test/lint/type-check green.

## Architecture

Existing Playwright e2e suite (`e2e/tests/customer-journey/*`) + Vitest unit suite (1009 tests). Use both; add manual smoke for prod-only env behavior the CI build can't exercise.

## Related Code Files

- Verify: all `app/(site)/[locale]/**` routes, `components/contact/*`, `components/booking/*`, `components/shared/whatsapp-floating-button.tsx`, `not-found.tsx`.
- Run: `e2e/tests/customer-journey/tour-detail-and-booking.spec.ts`.

## Implementation Steps

1. `npm run type-check && npm run lint && npm test && npm run build` — all green.
2. Run Playwright customer-journey e2e against a production-config preview.
3. Manual smoke (sv + en + de), on prod-config preview then prod after flip:
   - Home, /tours, tour detail, /guides, guide detail, /find-tour, /about-us, /faq, /group-booking, /privacy, /terms, /imprint, /cancellation, 404 — all 200, localized.
   - SEO: robots.txt allows, sitemap.xml non-empty, no `noindex` meta/header, canonical = `https://privatetours.se/...` (Phase 02/03).
   - Forms: submit contact form + group inquiry → confirm admin + customer emails arrive (Gmail SMTP — Phase 03 S10). Honeypot still blocks spam.
   - Booking: if Bokun live (Phase 04) widget renders + availability loads; if not, confirm CTA degrades (group-inquiry modal / WhatsApp / contact reachable, no dead/broken "Book Now").
   - WhatsApp floating button deep-links; dismiss persists.
   - Mobile viewport: sticky price bar, nav, images (blur placeholders), no layout breaks.
   - **All 3 locales incl `/de`** (live during the dark period): German pages render + are served per the launch decision.
   - **Security probes:** unauthenticated `curl /api/bookings|users|contact-inquiries|group-inquiries` → 401/403; `curl -X POST /api/group-inquiries` (direct REST) → 403, not 201.
   - **www→apex:** `curl -I https://www.privatetours.se/sv` → 301 to apex.
   - **`/coming-soon`:** after go-live → 301 to locale home (not 404).
   - **Client Sentry:** trigger a browser error → confirm it reaches Sentry (proves `NEXT_PUBLIC_VERCEL_ENV` set).
   - **Sitemap robustness:** `sitemap.xml` URL count above threshold (tours + guides + legal incl `/cancellation`), not a silent static-only degrade.
4. Lighthouse on home + a tour page (prod): perf/SEO/a11y/best-practices ≥ 90 (CI baseline).
5. Verify cache revalidation via the REAL mechanism: edit a tour in CMS → the in-process `revalidateTag()` afterChange hook fires → front page updates (NOT the phantom header-based POST in the old deployment-guide). Optionally test manual `POST /api/revalidate?secret=<REVALIDATION_SECRET>&tag=tours` → 200.

## Success Criteria

- [ ] CI gates green (type-check, lint, 1009 tests, build).
- [ ] e2e customer-journey passes.
- [ ] All routes 200 in 3 locales; SEO signals correct on prod.
- [ ] Contact + group-inquiry emails delivered (S10 verified live).
- [ ] Booking CTA transacts OR degrades gracefully (no broken Book Now).
- [ ] All 3 locales incl `/de` verified; PII REST endpoints 401/403; `group-inquiries` direct POST 403; www→apex 301; client Sentry receiving events.
- [ ] Lighthouse ≥ 90 all categories.

## Risk Assessment

- **Email only truly testable with prod creds** — unit tests mock nodemailer. Mitigation: live send test on prod-config env (step 3) — the real S10 proof.
- **Prod-only behavior** (env validation, NODE_ENV Bokun switch, headers) not exercised by local build. Mitigation: re-run smoke on prod immediately post-flip, before announcing.
