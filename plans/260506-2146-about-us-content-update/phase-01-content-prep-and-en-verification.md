# Phase 1 — Content Prep & EN Verification

## Context Links

- [plan.md](./plan.md)
- Source: `docx/About_Us_English.docx` (Part 1 only)
- Source: `docx/About_Us_Svenska.docx` (Part 1 only)
- Current English: `apps/web/messages/en.json` → `about.*`
- Current section components: `apps/web/components/pages/about-*.tsx`

## Overview

- **Priority:** P2
- **Status:** Pending
- **Description:** Map Part 1 docx content to existing translation keys. Polish EN lightly (typos, en-dashes, curly quotes). Reconcile structural mismatches between docx and current page (e.g., story paragraph count). Produce an authoritative EN copy table that Phase 2 will write into `en.json`.

## Key Insights

- **Story section paragraph mismatch.** Current `story.paragraph1`–`paragraph6` (6 paragraphs). Part 1 docx "About Private Tours" has 5 statements. Mapping plan:
  - Old `paragraph1` → New: "It always begins with a question."
  - Old `paragraph2` → New: "Not about what you want to see – but about how you want to feel when you leave."
  - Old `paragraph3` → New: "Private Tours is a curated platform for experiences across Sweden. Here you will find city walks and nature guides, food journeys and craft workshops, beer tastings and quiet mornings in the forest – all chosen for one reason: that the person behind each experience truly knows what they are offering."
  - Old `paragraph4` → New: "If you want to combine any experience with an authorised guide or subject-matter expert who can put it into a wider context, that is always an option. But it is never a requirement. The platform is built to meet you where you are – whether you are looking for a few hours or something that unfolds across several days and destinations."
  - Old `paragraph5` → New: "What connects everything we offer is not the format. It is the quality of the people behind it."
  - Old `paragraph6` → **REMOVE** (component must be updated to render 5 paragraphs only). Coordination with Phase 3.
- **Story title lines.** Current: "Created for Travelers" / "Who Value Depth". Replace with new copy heading aligned to Part 1's H2 "About Private Tours". Recommended: keep `titleLine1` = "Created for Travelers" and `titleLine2` = "Who Value Depth" since the new docx Part 1 doesn't supply a comparable 2-line hero heading and these still match the broader theme. Alternative: use "It Always Begins" / "With a Question" — defer to docs lead. **Default: keep existing 2-line title; only the body paragraphs change.** This keeps editorial decisions minimal.
- **Languages list.** EN docx adds Dutch: "Swedish, English, German, Dutch, French, Portuguese and Spanish". Apply across all 3 locales' `values.multilingual.description`.
- **Mission/Vision text.** Replace with docx Part 1:
  - Mission: "To be Sweden's most trusted platform for curated experiences – where culture, nature and food come together, and where every experience is personal, reliable, and deeply engaging."
  - Vision: "To set a new standard for how Sweden is experienced – where expertise, authenticity and human connection define every encounter with the country, its nature, its food and its stories."
- **Values section.** Part 1's "What Makes Us Different" maps 1:1 to existing 5 cards but with revised copy. Note: docx says "Verified Experts Only"; current key is `authorizedExperts`. **Keep the key name** (no rename — minimizes blast radius); update only the displayed `title` and `description` text.
- **Responsible Tourism.** Part 1 docx has no equivalent section. Source from Manifest's "A Responsibility to Places and People" since theme is identical and we're broadening to Sweden anyway. Update paragraph1–3 + items.
- **Hero subtitle.** Current: "Depth, Trust, and Personal Connection". Tweak to Sweden-wide framing or keep. **Default: keep** — still accurate, no docx replacement.
- **CTA + Certifications.** No docx source. Keep current. Adjust `local`/`localSub` if tied to "Stockholm" — defer to Phase 3 metadata pass.

## EN Verification Checklist (Light Polish)

- [ ] Use en-dash (`–`) consistently (docx already uses correctly — preserve)
- [ ] Use curly apostrophes (`'`) → ASCII apostrophe (`'`) for JSON safety, OR keep curly + ensure JSON is UTF-8 (recommended: ASCII straight apostrophes for tooling compatibility)
- [ ] Verify "Sweden's" possessive renders correctly (avoid mojibake)
- [ ] Spell-check `authorised` (UK spelling in docx) → keep UK spelling for consistency with rest of site (verify by sampling existing `en.json` keys)
- [ ] No double-spacing
- [ ] Capitalisation in headings matches existing convention (Title Case for headings, sentence case for descriptions)

