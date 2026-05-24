---
title: "Playwright E2E Testing"
description: "Add comprehensive E2E testing with Playwright covering customer journey, wizard, group booking, i18n, accessibility, SEO, visual regression, performance, and CI/CD"
status: in-progress
priority: P2
effort: "16h"
branch: master
tags: [testing, e2e, playwright, accessibility, seo, visual-regression, i18n]
created: 2026-02-12
updated: 2026-05-19
phase_01_completed: 2026-03-14
phase_02_completed: 2026-03-15
phase_04_partial_completed: 2026-03-15
blockedBy: []
blocks: []
---

# Playwright E2E Testing - Implementation Plan

## Summary

Add Playwright E2E test suite to Private Tours platform. Tests run against staging URL (STAGING_URL env var) with real Bokun TEST system -- no mocking. Covers 13 customer-facing routes + admin across customer journey, wizard, group booking, guides, i18n, accessibility, SEO, visual regression, performance, and admin smoke. CI via on-demand GitHub Actions with 3-browser sharding.

**Last updated**: 2026-05-19 — re-synced after 153 commits since 2026-03-14. Major shifts: new routes (/contact, /imprint, /cancellation, custom 404), redesigned tour-detail / guide-detail / guides-listing / tours-listing, Bokun outbound sync admin, Sentry observability, Lighthouse CI workflow already in place for PR Previews, AI chat (Bubblav) gated behind `NEXT_PUBLIC_ENABLE_AI_CHAT`, WhatsApp button hides while AI chat is open, group inquiry form fields fully changed (firstName/lastName/phone/preferredDates/tourInterest/specialRequirements + honeypot), new SEO schemas (contact-page, tour-list).

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Foundation (setup, config, POM base, smoke) | 3h | **Complete** | [phase-01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md) |
| 2 | Customer Journey (browse, search, filter, booking) | 3h | **Complete** | [phase-02](./phase-02-customer-journey-browse-search-filter-booking.md) |
| 3 | Wizard + Group Booking (3-step flow, forms, validation) | 2.5h | pending (rewritten 2026-05-19) | [phase-03](./phase-03-concierge-wizard-and-group-booking-form-validation.md) |
| 4 | i18n + Accessibility (locale routing, axe-core, keyboard) | 2h | **Partial** (axe done) | [phase-04](./phase-04-i18n-locale-routing-and-accessibility-axe-core-keyboard.md) |
| 5 | SEO + Visual + Performance (meta, schema, screenshots) | 2.5h | pending (rewritten 2026-05-19) | [phase-05](./phase-05-seo-meta-schema-visual-regression-and-performance-web-vitals.md) |
| 6 | CI/CD (GitHub Actions workflow, sharding, reports) | 2h | pending (rewritten 2026-05-19) | [phase-06](./phase-06-github-actions-ci-workflow-sharding-and-report-merge.md) |

**Progress**: 7/16h (~44%) — Phase 01/02 complete, Phase 04 axe-core audit shipped early.

## Key Dependencies

- Playwright 1.48+ with @axe-core/playwright 4.9+
- Staging URL provided via STAGING_URL env var
- Real Bokun TEST environment on staging (no mocks)
- Admin credentials via ADMIN_EMAIL / ADMIN_PASSWORD env vars
- Lighthouse CI workflow `.github/workflows/lighthouse-ci.yml` already runs perf budgets on Vercel Preview deployments — Playwright perf coverage is intentionally minimal to avoid duplication
- Bypass coming-soon redirect on staging (uses `IS_STAGING` env var) — tests already hit staging URL directly

## Key Decisions

- **Test location**: Root `e2e/` directory (isolated from apps/web)
- **Default locale**: `en` for most assertions (simplest string matching)
- **Browsers**: Chromium + Firefox + WebKit (all 3)
- **CI trigger**: `workflow_dispatch` only (on-demand manual)
- **Selectors**: Continue using semantic locators + aria attributes; no `data-testid` proliferation (codebase grep shows zero data-testid usage outside one filter test)
- **Bokun iframe**: Presence + locale (`?lang=`) verification only — interaction defers to manual smoke since Bokun TEST availability is brittle
- **Test data cleanup**: API cleanup via Payload admin API (afterAll hooks delete test group inquiries); honeypot field stays empty
- **CI sharding**: 3 browsers x 4 shards = 12 parallel jobs (max parallelism)
- **Visual regression**: Key pages full-page at 3 viewports — animations disabled, mask volatile regions (Bokun iframe, AI chat, WhatsApp button)
- **Performance**: Deferred to Lighthouse CI workflow (already shipped). Playwright covers only page-load timing sanity check, not Core Web Vitals
- **AI chat**: Tests run with `NEXT_PUBLIC_ENABLE_AI_CHAT` left untouched on staging; specs tolerate either Bubblav-mounted or absent state
- **Documentation**: Update roadmap, codebase-summary, code-standards with E2E section

