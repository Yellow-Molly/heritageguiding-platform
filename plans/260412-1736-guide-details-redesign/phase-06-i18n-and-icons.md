# Phase 06 — i18n Translations + Credential Icon Mapping

## Context
- [Design spec](research/researcher-01-design-spec.md) — Credential icons, section labels
- [en.json guides namespace](../../apps/web/messages/en.json) (line 579+)
- Translation files: `apps/web/messages/{en,sv,de}.json`

## Overview
- **Priority:** P1 (blocks Phase 2 sidebar)
- **Status:** Pending
- **Effort:** 0.5h
- **No blockers** — can run in parallel with Phase 1

Two deliverables: (A) add new i18n keys for sidebar labels and CTA text, (B) create credential icon mapping utility.

## Key Insights
- Existing keys: `guides.languages`, `guides.specializations`, `guides.credentials`, `guides.about`, `guides.toursBy`
- Missing keys: section labels (uppercase: "LANGUAGES", "AREAS OF EXPERTISE"), CTA button text, "See Available Tours" mobile CTA
- Credential icon mapping: design shows 5 keyword→icon pairs; credentials are free-text from CMS, so matching must be fuzzy (keyword substring)

## Requirements

**Functional:**
- New translation keys added to all 3 locale files (en, sv, de)
- `getCredentialIcon()` utility returns Lucide icon component + color CSS var for a credential string
- Fallback icon for unmatched credentials

**Non-functional:**
- Icon mapping utility: pure function, ~30 LOC, separate file
- Translation keys follow existing flat structure under `guides` namespace

## A. Translation Keys to Add

Under `guides` namespace in each locale file:

```json
{
  "sidebar": {
    "languages": "Languages",
    "areasOfExpertise": "Areas of Expertise",
    "credentials": "Credentials",
    "specializations": "Specializations",
    "contactGuide": "Contact {name}",
    "seeAvailableTours": "See Available Tours",
    "yearsExperience": "{years}+ years"
  }
}
```

Swedish (`sv.json`):
```json
{
  "sidebar": {
    "languages": "Spr\u00e5k",
    "areasOfExpertise": "Expertomr\u00e5den",
    "credentials": "Meriter",
    "specializations": "Specialiseringar",
    "contactGuide": "Kontakta {name}",
    "seeAvailableTours": "Se tillg\u00e4ngliga turer",
    "yearsExperience": "{years}+ \u00e5r"
  }
}
```

German (`de.json`):
```json
{
  "sidebar": {
    "languages": "Sprachen",
    "areasOfExpertise": "Fachgebiete",
    "credentials": "Qualifikationen",
    "specializations": "Spezialisierungen",
    "contactGuide": "Kontaktieren Sie {name}",
    "seeAvailableTours": "Verf\u00fcgbare Touren ansehen",
    "yearsExperience": "{years}+ Jahre"
  }
}
```

## B. Credential Icon Mapping Utility

Create `apps/web/lib/get-credential-icon.ts`:

```typescript
import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, GraduationCap, Timer, HeartPulse, Users, Award } from 'lucide-react'

interface CredentialIconResult {
  icon: LucideIcon
  colorVar: string
}

const CREDENTIAL_KEYWORDS: Array<{ keywords: string[]; icon: LucideIcon; colorVar: string }> = [
  { keywords: ['certified', 'license', 'authorized'], icon: BadgeCheck, colorVar: '--color-success' },
  { keywords: ['degree', 'university', 'education', 'master', 'bachelor'], icon: GraduationCap, colorVar: '--color-info' },
  { keywords: ['experience', 'years', 'veteran'], icon: Timer, colorVar: '--color-accent' },
  { keywords: ['first aid', 'medical', 'cpr', 'health'], icon: HeartPulse, colorVar: '--color-error' },
  { keywords: ['association', 'member', 'guild', 'society'], icon: Users, colorVar: '--color-primary' },
]

export function getCredentialIcon(credential: string): CredentialIconResult {
  const lower = credential.toLowerCase()
  const match = CREDENTIAL_KEYWORDS.find(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  )
  return match
    ? { icon: match.icon, colorVar: match.colorVar }
    : { icon: Award, colorVar: '--color-text-muted' }
}
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/messages/en.json` |
| Modify | `apps/web/messages/sv.json` |
| Modify | `apps/web/messages/de.json` |
| Create | `apps/web/lib/get-credential-icon.ts` |

## Implementation Steps
1. Add `sidebar` sub-object to `guides` namespace in `en.json`
2. Add `sidebar` sub-object to `guides` namespace in `sv.json`
3. Add `sidebar` sub-object to `guides` namespace in `de.json`
4. Create `get-credential-icon.ts` with keyword matching + fallback
5. Verify TypeScript compiles: `npm run build`

## Todo
- [ ] Add EN translation keys
- [ ] Add SV translation keys
- [ ] Add DE translation keys
- [ ] Create `get-credential-icon.ts`
- [ ] Build verification

## Success Criteria
- All 3 locale files have matching `guides.sidebar.*` keys
- `getCredentialIcon('Certified Guide')` returns `{ icon: BadgeCheck, colorVar: '--color-success' }`
- Unmatched credential returns fallback `Award` icon
- No TypeScript errors

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Swedish/German translations inaccurate | Medium | Low | Placeholder translations, can be refined later |
| Keyword matching misses CMS credential phrasing | Medium | Low | Fallback icon ensures graceful degradation; extend keywords as needed |
| `lucide-react` missing icons | Low | Low | All 6 icons are in standard lucide-react package |

## Security Considerations
None — static data, no user input processing.

## Next Steps
Unblocks Phase 2 (sidebar imports `getCredentialIcon` and uses `guides.sidebar.*` keys).
