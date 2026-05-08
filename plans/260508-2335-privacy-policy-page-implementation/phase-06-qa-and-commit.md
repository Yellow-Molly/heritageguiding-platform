# Phase 06 — QA, Lighthouse, Commit

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: All prior phases complete

## Overview
- **Priority:** High
- **Status:** Pending
- **Effort:** ~1-2h
- Manual QA across 3 locales × 3 breakpoints, Lighthouse measurement, legal-dates bump, conventional commit + PR.

## Key Insights
- Manual visual QA catches what automated tests miss (font rendering, German wrapping, color contrast in real conditions).
- Lighthouse must remain ≥90 across all 5 categories (Phase 11 standard).
- Bump `LEGAL_DATES.privacy` LAST — this is the publication marker.
- Commit messages: conventional commit format, no AI references.

## Requirements

### Manual QA Matrix
3 locales × 3 breakpoints = 9 manual checks:

| Viewport | SV | EN | DE |
|---|---|---|---|
| 1440px (desktop) | ✅ | ✅ | ✅ |
| 768px (tablet) | ✅ | ✅ | ✅ |
| 375px (mobile) | ✅ | ✅ | ✅ |

Per check, verify:
- Hero renders correctly (gradient, gold dividers, breadcrumb, chip, h1, subtitle)
- TOC sidebar (desktop) or pill+drawer (mobile) functional
- Processing Register table — desktop table view, mobile stacked cards
- Sub-Processor table — same swap behavior
- Rights accordion — all 8 expand correctly
- Prose sections render with gold underlines under h2
- Complaint callout with both CTAs (mailto + imy.se external)
- Contact CTA with correct email + SLA
- All section anchors scroll correctly with header offset
- No layout shift (CLS) during load
- Brand reads "Private Tours" everywhere; email = `info@privatetours.se`

### Lighthouse Targets
Run on `/en/privacy` (and spot-check SV/DE):
- Performance: ≥90
- Accessibility: ≥95 (target 100)
- Best Practices: ≥95
- SEO: ≥95
- LCP: <2.5s
- CLS: <0.1
- INP: <200ms

### Legal Dates Bump
- Update `apps/web/lib/legal-dates.ts` → `privacy: '<TODAY_ISO>'` (set on commit day)

### Pre-Commit Verification
- `npm run lint` — clean
- `npm run type-check` — clean
- `npm test` — all green
- `npm run build` — clean (no warnings)
- Visual check on `npm run dev` at 3 breakpoints

### Commit Strategy
Single feature commit per branch convention:
```
feat(privacy): GDPR-compliant Privacy Policy page redesign

- Replace minimal prose page with 9-component editorial layout
- Add 14 GDPR Art. 13/14 sections with Processing Register + Sub-Processor tables
- Implement TOC scroll-spy + mobile drawer
- Replace Adyen with Stripe (via Bokun Pay) per actual payment flow
- Add OpenAI, Vercel Blob, Google Workspace as disclosed sub-processors
- Bump LEGAL_DATES.privacy to publication date
- Cover SV/EN/DE locales; ~120 i18n keys per locale
- Add 11 new test files; full suite green
```

Or split into logical commits if helpful:
1. `feat(privacy): scaffold 9 components for Privacy Policy redesign`
2. `feat(privacy): add GDPR Art. 13 i18n content (SV/EN/DE)`
3. `feat(privacy): compose page + add interactive TOC + accordion`
4. `test(privacy): unit + i18n parity + a11y tests`
5. `chore(privacy): bump LEGAL_DATES, finalize for publication`

## Implementation Steps

### 1. Pre-Flight Checks
```bash
npm run lint
npm run type-check
npm test
npm run build
```
All must pass before manual QA.

### 2. Manual Visual QA
Start dev server: `npm run dev`
Open 9 URLs in 3 viewports each:
- http://localhost:3000/sv/privacy
- http://localhost:3000/en/privacy
- http://localhost:3000/de/privacy

Use browser DevTools responsive mode at 1440 / 768 / 375.

Use this checklist per locale × viewport (paste results in PR description):
- [ ] Hero gradient + gold dividers + breadcrumb + h1 visible
- [ ] TOC sidebar (≥1024) or drawer (<1024) functional
- [ ] Processing table renders correctly (table desktop, cards mobile)
- [ ] Sub-processor table renders correctly
- [ ] All 8 Rights accordion items expand/collapse
- [ ] All 14 anchor links scroll smoothly with offset
- [ ] No console errors
- [ ] No "Adyen" / "Heritage Guiding Sweden" / "Resend" anywhere
- [ ] Email = `info@privatetours.se`
- [ ] Brand = "Private Tours"

