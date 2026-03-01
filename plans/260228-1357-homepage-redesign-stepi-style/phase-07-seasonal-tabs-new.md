# Phase 07: Seasonal Tabs (New Component)

## Context Links
- [Plan Overview](./plan.md)
- Stepi reference: "Let's Travel All Year Round" with Winter/Spring/Summer/Autumn tabs, each showing imagery + description + CTA
- Replaces: CategoryNav section

## Overview
- **Priority:** P2
- **Status:** complete
- **Description:** Create new tabbed section with 4 seasonal tabs (Winter/Spring/Summer/Autumn). Each tab shows a background image, season description, and booking CTA. Replaces CategoryNav.

## Key Insights
- Stepi uses horizontal tab buttons across top, content area below changes on click
- Each season: full-width image bg with overlay + text content
- Mobile: tabs should be horizontally scrollable if needed, or stack as 2x2 grid
- Simple `useState` for active tab -- no need for Radix Tabs (YAGNI)
- Content per season: image, title, description paragraph, CTA link
- New i18n keys needed: `home.seasonal.*`
- Sweden has distinct seasons making this highly relevant for a Stockholm tour company

## Requirements

### Functional
- Section header: tagline + "Travel All Year Round" title (i18n)
- 4 tab buttons: Winter, Spring, Summer, Autumn (horizontal row)
- Active tab: gold underline/highlight
- Tab content: large image area with overlay + season title, description, CTA
- CTA links to `/tours?season={season}` or just `/tours`
- Mobile: tab buttons in scrollable row, content stacked below
- Desktop: tab buttons centered, content area with image+text overlay

### Non-Functional
- < 150 lines
- No external tab library (simple useState)
- Smooth tab content transition (opacity fade)
- Images use Next.js Image with appropriate sizes
- All text i18n-ready

## Architecture
New file: `apps/web/components/home/seasonal-tabs.tsx`. Client component for tab interaction.

```
SeasonalTabs (client)
├── Section header (tagline + title)
├── Tab buttons row (4 seasons)
└── Tab content panel
    ├── Background image + overlay
    └── Text content (title, description, CTA)
```

## Related Code Files
- **Create:** `apps/web/components/home/seasonal-tabs.tsx`
- **Modify:** `apps/web/components/home/index.ts` (add export)

## Implementation Steps

1. Create `apps/web/components/home/seasonal-tabs.tsx`
2. Define seasons data array:
   ```tsx
   const seasons = [
     {
       id: 'winter',
       image: 'https://images.unsplash.com/photo-...winter-stockholm',
       // title, description, cta come from i18n
     },
     { id: 'spring', image: '...' },
     { id: 'summer', image: '...' },
     { id: 'autumn', image: '...' },
   ]
   ```
3. Tab buttons layout (mobile-first):
   ```tsx
   <div className="mb-8 flex justify-center gap-2">
     {seasons.map((season) => (
       <button
         key={season.id}
         onClick={() => setActiveSeason(season.id)}
         className={cn(
           'rounded-full px-5 py-2.5 text-sm font-medium transition-all',
           activeSeason === season.id
             ? 'bg-[var(--color-secondary)] text-[var(--color-primary-dark)]'
             : 'bg-[var(--color-primary)]/10 text-[var(--color-text)]
                hover:bg-[var(--color-primary)]/20'
         )}
         aria-pressed={activeSeason === season.id}
       >
         {t(`seasons.${season.id}`)}
       </button>
     ))}
   </div>
   ```
4. Tab content panel:
   ```tsx
   <div className="relative overflow-hidden rounded-2xl">
     {/* Active season image + overlay */}
     <div className="relative aspect-[16/9] md:aspect-[21/9]">
       <Image
         src={activeSeason.image}
         alt={t(`${activeSeason.id}.imageAlt`)}
         fill className="object-cover"
         sizes="100vw"
       />
       <div className="absolute inset-0 bg-gradient-to-r
         from-[var(--color-primary-dark)]/80 via-[var(--color-primary-dark)]/50
         to-transparent" />
       {/* Text overlay */}
       <div className="absolute inset-0 flex items-center p-8 md:p-12">
         <div className="max-w-lg">
           <h3 className="mb-3 font-serif text-2xl font-bold text-white md:text-3xl">
             {t(`${activeSeason.id}.title`)}
           </h3>
           <p className="mb-6 text-white/80">
             {t(`${activeSeason.id}.description`)}
           </p>
           <Link href="/tours" className={getButtonClassName('secondary', 'lg')}>
             {t('cta')}
           </Link>
         </div>
       </div>
     </div>
   </div>
   ```
5. Add fade transition on tab change:
   ```tsx
   <div key={activeSeason} className="animate-fade-in">
     {/* content */}
   </div>
   ```
6. Add export to `index.ts`
7. Season images: use Stockholm seasonal Unsplash photos (winter snow, spring blossoms, summer waterfront, autumn colors)

## Todo List
- [x] Create `seasonal-tabs.tsx`
- [x] 4 season tab buttons with active state
- [x] Tab content: image with overlay + text
- [x] Fade transition between tabs
- [x] Mobile-first responsive (scrollable tabs, stacked content)
- [x] i18n keys for all season text
- [x] Add export to index.ts
- [x] Accessible tab buttons (aria-pressed)
- [x] File under 150 lines

## Success Criteria
- 4 clickable season tabs with visual active state
- Each tab shows unique seasonal image with text overlay
- Smooth fade transition between tabs
- Mobile: full-width, stacked
- Desktop: centered tabs, wide content panel
- All text uses i18n keys

## Risk Assessment
- **Low:** Self-contained, useState-only state management
- **Note:** Seasonal images are placeholders; real images needed before launch
- **Note:** `?season=` query param on /tours may not be supported yet -- use plain /tours for now

## Security Considerations
None.

## Next Steps
Phase 09 positions this after Testimonials in page.tsx.