## Codebase Changes Since 2026-03-14 (impact map)

| Area | Change | Phase Impact |
|------|--------|--------------|
| Routes | `/contact`, `/imprint`, `/cancellation`, custom 404, coming-soon redirect (staging bypass via IS_STAGING) | Phase 04 (axe added contact already), Phase 05 (meta/schema for contact + imprint + cancellation) |
| Tour detail | Redesigned booking-first layout; `booking-section.tsx` mounts `GroupInquiryModal` | Phase 03 (modal trigger selector) |
| Guides | Listing redesigned to portrait gallery; detail to split-panel sidebar; v3 data with photos | Phase 02 verified, Phase 04 audit still passes |
| Tours listing | Sidebar filters + city filter + view toggle + infinite scroll; instant filter feedback | Phase 02 (covered), Phase 04 (filter chip keyboard nav) |
| Homepage | VideoHighlight hidden for MVP; SeasonalCta exists but not in homepage; explicit dimensions on hero for LCP | POM `home-page.ts` already updated; Phase 05 visual baselines |
| Footer | Newsletter hidden, YouTube dropped, cities listing added, tagline updated | Phase 02 already covers; visual baselines need refresh |
| Group inquiry form | Fields: firstName, lastName, email, phone, groupSize (9-200), preferredDates, tourInterest, specialRequirements, honeypot | **Phase 03 rewritten** — replaces old name/message schema |
| Bokun outbound sync | Admin panel `TourBokunSyncPanel`, manual sync endpoint, persistent webhook bookings | Not in current e2e scope (admin smoke only) |
| Bokun widget | Lazy-load on viewport intersection, `?lang=` injection for locale, T&C disclosure surfaced | Phase 03 (assert disclosure visible); Phase 02 verified |
| AI chat | Bubblav widget gated by `NEXT_PUBLIC_ENABLE_AI_CHAT`; mounts on idle/first-interaction; provider exposes `isAiChatOpen` | Phase 04 (axe excludes `#bubblav-iframe` already); Phase 05 (WhatsApp visibility depends on isAiChatOpen) |
| WhatsApp | Hides when AI chat open, dismiss key `hg-whatsapp-dismissed` unchanged | Phase 05 spec must factor in AI chat coupling |
| SEO components | Added `contact-page-schema.tsx`, `tour-list-schema.tsx`; existing `about-schema`, `guide-detail-schema`, `guide-list-schema` | **Phase 05 expanded** |
| Sentry | env-gated client/server/edge; instrumentation-client.ts + sentry.*.config.ts | Phase 01 smoke unaffected; no specific test required |
| Lighthouse CI | `.github/workflows/lighthouse-ci.yml` already audits Vercel Preview on PRs (perf ≥0.9, a11y ≥0.95) | **Phase 05 + 06 simplified** — perf duplicates removed |
| Coming-soon | Production redirected to coming-soon until April 2; staging detected via `IS_STAGING` | Phase 01 smoke already passes against staging URL |
| Env validation | Boot-time Zod fail-fast for required env vars | Test config asserts STAGING_URL present |
| Privacy / Terms / FAQ / About | Content rewritten (GDPR-compliant Privacy 14 sections; Bokun+Adyen Terms; Sweden-wide FAQ + About) | Visual baselines stale → regenerate in Phase 05 |
| Rate limiting | `/api/tours/recommend` and `/api/revalidate` rate-limited | Phase 03 wizard recommend call may hit limit in parallel runs — test serially per browser |
| React Server Components | 9 static home sections converted to RSC; loading.tsx skeletons added | Visual baselines stale → regenerate |

## Validation Summary

**Last validated:** 2026-02-12 (original) — material drift confirmed 2026-05-19
**Re-validation needed:** Phase 03, 05, 06 prose was rewritten; verify with implementation team before starting.

### Open Questions (need confirmation before phase 03 implementation)
- Should group-inquiry e2e tests use a dedicated test SMTP catcher to verify the customer-email side effect (added 2026-04 in commit `edc8681`), or treat email as out-of-scope?
- Should we wire a `playwright-e2e-tests-on-demand.yml` workflow even though Lighthouse CI already runs on every PR? (Current plan: yes, on-demand only, no PR coupling.)
- Bokun TEST widget interaction was deferred in Feb 2026 validation — keep deferred, or attempt frameLocator now that hosted-checkout fallback exists?

## Research Reports

- [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- [i18n, Bokun, SEO Testing](./research/researcher-02-i18n-bokun-seo-testing.md)
