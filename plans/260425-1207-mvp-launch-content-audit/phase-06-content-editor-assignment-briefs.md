# Phase 06 — Content Editor Assignment Briefs

## Context Links
- Research: both researcher reports (entire scope)
- Blocks: phase-02 (CMS seeding can't start without briefs), phase-03 (verification brief), phase-04 (legal brief), phase-05 (marketing claims brief)

## Overview
- **Date:** 2026-04-25
- **Description:** Produce sendable briefs (one .md per assignment) under `assignments/` so each downstream owner has a self-contained spec: what to write, char limits, locales, examples, deadline.
- **Priority:** P1
- **Status:** drafted — 8 briefs (04 marked DROPPED per validation) in `assignments/`. Awaits project-lead send + recipient confirmations.
- **Review status:** ready for review

## Key Insights
- Without briefs, copywriters/business/legal/marketing get scattered Slack asks → drift, missed locales, char-limit failures
- Each brief is the single contract between project lead and the doer
- Briefs reference field-level specs from Payload schemas (no guesswork)

## Requirements

### Functional
- 8 brief files, each a standalone deliverable (sendable as email attachment)
- Each brief specifies: target page/component or CMS collection, exact field names, char limits per field, locale requirements (SV/EN/DE), examples, acceptance criteria, deadline, recipient
- Briefs are markdown, kebab-case filenames, numbered for order

### Non-functional
- Brief reading time ≤ 5 min per file
- Brief contains zero project jargon (recipients may not be technical)

## Architecture

```
plans/260425-1207-mvp-launch-content-audit/
└── assignments/
    ├── 01-tour-content-brief.md          → Tour copywriter
    ├── 02-guide-bios-brief.md            → Guide onboarding team
    ├── 03-categories-brief.md            → Category Manager
    ├── 04-testimonials-brief.md          → Marketing
    ├── 05-business-info-verification-brief.md → Business owner
    ├── 06-legal-review-brief.md          → Legal counsel
    ├── 07-marketing-claims-brief.md      → Marketing lead
    └── 08-media-alt-text-brief.md        → Photo manager / a11y reviewer
```

## Related Code Files (read-only, source of specs)

- `packages/cms/collections/Tours.ts` — field definitions for brief 01
- `packages/cms/collections/Guides.ts` — fields for brief 02
- `packages/cms/collections/Categories.ts` — for brief 03
- `packages/cms/collections/Reviews.ts` — for brief 04
- `apps/web/messages/sv.json` `tours.filters.*` — category labels (brief 03 must mirror exactly)
- Phase-03 doc — for brief 05 (verification scope)

## Implementation Steps

1. Read all phase docs (01-05, 07) to extract concrete specs per brief
2. For each brief, draft using template (below)
3. Brief template:
   - **Recipient + role**
   - **Deadline**
   - **Context** (1 paragraph: why this matters)
   - **Deliverables** (numbered list of artifacts)
   - **Specifications per field** (table: field, char limit, locales, example)
   - **Acceptance criteria** (checklist)
   - **How to submit** (Notion doc / shared drive / email)
   - **Questions / contact**
4. Project lead reviews drafts, sends to recipients
5. Each recipient confirms receipt + deadline
6. Project lead tracks delivery status in this phase's todo

### Brief content highlights

**01-tour-content-brief.md** — Tour copywriter
- 5 tours × 3 locales = 15 sets
- Per tour: title (≤200 chars), description (500-1500 chars rich text), shortDescription (≤160), highlights (1-10 bullets), accessibility notes per impairment
- Tone: heritage-focused, expert but warm
- Examples: link to 2 reference tour pages from competitors

**02-guide-bios-brief.md** — Guide onboarding
- 2 guides × 3 locales = 6 bios
- Per guide: name, bio (200-500 chars), credentials (array), languages, yearsExperience (number), guideStyle (Phase 16), whatGuestsAppreciate, uniqueAspectsQuote (≤500), uniqueAspectsBody, specialtyDescriptions (≤15)
- Photo: portrait, 1000×1000 min, neutral background

**03-categories-brief.md** — Category Manager
- 6+ categories × 3 locales
- MUST exact-match i18n filter labels (paste from `apps/web/messages/sv.json` `tours.filters.*`)
- Per category: name, description (≤200 chars), icon name (lucide-react)

**04-testimonials-brief.md** — Marketing
- 10+ real testimonials w/ consent
- Per testimonial: author name (or initials), tour name, rating 1-5, text (≤300 chars), locale of original (translate to other 2)
- Consent form template included; signed copy required

**05-business-info-verification-brief.md** — Business owner
- All fields from phase-03 (email, phone, WhatsApp, address, hours, social URLs)
- Test procedure per field
- Sign-off section at bottom

**06-legal-review-brief.md** — Legal counsel
- Full Terms / Privacy / Cancellation copy attached (export from i18n)
- GDPR compliance checklist
- Bokun T&C cross-check requirement
- Effective date placeholder
- Sign-off section per page

**07-marketing-claims-brief.md** — Marketing lead
- Each trust-signal claim listed (15+ years, 98% happy, 100% trusted, 2000+ travelers)
- Source field per claim (must fill in)
- Rewrite suggestion column if unverifiable
- Sign-off

**08-media-alt-text-brief.md** — Photo manager
- For every uploaded image: alt text in SV/EN/DE
- Tone: descriptive, NOT promotional ("Stockholm Old Town cobblestone street at dusk" not "Beautiful magical tour")
- WCAG AA compliance reference
- Spreadsheet template: image filename, SV alt, EN alt, DE alt

## Todo
- [x] 01-tour-content-brief.md drafted
- [x] 02-guide-bios-brief.md drafted
- [x] 03-categories-brief.md drafted
- [x] 04-testimonials-brief.md (DROPPED per validation — placeholder kept for traceability)
- [x] 05-business-info-verification-brief.md drafted
- [x] 06-legal-review-brief.md drafted
- [x] 07-marketing-claims-brief.md drafted
- [x] 08-media-alt-text-brief.md drafted
- [ ] Project lead sends briefs to recipients
- [ ] All recipients confirmed receipt
- [ ] Delivery tracker updated daily until phase-02/03/04/05 unblocked

## Success Criteria
- 8 briefs in `assignments/` folder
- Each recipient has confirmed receipt + deadline
- No phase-02/03/04/05 owner asks "what do I need to deliver?" — all in their brief
- Briefs are reused for future content batches (template is repeatable)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Briefs misinterpreted, wrong content delivered | Med | High | Examples per field; review draft before submission |
| Recipient unavailable (vacation, etc.) | Med | Med | Identify backup per role; deadline buffer 3 days |
| Brief scope creep | Med | Med | Lock specs to phase docs; changes go through project lead |
| Translation contracted-out delay | Med | High | Engage translators early; brief them in parallel |
| Char limits violated, requires rework | High | Low | Brief includes exact limit + word counter recommendation |

## Security Considerations
- Briefs may contain pre-launch business info (NDA recipients)
- Consent forms (testimonials) handled per GDPR — don't share recipient details cross-team
- Legal brief: no privileged info shared outside counsel
- Sign-off docs version-controlled (not just email)

## Next Steps
- Phase-02/03/04/05 unblocked once briefs delivered + acknowledged
- Project lead tracks delivery in shared dashboard
- Post-launch: brief templates archived for reuse
