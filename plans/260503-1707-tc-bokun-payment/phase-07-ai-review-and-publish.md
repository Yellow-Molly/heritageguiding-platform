# Phase 07 — AI Self-Review + Publish

## Context Links
- All previous phases
- Brainstorm AI-review checklist: `plans/reports/brainstorm-260503-1707-tc-bokun-payment.md` (3-pass)
- Design verification: `plans/reports/verification-260503-1752-tc-design.md`

## Overview
- **Priority:** P1
- **Status:** pending (depends on phases 02–06)
- **Effort:** 1-2h
- **Description:** Run final 3-pass AI review across en/sv/de + browser visual verify + a11y check + print check + bump LEGAL_DATES + commit + submit URLs to Bokun and PSP onboarding.

## 3-Pass Final Review

### Pass 1 — Mandatory clauses (per locale, all 3)
For each locale (en/sv/de):
- [ ] All 12 placeholder tokens replaced with real values
- [ ] Bokun named as Booking Platform
- [ ] Adyen / Bokun Pay named as Payment Processor
- [ ] Distansavtals citation correct: *2 kap. 11 § p. 12 distansavtalslagen (2005:59)*
- [ ] ARN reference (www.arn.se)
- [ ] EU ODR link `https://ec.europa.eu/consumers/odr/`
- [ ] Governing law = Swedish law
- [ ] Liability cap (capped at price paid)
- [ ] Per-tour cancellation reference, no fixed tiers
- [ ] Refund mechanics 5-10 bd via Adyen
- [ ] Language-prevails clause: SV prevails

### Pass 2 — Cross-locale consistency
- [ ] Same 19 section keys, exact same camelCase, exact same order in en/sv/de
- [ ] Same legal effect across languages (no clause stronger or weaker in one locale)
- [ ] Numbers, dates, URLs identical across locales
- [ ] Placeholder tokens (like `{{LAST_UPDATED}}`) eliminated everywhere — no leftover literals
- [ ] "Swedish prevails" clause present in all three locales

### Pass 3 — Operational consistency
- [ ] T&C cancellation language compatible with all current Bokun product configs (manual sanity check against Bokun supplier portal)
- [ ] T&C does not promise refund timing shorter than 5-10 bd
- [ ] Privacy page sub-processor list matches T&C §15 wording
- [ ] No mention of Swish, bank transfer, direct cards (legacy, removed)
- [ ] No leftover designer placeholder copy ("14 business days" specifically — verify it's gone)

## Browser Verification

### Build & dev server
```
npm run build
npm run dev
```

### Manual checks (each locale)
For `/en/terms`, `/sv/terms`, `/de/terms`:
- [ ] Page loads without console errors
- [ ] No missing-translation warnings
- [ ] Hero renders with gold underline + correct "Last updated" date
- [ ] ToC sidebar sticky on desktop scroll
- [ ] ToC accordion on mobile (resize to 390px)
- [ ] ToC scrollspy highlights active section on scroll
- [ ] Anchor clicks smooth-scroll to section
- [ ] Specialized components render: CompanyInfoCard (§01), CrossLinkCard (§07), LegalCallout (§08), checklist (§11), CrossLinkCard (§15), ARN/ODR cards (§16)
- [ ] Help band renders below body
- [ ] Header + Footer unchanged

### Print check
- [ ] `Ctrl+P` (or `Cmd+P`) — preview print
- [ ] Single column, no color blocks, hero replaced with simple bordered title
- [ ] Section numbering "§ XX" visible
- [ ] Header/Footer of print page show "PRIVATE TOURS · TERMS & CONDITIONS" + "Last updated"
- [ ] Page numbers visible

### A11y check
- [ ] Run Lighthouse a11y audit on `/en/terms` — score ≥95
- [ ] Tab through page: focus rings visible, ToC keyboard-navigable
- [ ] Screen reader spot-check: section headings announced with numbers
- [ ] Color contrast: body 12.6:1 (AAA), hero 10.4:1 (AAA), gold-on-bg 5.4:1 (AA) — verified via design

## LEGAL_DATES Bump

Update `apps/web/lib/legal-dates.ts`:
```ts
export const LEGAL_DATES = {
  terms: '2026-05-XX',     // <-- today's publish date
  privacy: '2026-05-XX',   // <-- today's publish date
}
```

## Commit & Deploy

```
git add apps/web/messages/{en,sv,de}.json
git add apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx
git add apps/web/components/terms/
git add apps/web/components/shared/inline-cross-link-card.tsx
git add apps/web/app/globals.css
git add apps/web/lib/legal-dates.ts
git commit -m "feat(legal): T&C overhaul for Bokun + Adyen compliance"
git push
```

After Vercel deploy succeeds, verify production URLs:
- https://privatetours.se/en/terms
- https://privatetours.se/sv/terms
- https://privatetours.se/de/terms

## Submit to Bokun + PSP

1. Email Bokun supplier-onboarding contact with the three URLs
2. Email Bokun Pay / Adyen onboarding contact with the three URLs (typically same Bokun contact)
3. Wait for compliance review feedback
4. Iterate if rejected (likely 1 round of minor edits)

## Todo List

- [ ] Run Pass 1 review (per locale ×3)
- [ ] Run Pass 2 review (cross-locale)
- [ ] Run Pass 3 review (operational)
- [ ] `npm run build` — zero errors
- [ ] `npm run dev` — visual check all three locales
- [ ] Print preview check (each locale)
- [ ] Lighthouse a11y audit (≥95)
- [ ] Bump LEGAL_DATES to publish date
- [ ] Commit + push
- [ ] Verify Vercel deploy
- [ ] Submit URLs to Bokun
- [ ] Submit URLs to PSP onboarding
- [ ] Mark plan completed in plan.md frontmatter
- [ ] Update `plans/260430-1520-bokun-go-live/` commercial-onboarding phase: T&C URL ✓

## Success Criteria

- All 3 review passes 100% complete per locale
- Build succeeds, no console errors
- Production URLs return 200 in all locales
- Lighthouse a11y ≥95
- Print preview renders correctly
- LEGAL_DATES bumped to publish date
- Bokun supplier-compliance review accepts T&C (first or second submission)
- PSP onboarding accepts T&C without rework

## Risks

- Bokun rejects on first submission → iterate based on specific feedback; common rejection reasons: missing supplier identity, vague payment terms, ambiguous refund timing
- A11y score <95 → fix specific issues (focus rings, color contrast, missing labels) before submission
- Print preview broken → likely missing `@media print` rule; add minimal print stylesheet to globals.css
- Sub-processor list incomplete → cross-check with privacy page audit; add any missing party

## Plan Closure

After Bokun acceptance:
1. Update `plan.md` frontmatter: `status: completed`
2. Update `plans/260430-1520-bokun-go-live/plan.md` commercial-onboarding section: mark T&C ✓
3. Run `/ck:journal` for technical journal entry
4. Run `/ck:plan archive` to archive this plan
