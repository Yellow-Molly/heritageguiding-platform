# Brief 08 — Media Alt Text (Photo Manager / A11y Reviewer)

**Recipient:** Photo manager + accessibility reviewer
**Deadline:** Per phase-02 image upload schedule
**Format:** Spreadsheet (one row per image, columns per locale)
**Submit to:** Project lead → CMS editor

---

## Context

Every uploaded image in the Payload Media collection needs `alt` text per locale (SV/EN/DE) for WCAG AA compliance and SEO. Tour image carousels, hero images, guide portraits, and category icons all need translated alt text.

---

## Deliverables

- Spreadsheet with one row per uploaded image, columns: filename, SV alt, EN alt, DE alt, image use (tour/guide/hero/etc.)
- Coverage: 100% of images uploaded in phase-02

## Specifications

| Image type | Alt text rule | Example |
|------------|---------------|---------|
| Tour photo | Describe scene + location | SV: "Kullerstensgata i Gamla Stan i skymning" |
| Guide portrait | Name + role | SV: "Guide {Namn}, auktoriserad Stockholmsguide" |
| Hero image | Scene + brand-relevant detail | SV: "Stockholms slott vid soluppgång" |
| Decorative only | Empty alt (`alt=""`) | n/a |
| Category icon | Skip (handled by lucide-react aria-label) | n/a |

### Tone rules
- **Descriptive, not promotional** — "Beautiful magical tour" → REJECT
- ≤125 chars per locale (screen reader friendly)
- Include location, time of day, key subject — skip generic adjectives
- WCAG AA reference: https://www.w3.org/WAI/tutorials/images/

## Acceptance criteria

- [ ] Every image has SV/EN/DE alt
- [ ] No promotional language
- [ ] ≤125 chars per locale
- [ ] Decorative images marked with `alt=""`
- [ ] A11y reviewer signs off on spreadsheet

## How to submit

- Shared spreadsheet (Google Sheets or Notion table)
- Photo manager fills filename + base description
- A11y reviewer translates + reviews per locale
- Project lead pulls into Payload Media admin during upload

## Questions / contact

- WCAG questions → a11y reviewer
- Specific image use → phase-02 content lead
- Translation help → certified translator pool
