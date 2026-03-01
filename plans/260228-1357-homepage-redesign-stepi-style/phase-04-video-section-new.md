# Phase 04: Video Section (New Component)

## Context Links
- [Plan Overview](./plan.md)
- Stepi reference: 2-column layout, left = video with play overlay, right = text + description
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
- **Priority:** P2
- **Status:** complete
- **Description:** Create new "Watch Our Video" section with 2-column layout: left side has a YouTube video embed with play button overlay on thumbnail, right side has heading + descriptive text + CTA. Replaces FindTourCta section.

## Key Insights
- Stepi uses a play button overlay on a thumbnail that reveals a video embed on click
- YouTube embed via iframe with `loading="lazy"` for performance
- Mobile: single column, video on top, text below
- Use a thumbnail image + play button; clicking replaces with iframe (avoids loading YouTube on page load)
- New i18n keys needed under `home.video.*`

## Requirements

### Functional
- Section title: "Watch Our Video" (i18n)
- Left column: video thumbnail with centered play button overlay
- Click play -> replace thumbnail with YouTube iframe embed
- Right column: section tagline, heading, paragraph text, CTA link to /tours
- Mobile: stacked (video first, text below)
- Tablet/Desktop: 2 columns side by side

### Non-Functional
- < 120 lines
- Lazy load YouTube iframe (only on click)
- No third-party video player libraries (YAGNI)
- Accessible: play button has aria-label, iframe has title

## Architecture
New file: `apps/web/components/home/video-section.tsx`. Client component for click interaction.

```
VideoSection (client)
├── Video thumbnail with play overlay (state: showVideo)
├── On click: swap to YouTube iframe
└── Text column with CTA
```

## Related Code Files
- **Create:** `apps/web/components/home/video-section.tsx`
- **Modify:** `apps/web/components/home/index.ts` (add export)

## Implementation Steps

1. Create `apps/web/components/home/video-section.tsx`
2. Component structure:
   ```tsx
   'use client'

   import { useState } from 'react'
   import Image from 'next/image'
   import { Play } from 'lucide-react'
   import { useTranslations } from 'next-intl'
   import { getButtonClassName } from '@/components/ui/button'
   import { Link } from '@/i18n/navigation'

   export function VideoSection() {
     const [showVideo, setShowVideo] = useState(false)
     const t = useTranslations('home.video')
     // YouTube video ID -- can be made configurable via CMS later
     const videoId = 'PLACEHOLDER_ID'

     return (
       <section className="bg-[var(--color-background-alt)] py-16 md:py-24">
         <div className="container mx-auto px-4 lg:px-8">
           <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
             {/* Video Column */}
             <div className="relative aspect-video overflow-hidden rounded-2xl">
               {showVideo ? (
                 <iframe
                   src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                   title={t('iframeTitle')}
                   allow="autoplay; encrypted-media"
                   allowFullScreen
                   className="h-full w-full"
                 />
               ) : (
                 <button
                   onClick={() => setShowVideo(true)}
                   className="group relative h-full w-full"
                   aria-label={t('playButton')}
                 >
                   <Image src="..." alt={t('thumbnailAlt')} fill
                     className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                   <div className="absolute inset-0 bg-black/30 transition-opacity
                     group-hover:bg-black/40" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="flex h-16 w-16 items-center justify-center
                       rounded-full bg-[var(--color-secondary)] text-[var(--color-primary-dark)]
                       shadow-xl transition-transform group-hover:scale-110">
                       <Play className="h-7 w-7 fill-current" />
                     </div>
                   </div>
                 </button>
               )}
             </div>

             {/* Text Column */}
             <div>
               <span className="mb-3 inline-block text-sm font-semibold uppercase
                 tracking-wider text-[var(--color-secondary)]">
                 {t('tagline')}
               </span>
               <h2 className="mb-4 font-serif text-3xl font-bold
                 text-[var(--color-primary)] md:text-4xl">
                 {t('title')}
               </h2>
               <p className="mb-6 text-[var(--color-text-muted)] leading-relaxed">
                 {t('description')}
               </p>
               <Link href="/tours" className={getButtonClassName('primary', 'lg')}>
                 {t('cta')}
               </Link>
             </div>
           </div>
         </div>
       </section>
     )
   }
   ```
3. Add export to `apps/web/components/home/index.ts`
4. Add i18n keys under `home.video` in all 3 locale files (Phase 11 handles full translations)

## Todo List
- [x] Create `video-section.tsx`
- [x] Thumbnail + play overlay with click-to-embed
- [x] 2-column layout (stacked mobile, side-by-side desktop)
- [x] YouTube iframe with `loading="lazy"` approach
- [x] i18n translation keys
- [x] Add export to index.ts
- [x] Accessible play button (aria-label)
- [x] File under 120 lines

## Success Criteria
- Video thumbnail shows with play button overlay
- Clicking play loads YouTube iframe with autoplay
- Mobile: stacked layout
- Desktop: 2-column side-by-side
- All text uses i18n keys
- No YouTube JS loaded until user clicks

## Risk Assessment
- **Low:** No external deps beyond YouTube iframe
- **Note:** YouTube video ID is placeholder -- needs real video before launch
- **Mitigation:** Use a Stockholm tourism stock video as placeholder

## Security Considerations
- YouTube iframe uses `allow="autoplay; encrypted-media"` only
- No `allow-scripts` or `allow-same-origin` beyond defaults

## Next Steps
Phase 09 places this section after TrustSignals in page.tsx.
