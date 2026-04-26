# Brief 03 — Categories (Category Manager)

**Recipient:** Category manager / content lead
**Deadline:** TBD by project lead
**Format:** Markdown table or spreadsheet (one row per category, columns per locale)
**Submit to:** Project lead → CMS editor

---

## Context

Tours filter UI (`/tours?category=…`) reads from `Categories` collection. Category names MUST exact-match the labels already in `apps/web/messages/{sv,en,de}.json` under `tours.filters.*` so the filter works.

> Hard requirement: paste filter labels verbatim — character-for-character.

---

## Deliverables

- **6+ categories × 3 locales** (SV, EN, DE) plus icon + description per category

## Specifications per field

| Field | Char limit | Locales | Source |
|-------|-----------|---------|--------|
| `name` | ≤80 | SV/EN/DE | EXACT match to i18n `tours.filters.*` |
| `description` | ≤200 | SV/EN/DE | Original |
| `icon` | string | shared | lucide-react icon name (e.g., `landmark`, `utensils`) |
| `slug` | URL-safe | shared | Auto-generated from EN name; manual override OK |

### Categories list (from `tours.filters.*` — confirm in i18n source)
- Historia & Kulturarv → History & Heritage → Geschichte & Kulturerbe
- Mat & Dryck → Food & Drink → Essen & Trinken
- Konst & Museer → Art & Museums → Kunst & Museen
- Privat → Private → Privat
- Grupp → Group → Gruppe
- Familj → Family → Familie
- (extend if i18n has more — check `apps/web/messages/sv.json`)

## Acceptance criteria

- [ ] Exact-match SV labels copied from i18n (no rewording)
- [ ] EN/DE labels copied from i18n
- [ ] Description per category in 3 locales (≤200 chars)
- [ ] Icon name verified against lucide-react library
- [ ] Slug URL-safe, no diacritics

## How to submit

- Spreadsheet (one row/category, columns: SV name / EN name / DE name / SV desc / EN desc / DE desc / icon / slug)

## Questions / contact

- Icon library questions → frontend dev lead
- Filter label discrepancies → project lead (do NOT invent new labels)