**Note:** Sample of existing `en.json` shows mixed: "Authorized Experts Only" (US spelling). Decide: switch to UK or keep US?
- **Decision: Use US spelling ("authorized") in EN site copy** — site is targeting international travelers, US English is the default. Map docx "authorised" → "authorized" silently.

## SV Source Reconciliation

Swedish docx (Part 1) is authoritative. Apply verbatim with light typo check:
- "Det här är vi" (heading for "What Makes Us Different") — OK
- "trivel" appears in `Kurerat – aldrig trivel`. Looks like a likely typo for "trängsel" (overcrowding). **Flag to user before applying** — see Risk Assessment in plan.md. **Decision (default): preserve docx wording** unless user instructs otherwise; mark as open question.
- "Sveriges kurerade resa" — OK
- "urvattnas" (Swedish docx text) — likely should be "urvattnats" (perfect tense). Same flagging logic.

**Action:** Phase 2 includes a "translation review note" called out in commit message; do not silently fix.

## Requirements

**Functional:**
- Produce a content matrix (table per locale × per translation key) ready for Phase 2 to apply
- Identify any translation keys to add or remove

**Non-Functional:**
- No code changes in this phase
- Output: a single artifact (markdown content table inside this phase doc, OR a working draft `en.json` snippet)

## Implementation Steps

1. Read the Part 1 docx content (already extracted in plan analysis).
2. For each existing `about.*` key in `en.json`, decide: KEEP / REPLACE / REMOVE.
3. Produce final EN strings table in this doc (see "Final EN Copy" section below — to be filled during execution).
4. Mark any key additions: e.g., add Dutch language mention.
5. Verify no JSON-breaking characters (curly quotes, ampersands handled).
6. Review SV docx; flag suspicious typos as open questions for user.

## Final EN Copy Mapping

