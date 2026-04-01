---
phase: 6
title: "Remove Testimonials + LatestPosts Placeholder Sections"
status: todo
priority: medium
effort: 15m
---

# Phase 6: Remove Placeholder Sections

## Overview

Remove Testimonials and LatestPosts sections from the homepage. No CMS collections exist for these — they'll be re-added when blog/testimonials data is available.

## Related Files
- **Modify**: `apps/web/app/(site)/[locale]/(frontend)/page.tsx` — remove imports + JSX
- **Keep** (don't delete): `apps/web/components/home/testimonials.tsx` — may reuse later
- **Keep** (don't delete): `apps/web/components/home/latest-posts.tsx` — may reuse later

## Implementation Steps

1. In `page.tsx`, remove imports for `Testimonials` and `LatestPosts`
2. Remove `<Testimonials />` and `<LatestPosts />` from JSX
3. Keep component files intact (no deletion) for future CMS integration

## Success Criteria
- [ ] Homepage renders without Testimonials section
- [ ] Homepage renders without LatestPosts section
- [ ] Component files still exist for future use
- [ ] No unused import warnings
