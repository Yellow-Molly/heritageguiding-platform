---
name: Privacy Policy Page Implementation (GDPR + Option A Design)
slug: 260508-2335-privacy-policy-page-implementation
status: completed
created: 2026-05-08
completed: 2026-05-09
branch: master
priority: high
effort: medium
mode: auto
blockedBy: []
blocks: []
relatedPlans:
  - 260503-1707-tc-bokun-payment  # implementation-complete; introduced privacy.* base + secondary-tint token
  - 260425-1207-mvp-launch-content-audit  # owns LEGAL_DATES bump
---

# Privacy Policy Page Implementation — GDPR Rewrite + Option A Design

## Goal
Replace `/privacy` page with GDPR-compliant 14-section content, rendered via Option A "Editorial Heritage" design from `pencils/privacy.pen`. Cover SV/EN/DE locales. Pass IMY audit. Match Lighthouse + WCAG 2.1 AA standards.

## Context Inputs (read in order)
1. `plans/reports/brainstorm-260508-2258-privacy-policy-gdpr-rewrite.md` — content scope (14 sections, Processing Register, Sub-Processor list)
2. `plans/reports/designer-prompt-260508-2258-privacy-policy-page.md` — design spec
3. `pencils/privacy.pen` (frame `fsrNe`) — chosen Option A design via Pencil MCP
4. `docs/design-guidelines.md` + `apps/web/app/globals.css` — design tokens (note: `--color-secondary` is `#856C2D`, `--color-secondary-light` is `#C4A052`; `--color-secondary-tint` exists)

## Locked Decisions
- Approach A (GDPR Art. 13/14 structure) approved via brainstorm
- Option A design (Editorial Heritage) approved
- Sub-processors: Bokun, Stripe (via Bokun Pay — REPLACES "Adyen" in current text), Vercel, Supabase, OpenAI, Google Workspace, WhatsApp
- Brand: "Private Tours" (NOT "Heritage Guiding Sweden" — design content placeholder)
- Privacy contact: `info@privatetours.se` (reuse `CONTACT_EMAIL`)
- Children: under-16 cannot book
- Cookies: essentials-only (no banner)
- Marketing: excluded

### Validation-Locked Decisions (interview 2026-05-08)
- **SV authoring:** Adapt a Swedish GDPR template (e.g., Verksamt.se / IMY-aligned templates) → customize. Reduces Phase 2 effort from 6-8h to ~3-4h. Phase 2 must record source URL of template for audit trail.
- **DE translation:** AI self-translation only (no professional service). Acceptable risk; precision review deferred to post-launch if IMY/user feedback indicates issues. Phase 2 must include AI translation note in metadata.
- **A11y testing:** Install `jest-axe` + `@axe-core/react` as devDependency (Phase 5 step 1). Establishes precedent for future a11y tests.
- **Legal review:** Self-attested. No external counsel gate. Risk accepted; may revisit if IMY contact occurs or breach.

## Phases

| # | Phase | Status | File |
|---|---|---|---|
| 1 | Component Scaffolding | completed | [phase-01-component-scaffolding.md](./phase-01-component-scaffolding.md) |
| 2 | i18n Content (SV → EN → DE) | completed | [phase-02-i18n-content.md](./phase-02-i18n-content.md) |
| 3 | Page Composition | completed | [phase-03-page-composition.md](./phase-03-page-composition.md) |
| 4 | Interactive Behavior (TOC scroll-spy, accordion, mobile drawer) | completed | [phase-04-interactive-behavior.md](./phase-04-interactive-behavior.md) |
| 5 | Tests (unit + i18n parity + a11y + visual) | completed | [phase-05-tests.md](./phase-05-tests.md) |
| 6 | QA, Lighthouse, Commit | completed | [phase-06-qa-and-commit.md](./phase-06-qa-and-commit.md) |

## Key Dependencies
- Phase 1 → Phase 3 (components needed before page composition)
- Phase 2 → Phase 3 (i18n keys needed before page renders content)
- Phase 3 → Phase 4 (page must compose before interactive enhancement)
- Phase 4 → Phase 5 (interactive behavior must work before testing)
- Phase 5 → Phase 6 (tests must pass before commit/QA)

Phases 1 + 2 can run in parallel (no shared files). Everything after is sequential.

## Files Touched (all phases)
- `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx` — restructure (Phase 3)
- `apps/web/components/privacy/*.tsx` — 9 new files (Phase 1)
- `apps/web/components/privacy/index.ts` — barrel (Phase 1)
- `apps/web/messages/{sv,en,de}.json` — `privacy.*` namespace expansion ~30→~120 keys (Phase 2)
- `apps/web/lib/legal-dates.ts` — bump `privacy` date (Phase 6)
- `apps/web/components/privacy/__tests__/*.test.tsx` — 9 new test files (Phase 5)
- `apps/web/__tests__/i18n-parity.test.ts` — extend or add (Phase 5)

## Out of Scope
- Cookie consent banner (essentials-only, no banner needed)
- Marketing/newsletter copy (newsletter dormant)
- Children's verification flow at booking time (separate concern)
- Bokun's downstream sub-processors detail (we link to Bokun's own list)
- Dark mode variant (defer until site-wide dark mode)
- Translation legal review (out-of-band; flagged as pre-publication gate)

## Risks
| Risk | Severity | Mitigation |
|---|---|---|
| Translation drift between SV/EN/DE | High | i18n parity test (Phase 5); review all 3 locales together |
| Adyen→Stripe sub-processor swap missed | High | Phase 2 explicit search-replace + grep verify |
| Designer's placeholder brand "Heritage Guiding Sweden" leaks | High | Phase 2 grep-block in test; never copy-paste from .pen text content |
| Sticky TOC IntersectionObserver SSR-safe | Medium | Use `'use client'` + guard `typeof window` |
| Lighthouse regression from added DOM size | Low | Phase 6 measures Lighthouse delta; budget ≤2pt drop |
| File >200 LOC | Medium | Component split rule already keeps files small; budget enforced via lint |

## Success Criteria
- All 14 GDPR sections render at `/sv/privacy`, `/en/privacy`, `/de/privacy`
- Processing Register table = 9 rows, Sub-Processor table = 7 rows, Rights accordion = 8 items
- Brand renders as "Private Tours" everywhere; email = `info@privatetours.se`
- No "Adyen", no "Heritage Guiding Sweden" anywhere in privacy.* keys
- Page passes axe-core a11y scan (semantic table, accordion ARIA, focus management)
- Mobile (<768px) shows stacked card view for tables
- Lighthouse ≥90 on /privacy (Phase 11 standard)
- All 1009+ existing tests pass; 9 new component tests pass; i18n parity test passes
- TypeScript strict, no new lint errors
- `LEGAL_DATES.privacy` bumped to publication date

## References
- GDPR Art. 13-14: https://gdpr-info.eu/art-13-gdpr/
- IMY: https://www.imy.se
- next-intl: https://next-intl.dev
- Existing pattern: `apps/web/components/cancellation/*` (component composition reference)
