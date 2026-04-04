# Design Specifications Report: Option 5 Bold & Contemporary
**Current vs. Target CSS/Spacing Diff**

---

## Nav Changes
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Height | `h-20` (80px) | 72px | Reduce to `h-[72px]` |
| Padding | `px-4 lg:px-8` | 0 80px | Update to `px-20` desktop |
| Logo/CTA font | Fixed values | Logo 14px, tracking 3px; CTA 13px, tracking 1px | Tighten sizing, add letter-spacing |
| CTA button padding | Loose | 12px 28px | Reduce to `py-3 px-7` |

---

## Hero Section
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Desktop height | `h-[620px]` | 620px ✓ | No change |
| Left panel width | Not fixed | 640px | Set `md:w-[640px] shrink-0` |
| Left padding | `px-20 py-20` | 80px all | Already correct ✓ |
| Gap (content stacking) | `gap-6` | 24px | Reduce to `gap-6` (already 24px) ✓ |
| Tag font size | 11px ✓ | 11px ✓ | No change |
| Tag padding | `px-3.5 py-1.5` | 6px 14px | Reduce to `px-3.5 py-1.5` (close match) |
| Title size (desktop) | 56px ✓ | 56px ✓ | No change |
| Subtitle size | 17px ✓ | 17px ✓ | No change |
| CTA padding | `px-10 py-4` | 16px 40px | Increase to `px-10 py-4` (already correct) ✓ |
| Mobile title | 38px ✓ | 38px ✓ | No change |
| Mobile subtitle | 14px ✓ | 14px ✓ | No change |
| Mobile CTA padding | `px-8 py-3.5` | 14px 32px | Adjust to `px-8 py-3.5` (close) |

---

