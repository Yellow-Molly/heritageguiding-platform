# Phase 01 — Data Gathering (BLOCKING)

## Context Links
- Brainstorm: `plans/reports/brainstorm-260503-1707-tc-bokun-payment.md`
- Design verification: `plans/reports/verification-260503-1752-tc-design.md`

## Overview
- **Priority:** P1 (blocks all subsequent phases)
- **Status:** pending
- **Effort:** 1-2h (mostly user-side info collection)
- **Description:** Collect legal entity data, sub-processor inventory, design clarifications. Cannot draft content without these.

## Required Inputs

### Legal entity (mandatory for §01 — Parties)
- Legal name of operator: ____
- Org.nr (organisationsnummer): ____
- VAT no. (momsregistreringsnummer): ____
- F-skatt status (godkänd för F-skatt): yes / no
- Registered address: ____
- General contact email: confirm `info@privatetours.se` from existing CONTACT_EMAIL constant
- Complaint contact email: same as general, or dedicated `complaints@`?
- Phone (optional): ____

### Liability insurance (§13)
- Carrier: ____
- Policy reference: ____
- If none, omit insurance reference; rely on liability cap only.

### Governing law (§17)
- Competent court: e.g. Stockholms tingsrätt (default if registered seat = Stockholm)

### Sub-processors (privacy patch + §15)
Audit current data flows. Confirm presence of:
- [x] Bokun (Tripadvisor LLC) — booking platform
- [x] Adyen N.V. — payment acquirer
- [x] Google LLC — Maps
- [ ] Vercel Inc. — hosting (confirm)
- [ ] Analytics provider (Plausible / GA / none?)
- [ ] Email/CRM provider (transactional email)
- [ ] Review platform (TripAdvisor / Google Reviews / none?)
- [ ] Any others?

### Currencies (§5)
- SEK confirmed primary
- Additional currencies enabled in Bokun: ____ (e.g. EUR, USD, or "none")

### Last-updated date
- Use day of publish: YYYY-MM-DD (set during Phase 07)

## Design Clarifications — RESOLVED 2026-05-03

### Q1 — Repeat-pattern sections ✅
**Decision: YES, repeat patterns.** Sections 02–06, 09–10, 12–15, 17–19 reuse the §01/§07/§08/§11/§16 patterns. No per-section bespoke layouts.

### Q2 — Tablet ToC breakpoint ✅
**Decision: 1024px (lg).** Sidebar → horizontal grid transitions at lg breakpoint. md→sm collapses to accordion. Tailwind classes: `lg:grid-cols-[260px_1fr]` for desktop sidebar; `md:grid-cols-2` for tablet ToC; `<md`: accordion.

### Q3 — Tint token promotion ✅
**Decision: YES.** Add to `apps/web/app/globals.css :root`:
- `--color-secondary-tint: #C4A05219`
- `--color-text-on-primary: #FFFFFF`
- `--color-text-on-primary-muted: #FFFFFFCC`

Also expose via `@theme inline` for Tailwind utility access (e.g. `bg-[var(--color-secondary-tint)]`).

## Output Artifact

Create `plans/260503-1707-tc-bokun-payment/data.md` capturing all confirmed values. Subsequent phases reference this file for placeholder fills.

## Todo List

- [ ] Collect legal entity data (org.nr, VAT, address, F-skatt)
- [ ] Confirm contact emails (general + complaints)
- [ ] Confirm liability insurance carrier or "none"
- [ ] Confirm competent court
- [ ] Audit sub-processor list (verify Vercel, analytics, email, reviews)
- [ ] Confirm currencies enabled in Bokun
- [ ] Resolve Q1/Q2/Q3 design clarifications
- [ ] Write `data.md` artifact
- [ ] Mark phase complete

## Success Criteria

- `data.md` populated with all 12 placeholder tokens from legal-content prompt
- Sub-processor list final
- All three design clarifications resolved
- No remaining unknowns blocking Phase 02–07

## Next Phase

Phase 02 (component scaffolding) can start in parallel with content drafting once Phase 01 closes.