### 3. Lighthouse
```bash
npm run lighthouse:privacy
# OR manual via Chrome DevTools → Lighthouse panel → run on /en/privacy
```
Save report to `plans/260508-2335-privacy-policy-page-implementation/reports/lighthouse-privacy-en.html`

If any score <90, debug:
- LCP: check hero image (no image used — should be very fast)
- CLS: check fonts (Inter + Playfair use `display: 'swap'` already)
- A11y: re-run axe-core, address violations

### 4. Bump Legal Date
Edit `apps/web/lib/legal-dates.ts`:
```ts
export const LEGAL_DATES = {
  privacy: '2026-MM-DD',  // <- today's date
  terms: '2026-05-04',
  cancellation: '2026-04-25',
} as const
```

### 5. Forbidden-Content Final Sweep
```bash
grep -ri "adyen\|heritage guiding sweden\|resend" apps/web/messages/ apps/web/components/privacy/ apps/web/app/(site)/[locale]/(frontend)/privacy/
```
Must return zero results.

### 6. Commit + PR
- Branch name: `feat/privacy-policy-gdpr-rewrite`
- Conventional commit messages, no AI references
- PR description includes:
  - Summary of changes
  - Manual QA checklist results
  - Lighthouse scores
  - Screenshots of each locale × viewport (or Loom video)
  - Legal review status (note: pre-publication legal counsel review may be required out-of-band)

### 7. Update Project Changelog
Add entry to `docs/project-changelog.md`:
```md
### 2026-MM-DD — Privacy Policy v2.0 (GDPR Rewrite)
- Replaced minimal Privacy Policy with 14-section GDPR Art. 13/14-aligned content
- Added Processing Register + Sub-Processor tables (9 + 7 rows)
- Added Rights accordion (8 GDPR rights with mailto exercise)
- Added IMY complaint route disclosure
- Replaced Adyen with Stripe (via Bokun Pay) per actual payment flow
- Disclosed previously-undisclosed sub-processors: OpenAI, Vercel Blob, Google Workspace
- Editorial Heritage design (Option A from privacy.pen)
- 9 new privacy components, 11 new test files
- Commit: <SHA>
```

## Todo List
- [ ] Pre-flight checks all green (lint, type-check, test, build)
- [ ] Manual QA matrix (9 cells) all pass
- [ ] Lighthouse run; all scores ≥90; A11y ≥95
- [ ] Bump `LEGAL_DATES.privacy` to publication date
- [ ] Forbidden-content grep returns zero
- [ ] Conventional commit(s) created
- [ ] Project changelog updated
- [ ] PR opened with QA checklist + Lighthouse scores in description
- [ ] Plan status flipped to `completed` in plan.md frontmatter

## Success Criteria
- All pre-flight checks green
- 9/9 manual QA cells pass
- Lighthouse ≥90 across all 5 categories on /en/privacy
- Legal-dates bumped
- Zero forbidden content
- PR ready for review (or merged if auto-merge enabled)
- Changelog reflects v2.0 milestone

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Manual QA misses German overflow | Specifically inspect DE at 375px — German is longest locale |
| Lighthouse regression from added DOM size | If A11y regresses, focus on table semantics + ARIA; if Perf, lazy-load below-fold |
| Pre-publication legal review delays merge | Flag in PR description; treat merge as staging-deploy-only until counsel sign-off |
| `LEGAL_DATES.privacy` bumped too early (before merge) | Bump as part of final commit only |

## Security Considerations
- Confirm no Pencil-design placeholder data leaked into code (e.g., `#0F2342` literal hex from design)
- Confirm no `console.log` left in production code
- Confirm no `dangerouslySetInnerHTML` introduced
- Confirm `target="_blank"` external links have `rel="noopener noreferrer"`

## Self-Attestation (Validation-Locked)

Per validation interview (2026-05-08), this plan ships under **self-attestation** — no external counsel review pre-publication. Acceptable risk based on:
- Content derived from public IMY/Verksamt template (audit-defensible foundation)
- Sub-processor list verified against actual codebase
- Processing register maps to real data flows
- Self-attestation does NOT create liability shield; revisit if:
  - IMY contacts the company about data handling
  - Data subject rights request reveals policy/practice mismatch
  - Material change to processing (new sub-processor, new data category)

Document the self-attestation in PR description: "Privacy policy v2.0 ships self-attested. Counsel review deferred per founder decision."

## Next Steps
- Post-merge: monitor for any user reports about TOC / accordion / form submission glitches
- Future: when newsletter activates, add marketing section + consent flow (separate plan)
- Future: revisit DE translation quality if user feedback or DACH-market expansion warrants professional review
