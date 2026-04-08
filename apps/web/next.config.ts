import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

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
      ...(process.env.VERCEL_ENV !== 'production'
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.bubblav.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://*.blob.vercel-storage.com https://images.unsplash.com https://*.privatetours.se",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src 'self' https://www.bubblav.com https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://www.bubblav.com https://*.bubblav.com https://*.ably.net https://*.ably-realtime.com wss://*.ably.net wss://*.ably-realtime.com",
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

export default withNextIntl(withPayload(nextConfig))
