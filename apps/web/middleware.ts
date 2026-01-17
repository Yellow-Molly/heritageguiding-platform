import createMiddleware from 'next-intl/middleware'
import { defaultLocale, locales } from './i18n'

export default createMiddleware({
  // List of all supported locales
  locales,

  // Default locale
  defaultLocale,

  // Automatically prefix routes with locale
  localePrefix: 'always',

  // Paths to exclude from locale prefixing (Payload admin and API routes)
  pathnames: {
    // Example: '/about' will be accessible at '/sv/about', '/en/about', etc.
  },
})

export const config = {
  // Skip all paths that should not be internationalized
  matcher: [
    // Match all pathnames except for
    // - API routes (/api/*)
    // - Payload admin routes (/admin/*)
    // - Static files (_next/*, /favicon.ico, etc.)
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
  ],
}
