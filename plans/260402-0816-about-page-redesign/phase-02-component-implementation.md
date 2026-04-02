# Phase 2: Component Implementation

## Context
- [Current page.tsx](../../apps/web/app/(site)/[locale]/(frontend)/about-us/page.tsx) — 187 lines, to be simplified
- [Current values-section.tsx](../../apps/web/components/pages/values-section.tsx) — 65 lines, to be redesigned
- [Home hero pattern](../../apps/web/components/home/hero-section.tsx) — reference for 'use client' + useTranslations pattern
- [Button component](../../apps/web/components/ui/button.tsx) — Button/getButtonClassName available
- CSS vars: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-background-alt`, `--color-surface`, `--color-text-muted`, `--color-success`, `--color-border`

## Overview
- **Priority**: P1
- **Status**: Complete
- **Effort**: 3h
- **Depends on**: Phase 1 (translations)

## Architecture

```
page.tsx (server component, ~52 lines)
  ├── AboutSchema (SEO)
  ├── Header
  ├── AboutHeroSection        ← new, 'use client'
  ├── AboutStorySection       ← new, 'use client'
  ├── AboutMissionVisionSection ← new, 'use client'
  ├── ValuesSection           ← modified, 'use client'
  ├── AboutResponsibleTourismSection ← new, 'use client'
  ├── AboutCertificationsSection ← new, 'use client'
  ├── AboutCtaSection         ← new, 'use client'
  └── Footer
