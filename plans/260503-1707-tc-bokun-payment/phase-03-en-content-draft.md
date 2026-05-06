# Phase 03 — EN Content Draft

## Context Links
- Legal-content prompt: `plans/reports/prompt-260503-1707-draft-tc-content.md`
- Brainstorm: `plans/reports/brainstorm-260503-1707-tc-bokun-payment.md`
- Data file: `plans/260503-1707-tc-bokun-payment/data.md` (from Phase 01)
- Existing: `apps/web/messages/en.json` (current `terms.*` namespace to replace)

## Overview
- **Priority:** P1
- **Status:** pending (depends on Phase 01)
- **Effort:** 2-3h
- **Description:** Draft EN T&C natively + run 3-pass review + replace `terms.*` namespace in `messages/en.json` + apply privacy patch.

## Implementation Steps

### 1. Generate raw draft via external AI
- Open the legal-content prompt file
- Replace `{{TOKEN}}` placeholders in mind (do NOT replace in prompt itself; AI receives literal tokens)
- Paste prompt into external AI (ChatGPT / Gemini / Claude)
- Receive EN JSON block

### 2. Fill placeholders from data.md
- Replace each `{{TOKEN}}` with actual values from `plans/260503-1707-tc-bokun-payment/data.md`
- Tokens: `{{LEGAL_ENTITY_NAME}}`, `{{ORG_NR}}`, `{{VAT_NR}}`, `{{F_SKATT_STATUS}}`, `{{REGISTERED_ADDRESS}}`, `{{CONTACT_EMAIL}}`, `{{COMPLAINT_EMAIL}}`, `{{LIABILITY_INSURANCE_REF}}`, `{{COMPETENT_COURT}}`, `{{ADDITIONAL_CURRENCIES}}`, `{{SUB_PROCESSORS}}`
- Leave `{{LAST_UPDATED}}` for Phase 07 (set at publish time)

### 3. Run 3-pass review (per legal-content prompt)
**Pass 1 — Mandatory clauses present:**
- [ ] Bokun named as Booking Platform
- [ ] Adyen / Bokun Pay named as Payment Processor
- [ ] Distansavtals citation: *2 kap. 11 § p. 12 distansavtalslagen (2005:59)*
- [ ] ARN reference (www.arn.se)
- [ ] EU ODR link: `https://ec.europa.eu/consumers/odr/`
- [ ] Governing law = Swedish law
- [ ] Liability cap clause (capped at price paid)
- [ ] Per-tour cancellation reference, no fixed tiers
- [ ] Refund mechanics 5-10 bd via Adyen
- [ ] Language-prevails clause: SV prevails

**Pass 2 — Cross-locale consistency** (run after all 3 locales complete in Phase 07; mark structure now):
- [ ] 19 sections, exact order: parties, definitions, service, booking, pricing, payment, cancellation, withdrawalExclusion, modifications, forceMajeure, participantObligations, minors, liability, ip, privacy, complaints, governingLaw, changes, acceptance

**Pass 3 — Operational consistency:**
- [ ] No promise shorter than 5-10 bd
- [ ] No fixed cancellation tier numbers
- [ ] No mention of Swish, bank transfer, direct cards (Bokun decides methods)

### 4. Replace `terms.*` in `messages/en.json`
- **Pre-step (validation S1):** `grep -r "terms\.sections\." apps/` to confirm no other code references old keys. Currently confirmed clean as of 2026-05-03.
- Open `apps/web/messages/en.json`
- **Atomic replace** — replace entire `terms` namespace with new structure (19 sections + camelCase keys); do NOT keep old keys alongside (avoid drift)
- Preserve other namespaces unchanged

### 5. Privacy patch in `messages/en.json`
- Locate `privacy.sections.dataSharing` (or equivalent existing section)
- Add explicit mention of Bokun (Tripadvisor LLC) and Adyen N.V. as sub-processors
- Bump tone consistent with existing privacy text

### 6. JSON validation
- Run `node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"` to confirm valid JSON
- Run `npm run build` (apps/web) to confirm next-intl picks up new keys without errors

## Related Code Files

### Modify
- `apps/web/messages/en.json` — replace `terms.*`, patch `privacy.*`

## Todo List

- [ ] Generate raw EN draft via external AI
- [ ] Fill all placeholders from data.md
- [ ] Run Pass 1 (mandatory clauses)
- [ ] Run Pass 3 (operational consistency)
- [ ] Replace `terms.*` namespace in en.json
- [ ] Apply privacy.* sub-processor patch
- [ ] Validate JSON syntax
- [ ] `npm run build` — verify next-intl key resolution
- [ ] Commit message: `feat(terms): draft EN content for Bokun + Adyen compliance`

## Success Criteria

- EN `terms.*` namespace has 19 sections in correct order
- Pass 1 + Pass 3 review checklists 100% complete
- Privacy patch lists Bokun + Adyen as sub-processors
- JSON valid; build succeeds
- No `{{TOKEN}}` placeholders remaining (except `{{LAST_UPDATED}}` reserved for Phase 07)
- No fixed cancellation tier numbers; no Swish/bank-transfer mentions

## Risks

- AI hallucinates Swedish-law citations → manually verify all citations against source (distansavtalslagen 2005:59)
- AI uses American English → review for British English alignment with rest of site (or accept American as canonical EN)
- JSON keys mismatch design's section IDs → keep keys identical to prompt's required structure

## Next Phase

Phase 04 (SV draft, legally binding) — recommended next. Phase 05 (DE) can run in parallel with 04 if multiple authors.
