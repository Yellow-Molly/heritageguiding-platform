import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'
import withBundleAnalyzer from '@next/bundle-analyzer'
import path from 'path'

const withNextIntl = createNextIntlPlugin('./i18n.ts')
const bundleAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const nextConfig: NextConfig = {
  // Ignore TypeScript errors from packages/cms during build
  // (packages/cms has its own type checking with its own node_modules)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Webpack config kept for --webpack fallback mode
  webpack: (config) => {
    // Fix module resolution for packages/cms imports
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules || []),
    ]
    return config
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.bokun.io',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  async redirects() {
    return [
      // Coming soon redirect — production only (remove after April 2 launch)
      {
        source: '/:locale(en|sv)',
        has: [{ type: 'host', value: 'privatetours.se' }],
        destination: '/:locale/coming-soon',
        permanent: false,
      },
      {
        source: '/:locale(en|sv)',
        has: [{ type: 'host', value: 'www.privatetours.se' }],
        destination: '/:locale/coming-soon',
        permanent: false,
      },
      {
        source: '/:locale(en|sv)/:path((?!coming-soon).*)',
        has: [{ type: 'host', value: 'privatetours.se' }],
        destination: '/:locale/coming-soon',
        permanent: false,
      },
      {
        source: '/:locale(en|sv)/:path((?!coming-soon).*)',
        has: [{ type: 'host', value: 'www.privatetours.se' }],
        destination: '/:locale/coming-soon',
        permanent: false,
      },
      // Old domain -> new domain (keep for 1+ year for SEO)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'heritageguiding.com' }],
        destination: 'https://privatetours.se/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.heritageguiding.com' }],
        destination: 'https://privatetours.se/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'staging.heritageguiding.com' }],
        destination: 'https://staging.privatetours.se/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      // Block search engine indexing on non-production deployments
      // Note: inline env check because next.config.ts can't use @/ path aliases
      ...(process.env.VERCEL_ENV !== 'production' || process.env.IS_STAGING === 'true'
        ? [
            {
              source: '/:path*',
              headers: [
                { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
              ],
            },
          ]
        : []),
      {
        // Cache static image assets for 1 year (immutable)
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // bokuntest.com hosts mirror bokun.io but for the sandbox env
              // (dev/preview deployments load `widgets.bokuntest.com`). Listing
              // both unconditionally keeps the CSP env-independent — the widget
              // loader code picks one based on NODE_ENV.
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.bubblav.com https://widgets.bokun.io https://static.bokun.io https://widgets.bokuntest.com https://static.bokuntest.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://widgets.bokun.io https://static.bokun.io https://widgets.bokuntest.com https://static.bokuntest.com",
              "img-src 'self' data: blob: https://*.blob.vercel-storage.com https://images.unsplash.com https://*.privatetours.se https://www.gravatar.com https://*.bokun.io https://*.bokuntest.com",
              "font-src 'self' data: https://fonts.gstatic.com https://widgets.bokun.io https://widgets.bokuntest.com",
              "frame-src 'self' https://www.bubblav.com https://www.youtube.com https://www.youtube-nocookie.com https://*.bokun.io https://*.bokuntest.com",
              "connect-src 'self' https://www.bubblav.com https://*.bubblav.com https://*.ably.net https://*.ably-realtime.com wss://*.ably.net wss://*.ably-realtime.com https://*.bokun.io https://*.bokuntest.com",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

// Sentry wraps last so its webpack/turbopack plugin can upload source maps
// and rewrite stack traces. Plugin is silent when SENTRY_AUTH_TOKEN / org /
// project are unset, so dev/preview builds don't fail.
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Don't fail the build if source-map upload fails — error reporting still
  // works without symbolication, and CI shouldn't gate on this.
  errorHandler: (err: Error) => {
    console.warn('[sentry] build plugin warning:', err.message)
  },
}

export default withSentryConfig(
  withNextIntl(withPayload(bundleAnalyzer(nextConfig))),
  sentryBuildOptions,
)
