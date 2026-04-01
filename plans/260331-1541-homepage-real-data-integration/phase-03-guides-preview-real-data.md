---
phase: 3
title: "GuidesPreview: Accept Real Guide Data as Props"
status: todo
priority: high
effort: 45m
---

# Phase 3: GuidesPreview — Real CMS Data

## Overview

Replace hardcoded fake guides with real `GuideListItem[]` data passed as props from server component.

## Related Files
- **Modify**: `apps/web/components/home/guides-preview.tsx`
- **Reference**: `apps/web/lib/api/get-guides.ts` (GuideListItem interface)

## Implementation Steps

1. Import `GuideListItem` type from `@/lib/api/get-guides`
2. Add props interface: `{ guides: GuideListItem[] }`
3. Remove hardcoded `guides` array and local `Guide` interface
4. Update rendering to use `GuideListItem` shape:
   - `guide.image` → `guide.photo?.url` (optional, needs fallback)
   - `guide.specialty` → derive from `guide.specializations[0]?.name` or `guide.operatingAreas[0]?.name`
   - `guide.name` stays the same
5. Add placeholder avatar for guides without photos (unlikely but defensive)
6. Handle empty state: if `guides.length === 0`, don't render section
7. Link each guide to `/guides/${guide.slug}`

## Key Changes

```diff
- const guides: Guide[] = [/* hardcoded */]
+ interface GuidesPreviewProps { guides: GuideListItem[] }

- export function GuidesPreview() {
+ export function GuidesPreview({ guides }: GuidesPreviewProps) {
+   if (guides.length === 0) return null

  // Image:
- <Image src={guide.image} alt={guide.name} ... />
+ <Image src={guide.photo?.url ?? '/images/guide-placeholder.svg'} alt={guide.name} ... />

  // Specialty:
- <p>{guide.specialty}</p>
+ <p>{guide.specializations[0]?.name ?? guide.operatingAreas[0]?.name ?? ''}</p>
```

## Success Criteria
- [ ] Renders real guide photos from CMS
- [ ] Guide names match CMS data
- [ ] Specialization/area shown as subtitle
- [ ] Each guide links to `/guides/{slug}`
- [ ] Empty state handled
