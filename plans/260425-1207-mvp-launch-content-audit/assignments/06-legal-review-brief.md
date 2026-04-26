# Brief 06 — Legal Review (Legal Counsel)

**Recipient:** External counsel (Swedish business law + GDPR)
**Deadline:** TBD by project lead (BLOCKS phase-01 dates and phase-07 launch gate)
**Format:** Markup on exported i18n copy + sign-off doc per page
**Submit to:** Project lead

---

## Context

We are launching a Stockholm heritage tours business under Swedish law. Legal pages (Terms, Privacy, Cancellation) are translated SV/EN/DE in i18n bundles. We need counsel review on enforceability, GDPR compliance, and cancellation policy alignment with Bokun product T&Cs.

> Source-of-truth locale: **SV** (Swedish company under Swedish law). EN/DE follow.

---

## Deliverables

1. Markup on exported legal copy (3 documents × 3 locales = 9 files)
2. GDPR Art. 13 compliance checklist
3. Cancellation policy cross-checked against Bokun product T&Cs
4. Sign-off doc per page (`legal-signoff.md` w/ counsel signature + date per page)

## Documents under review

| Page | i18n namespace | Sections | Notes |
|------|----------------|----------|-------|
| Terms of Service | `terms.*` | 7 (intro, booking, payment, cancellation, liability, conduct, IP, governing law, contact) | Enforceability under Swedish law |
| Privacy Policy | `privacy.*` | 8 (GDPR + intro, data collected, data use, sharing, cookies, rights, retention, security, contact) | GDPR Art. 13 |
| Cancellation Policy | `cancellation.*` | 3-tier refund + stepper | Match Bokun product T&Cs |

## Specs / disclosures required (Privacy)

- Controller name + registered address
- Lawful basis per data category (consent / contract / legitimate interest)
- Retention periods per category
- Third-country transfers (Bokun, Vercel, hosting) — list every processor
- DPA signed with each processor (confirm)
- Data subject rights procedure (access, erasure, portability, objection)
- DPO contact (if required — confirm staff count + special-cat data)
- Cookie consent / CMP (consent management platform) confirmed before tracking fires

## Cancellation policy cross-check

- Compare 3-tier refund logic to Bokun product T&Cs per tour
- Konsumentverket consumer-rights baseline (Swedish consumer law)
- Note variant matrix if cancellation rules differ per Bokun product

## Acceptance criteria

- [ ] All 3 documents reviewed in SV (source)
- [ ] EN + DE checked for parity by certified translator after SV edits
- [ ] GDPR Art. 13 checklist complete
- [ ] Bokun T&C cross-check report attached
- [ ] Effective date set per page (real review date, not 2026-01-01 placeholder)
- [ ] Sign-off doc signed per page
- [ ] DPO requirement decision documented
- [ ] Counsel confirmation: no privileged info shared outside scope

## How to submit

1. Project lead exports legal copy from i18n (script: `scripts/export-legal-copy.ts` — to be created)
2. Counsel marks up; returns with effective date
3. Project lead applies edits to SV first, then certified translator updates EN/DE
4. Sign-off doc updated, phase-01 and phase-07 notified

## Questions / contact

- Business model context → project lead
- Data flow diagrams → engineering lead
- Bokun product T&C URL → operations lead
