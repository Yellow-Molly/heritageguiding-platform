# Phase 04 — Legal Review

## Context Links
- Research: [researcher-01-frontend-pages-audit.md](research/researcher-01-frontend-pages-audit.md) finding 5 (fake dates)
- Research: [researcher-02-cms-i18n-content-audit.md](research/researcher-02-cms-i18n-content-audit.md) section 1 (legal i18n complete)
- Blocks: phase-01 (real lastUpdated dates), phase-07 (legal sign-off gate)

## Overview
- **Date:** 2026-04-25
- **Description:** External/internal counsel review of Terms (7 sections), Privacy (8 GDPR sections), Cancellation (3-tier) across SV/EN/DE; set effective dates; GDPR compliance gate.
- **Priority:** P1
- **Status:** pending
- **Review status:** not started

## Key Insights
- All legal copy already translated SV/EN/DE in i18n bundles — no rewrite needed unless legal flags issue
- `lastUpdated: 2026-01-01` in privacy/terms is placeholder — must be real review date
- Cancellation 3-tier policy must mirror actual booking T&Cs in Bokun (mismatch = liability)
- GDPR controller name/registered address required in privacy notice (currently generic)

## Requirements

### Functional
- Terms: counsel reviews 7 sections, confirms enforceable under Swedish law
- Privacy: counsel confirms GDPR Art. 13 disclosures, lawful basis per data category, DPO contact (if required), retention periods, third-country transfers (Bokun, Vercel, etc.)
- Cancellation: 3-tier refund policy matches Bokun product T&Cs and Konsumentverket consumer-rights baseline
- All effective dates set to actual review date (e.g., `2026-04-25`)
- Sign-off doc per page (terms, privacy, cancellation) by counsel

### Non-functional
- Review tracked in `plans/260425-1207-mvp-launch-content-audit/legal-signoff.md`
- Each locale reviewed by SV-fluent counsel (or certified translator confirms parity)

## Architecture

```
Counsel review ──► markup on i18n source (EN canonical or SV canonical?)
                          │
                          ▼
                  i18n updates (sv/en/de.json)
                          │
                          ▼
              legal-dates.ts constant updated
                          │
                          ▼
              phase-01 frontend uses dates
                          │
                          ▼
              phase-07 QA verifies render
```

- Source-of-truth locale: SV (Swedish company under Swedish law) — translations follow
- Effective dates centralized in `apps/web/lib/legal-dates.ts` (single update point)

## Related Code Files (read-only)

- `apps/web/messages/sv.json` — `terms.*`, `privacy.*`, `cancellation.*`
- `apps/web/messages/en.json`, `de.json` — same sections
- `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx:48` — lastUpdated
- `apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx:48` — lastUpdated
- `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx` — policy render

### Counsel may request edits to
- `apps/web/messages/{sv,en,de}.json` — text changes
- New i18n keys if disclosures added (e.g., DPO contact, controller name)

## Implementation Steps

1. Export current legal copy per locale to plain markdown (`legal-copy-export-sv.md`, `-en.md`, `-de.md`)
2. Send exports to counsel w/ context: business model (heritage tours), data flows (booking via Bokun, analytics via Vercel, comms via email)
3. Counsel returns markup w/ required edits + effective date
4. Apply edits to i18n source (SV first), translate to EN/DE w/ certified translator
5. Update `apps/web/lib/legal-dates.ts` (or constants) w/ real `lastUpdated`
6. Counsel verifies cancellation policy matches Bokun product T&Cs (cross-check tour-by-tour if policies vary)
7. GDPR checklist: lawful basis documented, retention defined, data subject rights (access/erase/portability) procedure in place
8. Counsel signs off per page
9. Sign-off doc updated; phase-01 + phase-07 notified

## Todo
- [ ] Export current copy (3 locales) for counsel
- [ ] Counsel review: Terms (7 sections)
- [ ] Counsel review: Privacy (8 GDPR sections)
- [ ] Counsel review: Cancellation (3-tier policy)
- [ ] Cross-check cancellation vs Bokun T&Cs
- [ ] Apply markup edits to i18n SV source
- [ ] Translate edits to EN + DE (certified)
- [ ] Update legal-dates.ts with real date
- [ ] GDPR checklist complete
- [ ] Sign-off doc per page
- [ ] Phase-01 + phase-07 notified

## Success Criteria
- `legal-signoff.md` contains counsel signature + date per page
- `lastUpdated` matches review date (not 2026-01-01 placeholder)
- Cancellation policy matches Bokun T&Cs (no consumer can claim divergence)
- GDPR Art. 13 disclosures complete in all 3 locales
- No "TBD", "Coming soon", placeholder names in legal copy

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Counsel turnaround > 2 weeks | High | High | Engage counsel NOW; parallel-track w/ phase-01-03 |
| Translation parity drift after edits | Med | High | Certified translator reviews EN/DE after SV update |
| Bokun T&Cs vary per product | Med | High | List cancellation rules per Bokun product; codify variant matrix |
| GDPR DPO requirement triggered | Low | High | Confirm staff count; appoint DPO if needed (>250 employees or special-cat data) |
| Legal copy rewrite during review | Med | Med | Reserve 3 days post-counsel for translation+i18n update |
| Konsumentverket complaint post-launch | Low | Critical | Counsel confirms consumer-rights compliance; complaint procedure documented |

## Security Considerations
- Privacy notice must list every data processor (Bokun, Vercel, Postgres host, email provider) — incomplete list = GDPR violation
- Retention periods enforced in code (not just documented) — coordinate w/ ContactInquiries cleanup job
- Cookie consent: confirm CMP (consent management platform) in place before tracking scripts load
- Right to erasure: procedure for deleting Bokun bookings + Payload data must be tested
- Data Processor Agreements (DPA) signed with all processors

## Next Steps
- Phase-01 unblocked: real lastUpdated date constant
- Phase-07 gate: counsel sign-off attached to launch checklist
- Post-launch: schedule annual review cycle
- Post-launch: implement data subject request (DSAR) endpoint
