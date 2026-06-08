---
phase: 1
title: "Why-Travel-With-Us Content"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Why-Travel-With-Us Content (Bug #1)

## Overview

Replace the four content cards in the homepage "Why Travel With Us" section with the stakeholder's four points. The section title stays; only the four cards change. The existing component renders a big animated number + label + description per card, which maps cleanly onto the new copy ("100%", "0" become the numbers).

## Key Insight

The four card **numbers are hardcoded in the component** (`trust-signals.tsx:83-108`), not in i18n. So this is **NOT i18n-only** — the stat `value`/`suffix` for cards 1, 3, 4 must change, and card 1 stops using the dynamic `guideCount` prop. The labels/descriptions live in i18n (`home.trust.*`) across `en/sv/de`.

## Content mapping (old → new)

| Card | New number | New label | New description |
|------|-----------|-----------|-----------------|
| 1 | `100%` (was `{guideCount}+`) | Authorized guides | Licensed, vetted and experts in their field. |
| 2 | `100%` (unchanged) | Private tours | Only you and your group — never a shared group. |
| 3 | `0` (was `15+`) | Compromises | Every guide and route is handpicked and approved by us. |
| 4 | `100%` (was `98%`) | Tailored to you | The experience is shaped around your interests and pace. |

Note: card 3 number is `0` with empty suffix — count-up animates 0→0 (renders a static "0"), which is the intended "zero compromises" message.

## Related Code Files

- **Modify:** `apps/web/components/home/trust-signals.tsx` — stat array values/suffixes (lines 83-108); rename i18n keys; drop `guideCount` prop + `TrustSignalsProps` (lines 74-78, 85).
- **Modify:** `apps/web/app/(site)/[locale]/(frontend)/page.tsx` — line 77: `<TrustSignals guideCount={guidesResponse.total} />` → `<TrustSignals />`. **Keep** `guidesResponse` — still feeds `GuidesPreview` at line 79.
- **Modify:** `apps/web/messages/en.json` — `home.trust.*` (lines ~44-52).
- **Modify:** `apps/web/messages/sv.json` — `home.trust.*` (lines ~44-52).
- **Modify:** `apps/web/messages/de.json` — `home.trust.*` (lines ~44-52).

## Implementation Steps

1. **Rename i18n keys** for semantic clarity (8 keys per locale). Replace the existing pairs:
   - `expertGuides`/`expertGuidesDesc` → `authorizedGuides`/`authorizedGuidesDesc`
   - `trustedAgency`/`trustedAgencyDesc` → `privateTours`/`privateToursDesc`
   - `yearsExperience`/`yearsExperienceDesc` → `zeroCompromises`/`zeroCompromisesDesc`
   - `happyTravelers`/`happyTravelersDesc` → `tailoredToYou`/`tailoredToYouDesc`
   - Keep `sectionTitle` ("Why Travel With Us" / "Varför Resa Med Oss" / "Warum Mit Uns Reisen") unchanged.

   **English (`en.json`):**
   ```json
   "authorizedGuides": "Authorized guides",
   "authorizedGuidesDesc": "Licensed, vetted and experts in their field.",
   "privateTours": "Private tours",
   "privateToursDesc": "Only you and your group — never a shared group.",
   "zeroCompromises": "Compromises",
   "zeroCompromisesDesc": "Every guide and route is handpicked and approved by us.",
   "tailoredToYou": "Tailored to you",
   "tailoredToYouDesc": "The experience is shaped around your interests and pace."
   ```

   **Swedish (`sv.json`) — DRAFT, flag for native review:**
   ```json
   "authorizedGuides": "Auktoriserade guider",
   "authorizedGuidesDesc": "Licensierade, granskade och experter inom sitt område.",
   "privateTours": "Privata turer",
   "privateToursDesc": "Endast du och ditt sällskap — aldrig en delad grupp.",
   "zeroCompromises": "Kompromisser",
   "zeroCompromisesDesc": "Varje guide och rutt är handplockad och godkänd av oss.",
   "tailoredToYou": "Skräddarsytt för dig",
   "tailoredToYouDesc": "Upplevelsen formas efter dina intressen och din takt."
   ```

   **German (`de.json`) — DRAFT, flag for native review:**
   ```json
   "authorizedGuides": "Autorisierte Guides",
   "authorizedGuidesDesc": "Lizenziert, geprüft und Experten auf ihrem Gebiet.",
   "privateTours": "Private Touren",
   "privateToursDesc": "Nur Sie und Ihre Gruppe — niemals eine geteilte Gruppe.",
   "zeroCompromises": "Kompromisse",
   "zeroCompromisesDesc": "Jeder Guide und jede Route wird von uns handverlesen und geprüft.",
   "tailoredToYou": "Maßgeschneidert für Sie",
   "tailoredToYouDesc": "Das Erlebnis richtet sich nach Ihren Interessen und Ihrem Tempo."
   ```

2. **Update the component stat array** (`trust-signals.tsx:83-108`) to the new values + renamed keys:
   ```tsx
   const stats: StatItem[] = [
     { value: 100, suffix: '%', label: t('authorizedGuides'), description: t('authorizedGuidesDesc') },
     { value: 100, suffix: '%', label: t('privateTours'),     description: t('privateToursDesc') },
     { value: 0,   suffix: '',  label: t('zeroCompromises'),  description: t('zeroCompromisesDesc') },
     { value: 100, suffix: '%', label: t('tailoredToYou'),    description: t('tailoredToYouDesc') },
   ]
   ```

3. **Drop the now-unused `guideCount` prop**: remove `TrustSignalsProps` interface + the `{ guideCount = 7 }` param → `export function TrustSignals()`. Update homepage usage `page.tsx:77` to `<TrustSignals />`. Do **not** remove the `guidesResponse` fetch (still used by `GuidesPreview`).

4. Type-check, lint, run the homepage/trust tests.

## Success Criteria

- [ ] Homepage "Why Travel With Us" shows exactly the 4 new cards (100% Authorized guides / 100% Private tours / 0 Compromises / 100% Tailored to you) with the new descriptions.
- [ ] All 3 locales (EN/SV/DE) render translated copy; no missing-key console warnings.
- [ ] No leftover references to old keys (`expertGuides`, `trustedAgency`, `yearsExperience`, `happyTravelers`) — grep returns nothing.
- [ ] `guideCount` prop removed; `npm run type-check` passes; homepage still builds.
- [ ] `npm test` green for affected suites.

## Risk Assessment

- **Stale key references** → grep all of `apps/web` for each old key before finishing; next-intl throws on missing keys at runtime.
- **Count-up for `0`** → verify "0 Compromises" renders a static "0" (target 0 ⇒ no visible animation) and looks intentional, not broken.
- **SV/DE accuracy** → drafts are flagged for native review; acceptable to ship per stakeholder decision, but log the review follow-up.
- **Design interpretation** → assumes the existing number+label card layout is retained (number = "100%"/"0"). If the stakeholder wanted plain heading+paragraph (no big number), that's a larger redesign — confirm on review of the first build.
