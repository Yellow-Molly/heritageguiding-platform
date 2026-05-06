# Phase 1: Content Prep & EN Polish

**Status:** Pending
**Effort:** 1h
**Owner:** Content lead (no subagent needed — direct read of docx via python-docx)

## Goal

Produce the final EN and SV Q&A copy as a flat mapping table keyed by `<category>.q<N>`. Land cancellation rewrites that strip specific tier numbers. Output is the input to Phase 2 (translation file updates).

## Inputs

- `docx/Private_Tours_FAQ_EN.docx` (Version 5.0, April 2026)
- `docx/Private_Tours_FAQ_SV.docx` (Version 5.0, April 2026)
- Existing `apps/web/messages/{en,sv,de}.json` `faq.*` block (terminology baseline)

## Category Map

| Key | EN label | SV label | DE label (Phase 2) | Q&A count |
|-----|----------|----------|--------------------|-----------|
| `understanding` | Understanding Private Tours | Förstå Private Tours | Private Tours verstehen | 5 |
| `comparing` | Comparing & Choosing | Jämföra & välja | Vergleichen & wählen | 5 |
| `booking` | Booking | Boka | Buchen | 6 |
| `afterBooking` | After Booking | Efter bokning | Nach der Buchung | 4 |
| `cancellation` | Cancellation, Refunds & Changes | Avbokning, återbetalning & ändringar | Stornierung, Erstattung & Änderungen | 6 |
| `experience` | The Tour Experience | Turupplevelsen | Das Tour-Erlebnis | 5 |
| `about` | About Private Tours | Om Private Tours | Über Private Tours | 2 |

**Totals:** 33 Q&As (vs current 22).

## Geography Broadening Rules

| Source phrase | Replace with |
|---------------|--------------|
| `private tour in Stockholm` | `private tour` |
| `privat tur i Stockholm` | `privat tur` |
| `Where does a private tour in Stockholm start?` | `Where does a private tour start?` (and SV equivalent) |
| Specific Stockholm-only references | drop unless contextually required |

Apply broadening before transferring text into Phase 2 JSON.

## Cancellation Rewrite Rules (Generic — defer to tour pages)

The docx has 6 cancellation Q&As containing specific tier numbers. Rewrite as follows:

| q# | Question (EN, after polish) | Rewrite rule |
|----|-----------------------------|--------------|
| q1 | What is the cancellation policy for private tours? | Drop "policy with levels" sentence and the implied table. Replace with: "Each tour has its own cancellation terms displayed at booking and on the tour page. The exact refund and rescheduling rules depend on how close to the tour date you cancel, and on the specific tour. We always show these rules transparently before you confirm your booking." |
| q2 | How do I cancel and how long does a refund take? | Keep core: cancel by email with booking reference; refund 2–5 banking days. Drop "level of policy applies" — replace with "according to the cancellation terms shown at booking". |
| q3 | Can I reschedule my tour instead of canceling? | Drop the "more than 7 days = free" specifics. Replace with: "Yes. We always do our utmost to find a workable solution — contact us as early as possible. Specific rescheduling terms vary by tour and follow that tour's cancellation policy." |
| q4 | What happens if I miss the tour without canceling? | Keep as-is (already generic — no-show, no refund). |
| q5 | What happens in case of extreme weather or force majeure? | Keep as-is (free reschedule or full refund — generic, applies platform-wide). |
| q6 | What happens if the guide has to cancel? | Keep as-is (alternative authorized guide or full refund). |

Apply identical rewrite to SV (q1, q2, q3 — same generic phrasing in Swedish).

## EN Polish Checklist

- Replace straight quotes with curly (' → ', " → ")
- Use en-dash (–) for ranges (2–8 hours), em-dash (—) for asides
- Verify "Visa and Mastercard" not "credit cards" (matches docx wording)
- "Authorized" (US/UK), not "licensed" — match docx terminology
- Preserve docx voice: avoid paraphrasing, only fix typos and punctuation
- Convert any remaining `·` separator artifacts that bled in from docx

## SV Verification Checklist

- Existing `sv.json` has clean Swedish with å/ä/ö — re-source from docx, ensure no mojibake
- Geography broadening applied (Stockholm → generic)
- Cancellation Q1–Q3 rewrites translated with same generic intent

## Output

A markdown table or YAML stub captured in this phase file's "Final Copy" section below (or a `final-copy.md` sibling), listing every Q&A with:
- `category.q<N>.question` (EN)
- `category.q<N>.answer` (EN)
- `category.q<N>.question` (SV)
- `category.q<N>.answer` (SV)

This becomes the literal source for Phase 2 JSON edits — no further interpretation required.

## Acceptance

- [ ] All 33 Q&As have final EN + SV text recorded
- [ ] Cancellation Q1–Q3 contain no `7 days`, `48 hours`, `100%`, `50%`, `24-48` numerics
- [ ] No `Stockholm` in generic Q&As (acceptable in 1–2 contextual examples like meeting points)
- [ ] No mojibake / `?` placeholder characters
- [ ] EN polish applied (curly quotes, en/em dashes)

## Final Copy

To be filled in when phase executes. Place final EN/SV copy table here.
