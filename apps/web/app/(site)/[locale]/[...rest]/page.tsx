import { notFound } from 'next/navigation'

/**
 * Catch-all route for unmatched paths under /[locale]/*.
 *
 * Next.js only renders not-found.tsx when notFound() is explicitly called —
 * it does NOT auto-render it for unrecognised URLs. This catch-all captures
 * any route that doesn't match a real page and triggers the custom 404 page
 * at app/(site)/[locale]/not-found.tsx.
 */
export default function CatchAllPage() {
  notFound()
}
