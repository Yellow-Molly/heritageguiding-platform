---
title: "Rebrand HeritageGuiding to Private Tours"
description: "Full platform rebrand from heritageguiding.com to privatetours.se with SEO migration"
status: validated
priority: P1
effort: 3.5h
branch: master
tags: [rebrand, seo, domain-migration, i18n]
created: 2026-02-17
---

# Rebrand: HeritageGuiding to Private Tours

## Summary

Mechanical find-and-replace rebrand across 50+ files (194 occurrences). New brand: **Private Tours** / domain: **privatetours.se**. Includes SEO 301-redirect strategy, GitHub repo rename, and full email migration.

## Validation Summary

**Validated:** 2026-02-17
**Questions asked:** 7

### Confirmed Decisions
- **Brand display name**: "Private Tours" (two words) for all user-facing text
- **Technical identifiers**: `privatetours` (no separator) for packages, domains, emails
- **Domain**: privatetours.se (already registered, DNS ready)
- **GitHub repo**: Will rename from `heritageguiding-platform` to `privatetours-platform`
- **Mock content**: Replace all physical references (signs, badges) to new brand
- **Redirects**: Add 301/308 redirect rules now in next.config.ts (harmless until DNS cutover)
- **Emails**: Update all to @privatetours.se (info@, bookings@, privacy@, admin@)

### Action Items
- [ ] Update all phase files: brand display name is "Private Tours" (two words), NOT "PrivateTours"
- [ ] Add GitHub repo rename step to Phase 06
- [ ] Ensure mock tour data references (signs/badges) are included in Phase 01

## Core Transformations

| Old | New |
|-----|-----|
| `HeritageGuiding` | `Private Tours` (display) / `privatetours` (technical) |
| `heritageguiding.com` | `privatetours.se` |
| `@heritageguiding/*` | `@privatetours/*` |
| `info@heritageguiding.com` | `info@privatetours.se` |
| Social handles | `privatetours` |
| GitHub repo | `privatetours-platform` |

## Phases

| # | Phase | Files | Status |
|---|-------|-------|--------|
| 1 | [Source Code Rebrand](./phase-01-source-code-rebrand.md) | 32 | complete |
| 2 | [Config & Packages](./phase-02-config-and-packages-rebrand.md) | 6 | complete |
| 3 | [i18n Translations](./phase-03-i18n-translations-rebrand.md) | 3 | complete |
| 4 | [Tests Update](./phase-04-tests-update.md) | 4 | complete |
| 5 | [SEO & Domain Migration](./phase-05-seo-and-domain-migration.md) | 5 | code complete |
| 6 | [Documentation Update](./phase-06-documentation-update.md) | 12 | complete |

## Execution Order

Phases 1-4 can run in parallel (no cross-dependencies). Phase 5 depends on 1-4 completion. Phase 6 runs last.

After each phase: `npm run lint && npm run type-check && npm test`

## Dependencies

- DNS: privatetours.se must be registered and pointed to Vercel
- Vercel: Add custom domain + keep old domain for redirects
- Google Search Console: Change of Address after go-live
- Email: Configure MX records for privatetours.se

## Risk

- **Low:** Mostly string replacements; no logic changes
- **Medium:** Package scope rename requires `npm install` to regenerate lock file
- **High:** DNS propagation may cause brief downtime; mitigate with low TTL
