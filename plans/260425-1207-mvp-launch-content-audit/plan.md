---
title: "MVP Launch Content Audit"
description: "Comprehensive audit + content delivery plan: replace placeholders with real data, seed CMS, verify business info, prep launch"
status: pending
priority: P1
effort: ~12h planning + content delivery (5-10 days)
branch: master
tags: [mvp, content, launch, audit, i18n, cms, payload]
created: 2026-04-25
blockedBy: []
blocks:
  - 260514-1506-go-live-readiness-review  # CMS empty + business sign-off + legal dates are P0 launch blockers
---

## Context

Heritage tours platform (Stockholm) approaching MVP launch. Audit found:
- Frontend: 14 hardcoded-text findings, fake testimonials, address mismatch, fake schema ratings
- CMS: schemas defined but ZERO seeded content (Tours/Guides/Categories/Reviews empty)
- i18n: 579 keys × 3 locales (SV/EN/DE) — translation-complete, no stubs
- Business data: contact info embedded but unverified

Cannot launch until CMS seeded + placeholders replaced + business data verified.

## Research Reports

- [Frontend Pages Audit](research/researcher-01-frontend-pages-audit.md) — 14 findings
- [CMS i18n Content Audit](research/researcher-02-cms-i18n-content-audit.md) — empty collections, seed strategy

## Phases

| # | Phase | Owner | Status |
|---|-------|-------|--------|
| 01 | [Frontend Code Fixes](phase-01-frontend-code-fixes.md) | Frontend dev | code complete (awaits phase-03/04 sign-offs for env values + real legal dates) |
| 02 | [CMS Content Seeding](phase-02-cms-content-seeding.md) | Content team | pending (awaits briefs + content) |
| 03 | [Business Data Verification](phase-03-business-data-verification.md) | Business owner + Marketing | pending (human action) |
| 04 | [Legal Review](phase-04-legal-review.md) | Legal | pending (human action) |
| 05 | [Marketing Content](phase-05-marketing-content.md) | Marketing + Content | pending (human action) |
| 06 | [Content Editor Assignment Briefs](phase-06-content-editor-assignment-briefs.md) | Project lead | drafted (8 briefs in `assignments/`) — awaits send + recipient confirmations |
| 07 | [Pre-Launch QA](phase-07-pre-launch-qa.md) | QA + Tech lead | pending (gates on 01–05) |

## Key Dependencies

- 06 (briefs) unblocks 02, 03, 04, 05 (content delivery)
- 03 (business data) blocks 01 (frontend keys need verified values)
- 04 (legal dates) blocks 01 (privacy/terms dates) and 07 (legal sign-off)
- 02 (CMS seeded) + 01 (code fixed) blocks 07 (QA)

## Success Criteria Summary

- All hardcoded business text → i18n keys or env vars (grep clean)
- CMS contains 5+ tours, 2+ guides, 6+ categories, 10+ reviews, all locales
- Contact data verified by business owner (signed off)
- Legal pages reviewed + dated by counsel
- All 3 locales render every page
- Lighthouse + schema.org validators green
- E2E smoke + Bokun test booking pass

## Unresolved Questions (root)

1. ~~Real testimonials~~ → **DECIDED:** Hide for MVP
2. ~~Canonical address~~ → **DECIDED:** Karlavägen 18, 114 31, Stockholm
3. ~~Blog~~ → **DECIDED:** Hide for MVP
4. ~~Reviews~~ → **DECIDED:** Keep hidden, seed nothing
5. ~~Trust stats~~ → **DECIDED:** Rewrite to honest defensible copy
6. ~~Schema.org aggregateRating~~ → **DECIDED:** Remove entirely
7. ~~Pages strategy~~ → **DECIDED:** Headless from i18n (Option A)
8. ~~Footer tour links~~ → **DECIDED:** Fetch top 3 featured tours from CMS
9. WhatsApp number to publish? — pending business owner
10. Content delivery deadline per locale? — pending project lead

## Validation Summary

**Validated:** 2026-04-25
**Questions asked:** 8 (covering all critical scope/risk decisions)

### Confirmed Decisions

| # | Decision | Choice | Impact |
|---|----------|--------|--------|
| 1 | Homepage testimonials | **Hide for MVP** | Phase 05: remove `home/testimonials.tsx` from homepage render. Re-add post-launch when real reviews seeded. |
| 2 | Canonical office address | **Karlavägen 18, 114 31, Stockholm** (new) | Phase 01 + 03: update i18n (sv/en/de), schema.org, footer. Discard both prior values. |
| 3 | Blog section | **Hide for MVP** | Phase 05: remove `home/latest-posts.tsx` from homepage render. Defer blog CMS to Phase 17+. |
| 4 | Reviews on tour detail | **Keep hidden, seed nothing** | Phase 01: remove TODO comment, document decision. Phase 02: skip Reviews seeding. |
| 5 | Schema.org `aggregateRating` | **Remove entirely** | Phase 01: strip aggregateRating block from `travel-agency-schema.tsx`. Re-add post-launch w/ real data. |
| 6 | Pages strategy | **Headless from i18n** (Option A) | Phase 02: skip Pages collection seeding. Pages render directly from `messages/*.json`. |
| 7 | Trust signals copy | **Rewrite honest + defensible** | Phase 05: marketing rewrites `trust-signals.tsx` claims. New copy goes through Phase 01 i18n migration. |
| 8 | Footer tour links | **Fetch top 3 featured tours from CMS** | Phase 01: convert `footer.tsx` tour links section to server-component fetch w/ `getFeaturedTours({ limit: 3 })`. |

### Action Items (apply before/during phase execution)

- [ ] **Phase 01:** Update address everywhere to "Karlavägen 18, 114 31, Stockholm"
- [ ] **Phase 01:** Remove `aggregateRating` block from schema.org component
- [ ] **Phase 01:** Convert footer tour-links list → server-component dynamic fetch (top 3 featured)
- [ ] **Phase 01:** Remove TODO reviews comment + delete reviews UI from tour detail page
- [ ] **Phase 02:** Drop Reviews + Pages seeding from scope — saves ~4h
- [ ] **Phase 05:** Remove `home/testimonials.tsx` + `home/latest-posts.tsx` imports from homepage
- [ ] **Phase 05:** Marketing drafts new trust-signals copy (defensible claims)
- [ ] **Phase 06:** Drop testimonials + reviews + blog assignment briefs (no longer needed)

### Scope Reduction Impact

- **Testimonials brief** — DROPPED
- **Reviews seeding** — DROPPED
- **Pages CMS seeding** — DROPPED
- **Blog CMS build** — DEFERRED (post-MVP)
- **Estimated effort saved:** ~12-16h content + dev work

### Pending Decisions (non-blocking)

- WhatsApp number — business owner to provide before launch
- Content delivery deadlines — project lead to set per locale
