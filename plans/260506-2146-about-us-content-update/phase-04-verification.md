# Phase 4 — Verification

## Context Links

- [plan.md](./plan.md)
- [Phase 1 mapping](./phase-01-content-prep-and-en-verification.md)
- [Phase 2 translations](./phase-02-translation-file-updates.md)
- [Phase 3 imagery & components](./phase-03-imagery-and-metadata.md)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Description:** Validate the content update across all 3 locales. Run static checks (type, lint, build), unit tests, and a manual browser smoke test at desktop and mobile breakpoints. Confirm no mojibake, no missing keys, and visual integrity.

## Key Insights

- **Three layers of verification:**
  1. Static — JSON parse + type-check + lint + build
  2. Tests — `npm test -- about`
  3. Manual — `npm run dev` + visit `/en/about-us`, `/sv/about-us`, `/de/about-us` at 1440px and 390px
- **Mojibake check is critical.** The existing SV/DE files showed `�` characters; verify they are gone post-update.
- **Bokun + crawler context.** Site is on staging crawler-blocked. No SEO impact concern for staging; production deploy gate is separate.

## Requirements

**Functional:**
- All 3 locales render the about page without missing-key warnings
- Hero, Story, Mission/Vision, Values, Responsible Tourism, Certifications, CTA all visible
- Languages list shows 7 entries (incl. Dutch)

**Non-Functional:**
- No new linter or type-check errors compared to master baseline
- Build succeeds
- No `�` characters anywhere in `apps/web/messages/*.json`

## Implementation Steps

1. **JSON sanity:**
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"
   node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/sv.json','utf8'))"
   node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/de.json','utf8'))"
   ```

2. **Mojibake scan:**
   ```bash
   grep -c $'\xef\xbf\xbd' apps/web/messages/en.json apps/web/messages/sv.json apps/web/messages/de.json
   # Expect 0 for all
   ```

3. **Type-check:**
   ```bash
   npm run type-check
   ```

4. **Lint:**
   ```bash
   npm run lint
   ```

5. **Tests:**
   ```bash
   npm test -- about
   npm test  # full suite at the end
   ```

6. **Build:**
   ```bash
   npm run build
   ```

7. **Manual browser smoke (dev mode):**
   - `npm run dev`
   - Visit `/en/about-us` → confirm hero, story (5 paragraphs), mission/vision, 5 value cards, responsible tourism, certifications, CTA
   - Visit `/sv/about-us` → same checks, confirm Swedish diacritics render correctly (å, ä, ö)
   - Visit `/de/about-us` → same checks, confirm German diacritics (ä, ö, ü, ß)
   - Resize to 390px (Chrome DevTools mobile emulator) on each locale; verify no overflow or layout break
   - Inspect `<head>` → confirm `<title>` and `<meta description>` use new copy

8. **Translation key audit:**
   - Diff `about.*` keys across 3 locales — must have identical structure
   - Confirm `about.story.paragraph6` removed everywhere (or kept as empty string consistently)

## Todo

- [ ] Run all 3 JSON parse commands; expect no errors
- [ ] Run mojibake scan; expect 0 matches
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`
- [ ] Run `npm test -- about`
- [ ] Run full `npm test` (final regression check)
- [ ] Run `npm run build`
- [ ] Manual browser visit on /en/about-us, /sv/about-us, /de/about-us at desktop + mobile
- [ ] Confirm SEO meta in page source uses broadened copy
- [ ] Confirm 7 languages listed in each locale's "Multilingual Expertise" card

## Success Criteria

- [ ] All commands above exit with status 0
- [ ] No `�` in any locale file
- [ ] No console warnings about missing translation keys when viewing the page
- [ ] Hero image is Sweden-wide (not Old Town alley)
- [ ] All 3 locales display 7 supported languages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Build fails due to next-intl strict key checking | Low | Med | Re-add any missing keys; ensure all 3 locales have parallel structure |
| Snapshot tests assert old copy | Med | Low | Update snapshots with intent, document in commit |
| Mobile layout breaks with longer DE text | Low | Low | Tailwind responsive classes are flexible; verify in DevTools |

## Security Considerations

- N/A (content-only)

## Next Steps

→ If all checks pass: commit, write a `/ck:journal` entry, mark plan completed.
→ If checks fail: return to the failing phase, fix, re-run Phase 4.

## Sign-Off

After verification:
- Update `plan.md` status: `in_progress` → `completed`
- Update each phase status to `Complete`
- Run `/ck:journal` to record the change
