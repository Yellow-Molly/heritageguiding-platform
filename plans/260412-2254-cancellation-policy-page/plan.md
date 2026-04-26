---
title: "Cancellation Policy Page"
description: "Add cancellation policy page with refund tiers, stepper, prose, trust banner per design"
status: pending
priority: P2
effort: 3h
branch: master
tags: [frontend, static-page, cancellation, i18n]
created: 2026-04-12
---

## Summary

New `/cancellation` static page with 6 designed sections: hero, refund tiers, stepper, prose, trust banner, CTA. Server component, fully i18n'd (en/sv/de), follows existing privacy/terms pattern. Footer link updated from `/help/cancellation` to `/cancellation`.

## Architecture

```
apps/web/
  app/(site)/[locale]/(frontend)/cancellation/page.tsx  -- route + composition
  components/cancellation/
    cancellation-hero.tsx        -- hero with breadcrumb + gradient
    cancellation-tiers.tsx       -- 3-column refund cards
    cancellation-stepper.tsx     -- 3-step horizontal/vertical process
    cancellation-prose.tsx       -- 4 policy blocks with gold border
    cancellation-trust-banner.tsx -- trust items on primary bg
    cancellation-cta.tsx         -- contact CTA section
    index.ts                     -- barrel export
  messages/{en,sv,de}.json       -- +cancellation namespace
  components/layout/footer.tsx   -- link href update
```

## Data Flow

1. `page.tsx` receives `params.locale`, calls `getTranslations('cancellation')`
2. Passes translated strings as props to each section component
3. Each section is a server component (no interactivity needed)
4. `generateMetadata` produces SEO title/description
5. `WebPageSchema` adds structured data

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Page Route & i18n | Pending | [phase-01](./phase-01-page-route-and-i18n.md) |
| 2 | Page Sections/Components | Pending | [phase-02](./phase-02-page-sections-components.md) |

## Dependencies

- Phase 2 blocked by Phase 1 (needs route + translations)
- Existing: `Breadcrumb` component at `components/shared/breadcrumb.tsx`
- Existing: `Header`, `Footer`, `WebPageSchema`, `generatePageMetadata`
- Lucide icons already installed

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| i18n key conflicts | Low | Medium | Use dedicated `cancellation` namespace |
| 200 LOC limit exceeded | Medium | Low | 6 separate component files + barrel |
| Footer link breaks existing bookmarks | Low | Low | No existing `/help/cancellation` route exists |

## Rollback

Single feature branch. Revert = delete route dir + remove i18n keys + restore footer href.

## Success Criteria

- [ ] Page renders at `/{locale}/cancellation` for all 3 locales
- [ ] All text from i18n, zero hardcoded strings
- [ ] Desktop: matches design spec layout (gradient hero, 3-col tiers, horizontal stepper)
- [ ] Mobile: stacked layout, vertical stepper
- [ ] Footer link points to `/cancellation`
- [ ] Lighthouse accessibility score >= 95
- [ ] All existing tests pass

## Validation Summary

**Validated:** 2026-04-12
**Questions asked:** 3

### Confirmed Decisions
- **Route path**: `/cancellation` — matches `/privacy`, `/terms` pattern. Update footer link from `/help/cancellation`.
- **Decorative motifs**: Include gold circles in hero (desktop only) — match design exactly.
- **i18n strategy**: AI-generate Swedish & German translations during implementation. Mark for human review.

### Action Items
- No plan changes required — all recommendations confirmed as-is.
