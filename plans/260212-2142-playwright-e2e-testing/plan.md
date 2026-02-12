---
title: "Playwright E2E Testing"
description: "Add comprehensive E2E testing with Playwright covering customer journey, wizard, group booking, i18n, accessibility, SEO, visual regression, performance, and CI/CD"
status: pending
priority: P2
effort: "16h"
branch: master
tags: [testing, e2e, playwright, accessibility, seo, visual-regression, i18n]
created: 2026-02-12
---

# Playwright E2E Testing - Implementation Plan

## Summary

Add Playwright E2E test suite to HeritageGuiding platform. Tests run against staging URL (STAGING_URL env var) with real Bokun TEST system -- no mocking. Covers 10 test suites across customer journey, wizard, group booking, i18n, accessibility, SEO, visual regression, performance, and admin smoke. CI via on-demand GitHub Actions with 3-browser sharding.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Foundation (setup, config, POM base, smoke) | 3h | pending | [phase-01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md) |
| 2 | Customer Journey (browse, search, filter, booking) | 3h | pending | [phase-02](./phase-02-customer-journey-browse-search-filter-booking.md) |
| 3 | Wizard + Group Booking (3-step flow, forms, validation) | 2.5h | pending | [phase-03](./phase-03-concierge-wizard-and-group-booking-form-validation.md) |
| 4 | i18n + Accessibility (locale routing, axe-core, keyboard) | 2.5h | pending | [phase-04](./phase-04-i18n-locale-routing-and-accessibility-axe-core-keyboard.md) |
| 5 | SEO + Visual + Performance (meta, schema, screenshots, vitals) | 2.5h | pending | [phase-05](./phase-05-seo-meta-schema-visual-regression-and-performance-web-vitals.md) |
| 6 | CI/CD (GitHub Actions workflow, sharding, reports) | 2.5h | pending | [phase-06](./phase-06-github-actions-ci-workflow-sharding-and-report-merge.md) |

## Key Dependencies

- Playwright 1.48+ with @axe-core/playwright 4.9+
- Staging URL provided via STAGING_URL env var
- Real Bokun TEST environment on staging (no mocks)
- Admin credentials via ADMIN_EMAIL / ADMIN_PASSWORD env vars

## Key Decisions

- **Test location**: Root `e2e/` directory (isolated from apps/web)
- **Default locale**: `en` for most assertions (simplest string matching)
- **Browsers**: Chromium + Firefox + WebKit (all 3)
- **CI trigger**: `workflow_dispatch` only (on-demand manual)
- **Selectors**: Add `data-testid` attributes to ~15 React components for stable E2E selectors
- **Bokun iframe**: Try `frameLocator` interaction with Bokun TEST widget (select dates, check availability)
- **Test data cleanup**: API cleanup via Payload admin API (afterAll hooks delete test entries)
- **CI sharding**: 3 browsers x 4 shards = 12 parallel jobs (max parallelism)
- **Visual regression**: Key components only (header, footer, tour card) — not full pages
- **Documentation**: Update roadmap, codebase-summary, code-standards with E2E section

## Validation Summary

**Validated:** 2026-02-12
**Questions asked:** 6

### Confirmed Decisions
- **Selectors**: Add `data-testid` to ~15 React components (stable over semantic-only)
- **Bokun iframe**: Try real iframe interaction via `frameLocator` (not just presence check)
- **Test data**: API cleanup after tests via Payload admin API (not manual, not skip)
- **CI shards**: Keep 3x4=12 parallel jobs (max speed, ~60 CI min/run acceptable)
- **Visual regression**: Screenshot key components only (header, footer, tour card) — avoids dynamic content noise
- **Documentation**: Full docs update — roadmap, codebase-summary, code-standards

### Action Items (Plan Revisions Needed)
- [ ] Phase 02: Add step to implement `data-testid` on ~15 components before writing tests
- [ ] Phase 02: Replace Bokun presence-only check with `frameLocator` interaction tests
- [ ] Phase 03: Add `afterAll` cleanup hook using Payload API to delete test group inquiries
- [ ] Phase 05: Change visual regression from full-page to component-level screenshots
- [ ] Phase 06 (or new): Add documentation updates (roadmap, codebase-summary, code-standards)

## Research Reports

- [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- [i18n, Bokun, SEO Testing](./research/researcher-02-i18n-bokun-seo-testing.md)
