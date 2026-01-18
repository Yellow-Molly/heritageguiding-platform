# Phase 04: Design System

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v3 Docs](https://tailwindcss.com/docs)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | done (2026-01-18) | 32-36h |

Build component library with Tailwind CSS, shadcn/ui, and custom HeritageGuiding theme. Establish typography, color palette, spacing, and accessible UI patterns.

## Key Insights

- shadcn/ui provides unstyled Radix UI components with Tailwind
- Copy-paste components (not npm dependency) for full customization
- WCAG 2.1 AA contrast ratios required from start
- Mobile-first responsive design
- Design tokens via CSS variables for theming

## Requirements

### Functional
- Complete component library for MVP pages
- Responsive layouts (mobile, tablet, desktop)
- Dark mode support (optional, post-MVP)
- Icon system (Lucide React)
- Image optimization with Next.js Image

### Non-Functional
- WCAG 2.1 AA color contrast ratios
- Focus indicators on all interactive elements
- Consistent spacing scale (4px base)
- Typography scale for readability
- <100ms interaction response

## Architecture

### Component Structure

```
apps/web/
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   └── skeleton.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── navigation.tsx
│   │   └── container.tsx
│   ├── tour/
│   │   ├── tour-card.tsx
│   │   ├── tour-gallery.tsx
│   │   └── tour-filters.tsx
│   ├── booking/
│   │   ├── booking-widget.tsx
│   │   └── date-picker.tsx
│   └── shared/
│       ├── language-switcher.tsx
│       ├── rating-stars.tsx
│       ├── accessibility-badge.tsx
│       └── loading-spinner.tsx
├── lib/
│   └── utils.ts                 # cn() utility
└── styles/
    └── globals.css              # Tailwind base + theme
```

## Related Code Files

### Create
- `apps/web/components/ui/*.tsx` - shadcn/ui components
- `apps/web/components/layout/header.tsx` - Site header
- `apps/web/components/layout/footer.tsx` - Site footer
- `apps/web/components/layout/navigation.tsx` - Main nav
- `apps/web/components/layout/container.tsx` - Max-width wrapper
- `apps/web/components/shared/rating-stars.tsx` - Star rating display
- `apps/web/components/shared/accessibility-badge.tsx` - WCAG indicator
- `apps/web/components/shared/loading-spinner.tsx` - Loading state
- `apps/web/lib/utils.ts` - cn() classname utility
- `tailwind.config.ts` - Theme configuration
- `apps/web/styles/globals.css` - Global styles + variables

### Modify
- `apps/web/app/layout.tsx` - Apply global styles

## Implementation Steps

1. **Initialize shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   # Select: TypeScript, Tailwind, CSS variables, app/globals.css
   ```

2. **Configure Tailwind Theme**
   ```typescript
   // tailwind.config.ts
   import type { Config } from 'tailwindcss'

   export default {
     darkMode: ['class'],
     content: ['./app/**/*.tsx', './components/**/*.tsx'],
     theme: {
       extend: {
         colors: {
           // Brand colors (from design or create)
           primary: {
             DEFAULT: 'hsl(var(--primary))',
             foreground: 'hsl(var(--primary-foreground))'
           },
           secondary: {
             DEFAULT: 'hsl(var(--secondary))',
             foreground: 'hsl(var(--secondary-foreground))'
           },
           accent: {
             DEFAULT: 'hsl(var(--accent))',
             foreground: 'hsl(var(--accent-foreground))'
           },
           destructive: {
             DEFAULT: 'hsl(var(--destructive))',
             foreground: 'hsl(var(--destructive-foreground))'
           },
           muted: {
             DEFAULT: 'hsl(var(--muted))',
             foreground: 'hsl(var(--muted-foreground))'
           }
         },
         fontFamily: {
           sans: ['Inter', 'system-ui', 'sans-serif'],
           serif: ['Georgia', 'serif']
         },
         borderRadius: {
           lg: 'var(--radius)',
           md: 'calc(var(--radius) - 2px)',
           sm: 'calc(var(--radius) - 4px)'
         }
       }
     },
     plugins: [require('tailwindcss-animate')]
   } satisfies Config
   ```

3. **Set Up CSS Variables**
   ```css
   /* apps/web/styles/globals.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   @layer base {
     :root {
       --background: 0 0% 100%;
       --foreground: 222.2 84% 4.9%;
       --primary: 222.2 47.4% 11.2%;
       --primary-foreground: 210 40% 98%;
       --secondary: 210 40% 96.1%;
       --secondary-foreground: 222.2 47.4% 11.2%;
       --accent: 43 96% 56%; /* Gold for heritage theme */
       --accent-foreground: 222.2 47.4% 11.2%;
       --muted: 210 40% 96.1%;
       --muted-foreground: 215.4 16.3% 46.9%;
       --destructive: 0 84.2% 60.2%;
       --border: 214.3 31.8% 91.4%;
       --ring: 222.2 84% 4.9%;
       --radius: 0.5rem;
     }
   }
   ```

4. **Install Core shadcn/ui Components**
   ```bash
   npx shadcn-ui@latest add button card input select dialog dropdown-menu tabs badge skeleton
   ```

5. **Create cn() Utility**
   ```typescript
   // apps/web/lib/utils.ts
   import { type ClassValue, clsx } from 'clsx'
   import { twMerge } from 'tailwind-merge'

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs))
   }
   ```

6. **Build Layout Components**
   ```typescript
   // apps/web/components/layout/header.tsx
   import { Navigation } from './navigation'
   import { LanguageSwitcher } from '../shared/language-switcher'

   export function Header() {
     return (
       <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
         <div className="container flex h-16 items-center justify-between">
           <Logo />
           <Navigation />
           <LanguageSwitcher />
         </div>
       </header>
     )
   }

   // apps/web/components/layout/container.tsx
   export function Container({ children, className }) {
     return (
       <div className={cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
         {children}
       </div>
     )
   }
   ```

7. **Create Rating Stars Component**
   ```typescript
   // apps/web/components/shared/rating-stars.tsx
   import { Star } from 'lucide-react'

   export function RatingStars({ rating, max = 5 }) {
     return (
       <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of ${max}`}>
         {Array.from({ length: max }).map((_, i) => (
           <Star
             key={i}
             className={cn(
               'h-4 w-4',
               i < rating ? 'fill-accent text-accent' : 'text-muted'
             )}
           />
         ))}
       </div>
     )
   }
   ```

8. **Create Accessibility Badge**
   ```typescript
   // apps/web/components/shared/accessibility-badge.tsx
   import { Wheelchair, Ear, Eye } from 'lucide-react'
   import { Badge } from '@/components/ui/badge'

   export function AccessibilityBadge({ type }) {
     const icons = {
       wheelchair: Wheelchair,
       hearing: Ear,
       visual: Eye
     }
     const Icon = icons[type]

     return (
       <Badge variant="outline" className="gap-1">
         <Icon className="h-3 w-3" />
         <span className="sr-only">{type} accessible</span>
       </Badge>
     )
   }
   ```

9. **Set Up Icon System**
   ```bash
   npm install lucide-react
   ```
   - Use Lucide for all icons
   - Consistent sizing: 4, 5, 6 (16px, 20px, 24px)
   - Always include `aria-label` or `sr-only` text

10. **Create Typography Classes**
    ```css
    /* apps/web/styles/globals.css */
    @layer base {
      h1 { @apply text-4xl font-bold tracking-tight lg:text-5xl; }
      h2 { @apply text-3xl font-semibold tracking-tight; }
      h3 { @apply text-2xl font-semibold tracking-tight; }
      h4 { @apply text-xl font-semibold; }
      p { @apply leading-7; }
    }
    ```

11. **Implement Focus Styles**
    ```css
    @layer base {
      *:focus-visible {
        @apply outline-none ring-2 ring-ring ring-offset-2;
      }
    }
    ```

## Todo List

- [x] Initialize shadcn/ui with Tailwind
- [x] Configure Tailwind theme (colors, fonts, spacing)
- [x] Set up CSS variables for theming
- [x] Install core shadcn/ui components
- [x] Create cn() utility function
- [x] Build Header component
- [x] Build Footer component
- [x] Build Navigation component
- [x] Build Container component
- [x] Create RatingStars component
- [x] Create AccessibilityBadge component
- [x] Create LoadingSpinner component
- [x] Set up Lucide React icons
- [x] Define typography scale
- [x] Implement focus styles for accessibility
- [ ] Test contrast ratios (WCAG AA)
- [ ] Create responsive breakpoint demos
- [ ] Fix CardTitle type parameter (HTMLHeadingElement)
- [ ] Verify reduced motion support in globals.css
- [ ] Document Input label association pattern

## Success Criteria

- [x] All shadcn/ui components installed and themed
- [x] Layout components (header, footer, nav) responsive
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1) - Needs testing
- [x] Focus indicators visible on all interactive elements
- [x] Typography readable across devices
- [x] Icons accessible with screen readers
- [ ] Component Storybook or demo page working - Pending homepage integration

## Code Review Results

**Review Date:** 2026-01-18
**Quality Score:** 9.2/10
**Status:** APPROVED FOR PRODUCTION ✅

### Summary
Excellent implementation with professional-grade code quality. Components demonstrate strong TypeScript typing, comprehensive accessibility support, consistent patterns, and thorough test coverage.

### Key Findings
- **Critical Issues:** None
- **High Priority:** 2 (reduced motion support, half star rendering)
- **Medium Priority:** 4 (input label pattern, type inconsistency)
- **Low Priority:** 2 (magic numbers, edge case tests)

### Completed Components
- ✅ RatingStars (89 lines) - With comprehensive tests
- ✅ AccessibilityBadge + Group (147 lines) - With comprehensive tests
- ✅ LoadingSpinner + Overlay + Dots (148 lines) - With comprehensive tests
- ✅ Container + Section (103 lines)
- ✅ Card components (75 lines)
- ✅ Badge (47 lines)
- ✅ Skeleton variants (94 lines)
- ✅ Input + Textarea (94 lines)

### Metrics
- TypeScript: ✅ No errors, strict mode compliant
- Accessibility: ✅ WCAG roles, ARIA labels, sr-only text
- Test Coverage: ~85% (313 lines of tests)
- File Size: ✅ All under 200 lines
- Code Standards: ✅ Full compliance

### Recommended Actions Before Phase 05
1. Fix CardTitle type parameter (1 min)
2. Verify reduced motion CSS (5 min)
3. Add Input label documentation (10 min)

**Total Effort:** ~20 minutes

**Full Report:** `plans/reports/code-reviewer-260118-1920-phase04-design-system.md`

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Design not ready | Medium | High | Use shadcn/ui defaults; customize later |
| Contrast failures | Medium | Medium | Use WCAG contrast checker during build |
| Component bloat | Low | Medium | Only install needed components |

## Security Considerations

- Sanitize any user content rendered in components
- Avoid `dangerouslySetInnerHTML` without sanitization
- Validate image sources before rendering

## Next Steps

After completion:
1. Proceed to [Phase 05: Homepage](./phase-05-homepage.md)
2. Build hero section, featured tours, trust signals
3. Implement responsive homepage layout
