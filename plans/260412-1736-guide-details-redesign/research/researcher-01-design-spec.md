# Design Spec: Guide Profile — Option B

Source: `pencils/General.pen` (extracted structure)  
Date: 2026-04-12

---

## Layout Structure

### Desktop (1440px)
Two-column horizontal flex, full-width, `bg: --color-background`.

| Zone | Width | Bg | Padding |
|---|---|---|---|
| Nav | full | `--color-primary` | `[0, 64]` |
| Left Sidebar | 450px fixed | `--color-surface` | `[48, 40]` |
| Right Column | fill (flex:1) | `--color-background` | `[40, 64]` |

Sidebar has right border `--color-border`. Right column has `gap: 40px` between sections.

### Mobile (375px)
Single column. Nav is compact with hamburger. Layout order: Nav → Breadcrumb bar → Header section → Bio → Tours → Sticky CTA → Footer.

---

## Component Breakdown

### Left Sidebar (desktop) / Header Section (mobile)

**Avatar**
- Desktop: 160px circle (`border-radius: 50%`)
- Mobile: 120px circle, centered

**Identity block** (stacked, centered on mobile)
- Name: Playfair Display, 28px bold, `--color-primary` (mobile: 24px)
- Tagline: Inter, 14px, `--color-text-muted` (mobile: 13px)
- Gold divider: `--color-secondary`, 2px height, 60px wide (mobile: 40px)

**Languages section**
- Label row: globe icon + "LANGUAGES" (Inter 12px, weight 600, letter-spacing 0.5px, uppercase implied)
- Tags: pill shape (`--radius-full`), bg `--color-background-alt`, Inter 13px (mobile: 12px)

**Areas of Expertise section**
- Label row: map-pin icon + "AREAS OF EXPERTISE" — same label style as Languages
- Tags: same pill style

**Divider**: `--color-border-light`, 1px horizontal rule

**Credentials section**
- Title: "Credentials", Inter 12px weight 600
- List items: icon + text, Inter 13px (mobile: 12px)
- Icon color mapping:
  - `badge-check` → `--color-success` (#10B981)
  - `graduation-cap` → `--color-info` (#3B82F6)
  - `timer` → `--color-accent` (#E67E5A)
  - `heart-pulse` → `--color-error` (#EF4444)
  - `users` → `--color-primary` (#1E3A5F)

**Divider**

**Specializations section**
- Title: "Specializations", Inter 12px weight 600
- Tags: pill with icon, bg `#FEF3C7` (amber-50), text `--color-secondary-dark` (#B49042), Inter 12px weight 500

**CTA Button** (desktop sidebar only)
- Full-width, bg `--color-accent`, white text
- Icon: mail (white), label "Contact Anna"
- Inter 15px weight 600, padding `[14, 24]`, `--radius-md`

---

### Right Column — Bio Section

- Breadcrumb: Home / Guides / Anna Lindström (Inter, small, `--color-text-muted`)
- Heading "About Anna": Playfair Display 32px bold (mobile: 22px)
- Body: 3 paragraphs, Inter 15px, line-height 1.7, `--color-text` (mobile: 14px, line-height 1.65)
- Section padding mobile: `[24, 20]`, gap 16

---

### Tours Grid

**Desktop**: 2-column grid, gap 24px  
**Mobile**: 1-column, gap 16px

**Each card**:
- Border radius: `--radius-lg`
- Bg: `--color-surface`
- Border: `--color-border`
- Image: 180px height, full card width (mobile: 160px)
- Body: padding 16px, gap 10px
  - Title: Inter 15px weight 600 (mobile: 14px)
  - Meta row: timer icon + duration, star icon + rating/count — Inter 13px `--color-text-muted` (mobile: 12px)
  - Price: Inter 16px weight 700, `--color-primary` (mobile: 15px)

---

### Mobile-Only: Sticky CTA Bar

- Position: `fixed bottom: 0`, full width
- Bg: `--color-surface`, top border `--color-border`
- Button: "See Available Tours", calendar icon, bg `--color-accent`
- Replaces desktop sidebar CTA; no sidebar CTA exists on mobile

---

## Typography Summary

| Element | Font | Size (desktop) | Size (mobile) | Weight | Color |
|---|---|---|---|---|---|
| Guide name | Playfair Display | 28px | 24px | 700 | `--color-primary` |
| Section headings | Playfair Display | 32px | 22px | 700 | `--color-text` |
| Tours heading | Playfair Display | 28px | — | 700 | `--color-text` |
| Tagline | Inter | 14px | 13px | 400 | `--color-text-muted` |
| Section labels | Inter | 12px | 11px | 600 | `--color-text-muted` |
| Pills/tags | Inter | 13px | 12px | 400/500 | varies |
| Body paragraphs | Inter | 15px | 14px | 400 | `--color-text` |
| CTA button | Inter | 15px | 15px | 600 | white |

---

## Spacing Reference

| Token | Value | Usage |
|---|---|---|
| `--spacing-2xl` | 48px | Sidebar vertical padding |
| `--spacing-3xl` | 64px | Nav/right-col horizontal padding |
| `--spacing-xl` | 32px | Mobile header vertical padding |
| `--spacing-lg` | 24px | Section gaps, grid gap |
| `--spacing-md` | 16px | Card body padding, mobile gaps |

---

## Key Responsive Differences

| Feature | Desktop | Mobile |
|---|---|---|
| Layout | 2-column (450px + fill) | Single column |
| Sidebar | Fixed left panel | Collapsed into top header section |
| CTA | Sidebar button ("Contact Anna") | Sticky bottom bar ("See Available Tours") |
| Tour grid | 2 columns | 1 column |
| Avatar | 160px | 120px |
| Breadcrumb | In right column | Separate bar, bg `--color-background-alt`, padding `[12,20]` |

---

## Unresolved Questions

1. Accent color on `--color-accent` token — `timer` credential icon mapped to accent: confirm this is `#E67E5A` (coral) vs a separate "warning" amber.
2. No hover/focus states specified in extracted data — confirm interactive states for pills, cards, and CTA button from Pencil file.
3. Credential list item count — design shows 5 icon types; is the list static/hardcoded or driven by guide data model?
4. Mobile footer content — noted as "compact, gap 12" but structure unspecified; confirm if reuses existing footer component.
5. `--color-secondary` (gold) for divider confirmed as `#C4A052` per design-guidelines — but Specialization tag uses `--color-secondary-dark` (`#B49042`) for text; verify contrast meets WCAG AA on `#FEF3C7` bg.
