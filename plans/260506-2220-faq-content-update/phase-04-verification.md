# Phase 4: Verification

**Status:** Pending
**Effort:** 30-45m
**Depends on:** Phase 2 + Phase 3

## Goal

Confirm the FAQ renders correctly in all three locales, FAQ schema JSON-LD includes every Q&A as plain text, existing tests pass, and the build succeeds.

## Static Checks

```bash
npm run type-check          # type safety across workspaces
npm run lint                # ESLint flat config
npm run build               # Next.js 16 + Turbopack production build
```

All three must pass before browser verification.

## Existing Test Suites (verify, no edits expected)

```bash
npx vitest run apps/web/components/pages/__tests__/faq-accordion.test.tsx
npx vitest run apps/web/components/seo/__tests__/faq-schema.test.tsx
```

Both use mock data and are locale-agnostic — should still pass. If any fail, root-cause before touching tests.

## Browser Smoke

Run `npm run dev` and visit each locale:

| URL | Checks |
|-----|--------|
| `http://localhost:3000/en/faq` | Hero title, 7 category headings render in order, expand each category and verify expected Q&A count, expand cancellation Q1 and confirm no `7 days`/`48 hours`/`100%`/`50%` numerics, no mojibake (`�`) anywhere |
| `http://localhost:3000/sv/faq` | Same checks; Swedish characters å/ä/ö render cleanly; cancellation Q&As generic |
| `http://localhost:3000/de/faq` | Same checks; German umlauts ü/ö/ä/ß render cleanly; formal "Sie" register; cancellation Q&As generic |

Per locale, also:
- Open browser devtools → Elements → search for `application/ld+json` script tag → confirm it's parseable JSON with `mainEntity` array of length 33 (or however many Q&As land after Phase 1 consolidation)
- Click "Contact Us" CTA → links to `/{locale}/contact`
- Resize to 390px width → accordion still legible, no overflow

## SEO Sanity

- Page metadata: open page source, confirm `<title>` and `<meta name="description">` reflect the broadened "Sweden" wording
- FAQ JSON-LD: paste into [Google Rich Results Test](https://search.google.com/test/rich-results) — expect "FAQPage" detected, no errors

## Cross-Plan Sync

After Phase 4 passes:
1. Update `plans/260419-1332-per-tour-cancellation-policy/plan.md`: mark Phase 06 ("FAQ cancellation Q&A rewrite") as superseded by `plans/260506-2220-faq-content-update/`.
2. Cancellation page (`/cancellation-policy`) NOT updated by this plan — flag as known gap. The 48h tier copy still lives there until per-tour-cancellation plan ships.

## Acceptance

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `faq-accordion.test.tsx` and `faq-schema.test.tsx` pass without edits
- [ ] All 3 locales render 7 categories with correct Q&A counts
- [ ] No mojibake in any locale
- [ ] FAQ JSON-LD validates as Schema.org FAQPage
- [ ] Cancellation Q&As contain no specific tier numbers
- [ ] Per-tour-cancellation plan's Phase 06 status updated

## Rollback

If browser smoke reveals systemic mojibake or layout breakage:

```bash
git checkout -- apps/web/messages/en.json apps/web/messages/sv.json apps/web/messages/de.json
git checkout -- apps/web/app/\(site\)/\[locale\]/\(frontend\)/faq/page.tsx
```

Re-run from Phase 1 with corrected source extraction.
