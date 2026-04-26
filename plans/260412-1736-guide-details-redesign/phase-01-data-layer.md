# Phase 01 — Data Layer Update

## Context
- [get-guide-by-slug.ts](../../apps/web/lib/api/get-guide-by-slug.ts)
- [CMS guides collection](../../packages/cms/collections/guides.ts)
- CMS already has `yearsExperience` field (number, min 0 max 60) — added via recent migration `fd84bbb`

## Overview
- **Priority:** P1 (blocks Phase 2 sidebar)
- **Status:** Pending
- **Effort:** 0.5h

Add `yearsExperience` to the `GuideDetail` TypeScript interface and include it in the Payload query return object.

## Key Insights
- Field exists in CMS but is NOT in the `GuideDetail` interface or the return mapping in `getGuideBySlug()`
- No schema migration needed — column already present
- `additionalLanguages` is already fetched and returned

## Requirements
**Functional:** Expose `yearsExperience: number | undefined` on `GuideDetail` so sidebar can display it.
**Non-functional:** Zero runtime impact — just adds one field to existing query result mapping.

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/lib/api/get-guide-by-slug.ts` |

## Implementation Steps
1. Add `yearsExperience?: number` to the `GuideDetail` interface (after `status` field)
2. In `getGuideBySlug()` return object (~line 100), add: `yearsExperience: typeof doc.yearsExperience === 'number' ? doc.yearsExperience : undefined`
3. Run `npm run build` to verify no type errors

## Todo
- [ ] Add `yearsExperience` to `GuideDetail` interface
- [ ] Map `yearsExperience` in `getGuideBySlug` return object
- [ ] Verify build passes

## Success Criteria
- `GuideDetail` type includes `yearsExperience?: number`
- Existing tests still pass
- No breaking changes to consumers of `GuideDetail`

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Field missing in CMS for some guides | Low | Low | Optional field (`?`), sidebar renders "N/A" or hides |

## Security Considerations
None — read-only public data, no PII exposure.

## Next Steps
Unblocks Phase 2 (sidebar uses `yearsExperience` for experience credential display).
