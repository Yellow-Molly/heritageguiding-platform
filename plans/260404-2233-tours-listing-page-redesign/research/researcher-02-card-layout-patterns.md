# Tour Card Layout Patterns Research

## Key Findings

**Layout Choice Trade-offs**: Grid dominates visual-first products (tours, accommodations); list excels at information-dense scenarios. Grid maximizes mobile screen usage (2-3 cols), list shows more detail per item. Tours favor grid because imagery drives decisions.

**Responsive Pattern (2025)**: Mobile-first design with container queries > fixed breakpoints. Standard: mobile stacks vertically, tablet 2-col grid, desktop 3-col. Use `clamp()` for fluid typography instead of rigid breakpoints.

**Image Optimization**: Prevent layout shift with `aspect-ratio` CSS + width/height attributes. Native `loading="lazy"` supported 95%+ browsers. Next.js Image component handles srcset/webp automatically.

## Grid vs List Comparison

| Dimension | Grid (Option B Desktop) | List (Option B Mobile) |
|-----------|-------------------------|------------------------|
| **Scanning pattern** | Horizontal/vertical scan, dispersed gaze | Vertical focus, text-driven attention |
| **Information density** | Compact, image-centric (180px tall) | Detailed, text-prominent (130px side image) |
| **Mobile fit** | 2-3 cards per row, space-efficient | 1 item per row, max 130px height |
| **Best for** | Visual products (tours, experiences) | Complex specs, comparisons, reviews |
| **Conversion** | Higher for impulse/visual decisions | Higher for research-heavy purchases |

## Recommended Approach

1. **Grid primary** (desktop/tablet 3-col, tablet 2-col, mobile 1-col via CSS breakpoints or `container query`)
2. **List as secondary toggle** (optional user preference, not forced mobile default)
3. **Hybrid image strategy**: 180px grid → 130px list; use `object-fit: cover` + aspect-ratio to prevent distortion
4. **Keyboard + hover**: Include both states (WCAG 1.4.13); focus outline 3px minimum, escape key to dismiss tooltips

## Implementation Notes

- Use Next.js `<Image />` with placeholder blur and native lazy loading
- Set both width/height attributes on img elements to reserve space
- Grid: 3-col desktop (24rem card width), 2-col tablet (≥768px), 1-col mobile
- Card states: Default → Hover (subtle shadow lift +2px, overlay 5% opacity) → Focus (outline 3px, visible)
- Avoid content-on-hover without focus equivalent; ensure dismiss mechanism (ESC key, click outside)
- Lazy load images: `loading="lazy"` native, or `IntersectionObserver` for older browsers
- Rating + price row: Flex layout, bold price, small (12px) gray rating text

**Status**: Aligns with Option B desktop/mobile designs. Grid primary recommended for tour listings.

---

## Sources
- [E-Commerce Product Listings: Grid Layout | Preline Pro](https://preline.co/pro/examples/ecommerce-product-listings-grid-layout.html)
- [Grid VS List: eCommerce UI/UX Debate - ConvertMate](https://convertmate.io/blog/grid-vs-list-ecommerce-ui-ux-debate)
- [List vs Grid: Which Product Layout Drives More Sales on Smartphones?](https://www.realeye.io/blog/post/list-vs-grid-which-product-layout-drives-more-sales-on-smartphones)
- [Responsive Design Breakpoints: 2025 Playbook - DEV Community](https://dev.to/gerryleonugroho/responsive-design-breakpoints-2025-playbook-53ih)
- [Using CSS breakpoints for fluid, future-proof layouts - LogRocket](https://blog.logrocket.com/css-breakpoints-responsive-design/)
- [Native lazy-loading images with aspect-ratio](https://n8d.at/native-lazy-loading-images-with-aspect-ratio/)
- [Image Optimization - Next.js Docs](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [WCAG Content on Hover or Focus (1.4.13)](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html)
- [Hover and Focus Best Practices - Access Guide](https://www.accessguide.io/guide/hover-and-focus)
