# Phase 05 — DE Content Draft

## Context Links
- Legal-content prompt: `plans/reports/prompt-260503-1707-draft-tc-content.md`
- Phase 03 (EN) + Phase 04 (SV) for cross-check
- Data file: `plans/260503-1707-tc-bokun-payment/data.md`
- Existing: `apps/web/messages/de.json`

## Overview
- **Priority:** P1
- **Status:** pending (depends on Phase 01)
- **Effort:** 2h
- **Description:** Draft DE natively. Courtesy translation only — SV legally binding. Standard German for Sweden-resident German-speaking customers + EU/DACH visitors.

## German Style Decisions

- **Address form:** "Sie" (formal) — standard for legal/commercial DE
- **Variant:** Standard German (Bundesdeutsch). Avoid Austrian/Swiss-specific terms.
- **Length budget:** DE typically +30% vs EN. Confirm layout in Phase 06 doesn't overflow on long German compounds.

## Implementation Steps

### 1. Generate native DE draft
- Use the same legal-content prompt
- Specify: "Draft the German (DE) version natively, formal Sie form"
- AI must NOT use Latin legalese ("vorbehaltlich", "bezüglich" only when natural)

### 2. Cross-reference EN/SV structure
- Confirm 19 section keys match exactly
- Confirm clause-by-clause legal effect equivalent (no weaker/stronger wording)

### 3. Fill placeholders from data.md
- German address formatting: street + house number, postal code city
- "Org.nr" remains Swedish — DE customers expect to see Swedish identifiers since the operator is Swedish

### 4. Run 3-pass review

**Pass 1 — Mandatory clauses (DE):**
- [ ] Bokun (Tripadvisor LLC) als Buchungsplattform
- [ ] Bokun Pay / Adyen als Zahlungsabwickler
- [ ] **Hinweis (untranslated citation):** *2 kap. 11 § p. 12 distansavtalslagen (2005:59) — undantag för fritidsaktiviteter på bestämd dag*. Add a parenthetical explanation in German: "(schwedisches Fernabsatzgesetz, Ausnahme für terminierte Freizeitaktivitäten)". Do NOT translate the citation itself — keep Swedish.
- [ ] ARN-Verweis: Allmänna reklamationsnämnden (schwedische Verbraucherbeschwerdestelle), www.arn.se
- [ ] EU-OS-Plattform: `https://ec.europa.eu/consumers/odr/`
- [ ] Anwendbares Recht: schwedisches Recht
- [ ] Haftungsbegrenzung auf Kaufpreis
- [ ] Stornierung pro Tour, keine festen Stufen
- [ ] Rückerstattung 5-10 Bankarbeitstage über Adyen
- [ ] Sprachklausel: schwedische Fassung ist maßgebend

**Pass 3 — Operational consistency:**
- [ ] Keine Erstattungszusage unter 5 Bankarbeitstagen
- [ ] Keine festen Stornierungsstufen
- [ ] Kein Hinweis auf Swish/Banküberweisung/Kartenzahlung direkt

### 5. Replace `terms.*` in `messages/de.json`
### 6. Privacy patch in `messages/de.json`
- Add Bokun + Adyen als Auftragsverarbeiter in `privacy.sections.dataSharing`

### 7. JSON validation + build

## Related Code Files

### Modify
- `apps/web/messages/de.json` — replace `terms.*`, patch `privacy.*`

## Todo List

- [ ] Generate native DE draft (formal Sie)
- [ ] Confirm structural parity with EN
- [ ] Fill placeholders from data.md
- [ ] Run Pass 1 (DE mandatory clauses)
- [ ] Run Pass 3 (operational consistency)
- [ ] Verify long-compound layout fits design (test in Phase 06)
- [ ] Replace `terms.*` in de.json
- [ ] Apply privacy.* sub-processor patch
- [ ] Validate JSON
- [ ] `npm run build`
- [ ] Commit: `feat(terms): draft DE content for Bokun + Adyen compliance`

## Success Criteria

- Native DE in formal Sie
- Distansavtals citation kept in Swedish + German parenthetical
- 19 sections matching EN/SV structure
- ARN + ODR present
- ä/ö/ü/ß encoded correctly in JSON
- JSON valid; build succeeds

## Risks

- AI translates Swedish citation into German → corrupts legal precision. Pass 1 catches this.
- Long German compounds break ToC item width → Phase 06 visual check catches this; CSS `text-wrap: pretty` or `hyphens: auto` may be needed
- Eszett (ß) encoding issues → confirm UTF-8

## Next Phase

Phase 06 (page composition) — depends on at least one of 03/04/05 being complete to wire content keys.
