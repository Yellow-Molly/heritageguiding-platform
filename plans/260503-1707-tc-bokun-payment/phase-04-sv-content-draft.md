# Phase 04 — SV Content Draft (LEGALLY BINDING)

## Context Links
- Legal-content prompt: `plans/reports/prompt-260503-1707-draft-tc-content.md`
- Phase 03 (EN reference for cross-locale consistency check): `phase-03-en-content-draft.md`
- Data file: `plans/260503-1707-tc-bokun-payment/data.md`
- Existing: `apps/web/messages/sv.json`

## Overview
- **Priority:** P1
- **Status:** pending (depends on Phase 01; recommended after Phase 03 for cross-check anchor)
- **Effort:** 2-3h
- **Description:** Draft SV natively (NOT translation from EN). SV is the legally binding version per the language-prevails clause. Extra rigor on Swedish-law citations and Swedish consumer-law terminology.

## Why Native, Not Translation

Swedish consumer law uses precise statutory language that loses legal force in literal translation. Example: "right of withdrawal" must render as "ångerrätt" (statutory term), not "uppsägningsrätt" (informal). Native drafting catches these.

## Implementation Steps

### 1. Generate native SV draft via external AI
- Use the same legal-content prompt
- Specify: "Draft the Swedish (SV) version natively, not translated"
- AI must use Swedish statutory terminology where legally precise terms exist

### 2. Statutory terminology check (SV-specific)
Verify the draft uses correct Swedish legal terms:
- [ ] "Distansavtalslagen (2005:59)" — full statute name spelled out at first use
- [ ] "Allmänna reklamationsnämnden (ARN)" — full name + acronym
- [ ] "Konsumentköplagen" / "Konsumenttjänstlagen" — if referenced
- [ ] "Force majeure" → "Force majeure" or "Befriande omständigheter" (industry-standard)
- [ ] "Personuppgiftsansvarig" if data controller mentioned
- [ ] "Mervärdesskatt (moms)" for VAT
- [ ] "Organisationsnummer" + "Momsregistreringsnummer" + "Godkänd för F-skatt" — exact Swedish business identifiers

### 3. Fill placeholders from data.md
Same token list as Phase 03. Note Swedish address formatting differs (street comma postal code city — no comma in some styles).

### 4. Run 3-pass review (per legal-content prompt)

**Pass 1 — Mandatory clauses (SV-specific):**
- [ ] Bokun (Tripadvisor LLC) som bokningsplattform
- [ ] Bokun Pay / Adyen som betalningsförmedlare
- [ ] **Korrekt citat:** *2 kap. 11 § p. 12 distansavtalslagen (2005:59) — undantag för fritidsaktiviteter på bestämd dag*
- [ ] ARN-hänvisning: www.arn.se
- [ ] EU ODR-länk: `https://ec.europa.eu/consumers/odr/`
- [ ] Tillämplig lag: svensk lag
- [ ] Ansvarsbegränsning till köpesumman
- [ ] Avbokningsregler per bokning, ingen fast trappa
- [ ] Återbetalning 5-10 bankdagar via Adyen
- [ ] Språkklausul: svensk text äger företräde

**Pass 2 — Structural parity with EN/DE** (final pass in Phase 07):
- [ ] 19 sections, exact same camelCase keys as EN
- [ ] No clause stronger or weaker than EN counterpart

**Pass 3 — Operational consistency:**
- [ ] Inga löften om återbetalning under 5 bankdagar
- [ ] Inga fasta avbokningstrappor
- [ ] Ingen omnämning av Swish/banköverföring/kortdirekt

### 5. Replace `terms.*` in `messages/sv.json`
- Replace entire `terms` namespace
- Preserve other namespaces

### 6. Privacy patch in `messages/sv.json`
- Add Bokun + Adyen as personuppgiftsbiträden in `privacy.sections.dataSharing`

### 7. JSON validation + build

## Related Code Files

### Modify
- `apps/web/messages/sv.json` — replace `terms.*`, patch `privacy.*`

## Todo List

- [ ] Generate native SV draft (not translation)
- [ ] Statutory terminology audit (12 terms)
- [ ] Fill placeholders from data.md
- [ ] Run Pass 1 (SV mandatory clauses)
- [ ] Run Pass 3 (operational consistency)
- [ ] Replace `terms.*` in sv.json
- [ ] Apply privacy.* sub-processor patch
- [ ] Validate JSON
- [ ] `npm run build`
- [ ] Commit: `feat(terms): draft SV content (legally binding) for Bokun + Adyen compliance`

## Success Criteria

- Native SV (not literal EN translation)
- Distansavtals citation correct including section/paragraph/punkt
- ARN + ODR present
- 19 sections matching EN structure
- All Swedish statutory terms used correctly
- JSON valid; build succeeds

## Risks

- AI translates literally, missing statutory precision → mitigated by terminology audit step
- AI uses formal/informal mismatch (Ni vs du) → SV legal text uses "Ni" historically but modern Swedish T&C uses "du"; pick one and use consistently
- ä/ö/å encoding issues in JSON → confirm UTF-8, validate
- "F-skatt" omitted → must be present in §01 if status is "godkänd"

## Next Phase

Phase 05 (DE draft) — can run in parallel.
