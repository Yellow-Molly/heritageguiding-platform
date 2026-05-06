# Phase 2: Translation File Updates (EN/SV/DE)

**Status:** Pending
**Effort:** 1-1.5h
**Depends on:** Phase 1 (final EN + SV copy table)

## Goal

Replace the `faq.*` block in all three locale files with the new 7-section / 33-Q&A structure. German is AI-translated from polished EN using the existing formal "Sie" tone and terminology glossary already present in `de.json`.

## Files

- `apps/web/messages/en.json` — replace `faq.categories.*` keys; replace `faq.questions.*`; broaden `faq.description` and `faq.subtitle` to Sweden
- `apps/web/messages/sv.json` — same
- `apps/web/messages/de.json` — same (AI-translated)

## JSON Structure

```jsonc
"faq": {
  "title": "...",
  "description": "...",         // broadened to Sweden
  "subtitle": "...",            // broadened to Sweden
  "categories": {
    "understanding": "...",
    "comparing": "...",
    "booking": "...",
    "afterBooking": "...",
    "cancellation": "...",
    "experience": "...",
    "about": "..."
  },
  "stillHaveQuestions": "...",
  "contactDescription": "...",
  "contactUs": "...",
  "questions": {
    "understanding": { "q1": { "question": "...", "answer": "..." }, ... "q5": {...} },
    "comparing":     { "q1": ... "q5": ... },
    "booking":       { "q1": ... "q6": ... },
    "afterBooking":  { "q1": ... "q4": ... },
    "cancellation":  { "q1": ... "q6": ... },
    "experience":    { "q1": ... "q5": ... },
    "about":         { "q1": ... "q2": ... }
  }
}
```

**Drop:** `faq.questions.payment`, `faq.questions.guides`, `faq.questions.accessibility`, and old `faq.categories.payment/guides/safety/accessibility` keys (replaced by new 7-section structure). Some old Q&As are absorbed into new sections (e.g., payment → booking q5/q6; guides → understanding q4 + booking q3; accessibility → experience q5).

## DE Translation Glossary (from existing de.json)

| EN | DE (use this) |
|----|---------------|
| authorized guide | autorisierte/r Guide |
| verified expert | verifizierte/r Experte |
| private tour | private Tour |
| group tour | Gruppentour |
| booking | Buchung |
| reschedule | umbuchen |
| refund | Rückerstattung |
| cancellation | Stornierung |
| force majeure | höhere Gewalt |
| meeting point | Treffpunkt |
| no-show | Nichterscheinen / "no-show" |
| we, our, us | wir, unser, uns (formal "Sie" for "you") |

## SEO Meta Broadening

| Key | Old (Stockholm-tinged) | New (Sweden-wide) |
|-----|------------------------|-------------------|
| `faq.title` | "Frequently Asked Questions" / "Vanliga Frågor" / "Häufig Gestellte Fragen" | unchanged |
| `faq.description` | "Find answers to common questions about Private Tours…" | "Find answers about private tours in Sweden — booking, guides, cancellation, and what to expect" |
| `faq.subtitle` | "Everything you need to know about our private tour experiences" | "Everything you need to know about our private tours across Sweden" |
| `faq.contactDescription` | "Our team is ready to help you plan your perfect Private Tours experience." | unchanged or light tweak — preserve current voice |

Apply equivalent broadening to SV and DE.

## Implementation Steps

1. Read `apps/web/messages/en.json` to confirm exact line span of current `faq` block (~lines 223–340).
2. Build the new `faq` block in EN per Phase 1 final copy, using JSON-safe escaping (`\"`, `\n` if needed inside answers — prefer single-line answers).
3. Replace the entire `faq` block in `en.json` with the new EN block.
4. Repeat for `sv.json` (use Phase 1 SV copy).
5. AI-translate polished EN to DE using the glossary above. Render answers in formal "Sie" register. Keep paragraph structure (single line, no markdown).
6. Replace the `faq` block in `de.json` with the AI-translated DE block.
7. Validate JSON parses (`node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"` for each file).

## Mojibake Guard

After writing each file, grep for replacement chars:
```
grep -n "�" apps/web/messages/{en,sv,de}.json
```
Should return zero matches. If any present, the source pull from docx used the wrong encoding — re-extract with `sys.stdout.reconfigure(encoding='utf-8')` and rewrite.

## Acceptance

- [ ] All three locale files parse as valid JSON
- [ ] `faq.questions` contains exactly 7 categories with the right q-counts (5/5/6/4/6/5/2)
- [ ] No mojibake (`�` or `?` replacement chars) anywhere in the new `faq` block
- [ ] `faq.description` and `faq.subtitle` broadened to Sweden across EN/SV/DE
- [ ] Cancellation Q1–Q3 contain no specific tier numbers
- [ ] DE uses formal "Sie" consistently; key terms match existing `de.json` glossary
- [ ] Old keys removed: `categories.payment`, `categories.guides`, `categories.safety` (if any), `categories.accessibility`; `questions.payment`, `questions.guides`, `questions.accessibility`
