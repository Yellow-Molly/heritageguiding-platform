# Brief 02 — Guide Bios (Guide Onboarding)

**Recipient:** Guide onboarding lead
**Deadline:** TBD by project lead
**Format:** Per-guide Notion doc with locale tabs + portrait photo upload
**Submit to:** Project lead → CMS editor

---

## Context

Two licensed guides launch with the MVP. Each guide profile renders on `/guides` and `/guides/[slug]` and is referenced from tour detail pages. Bios must be in three locales and feature on the new split-layout guide profile (Phase 16).

---

## Deliverables

- **2 guides × 3 locales = 6 bios**
- Per guide: portrait photo (1000×1000 minimum, neutral background, professional)
- Written consent from each guide for use of name + photo (GDPR)

## Specifications per field

| Field | Char limit | Locales | Notes |
|-------|-----------|---------|-------|
| `name` | ≤80 | SV (no translit) | First + last name |
| `bio` | 200–500 | SV/EN/DE | First-person or third-person — be consistent |
| `credentials[]` | array, ≤80 each | SV/EN/DE | E.g., "Auktoriserad Stockholmsguide" |
| `languages[]` | array | shared | Language codes (sv, en, de, fr…) |
| `yearsExperience` | number | shared | Integer ≥ 0 |
| `guideStyle` | ≤150 | SV/EN/DE | Phase 16 — short tag like "Storyteller" |
| `whatGuestsAppreciate` | ≤300 | SV/EN/DE | Phase 16 — what guests highlight in feedback |
| `uniqueAspectsQuote` | ≤500 | SV/EN/DE | Phase 16 — first-person quote |
| `uniqueAspectsBody` | ≤500 | SV/EN/DE | Phase 16 — supporting paragraph |
| `specialtyDescriptions[]` | ≤15 items, ≤200 each | SV/EN/DE | Phase 16 — named expertise areas |

### Photo specs
- Portrait orientation, square crop (1000×1000)
- Neutral or location-relevant background
- Natural lighting, no heavy filters
- Guide signs photo-release form (template provided by project lead)

## Acceptance criteria

- [ ] 2 guides × 3 locales delivered
- [ ] Portrait photo per guide, ≥1000×1000
- [ ] Photo-release signed
- [ ] Char limits respected
- [ ] Specialty list aligns with tours guide leads
- [ ] Native-speaker review per locale

## How to submit

- Notion doc per guide with locale tabs
- Photo: shared drive link in doc

## Questions / contact

- Photo standards → photo manager
- Bio content questions → project lead
- Phase 16 field semantics → development lead