```

**Note**: Team section skipped per validation decision.

All section components use `'use client'` + `useTranslations('about')` pattern. Page remains a server component handling metadata + composition.

## File Ownership (no overlapping edits)

| File | Action | Est. Lines |
|------|--------|-----------|
| `components/pages/about-hero-section.tsx` | Create | ~60 |
| `components/pages/about-story-section.tsx` | Create | ~80 |
| `components/pages/about-mission-vision-section.tsx` | Create | ~90 |
| `components/pages/values-section.tsx` | Modify | ~100 |
| `components/pages/about-responsible-tourism-section.tsx` | Create | ~80 |
| `components/pages/about-certifications-section.tsx` | Create | ~80 |
| `components/pages/about-cta-section.tsx` | Create | ~70 |
| `app/(site)/[locale]/(frontend)/about-us/page.tsx` | Modify | ~55 |

All paths relative to `apps/web/`.

## Component Specifications

### 2.1 AboutHeroSection
**File**: `about-hero-section.tsx`

```
Structure:
  <section> h-[450px] md, h-[300px] mobile, relative, overflow-hidden
    <div> absolute inset-0, bg-[url('/images/about-hero.jpg')] bg-cover bg-center
      (fallback: gradient from-[#1E3A5F] to-[#0f2440] if no image)
    <div> absolute inset-0 bg-[#1E3A5FDD] (dark overlay)
    <div> relative z-10, flex items-center justify-center h-full, text-center
      <span> uppercase, text-secondary, text-xs, tracking-[2px], font-semibold
        → t('hero.label') = "OUR STORY"
      <h1> Playfair Display (font-serif), 56px/28px, white, font-bold
        → t('title')
      <p> Inter, 20px/16px, white/80%
        → t('subtitle')
      <div> 60px x 3px, bg-secondary, mx-auto (decorative divider)
```

**Imports**: `useTranslations` from next-intl

### 2.2 AboutStorySection
**File**: `about-story-section.tsx`

```
Structure:
  <section> py-24 lg:py-24, px-5 lg:px-[120px]
    <div> container, flex flex-col md:flex-row, gap-16
      <div> flex-1 (text side, order-2 md:order-1)
        <span> label "WHO WE ARE" — gold, uppercase, tracking-[2px], text-xs
        <h2> font-serif, 36px/28px, primary color
          → t('story.title') = "Created for Travelers Who Value Depth"
          NOTE: reuse existing key, design title differs from current "Who We Are"
          Decision: keep existing translation content, just restyle
        <p> paragraph1 — Inter 16px, line-height 1.7
        <p> paragraph2
        <blockquote> left border 4px secondary, pl-6 md:pl-8, italic font-serif 22px
          → t('story.paragraph3')
      <div> md:w-[480px] md:h-[500px], w-full h-[240px], order-1 md:order-2
        <Image> rounded-2xl, object-cover, fill
          src="/images/about-story.jpg" (placeholder — can use any Stockholm image)
          alt={t('heroAlt')}
```

**Responsive**: Mobile shows image first (order-1), text second. Desktop: text left, image right.

### 2.3 AboutMissionVisionSection
**File**: `about-mission-vision-section.tsx`

```
Structure:
  <section> bg-background-alt, py-24/12
    <div> container, text-center
      <span> "OUR PURPOSE" label — gold, uppercase
      <h2> "Mission & Vision" — NOT from translations (or add key)
        Decision: use t('mission.label') for section label, derive title from context
        Actually: add combined title key or just use "Mission & Vision" hardcoded?
        → Better: Use new key about.missionVision.title or just combine existing
        → Simplest: hardcode section title in translations
      <div> grid md:grid-cols-2, gap-8/5
        Card 1 (Mission):
          <div> bg-surface, rounded-2xl, shadow, p-12/7
            <div> 56px square, bg-primary, rounded-lg, flex center
              <Compass> 28px, text-secondary (gold)
            <h3> font-serif, 24px/20px, primary → t('mission.title')
            <p> 15px, text-muted, leading-[1.7] → t('mission.description')
        Card 2 (Vision):
          Same structure, Eye icon
            → t('vision.title'), t('vision.description')
```

**Icons**: `Compass` and `Eye` from lucide-react.

### 2.4 ValuesSection (Modify Existing)
**File**: `values-section.tsx` — complete rewrite

```
Changes from current:
  - Remove bg-background-alt (design shows white bg)
  - Add label "WHY CHOOSE US" + subtitle line
  - Change grid: 3-col top row + centered 2-col bottom row (desktop), 1-col (mobile)
  - Card redesign: border instead of shadow, icon in 56px primary-bg square, gold divider bar
  - Icons change: ShieldCheck, Star, Lock, Settings, Globe (from lucide)

Structure:
  <section> py-24
    <div> container, text-center
      <span> "WHY CHOOSE US" label
      <h2> t('title')
      <p> t('subtitle') — text-muted
      <div> grid lg:grid-cols-3, gap-6 (top 3 cards)
        Card × 3
      <div> grid lg:grid-cols-2, gap-6, max-w-[800px], mx-auto, mt-6 (bottom 2 cards)
        Card × 2

  Card structure:
    <div> border border-[var(--color-border)], rounded-2xl, shadow-sm, p-8/5, text-center md:text-left
      <div> 56px square, bg-primary, rounded-lg, flex center
        <Icon> 24px, text-secondary
      <div> 40px x 3px, bg-secondary (decorative divider)
      <h3> font-serif, 20px, primary
      <p> 14px, text-muted, leading-[1.6]
```

**Values array update**:
```ts
const values = [
  { icon: ShieldCheck, key: 'authorizedExperts' },
  { icon: Star, key: 'curated' },
  { icon: Lock, key: 'privateByDesign' },
  { icon: Settings, key: 'seamlessHosting' },
  { icon: Globe, key: 'multilingual' },
]
```

### 2.5 AboutResponsibleTourismSection
**File**: `about-responsible-tourism-section.tsx`

```
Structure:
  <section> py-24, px-5 lg:px-[120px]
    <div> container, flex flex-col md:flex-row, gap-16/8
      <div> md:w-[480px] md:h-[400px], w-full h-[220px] (image, order-1)
        <Image> rounded-2xl, object-cover, placeholder Stockholm nature image
      <div> flex-1 (content, order-2)
        <span> "OUR COMMITMENT" label
        <h2> t('responsibleTourism.title') — font-serif 36px/28px
        <p> t('responsibleTourism.paragraph1') — 16px/15px, leading-[1.7]
        <ul> space-y-4/3.5
          4 × <li> flex items-start gap-3
            <CircleCheck> 20px, text-success (green)
            <span> t('responsibleTourism.items.itemN') — 15px
```

**Icons**: `CircleCheck` from lucide-react.

### 2.6 AboutCertificationsSection
**File**: `about-certifications-section.tsx`

```
Structure:
  <section> bg-primary, py-16, text-white
    <div> container, flex flex-col md:flex-row items-center justify-center, gap-16/8
      CertItem × 3 with dividers between:
        <div> flex flex-col items-center, text-center
          <div> w-16/14 h-16/14, rounded-full, bg-white/15, flex center
            <Icon> 28px, text-secondary
          <span> 16px/15px, white, font-bold → t('certifications.licensed')
          <span> 13px, white/67% → t('certifications.licensedSub')

        Divider (between items):
          Desktop: <div> w-px h-[60px] bg-white/20
          Mobile: <div> w-[60px] h-px bg-white/20
```

**Icons**: `Shield`, `Shield`, `MapPin` from lucide-react (matching current).
Actually per design: Award for Licensed, Shield for Insured, MapPin for Local — keep current icons.

### 2.7 AboutCtaSection
**File**: `about-cta-section.tsx`

```
Structure:
  <section> py-24/12
    <div> container, text-center
      <h2> font-serif, 42px/32px, primary → t('cta.title')
      <p> text-muted, 18px/15px → t('cta.description')
      <div> flex flex-col sm:flex-row justify-center, gap-4/3, mt-8
        <Link> primary button style (accent bg, rounded-full, shadow)
          <Compass> 20px inline icon
          t('cta.exploreTours')
          → href="/tours" via i18n Link
        <Link> outline style (secondary border 2px, rounded-full)
          <Mail> 20px inline icon
          t('cta.contactUs')
          → href="/contact" via i18n Link
```

**Imports**: `Link` from `@/i18n/navigation`, `Compass` and `Mail` from lucide-react, `getButtonClassName` from button.

**Button style**: Use `getButtonClassName` with custom overrides for rounded-full. Or inline Tailwind — simpler given rounded-full is non-standard for button component.

### 2.8 Page.tsx Simplification
**File**: `app/(site)/[locale]/(frontend)/about-us/page.tsx`

Reduce to thin orchestrator:

```tsx
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AboutSchema } from '@/components/seo'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
// Section imports
import { AboutHeroSection } from '@/components/pages/about-hero-section'
import { AboutStorySection } from '@/components/pages/about-story-section'
import { AboutMissionVisionSection } from '@/components/pages/about-mission-vision-section'
import { ValuesSection } from '@/components/pages/values-section'
import { AboutResponsibleTourismSection } from '@/components/pages/about-responsible-tourism-section'
import { AboutCertificationsSection } from '@/components/pages/about-certifications-section'
import { AboutCtaSection } from '@/components/pages/about-cta-section'

// generateMetadata stays the same

export default async function AboutPage({ params }) {
  return (
    <>
      <AboutSchema />
      <Header />
      <main className="min-h-screen">
        <AboutHeroSection />
        <AboutStorySection />
        <AboutMissionVisionSection />
        <ValuesSection />
        <AboutResponsibleTourismSection />
        <AboutCertificationsSection />
        <AboutCtaSection />
      </main>
      <Footer />
    </>
  )
}
```

No props needed — each section reads its own translations.

## Implementation Order (Completed)

1. ✓ Create `about-hero-section.tsx`
2. ✓ Create `about-story-section.tsx`
3. ✓ Create `about-mission-vision-section.tsx`
4. ✓ Modify `values-section.tsx`
5. ✓ Create `about-responsible-tourism-section.tsx`
6. ✓ Create `about-certifications-section.tsx`
7. ✓ Create `about-cta-section.tsx`
8. ✓ Simplify `page.tsx` (from 187 to 52 lines)

**Notes:**
- Team section skipped per validation decision
- Story paragraphs 4-6 kept in translations but not rendered in new design (for safety)
- All hero image alt text fixed during code review
- Fragment fix applied in story section
- Images use Unsplash URLs (already configured in next.config.ts)

## Todo

- [x] Create about-hero-section.tsx
- [x] Create about-story-section.tsx
- [x] Create about-mission-vision-section.tsx
- [x] Redesign values-section.tsx
- [x] Create about-responsible-tourism-section.tsx
- [x] Create about-certifications-section.tsx
- [x] Create about-cta-section.tsx
- [x] Simplify page.tsx to import sections (187 → 52 lines)

## Success Criteria
- [x] Each component < 200 lines
- [x] All components use 'use client' + useTranslations pattern
- [x] Page renders all 7 sections in correct order (team skipped)
- [x] Responsive at 390px and 1440px breakpoints
- [x] Uses CSS vars (not hardcoded colors except hero overlay)
- [x] Uses `Link` from `@/i18n/navigation` for internal links

## Risk Assessment (Resolved)
- ✓ **Hero image missing**: Uses Unsplash URLs (configured in next.config.ts)
- ✓ **Team section scope**: Skipped per validation, reduces complexity
- ✓ **Code review issues**: All high/medium severity issues fixed (image optimization, alt text, Fragment)

## Security Considerations
- No user input handled
- No API calls
- Static content only