## Trust Signals Section
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Background | `bg-[var(--color-background)]` (#FAFAF8) | #FAFAF8 ✓ | No change |
| Padding | `py-10 md:py-20` | 80px all | Update to `py-20 px-20` desktop |
| Header spacing | `mb-8 md:mb-12` | gap 48px | Increase to `md:mb-12` (48px equiv) ✓ |
| Gold separator line | `h-[3px] w-[200px]` | 200px × 3px ✓ | No change |
| Stat cards grid gap | `gap-3 md:gap-6` | 24px desktop / 12px mobile | Change mobile gap to `gap-3` → `gap-2` |
| Stat card padding | `p-5 md:p-8` | 32px desktop / 20px mobile | Update to `p-5 md:p-8` (20px/32px) ✓ |
| Number font size | `text-3xl md:text-5xl` | 48px desktop / 36px mobile | Increase desktop to `md:text-5xl` (48px) ✓ |
| Title font size | `text-sm md:text-base` | 16px desktop / 13px mobile | Update to `md:text-base` (16px) ✓ |
| Description font size | `text-xs md:text-sm` | 14px desktop / 11px mobile | Increase to `md:text-sm` (14px) ✓ |

---

## Featured Tours Section
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Background | `bg-white` | #FAFAF8 | Change to `bg-[#FAFAF8]` |
| Padding | `py-16 md:py-24` | 80px all | Update to `py-20 md:py-20 px-20` |
| Header margin | `mb-12` | gap 48px | Increase to `md:mb-12` (48px) ✓ |
| Tag font | 11px, tracking 3px | 11px, tracking 3px ✓ | No change |
| Title font | Playfair 42px | Playfair 42px ✓ | No change |
| Subtitle font | Inter 16px | Inter 16px ✓ | No change |
| Card grid gap | `gap-6` | 24px | Already correct ✓ |
| Card image height | `aspect-[3/4]` | 320px portrait | Keep aspect-ratio (responsive) |
| Card padding | `p-5` | 24px | Already correct ✓ |
| Card title | `text-lg` (18px) | Playfair 22px | Increase to `md:text-[22px]` |
| Card description | 14px ✓ | 14px ✓ | No change |
| Meta icons/spacing | Current spacing adequate | Gap 4px icons, 16px between | Already close ✓ |
| CTA link color | Gold #d0ad50 | #E67E5A coral text | **CHANGE STYLING** — use coral accent |
| Mobile cards | Horizontal scroll | Stack vertically (2 col at max) | Desktop `md:grid-cols-3`; mobile needs review |

---

## Video Section
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Container height | `md:h-[500px]` | 500px ✓ | No change |
| Left panel width | `md:w-[480px]` | 480px ✓ | No change |
| Left padding | `md:px-20 md:py-0` | 0 80px horiz ✓ | No change |
| Left gap | `gap-5` | 20px | Reduce to `gap-5` (equiv 20px) ✓ |
| Tag font | 11px, tracking 3px | 11px, tracking 3px ✓ | No change |
| Title font | 42px ✓ | 42px ✓ | No change |
| Subtitle font | 15px ✓ | 15px ✓ | No change |
| Play button (mobile) | `h-14 w-14` | 56px | Reduce desktop to `h-[72px] w-[72px]` ✓ |
| Play button (desktop) | `md:h-[72px] md:w-[72px]` | 72px ✓ | No change |

---

## Gold Separator
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Height | (not visible in code) | 4px | Add `h-1` separator between sections |
| Background | N/A | #C4A052 | Add `bg-[#C4A052]`; full-width |

---

## Guides Section
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Background | `bg-[var(--color-primary)]` (#1E3A5F) | #1E3A5F ✓ | No change |
| Padding | `py-10 md:py-20` | 80px all | Update to `py-20 px-20` desktop |
| Header layout | Flex col center / row between (md) | Header left, CTA right (md) | Already correct ✓ |
| Header spacing | `gap-4 md:mb-12` | 48px | Reduce gap to `gap-4` (16px); use `md:mb-12` (48px) |
| Grid columns | `grid-cols-2 md:grid-cols-4` | 4-col desktop / 2×2 mobile | Already correct ✓ |
| Grid gap | `gap-4 md:gap-6` | 24px desktop / 16px mobile | Update to `gap-4 md:gap-6` (16px/24px) ✓ |
| Photo size | `h-28 w-28 md:h-[140px] md:w-[140px]` | 140px desktop / 100px mobile | Reduce mobile to `h-24 w-24` (96px? need review) |
| Photo border | `border-[3px]` | 3px desktop / 2px mobile | Add mobile variant `border-[2px]` |
| Name font | `text-lg md:text-[22px]` | 22px desktop / 18px mobile | Reduce mobile to `text-[18px]` |
| Specialty font | `text-sm` (14px) | 14px ✓ | No change |
| Languages font | `text-[13px]` | 13px ✓ | No change |
| CTA button padding | `px-8 py-3.5` | 14px 32px (padding) | Already correct ✓ |

---

## Footer
| Aspect | Current | Option 5 | CSS Change |
|--------|---------|---------|-----------|
| Background | `bg-[var(--color-primary)]` | #1E3A5F ✓ | No change |
| Padding | (varies) | 32px 80px desktop / 24px 16px mobile | Review and standardize |
| Logo tracking | Current | 3px (if visible) | Verify tracking on logo text |
| Copyright font | 12px normal | 12px ✓ | No change |

---

## Summary: Actionable CSS Priority

### HIGH (Critical Visual Impact)
1. **Featured Tours background:** Change `bg-white` → `bg-[#FAFAF8]`
2. **Featured Tours CTA link:** Change gold to coral (#E67E5A); update hover states
3. **Gold separator line:** Add 4px divider between sections (post-video)
4. **Card image heights:** Review portrait aspect ratio consistency

### MEDIUM (Spacing Refinements)
5. Standardize padding: all sections → `px-20 py-20` (desktop) / `px-4 py-10` (mobile)
6. Increase header margins in Trust/Tours/Guides to `mb-12` (48px)
7. Adjust mobile guide photo size (review 100px → 96px gap)
8. Mobile border width on guide photos: `border-[2px]` instead of 3px

### LOW (Fine-tuning)
9. Add letter-spacing refinements to nav logo/CTA
10. Mobile guide name font: 18px explicit class

---

## Unresolved Questions
- Should featured tour cards display 3-col grid on desktop, or 2-col max on some breakpoints?
- Gold separator line placement: between every section, or only video→guides transition?
- Guide photo size mobile: confirm 100px circle is acceptable or needs adjustment
- CTA button coral hover state: lighten to what opacity/color?
