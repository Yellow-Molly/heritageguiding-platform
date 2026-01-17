import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { fileURLToPath } from 'url'
import { Users } from './collections/users'
import { Media } from './collections/media'

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
      titleSuffix: '- HeritageGuiding',
    },
  },
  collections: [Users, Media],
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
  // Localization configuration for SV/EN/DE
  localization: {
    locales: [
      {
        code: 'sv',
        label: 'Svenska',
      },
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'de',
        label: 'Deutsch',
      },
    ],
    defaultLocale: 'sv',
    fallback: true,
  },
  plugins: [
    vercelBlobStorage({
      enabled: process.env.BLOB_READ_WRITE_TOKEN !== undefined,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
