# HeritageGuiding Design Guidelines

## Overview

Premium heritage tour guiding platform for Stockholm. Design inspired by TripFreak with Aurora UI + Motion-Driven patterns adapted for a sophisticated, trust-building experience.

## Design Philosophy

- **Premium Heritage**: Elegant, sophisticated aesthetic reflecting Swedish heritage
- **Trust-First**: Visual elements that build credibility and confidence
- **Motion-Driven**: Purposeful animations that enhance storytelling
- **Mobile-First**: Responsive design optimized for all devices

---

## Color Palette

### Primary - Deep Navy Blue
Trust, sophistication, authority.
```css
--color-primary: #1E3A5F
--color-primary-light: #2A4A75
--color-primary-dark: #152B47
```

### Secondary - Rich Gold
Heritage, premium quality, excellence.
```css
--color-secondary: #C4A052
--color-secondary-light: #D4B462
--color-secondary-dark: #B49042
```

### Accent - Coral Orange
CTAs, highlights, energy.
```css
--color-accent: #E67E5A
--color-accent-light: #EE9273
--color-accent-dark: #D66A45
```

### Neutral Colors
```css
--color-background: #FAFAF8      /* Off-white, warm */
--color-background-alt: #F5F5F3  /* Alternative sections */
--color-surface: #FFFFFF         /* Cards, overlays */
--color-text: #2D3748           /* Primary text */
--color-text-muted: #6B7280     /* Secondary text */
--color-text-light: #9CA3AF     /* Tertiary text */
--color-border: #E5E7EB         /* Borders */
--color-border-light: #F3F4F6   /* Light borders */
```

### Semantic Colors
```css
--color-success: #10B981
--color-warning: #F59E0B
--color-error: #EF4444
--color-info: #3B82F6
```

---

## Typography

### Font Families
- **Headings**: Playfair Display (serif) - elegant, luxury, sophisticated
- **Body**: Inter (sans-serif) - clean, readable

### Implementation (Next.js)
```tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})
```

### Type Scale
```css
h1 { font-size: clamp(2.5rem, 5vw, 4.5rem); }  /* 40-72px */
h2 { font-size: clamp(2rem, 4vw, 3rem); }      /* 32-48px */
h3 { font-size: clamp(1.5rem, 3vw, 2rem); }    /* 24-32px */
h4 { font-size: clamp(1.25rem, 2.5vw, 1.5rem); } /* 20-24px */
body { line-height: 1.6; }
```

---

## Spacing System

```css
--spacing-xs: 0.25rem   /* 4px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 1rem      /* 16px */
--spacing-lg: 1.5rem    /* 24px */
--spacing-xl: 2rem      /* 32px */
--spacing-2xl: 3rem     /* 48px */
--spacing-3xl: 4rem     /* 64px */
--spacing-4xl: 6rem     /* 96px */
```

---

## Border Radius

```css
--radius-sm: 0.375rem   /* 6px */
--radius-md: 0.5rem     /* 8px */
--radius-lg: 0.75rem    /* 12px */
--radius-xl: 1rem       /* 16px */
--radius-2xl: 1.5rem    /* 24px */
--radius-full: 9999px   /* Pills */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-card: 0 4px 20px -2px rgb(0 0 0 / 0.08);
--shadow-card-hover: 0 8px 30px -4px rgb(0 0 0 / 0.12);
```

---

## Animations

### Timing
```css
--transition-fast: 150ms ease;
--transition-normal: 300ms ease;
--transition-slow: 500ms ease;
```

### Animation Classes
- `.animate-fade-in` - Simple fade in
- `.animate-fade-in-up` - Fade in from below
- `.animate-slide-in-left` - Slide from left
- `.animate-slide-in-right` - Slide from right
- `.animate-scale-in` - Scale up with fade

### Scroll Animations
Elements with `.scroll-animate` class animate when entering viewport.

### Reduced Motion
All animations respect `prefers-reduced-motion` media query.

---

## Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;        /* Header */
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
```

---

## Component Patterns

### Button Variants
| Variant | Usage |
|---------|-------|
| `primary` | Main CTAs (coral orange) |
| `secondary` | Secondary actions (gold) |
| `outline` | Light backgrounds, hero overlays |
| `outline-dark` | Dark text on light backgrounds |
| `ghost` | Minimal emphasis |
| `link` | Inline text links |

### Button Sizes
- `sm`: 36px height, 16px padding
- `md`: 44px height, 24px padding (default)
- `lg`: 52px height, 32px padding
- `xl`: 56px height, 40px padding

### Card Design
- Border radius: 24px (`rounded-2xl`)
- Shadow: `--shadow-card` default, `--shadow-card-hover` on hover
- Hover: Scale 1.02, increased shadow
- Image aspect ratio: 4:3 for tour cards

### Trust Indicators
- Star ratings with gold fill
- Badge styles with subtle backgrounds
- Icon + text combinations

---

## Page Structure

### Homepage Sections
1. Header (fixed, transparent->solid on scroll)
2. Hero (100vh, full-bleed image, gradient overlay)
3. Trust Signals Strip (navy background, stats)
4. Featured Tours Grid (3 columns desktop)
5. Find Your Tour CTA (full-width, image background)
6. Why Choose Us (2-column layout)
7. Testimonials Carousel
8. Footer (multi-column, newsletter)

### Container
```css
.container {
  max-width: 1280px;
  padding: 16px; /* mobile */
  padding: 24px; /* tablet */
  padding: 32px; /* desktop */
}
```

---

## Accessibility

- Color contrast: WCAG 2.1 AA minimum (4.5:1 normal text, 3:1 large text)
- Focus states: 2px solid primary with 2px offset
- Touch targets: 44x44px minimum
- Reduced motion support
- Semantic HTML structure
- ARIA labels for interactive elements

---

## Image Guidelines

### Sources
- Placeholder: Unsplash (images.unsplash.com)
- Production: Vercel Blob Storage

### Optimization
- Formats: AVIF, WebP with fallbacks
- Next.js Image component for optimization
- Appropriate `sizes` attribute for responsive loading

### Hero Images
- Full viewport width
- Gradient overlay: `from-primary-dark/70 via-primary/50 to-primary-dark/80`

---

## Component Files

```
apps/web/
├── components/
│   ├── ui/
│   │   └── button.tsx           # Button component with variants
│   ├── layout/
│   │   ├── header.tsx          # Site header with mobile menu
│   │   └── footer.tsx          # Site footer with newsletter
│   └── home/
│       ├── hero-section.tsx    # Hero with parallax
│       ├── trust-signals.tsx   # Stats with count-up
│       ├── featured-tours.tsx  # Tour card grid
│       ├── find-tour-cta.tsx   # CTA section
│       ├── why-choose-us.tsx   # Benefits grid
│       └── testimonials.tsx    # Carousel
├── lib/
│   └── utils.ts                # cn() helper, formatters
└── app/
    ├── globals.css             # Design tokens, animations
    └── layout.tsx              # Root layout with fonts
```

---

## Usage Examples

### Button with Link
```tsx
import Link from 'next/link'
import { getButtonClassName } from '@/components/ui/button'

<Link href="/tours" className={getButtonClassName('primary', 'lg')}>
  View Tours
</Link>
```

### Scroll Animation
```tsx
const [isVisible, setIsVisible] = useState(false)
const ref = useRef(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => entry.isIntersecting && setIsVisible(true),
    { threshold: 0.2 }
  )
  observer.observe(ref.current)
  return () => observer.disconnect()
}, [])

<div className={cn(
  'transition-all duration-500',
  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
)} />
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Phase 07 complete: Design system applied across all pages (catalog, detail, footer) |
| 2026-01-18 | Updated component patterns and accessibility checklist |
| 2026-01-16 | Initial design system and homepage implementation (Phase 04-05) |
