# Brief 07 — Marketing Claims (Marketing Lead)

**Recipient:** Marketing lead
**Deadline:** TBD by project lead
**Format:** Filled-in claim audit table + rewrites
**Submit to:** Project lead

---

## Context

Homepage `trust-signals.tsx` and other marketing surfaces use unverifiable numeric claims ("15+ years", "98% happy travelers", "100% trusted", "2,000+ travelers"). False or unverifiable claims violate Marknadsföringslagen (Swedish Marketing Act) and may trigger Konsumentverket complaints. Plus Google penalizes fake schema.org structured data.

> **Decided:** Trust signals will be rewritten as honest, defensible copy (validation 2026-04-25, decision #7). Schema.org `aggregateRating` is removed entirely (decision #5).

---

## Deliverables

1. Audit each claim — verify or rewrite
2. New trust-signals copy in SV/EN/DE
3. Verifiable source per claim (or removal)

## Claim audit table

| Claim today | Verifiable? | Source | Rewrite (if not verifiable) |
|-------------|-------------|--------|------------------------------|
| "15+ years" | TBD | Founding year proof? | If <15: "Stockholm guides since {YYYY}" |
| "98% happy travelers" | TBD | Customer survey data? | "Multilingual licensed guides" |
| "100% trusted" | NO (meaningless) | n/a | Replace with certification (e.g., "Auktoriserad Stockholmsguide") OR remove |
| "2,000+ travelers" | TBD | Booking count? | If <2000: drop or rephrase as range |

> Marketing lead fills "Source" column. Where source is missing, rewrite is mandatory.

## Specs

- All copy in **SV (source) + EN + DE**
- New copy must be:
  - Defensible (data exists or claim is qualitative not quantitative)
  - Konsumentverket-compliant
  - Aligned with brand voice (heritage, expert, warm)
- Char limits: trust-signal headline ≤40 chars, supporting line ≤80 chars

## Acceptance criteria

- [ ] Every existing claim either verified (with source) or rewritten
- [ ] Rewrites approved in SV (source) + translated to EN/DE
- [ ] Marketing lead signs off on final copy
- [ ] Source comments included in handoff doc — frontend devs add as code comments
- [ ] Schema.org `aggregateRating` confirmed REMOVED in phase-01 PR (no fake data)

## How to submit

- Filled audit table + final copy in shared doc
- Coordinate with phase-01 PR (frontend dev applies copy)

## Questions / contact

- Konsumentverket compliance questions → legal counsel (brief 06)
- Schema.org technical questions → frontend dev lead
- Brand voice → marketing lead final call
