---
title: "Guides Data V2 Update — DOCX Ingest + In-Session Translation"
description: "Parse 11 v2 guide docx profiles, translate SV→EN/DE in-session (Claude authors directly, no API), merge into CMS preserving v1 metadata"
status: completed
priority: P1
effort: 4h
branch: master
tags: [guides, data-import, translation, docx, cms]
created: 2026-04-14
completed: 2026-04-15
blockedBy: []
blocks: []
---

# Guides Data V2 Update

## Context

Content editor delivered refreshed guide profiles as 11 Swedish `.docx` files in `docx/Guides data v2/`:

- **7 existing guides** (Anders, Annika, Christian, Niklas, Olof, Sabine, Sophie) — same slugs, richer narrative
- **4 new guides** to onboard: Åsa Övrelid, Mattias Wallin, Svante Bergqvist, Tommy Nilsson
- **New narrative sections** per profile: `Guidestil`, `Vad gästerna uppskattar`, `Det som gör turer unika` (pull quote)
- **Dropped fields**: docx has no email/phone/operating-areas/explicit certifications

User wants **Claude to author translations directly in-session** (no Anthropic API call) since the set is tiny (11 × 2 = 22 translation blocks).

## Data Flow

```
docx/Guides data v2/*.docx
  │  (Phase 1: Python extraction via ~/.claude/skills/.venv)
  ▼
data/guides-v2-sv.json
  │  (Phase 2: Claude writes translations directly — no API)
  ▼
data/translated-guides-v2.json + data/translations-review/guide-v2-{slug}.md
  │  (Phase 3: photos — map existing + placeholder for 3 new)
  ▼
data/guide-photo-media-mapping.json (extended)
  │  (Phase 4: extended import script, merge mode)
  ▼
Payload CMS guides (11 entries × 3 locales)
  │  (Phase 5: verify + browser smoke)
  ▼
Report
```

## Phases

| # | Phase | File | Status | Effort | Depends On |
|---|-------|------|--------|--------|------------|
| 1 | Parse v2 docx → SV JSON | [phase-01](phase-01-parse-docx.md) | Complete | 1h | — |
| 2 | Claude-authored translations | [phase-02](phase-02-translate-in-session.md) | Complete | 1h | Phase 1 |
| 3 | Photos: placeholder + new guides | [phase-03](phase-03-photos.md) | Complete | 0.5h | — |
| 4 | Merge-import into CMS | [phase-04](phase-04-import.md) | Complete | 1h | Phases 2 + 3 |
| 5 | Verify + browser smoke | [phase-05](phase-05-verify.md) | Complete | 0.5h | Phase 4 |

Phases 1 and 3 can run in parallel.

## Key Decisions

- **Translation author = Claude in-session** (no Anthropic SDK call). All 22 translation blocks authored inline via Write/Edit.
- **DOCX parser = Python (python-docx)** — already works in `~/.claude/skills/.venv`; avoids adding a Node `mammoth` dep for one-off ingest.
- **Append narrative to `bio` richText** (no schema change). Structured markdown with H3 headings + blockquote → Lexical via existing `markdownToLexical()`.
- **Merge mode**: for 7 existing guides, only overwrite bio/credentials/specializations; preserve v1 email/phone/operatingAreas/additionalLanguages/yearsExperience. For 4 new: email='', phone='', operatingAreas=[stockholm], credentials=['Auktoriserad Stockholmsguide (FSAG)'].
- **Photos**: reuse 7 existing + map `Mattias Wallin 2.jpeg` → `mattias-wallin`; upload one placeholder silhouette, reference for Åsa/Svante/Tommy.
- **Slug rule** matches v1 transliteration: `åäö→a/a/o`, `ü→u`. New slugs: `asa-ovrelid`, `mattias-wallin`, `svante-bergqvist`, `tommy-nilsson`.
- **Tour relations unchanged**: docx has no tour signals. 4 new guides start without tour assignments (PO assigns later via admin).

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| DOCX section drift across 11 files | Medium | Parser asserts expected headers; fails loudly. Sampled 3 files — structure matches. |
| Translation quality variance | Medium | One guide at a time; per-guide review markdown; user spot-checks before Phase 4. |
| Bio overwrite on PO-edited CMS bios | Medium | Import with `--only-bio-credentials-specs` merge filter; v1 json kept on disk. |
| Slug/photo mismatch for new guides | Low | Phase 1 outputs slugs; Phase 3 map uses them; Phase 5 verifies 1:1. |
| Placeholder silhouette quality | Low | User approves silhouette before Phase 3; fallback = `photo:null` + flag in report. |

## Rollback

- Payload version history preserved (Payload default).
- `data/translated-guides.json` (v1) untouched — re-run v1 import with `--update` restores.
- Photo map edits additive; revert via git.

## Cross-Plan Dependencies

- `260329-2258-guides-data-cms-integration` — **complete** (v1). Superseded.
- `260412-1736-guide-details-redesign` — UI only, independent.
- `260413-1710-tour-data-v2-update` — complete, disjoint.

No `blockedBy` / `blocks` links.

## Verification

1. `npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-data.ts --dry-run --input=data/translated-guides-v2.json` → 11 guides, 4 new / 7 update, 0 errors.
2. Live: `--update --status=active` → 11 guides in CMS admin.
3. `npx tsx scripts/verify-guide-import.ts --v2` → 11 present, 3 locales each, photo IDs resolved (placeholder flagged for Åsa/Svante/Tommy).
4. `npm run dev` → `/sv/guides`, `/en/guides`, `/de/guides` render all 11 cards; detail pages show translated bio with visible H3 sections and pull quote.
5. Lighthouse a11y ≥ 90 on one guide detail page.

## Validation Summary

**Validated:** 2026-04-14
**Questions asked:** 4

### Confirmed Decisions
- **Placeholder photo source:** Pull a neutral portrait placeholder from **Unsplash** (not AI-generated). Save as `docx/Guide-photos/_placeholder-silhouette.jpg`. Used by Åsa, Svante, Tommy.
- **Bio overwrite safety:** No manual PO edits in CMS since v1 import — Phase 4 can overwrite all 7 existing bios freely. `--only-bio-credentials-specs` flag still defaults ON to avoid touching email/phone/operatingAreas.
- **Tour relations for 4 new guides:** Leave unassigned. PO will assign via CMS admin post-import. Phase 4 does not attempt auto-matching.
- **Specializations on 7 existing guides:** Re-derive category relations from v2 specialization text via `resolveSpecializations()`. V1 relations get replaced (not merged).

### Action Items
- [ ] Phase 3: Download neutral portrait placeholder from Unsplash → `docx/Guide-photos/_placeholder-silhouette.jpg` (grayscale or soft-focus, professional aesthetic, 512×512+). Do BEFORE live import.
- [ ] Phase 4: Keep `--only-bio-credentials-specs` default ON; confirm in dry-run that only bio + credentials + specializations change on the 7 existing guides.
- [ ] Phase 4: Remove any defensive diffing logic — v1 bios are safe to overwrite.
- [ ] Phase 4: Ensure `importV2()` passes v2-re-derived `specializationIds` on both new AND existing guides (re-derive always, don't preserve).

## Open Questions

- **Sabine docx is `v02_sg_2026-04-14`** — assumed authoritative. Confirm no newer revision pending.
- **Åsa Övrelid slug** = `asa-ovrelid` by transliteration rule. Flag if a different slug is wanted for SEO.
