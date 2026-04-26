---
title: Existing Code Analysis — Guide Detail Redesign
date: 2026-04-12
researcher: researcher-02
---

## CMS Data Model (`packages/cms/collections/guides.ts`)

Field inventory with types:

| Field | Type | Notes |
|---|---|---|
| name | text | required |
| slug | text | unique, indexed |
| status | select | active / inactive / on-leave |
| bio | richText | localized |
| credentials | array[{credential: text}] | localized, max 20 |
| photo | upload → media | |
| email / phone | text | sidebar, not public |
| languages | select hasMany | sv/en/de/fr/es/it |
| additionalLanguages | select hasMany | 13 options |
| specializations | relationship → categories | hasMany |
| operatingAreas | relationship → cities | hasMany |
| **yearsExperience** | number | min 0 max 60 — **present in CMS** |

**Key finding:** `yearsExperience` exists in CMS (added via recent migration). The `GuideDetail` interface in `get-guide-by-slug.ts` must be verified — if missing, it needs to be added to both the query and the TypeScript interface.

---

## CSS Design Tokens (`apps/web/app/globals.css`)

All tokens available via Tailwind `@theme inline` — use as `text-primary`, `bg-background-alt`, etc.:

- **Colors:** `primary` (#1E3A5F), `secondary` (#856C2D), `secondary-light` (#C4A052), `accent` (#C05030), `background-alt` (#F5F5F3), `surface` (#FFF), `muted` (text-muted), `border`
- **Radius:** `sm/md/lg/xl/2xl/full`
- **Shadows:** `shadow-card`, `shadow-card-hover`, `shadow-md`, `shadow-lg`
- **Typography:** `font-serif` (Playfair), `font-body` (Inter)
- **Transitions:** `transition-normal` (300ms)

No gaps — all tokens a premium redesign would need are present.

---

## `guide-card.tsx` — Reusable Patterns

The recently redesigned `GuideCard` (used on tour detail page) shows mature patterns:

1. **Avatar:** `relative h-20 w-20 shrink-0` with `fill` Image + `rounded-full` + `blurDataURL` placeholder — copy this verbatim for hero photo thumbnail
2. **Card shell:** `rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:p-6` — consistent card framing
3. **Name link:** `font-serif text-lg font-semibold` + `text-primary underline-offset-2 hover:underline`
4. **Meta line:** `text-[13px] text-[var(--color-text-muted)]` dot-separated parts
5. **Bio:** `text-sm leading-relaxed text-[var(--color-text)]`
6. **Async server component** pattern with `getTranslations` — same pattern applies to redesigned header

---

## What Needs to Change

### `get-guide-by-slug.ts` (data layer)
- Add `yearsExperience` to the Payload query select + `GuideDetail` interface
- Verify `additionalLanguages` is already included (it is per known interface)

### `guide-detail-header.tsx` — full rewrite
Current: flat photo (128/160px rounded), name, on-leave badge, comma-list languages/areas.
Needed for redesign:
- Larger hero photo (full-bleed or large portrait) vs current small circle
- Stats bar: tour count, yearsExperience, language count — requires `yearsExperience` from data layer
- Language badges (pill chips) instead of comma string
- Operating areas as location chips
- Sticky CTA or "Book" button region (if in scope)

### `guide-detail-content.tsx`
- Minor: credentials currently rendered as outline badges — likely stays; verify badge style matches redesign
- `specializations` currently secondary badges — may need icon treatment

### `guide-tours-section.tsx`
- 3-col grid card layout is solid; assess if card style needs to match new `TourCard` from Phase 15 redesign
- Price badge overlay pattern — keep

### `en.json` translation additions needed
- `stats.experience` key exists (`stats.tours` and `stats.experience` both present per known keys)
- May need: `stats.languages` if adding language count stat
- Badge label for `yearsExperience` unit (e.g. "yrs" or "years")

---

## Reuse vs Rewrite Summary

| Component | Action | Reason |
|---|---|---|
| `guide-detail-header.tsx` | Full rewrite | Layout fundamentally changes |
| `guide-detail-content.tsx` | Incremental edits | Bio/credentials/specs — mostly structural tweaks |
| `guide-tours-section.tsx` | Card style update only | Grid is fine; card skin may need alignment |
| `guide-card.tsx` | Reference only — do not modify | It's for tour detail page, different context |
| `get-guide-by-slug.ts` | Add yearsExperience field | Data gap vs CMS |

---

## Unresolved Questions

1. **Design spec not reviewed** — what exactly does the redesigned header look like (full-bleed photo? floating card? gradient overlay)? This determines rewrite scope for `guide-detail-header.tsx`.
2. **`get-guide-by-slug.ts` query** — need to confirm whether `yearsExperience` is already selected in the Payload query or only missing from the TypeScript interface.
3. **`additionalLanguages` display** — current header shows comma list; redesign may want merged languages (primary + additional) as a unified badge set. Merging logic needs decision.
4. **Sticky CTA** — is a "Book a tour" / "Contact" button part of the redesign? Not covered by existing components.
5. **Tour card alignment** — does `guide-tours-section.tsx` need to use the same `TourCard` component introduced in the guides listing Phase 15 redesign, or keep its own card?
