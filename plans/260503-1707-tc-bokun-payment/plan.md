---
plan: tc-bokun-payment
title: "T&C Overhaul for Bokun + Bokun Pay/Adyen Compliance"
description: "Rewrite /terms page (en/sv/de) per design spec; add Bokun + Adyen as privacy sub-processors; build 6 new components from spec sheet."
status: implementation-complete
priority: P1
effort: 12-16h
branch: master
created: 2026-05-03
tags: [legal, frontend, i18n, bokun, payment, compliance, design-handoff]
blockedBy: []
blocks: []
related:
  - plans/260503-1707-tc-bokun-payment/  # self
  - plans/260430-1520-bokun-go-live/  # T&C is a substep of commercial onboarding
  - plans/260419-1332-per-tour-cancellation-policy/  # §07 cross-links to /cancellation
  - plans/260412-2254-cancellation-policy-page/  # /cancellation page already shipped
context:
  brainstorm: plans/reports/brainstorm-260503-1707-tc-bokun-payment.md
  legalContentPrompt: plans/reports/prompt-260503-1707-draft-tc-content.md
  designPrompt: plans/reports/prompt-260503-1716-design-tc-page.md
  designVerification: plans/reports/verification-260503-1752-tc-design.md
  designFile: pencils/terms-and-conditions.pen
---

# T&C Overhaul for Bokun + Bokun Pay/Adyen Compliance

## Summary

Replace generic placeholder content on `/[locale]/terms` with Bokun-supplier + Adyen-PSP + Swedish-consumer-law compliant T&C. Build 6 new components per design spec. Add Bokun + Adyen as sub-processors in `/privacy`. Keep existing global Header/Footer untouched. No CMS migration — content lives in i18n JSON.

## Scope Boundaries

**In:** Content rewrite (en/sv/de) for `terms.*` and `privacy.*` namespaces; new T&C components per design spec; page composition restructure; legal-dates bump; AI self-review.

**Out:** Header/Footer redesign (untouched); CMS migration; new routes; payment gateway code; Bokun product cancellation-tier configuration (separate plan).

## Architecture

```
apps/web/
├── app/(site)/[locale]/(frontend)/terms/page.tsx   -- restructure: hero + ToC + 19 sections + help band
├── components/terms/                               -- NEW component palette
│   ├── legal-callout.tsx                          -- gold-tint bg + 4px gold left border
│   ├── company-info-card.tsx                      -- org.nr / VAT / address grid
│   ├── toc-sidebar.tsx                            -- client, scrollspy
│   ├── toc-item.tsx
│   ├── help-band.tsx                              -- "Need help?" CTA section
│   └── index.ts                                   -- barrel
├── components/shared/inline-cross-link-card.tsx    -- NEW shared (used in §07, §15)
├── messages/en.json                                -- rewrite terms.*, patch privacy.*
├── messages/sv.json                                -- legally binding version
├── messages/de.json                                -- DE content
├── lib/legal-dates.ts                              -- bump terms + privacy dates
└── app/globals.css                                 -- add 3 new tokens (color-secondary-tint, color-text-on-primary, color-text-on-primary-muted)
```

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 01 | [Data gathering](./phase-01-data-gathering.md) — collect legal entity data + design clarifications (BLOCKING) | 1-2h | complete (partial — see Action Items) |
| 02 | [Component scaffolding](./phase-02-component-scaffolding.md) — build 6 components from design spec sheet | 3-4h | complete |
| 03 | [EN content draft](./phase-03-en-content-draft.md) — draft natively + 3-pass review | 2-3h | complete |
| 04 | [SV content draft (legally binding)](./phase-04-sv-content-draft.md) — native draft + extra Swedish-law rigor | 2-3h | complete |
| 05 | [DE content draft](./phase-05-de-content-draft.md) — native draft + 3-pass review | 2h | complete |
| 06 | [Page composition](./phase-06-page-composition.md) — restructure terms/page.tsx using new components | 2-3h | complete |
| 07 | [AI self-review + publish](./phase-07-ai-review-and-publish.md) — final 3-pass + browser verify + Bokun submit | 1-2h | code complete; user-side: browser/a11y/print check + commit + Bokun submit |

## Key Dependencies

- **Phase 01 blocks all subsequent phases** — cannot draft content without legal entity data.
- **Phases 03/04/05 can run sequentially or parallel** — but EN first is recommended as anchor for cross-locale review.
- **Phase 06 depends on 02** (needs components) and **at least one of 03/04/05** (needs content keys to wire).
- **Phase 07 depends on all** — final review pass.

## Success Criteria

- All 19 T&C sections render correctly in en/sv/de with structurally identical layout
- Distansavtals exclusion citation correct: *2 kap. 11 § p. 12 distansavtalslagen (2005:59)*
- ARN reference + EU ODR link present in all locales
- Privacy page lists Bokun + Adyen as sub-processors
- WCAG 2.1 AA contrast verified (browser DevTools or axe scan)
- Print preview renders correctly (Chrome Ctrl+P)
- Bokun supplier-compliance review passes T&C audit
- All three locale URLs return 200; "Last updated" date matches publish date

## Risk Register

| Risk | Mitigation | Phase |
|------|------------|-------|
| AI-drafted legal text contains subtle error | Three-pass structured self-review per locale | 03–05, 07 |
| Cancellation language conflicts with per-tour Bokun config | Defer to "as displayed at checkout"; no hard-coded tiers | 03–05 |
| SV legal nuance differs from EN | Native drafting per locale, SV-prevails clause | 04 |
| ToC scrollspy breaks SSR | Client component with `'use client'` directive, hydration-safe | 02, 06 |
| Sub-processor list incomplete in privacy patch | Audit data flows in Phase 01 (Bokun, Adyen, Google Maps, Vercel, others) | 01 |
| Designer's placeholder copy "14 business days" leaks into prod | Phase 03 drafts override placeholder; reviewers flag any number not in spec | 03–07 |
| Future legal updates require redeploy | Acceptable given current update cadence; revisit if monthly+ | n/a |

