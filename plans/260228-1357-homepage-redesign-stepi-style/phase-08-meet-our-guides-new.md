# Phase 08: Meet Our Guides (New Component)

## Context Links
- [Plan Overview](./plan.md)
- Stepi reference: circular avatar cards with name, role, social links
- [Guide listing page](../../apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx)
- [Guide listing card](../../apps/web/components/guide/guide-listing-card.tsx)

## Overview
- **Priority:** P2
- **Status:** complete
- **Description:** Create new "Meet Our Guides" section with circular avatar cards showing guide photo, name, specialty, and social links. Matches Stepi team section pattern.

## Key Insights
- Project already has a guide system: Guides CMS collection + guide listing page + guide detail pages
- Homepage section should be a teaser: 3-4 featured guides with link to /guides page
- Stepi uses circular avatars with centered text below and small social icons
- Keep data hardcoded for now (matching existing pattern in other home components)
- Future: fetch from Payload CMS Guides collection
- New i18n keys: `home.guides.*`

## Requirements

### Functional
- Section header: tagline + "Meet Our Expert Guides" title (i18n)
- 3-4 guide cards in horizontal row
- Each card: circular avatar image (150px), name, specialty/role, brief tagline
- Social links: small icon buttons (Instagram, LinkedIn) below name
- "Meet All Guides" CTA link to /guides page
- Mobile: 2-column grid or horizontal scroll
- Desktop: 3-4 columns centered

### Non-Functional
- < 120 lines
- Circular images with Next.js Image (rounded-full, fixed size)
- No external carousel library (simple grid)
- Hover: subtle scale on avatar

## Architecture
New file: `apps/web/components/home/meet-our-guides.tsx`. Can be server or client component (no interactivity needed beyond links). Use client for consistency with other home components.

```
MeetOurGuides (client)
├── Section header
├── Guides grid (3-4 cards)
│   └── GuideCard: avatar, name, role, social icons
└── "Meet All Guides" CTA
```

## Related Code Files
- **Create:** `apps/web/components/home/meet-our-guides.tsx`
- **Modify:** `apps/web/components/home/index.ts` (add export)
- **Reference:** `apps/web/components/guide/guide-listing-card.tsx` (existing patterns)

## Implementation Steps

1. Create `apps/web/components/home/meet-our-guides.tsx`
2. Define guide data (hardcoded, matching existing pattern):
   ```tsx
   const featuredGuides = [
     {
       id: 'johan',
       name: 'Johan Lindberg',
       role: 'History Specialist',
       avatar: 'https://images.unsplash.com/photo-...',
       instagram: '#',
       linkedin: '#',
     },
     // 3-4 guides total
   ]
   ```
3. Component structure:
   ```tsx
   export function MeetOurGuides() {
     const t = useTranslations('home.guides')

     return (
       <section className="bg-[var(--color-background)] py-16 md:py-24"
         aria-label={t('ariaLabel')}>
         <div className="container mx-auto px-4 lg:px-8">
           {/* Header */}
           <div className="mb-12 text-center">
             <span className="mb-3 inline-block text-sm font-semibold uppercase
               tracking-wider text-[var(--color-secondary)]">
               {t('tagline')}
             </span>
             <h2 className="mb-4 font-serif text-3xl font-bold
               text-[var(--color-primary)] md:text-4xl">
               {t('title')}
             </h2>
           </div>

           {/* Guides Grid */}
           <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
             {featuredGuides.map((guide) => (
               <div key={guide.id} className="text-center">
                 {/* Avatar */}
                 <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full
                   border-4 border-[var(--color-secondary)]/20 md:h-40 md:w-40">
                   <Image src={guide.avatar} alt={guide.name}
                     width={160} height={160}
                     className="h-full w-full object-cover" />
                 </div>
                 {/* Info */}
                 <h3 className="font-serif text-lg font-semibold
                   text-[var(--color-primary)]">{guide.name}</h3>
                 <p className="mb-3 text-sm text-[var(--color-text-muted)]">
                   {guide.role}
                 </p>
                 {/* Social */}
                 <div className="flex justify-center gap-3">
                   <a href={guide.instagram} aria-label={`${guide.name} Instagram`}
                     className="text-[var(--color-text-muted)]
                       hover:text-[var(--color-secondary)] transition-colors">
                     <Instagram className="h-4 w-4" />
                   </a>
                   <a href={guide.linkedin} aria-label={`${guide.name} LinkedIn`}
                     className="text-[var(--color-text-muted)]
                       hover:text-[var(--color-secondary)] transition-colors">
                     <Linkedin className="h-4 w-4" />
                   </a>
                 </div>
               </div>
             ))}
           </div>

           {/* CTA */}
           <div className="mt-12 text-center">
             <Link href="/guides"
               className={getButtonClassName('outline-dark', 'lg')}>
               {t('viewAll')}
             </Link>
           </div>
         </div>
       </section>
     )
   }
   ```
4. Add export to `index.ts`
5. Use professional-looking Unsplash avatar photos
6. Social links are placeholders ('#') for now

## Todo List
- [x] Create `meet-our-guides.tsx`
- [x] 4 guide cards with circular avatars
- [x] Name, role, social icon links
- [x] 2-col mobile / 4-col desktop grid
- [x] Gold border accent on avatars
- [x] "Meet All Guides" CTA to /guides
- [x] i18n keys for section text
- [x] Add export to index.ts
- [x] File under 120 lines

## Success Criteria
- Circular avatar cards with name and role
- Social icon links (Instagram, LinkedIn)
- 2-col mobile, 4-col desktop
- Gold accent borders on avatars
- CTA links to /guides page
- All section text uses i18n keys

## Risk Assessment
- **Low:** Simple presentational component
- **Note:** Social links are placeholders -- need real guide profiles before launch
- **Note:** Guide data is hardcoded; future integration with CMS Guides collection

## Security Considerations
- Social links open in same tab (internal section, not external) -- `target="_blank"` with `rel="noopener noreferrer"` for external links

## Next Steps
Phase 09 positions this after SeasonalTabs, before Footer.
