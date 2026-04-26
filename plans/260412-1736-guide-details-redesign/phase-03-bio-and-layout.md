# Phase 03 — Bio Section Refactor + Page Layout Rewrite

## Context
- [Design spec](research/researcher-01-design-spec.md) — Right Column, Bio Section
- [page.tsx](../../apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx)
- [guide-detail-content.tsx](../../apps/web/components/guide/guide-detail-content.tsx)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1.5h
- **Blocked by:** Phase 2 (sidebar component)

Two changes: (A) rename `guide-detail-content.tsx` → `guide-detail-bio.tsx` with simplified content (bio only — credentials/specializations moved to sidebar), and (B) rewrite `page.tsx` layout from current header+grid to split-panel flex.

## Key Insights
- Current `guide-detail-content.tsx` renders bio + credentials + specializations — credentials and specializations move to sidebar, so this becomes bio-only
- Page layout changes from `container` grid to full-width flex with sidebar + right column
- Breadcrumb placement differs: desktop inside right column, mobile separate bar above content
- `GuideDetailSchema` (structured data) stays in page — no visual change

## Requirements

**Functional:**
- Bio section: heading "About {name}" (Playfair 32px/22px) + RichText body (Inter 15px/14px, line-height 1.7/1.65)
- Page layout desktop: `flex` with sidebar (450px) + right column (flex-1, padding 40px 64px, gap 40px)
- Page layout mobile: single column — sidebar-as-header, breadcrumb bar, bio, tours
- Breadcrumb: desktop inside right column top; mobile separate `bg-background-alt` bar

**Non-functional:**
- `page.tsx` stays under 200 LOC (currently 93 lines, target ~80)
- `guide-detail-bio.tsx` should be ~40 LOC (down from 64)

## Architecture

### New page.tsx structure
```tsx
<>
  <GuideDetailSchema ... />
  <Header variant="solid" />
  <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
    {/* Mobile breadcrumb */}
    <div className="bg-[var(--color-background-alt)] px-5 py-3 lg:hidden">
      <Breadcrumb items={breadcrumbs} />
    </div>
    
    {/* Split panel container */}
    <div className="flex flex-col lg:flex-row">
      {/* Sidebar */}
      <GuideDetailSidebar guide={guide} />
      
      {/* Right column */}
      <div className="flex-1 px-5 py-6 lg:px-16 lg:py-10">
        {/* Desktop breadcrumb */}
        <div className="mb-10 hidden lg:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
        
        <div className="space-y-10">
          <GuideDetailBio guide={guide} />
          {guide.tours.length > 0 && (
            <GuideToursSection tours={guide.tours} guideName={guide.name} />
          )}
        </div>
      </div>
    </div>
  </main>
  <GuideStickyCta guideName={guide.name} tourCount={guide.tours.length} />
  <Footer />
</>
```

## Related Code Files
| Action | File |
|--------|------|
| Rename+Simplify | `apps/web/components/guide/guide-detail-content.tsx` → `guide-detail-bio.tsx` |
| Rewrite | `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx` |
| Modify | `apps/web/components/guide/index.ts` (update export) |

## Implementation Steps

### A. Bio component
1. Create `guide-detail-bio.tsx` (new file):
   - Props: `{ guide: GuideDetail }`
   - Async server component with `getTranslations('guides')`
   - Render heading: `t('about', { name: guide.name })` with `font-serif text-[32px] lg:text-[22px]` — wait, design says desktop 32px, mobile 22px: `text-[22px] lg:text-[32px]`
   - Render bio via `<RichText data={guide.bio} />` with prose styling
   - No credentials, no specializations (they're in sidebar now)

2. Delete `guide-detail-content.tsx`

3. Update `index.ts`: replace `GuideDetailContent` export with `GuideDetailBio`

### B. Page layout rewrite
4. Rewrite `page.tsx` layout:
   - Remove old `GuideDetailHeader` import, add `GuideDetailSidebar`, `GuideDetailBio`, `GuideStickyCta`
   - Remove container/grid layout
   - Add flex split-panel as shown in architecture above
   - Mobile breadcrumb: `bg-[var(--color-background-alt)]` bar, hidden on lg
   - Desktop breadcrumb: inside right column, hidden below lg

5. Keep `generateMetadata` and `generateStaticParams` unchanged

6. Verify page still SSR renders correctly with `npm run build`

## Todo
- [ ] Create `guide-detail-bio.tsx` (bio-only, ~40 LOC)
- [ ] Delete `guide-detail-content.tsx`
- [ ] Rewrite `page.tsx` with split-panel flex layout
- [ ] Dual breadcrumb placement (mobile bar + desktop inline)
- [ ] Update barrel exports
- [ ] Build verification

## Success Criteria
- Desktop: sidebar + right column flex layout renders correctly
- Mobile: single column with breadcrumb bar, sidebar-as-header, then bio + tours
- Bio section shows heading + rich text only (no credentials/specializations)
- Page under 200 LOC
- Structured data (GuideDetailSchema) still present

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Layout shift on sidebar/content boundary | Medium | Medium | Test at 1024px breakpoint specifically |
| RichText prose styling conflicts with new layout | Low | Low | Existing `prose max-w-none` class handles it |
| Old component import breaks other pages | Low | High | Grep for `GuideDetailContent` imports — only used in this page |

## Security Considerations
None — layout/display changes only.

## Next Steps
After this phase, the page has its final structure. Phase 4 updates tour cards, Phase 5 adds sticky CTA.