## Action Items — Operator Follow-Up (NON-BLOCKING)

Phase 01 closed (2026-05-03) with partial data. Per operator direction, remaining items are **temporary blanks** — Phases 02–07 proceed with safe defaults / TODO markers; operator updates content via a small follow-up commit after publish. Final published copy must include items 1–2 for full Swedish consumer-commerce compliance, but does not block initial publish + Bokun submission.

Drafting strategy per item:

| # | Item | Draft strategy in JSON | Update mechanism |
|---|------|------------------------|------------------|
| 1 | **VAT no.** | Insert literal `<VAT-TBD>` in §01 body; document expected `SE559577508001` | Operator confirms, single-line JSON edit |
| 2 | **F-skatt status** | Omit clause entirely from §01 in v1 | Operator adds clause when confirmed |
| 3 | **Liability insurance** | Omit insurance reference; rely on liability-cap clause only | Add reference if/when operator provides carrier |
| 4 | **Phone** | Omit phone from §01 contact block | Add line if operator provides |
| 5 | **Complaint email** | Default to `info@privatetours.se` (shared) | Update if dedicated `complaints@` created |
| 6 | **Analytics** | Default "none" in privacy patch | Add provider if introduced |
| 7 | **Review platform** | Default "none" in privacy patch | Add platform if introduced |

**Confirmed (no action needed):**
- Legal name: Yellow Molly Aktiebolag
- Org.nr: 559577-5080
- Address: Karlavägen 18, 114 31 Stockholm
- Currency: SEK only
- Court: Stockholms tingsrätt
- Contact email: info@privatetours.se
- Sub-processors: Bokun, Adyen, Google Maps, Vercel, Supabase, Resend

---

## Notes for Implementation

- Existing patterns to mirror: `/privacy` hero shell, `/cancellation` gold-border prose, footer link wiring already in place
- Header/Footer: **DO NOT MODIFY** — global components stay as-is per user direction
- Design source of truth: `pencils/terms-and-conditions.pen` (verified 2026-05-03)
- Legal copy source of truth: external AI output via `prompt-260503-1707-draft-tc-content.md`, reviewed by 3-pass checklist

---

## Validation Log

### Session 1 — 2026-05-03
**Trigger:** User asked if plan was validated before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 02 plans 6 NEW components. Existing /cancellation page has 6 page-scoped components that are NOT generic. How should we handle component reuse?
   - Options: Build T&C-specific (Recommended) | Extract generic versions | Skip new components, restyle existing
   - **Answer:** Build T&C-specific
   - **Rationale:** Mirrors cancellation/* pattern; avoids premature generalization (YAGNI). `inline-cross-link-card` placed in `shared/` since used by multiple pages.

2. **[Risks]** Current `terms.*` has 9 sections; new structure has 19 different keys. next-intl errors on missing keys at runtime. Migration approach?
   - Options: Atomic replace + verify (Recommended) | Add new keys, keep old | Rename keys to match old
   - **Answer:** Atomic replace + verify
   - **Rationale:** Pre-validation grep confirmed no other code references `terms.sections.*` keys. Atomic replace is safe and clean. Build catches any missed reference.

3. **[Risks]** Phase 07 verifies print preview but no phase ADDS print CSS. Design ships an A4 print mockup. Where to add print styles?
   - Options: Add to Phase 02 (Recommended) | Skip print mode for MVP | Add to Phase 06
   - **Answer:** Add to Phase 02
   - **Rationale:** Print CSS is part of design system, not page logic. Belongs alongside the design tokens added to globals.css in Phase 02. Matches design A4 mockup expectations.

4. **[Architecture]** ToC scrollspy: page.tsx is server, TocSidebar must be 'use client'. How to pass the 19 entries across the RSC boundary?
   - Options: Server builds prop array (Recommended) | Client reads i18n directly | Hardcode titles client-side
   - **Answer:** Server builds prop array
   - **Rationale:** Standard RSC pattern. Avoids double-loading i18n bundle on client. Hydration-safe. Already aligned with Phase 06 plan.

#### Confirmed Decisions
- **Component scope:** T&C-specific components in `components/terms/`, `inline-cross-link-card` in `components/shared/`. No refactor of `cancellation/`.
- **i18n migration:** Atomic replace per locale; grep-confirmed no external refs; build is the safety net.
- **Print CSS:** Phase 02 adds `@media print` block to `globals.css` (~30 LOC) scoped to `.terms-page`.
- **RSC boundary:** `page.tsx` builds tocItems prop server-side; passes to `<TocSidebar>` client component as plain JSON prop.

#### Action Items
- [x] Phase 02: add print CSS step (see updated phase doc)
- [x] Phase 03/04/05: emphasize grep-verify before atomic replace (added marker)
- [x] Phase 06: confirm tocItems prop-array pattern (validated)

#### Impact on Phases
- Phase 02: +1 step (print CSS); +~30 LOC to globals.css
- Phase 03/04/05: marker added; no scope change
- Phase 06: marker added; no scope change

#### Deferred Question (not asked)
- **Bokun supplier T&C template baseline** — leaving as implementer's call. Default: skip template, draft from outline. Revisit only if Bokun rejects v1.