| Key | New Value | Source |
|-----|-----------|--------|
| `about.title` | "About Private Tours" | docx H2 / current |
| `about.description` | "Private, expertly hosted experiences across Sweden led by authorized professionals" | Edited (Stockholm → Sweden) |
| `about.subtitle` | "Depth, Trust, and Personal Connection" | KEEP |
| `about.heroAlt` | "Private Tours - curated experiences across Sweden" | Edited (Stockholm → Sweden) |
| `about.hero.label` | "OUR STORY" | KEEP |
| `about.story.label` | "WHO WE ARE" | KEEP |
| `about.story.imageAlt` | "Sweden's diverse landscapes — coastline, forest and historic cities" | Edited (broaden) |
| `about.story.titleLine1` | "Created for Travelers" | KEEP |
| `about.story.titleLine2` | "Who Value Depth" | KEEP |
| `about.story.paragraph1` | "It always begins with a question." | docx |
| `about.story.paragraph2` | "Not about what you want to see – but about how you want to feel when you leave." | docx |
| `about.story.paragraph3` | "Private Tours is a curated platform for experiences across Sweden. Here you will find city walks and nature guides, food journeys and craft workshops, beer tastings and quiet mornings in the forest – all chosen for one reason: that the person behind each experience truly knows what they are offering." | docx |
| `about.story.paragraph4` | "If you want to combine any experience with an authorized guide or subject-matter expert who can put it into a wider context, that is always an option. But it is never a requirement. The platform is built to meet you where you are – whether you are looking for a few hours or something that unfolds across several days and destinations." | docx (UK→US: authorised→authorized) |
| `about.story.paragraph5` | "What connects everything we offer is not the format. It is the quality of the people behind it." | docx |
| `about.story.paragraph6` | **REMOVE** (component update required in Phase 3) | — |
| `about.mission.label` | "OUR PURPOSE" | KEEP |
| `about.mission.title` | "Our Mission" | docx H2 / KEEP |
| `about.mission.description` | "To be Sweden's most trusted platform for curated experiences – where culture, nature and food come together, and where every experience is personal, reliable, and deeply engaging." | docx |
| `about.vision.title` | "Our Vision" | KEEP |
| `about.vision.description` | "To set a new standard for how Sweden is experienced – where expertise, authenticity and human connection define every encounter with the country, its nature, its food and its stories." | docx |
| `about.values.label` | "WHY CHOOSE US" | KEEP |
| `about.values.title` | "What Makes Us Different" | docx |
| `about.values.subtitle` | "A considered approach to curated experiences across Sweden" | Edited (Stockholm → Sweden) |
| `about.values.authorizedExperts.title` | "Verified Experts Only" | docx (was: "Authorized Experts Only") |
| `about.values.authorizedExperts.description` | "Every experience is led by a licensed city guide, nature guide, chef, artisan or subject-matter expert. We personally review credentials, experience and the ability to engage. Nothing is left to chance." | docx |
| `about.values.curated.title` | "Curated, Never Crowded" | docx / KEEP |
| `about.values.curated.description` | "We are not an open platform. Every experience – whether a nature tour, a food journey or a craft workshop – is handpicked and reviewed. We do not offer everything. Only what we genuinely stand behind." | docx |
| `about.values.privateByDesign.title` | "Private by Design" | docx / KEEP |
| `about.values.privateByDesign.description` | "All experiences are exclusively private. Pace, focus and depth are adapted entirely to you and your group – not to anyone else's agenda." | docx |
| `about.values.seamlessHosting.title` | "Seamless Hosting" | docx / KEEP |
| `about.values.seamlessHosting.description` | "We handle logistics, transport and transitions. You should never have to think about the next step – only be present in the one you are in." | docx |
| `about.values.multilingual.title` | "Multilingual Expertise" | docx / KEEP |
| `about.values.multilingual.description` | "Experiences are offered in Swedish, English, German, Dutch, French, Portuguese and Spanish – always by certified professionals." | docx (adds Dutch) |
| `about.responsibleTourism.label` | "OUR COMMITMENT" | KEEP |
| `about.responsibleTourism.title` | "A Responsibility to Places and People" | Manifest H2 |
| `about.responsibleTourism.imageAlt` | "Swedish landscape — nature and historic settings across the country" | Edited (broaden) |
| `about.responsibleTourism.paragraph1` | "Private Tours operates with care for both people and the environment. We collaborate with local professionals and businesses across Sweden, maintain a low-impact private-only model, and design experiences that respect the landscapes and communities we visit – from city centres to wilderness." | Manifest |
| `about.responsibleTourism.paragraph2` | "Accessibility matters to us. Our digital platforms follow recognized accessibility standards, and our experiences are designed to be inclusive where possible – without compromising on depth or quality." | Manifest (UK→US: recognised→recognized) |
| `about.responsibleTourism.paragraph3` | "Cultural heritage, natural heritage and food traditions are not backdrops. They are a responsibility. Our work is grounded in education, preservation and long-term respect for the stories we share – wherever in Sweden they unfold." | Manifest |
| `about.responsibleTourism.items.item1` | "Local partnerships across Sweden" | Edited (broaden) |
| `about.responsibleTourism.items.item2` | "Low-impact private-only touring model" | KEEP |
| `about.responsibleTourism.items.item3` | "Inclusive and accessible experience design" | Light edit |
| `about.responsibleTourism.items.item4` | "Cultural and natural heritage preservation" | Edited (add natural) |
| `about.team.*` | KEEP existing (team section unused per prior plan validation, but keys retained) | — |
| `about.certifications.local` | "Local Experts" | KEEP |
| `about.certifications.localSub` | "Across Sweden" | Edited (was "Born and raised in Stockholm") |
| `about.cta.title` | "Ready to Explore?" | KEEP |
| `about.cta.description` | "Discover Sweden through the people who know it best" | Edited (was Stockholm-specific) |
| `about.cta.exploreTours` | "Explore Tours" | KEEP |
| `about.cta.contactUs` | "Contact Us" | KEEP |

## Todo

- [ ] Confirm story section paragraph reduction approach (5 vs 6 paragraphs)
- [ ] Verify "authorised → authorized" spelling decision matches site-wide convention
- [ ] Flag Swedish typos to user (`trivel`, `urvattnas`) before Phase 2 applies SV
- [ ] Lock Final EN Copy Mapping table

## Success Criteria

- [ ] Final EN Copy Mapping table approved and complete
- [ ] All structural mismatches identified (paragraph count, key adds/removes)
- [ ] Open SV typos surfaced

## Risk Assessment

- **Risk:** Editorial drift in light polish. **Mitigation:** Track every edit against docx source in mapping table.
- **Risk:** Forgetting to surface SV typos. **Mitigation:** Explicit todo above + commit message annotation in Phase 2.

## Next Steps

→ Phase 2 applies the mapping table to `en.json`, `sv.json`, and AI-generates `de.json`.
