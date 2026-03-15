---
title: "Playwright E2E Testing"
description: "Add comprehensive E2E testing with Playwright covering customer journey, wizard, group booking, i18n, accessibility, SEO, visual regression, performance, and CI/CD"
status: in-progress
priority: P2
effort: "16h"
branch: master
tags: [testing, e2e, playwright, accessibility, seo, visual-regression, i18n]
created: 2026-02-12
updated: 2026-03-15
phase_01_completed: 2026-03-14
phase_02_completed: 2026-03-15
---

# Playwright E2E Testing - Implementation Plan

## Summary

Add Playwright E2E test suite to Private Tours platform (formerly Private Tours). Tests run against staging URL (STAGING_URL env var) with real Bokun TEST system -- no mocking. Covers 12 customer-facing routes + admin across customer journey, wizard, group booking, guides, i18n, accessibility, SEO, visual regression, performance, and admin smoke. CI via on-demand GitHub Actions with 3-browser sharding.

**Last updated**: 2026-03-14 — synced with codebase changes since Feb 12 (rebrand, homepage redesign, guides pages, BubblaV AI chat, FAQ i18n, group booking min size change, hero title removal).

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Foundation (setup, config, POM base, smoke) | 3h | **Complete** | [phase-01](./phase-01-foundation-setup-config-pom-base-smoke-tests.md) |
| 2 | Customer Journey (browse, search, filter, booking) | 3h | **Complete** | [phase-02](./phase-02-customer-journey-browse-search-filter-booking.md) |
| 3 | Wizard + Group Booking (3-step flow, forms, validation) | 2.5h | pending | [phase-03](./phase-03-concierge-wizard-and-group-booking-form-validation.md) |
| 4 | i18n + Accessibility (locale routing, axe-core, keyboard) | 2.5h | pending | [phase-04](./phase-04-i18n-locale-routing-and-accessibility-axe-core-keyboard.md) |
| 5 | SEO + Visual + Performance (meta, schema, screenshots, vitals) | 2.5h | pending | [phase-05](./phase-05-seo-meta-schema-visual-regression-and-performance-web-vitals.md) |
| 6 | CI/CD (GitHub Actions workflow, sharding, reports) | 2.5h | pending | [phase-06](./phase-06-github-actions-ci-workflow-sharding-and-report-merge.md) |

**Progress**: 6/16h (37.5%)

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

### Codebase Changes Since Original Plan (2026-02-12 → 2026-03-14)
- **Rebrand**: HeritageGuiding → Private Tours (brand name, URLs, copy)
- **Homepage redesign**: Stepi-inspired clean aesthetic, new sections (guides-preview, seasonal-cta, video-highlight)
- **Hero title removed**: `<h1>` with "Discover Stockholm's Rich Heritage" no longer exists
- **BubblaV AI chat**: "Find Your Tour" CTAs replaced with "Ask AI" powered by BubblaV
- **Guides pages**: New `/guides` listing and `/guides/[slug]` detail pages
- **FAQ redesign**: Migrated to i18n translations with accordion UI
- **Group booking**: Min group size changed from 20 to 9
- **SEO schemas**: New `guide-detail-schema.tsx`, `guide-list-schema.tsx`, `about-schema.tsx`
- **llms.txt**: New `/llms.txt` and `/llms-full.txt` endpoints
- **Next.js 16**: `middleware.ts` → `proxy.ts` (deprecation, not breaking)
- **Unit tests**: Coverage improved from ~52% to 90%+

## Research Reports

- [Playwright Best Practices](./research/researcher-01-playwright-best-practices.md)
- [i18n, Bokun, SEO Testing](./research/researcher-02-i18n-bokun-seo-testing.md)
