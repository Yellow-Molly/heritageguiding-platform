import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  Users,
  Media,
  Tours,
  Guides,
  Categories,
  Cities,
  Neighborhoods,
  Reviews,
  Pages,
  Bookings,
  GroupInquiries,
} from './collections/index'
import { SiteSettings } from './globals/site-settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Validate required environment variables
const getPayloadSecret = (): string => {
  if (process.env.PAYLOAD_SECRET) return process.env.PAYLOAD_SECRET
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PAYLOAD_SECRET is required in production')
  }
  return 'development-secret-change-me-32chars'
}

const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production')
  }
  // Return empty for development - will fail gracefully if no local DB
  return ''
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Private Tours',
    },
  },
  // Localization for SV/EN/DE support
  localization: {
    locales: [
      { label: 'Swedish', code: 'sv' },
      { label: 'English', code: 'en' },
      { label: 'German', code: 'de' },
    ],
    defaultLocale: 'sv',
    fallback: true,
  },
  collections: [
    Users,
    Media,
    Tours,
    Guides,
    Categories,
    Cities,
    Neighborhoods,
    Reviews,
    Pages,
    Bookings,
    GroupInquiries,
  ],
  globals: [SiteSettings],
  secret: getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: getDatabaseUrl(),
    },
  }),
  editor: lexicalEditor(),
  // Vercel-blob plugin - always enabled, will use local storage fallback if no token
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
